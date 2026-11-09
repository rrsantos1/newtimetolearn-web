import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { playActivitySound } from "@/modules/users/utils/activitySounds";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { getHangmanRankingService, type HangmanRankingEntry } from "@/modules/activities/services/getHangmanRankingService";
import { submitHangmanAttemptService, type HangmanAttemptResult } from "@/modules/activities/services/submitHangmanAttemptService";
import { useTranslation } from "@/hooks/useTranslation";

interface PublicHangmanWord { id: string; answer?: string; word?: string; clue: string; imageUrl: string | null; imageAlt: string; }
interface ActivityResponse {
  success: true;
  data: {
    slug: string;
    type: string;
    version: {
      name: string;
      description: string | null;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      content: { words: PublicHangmanWord[] };
    };
  };
}
type Phase = "ready" | "playing" | "word-complete" | "losing" | "finished";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function normalizeAnswer(value?: string | null): string {
  return (value ?? "").normalize("NFD").replace(/\s/g, "").replace(/\s/g, "").toLocaleUpperCase("pt-BR");
}
function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}
function RankingList({ ranking }: Readonly<{ ranking: HangmanRankingEntry[] }>) {
  const { t } = useTranslation();
  if (!ranking.length) return <p className="mt-3 text-sm text-muted">{t("play.noResults")}</p>;
  return <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">{ranking.slice(0, 5).map((entry) =>
    <li key={entry.position + entry.createdAt} className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="truncate text-sm font-semibold text-dark">{entry.position}. {entry.studentName}</span>
      <strong className="shrink-0 text-dark">{entry.score} pts</strong>
    </li>)}</ol>;
}
function GallowsDrawing({ mistakes }: Readonly<{ mistakes: number }>) {
  const { t } = useTranslation();
  return <svg viewBox="0 0 240 230" role="img" aria-label={t("activities.play.hangman.gallowsAlt", { mistakes })} className="mx-auto h-64 w-full max-w-sm sm:h-72">\n    <style jsx>{`@keyframes hangman-draw { from { stroke-dashoffset: 180; } to { stroke-dashoffset: 0; } } .hangman-draw { stroke-dasharray: 180; stroke-dashoffset: 180; animation: hangman-draw 650ms ease-out forwards; }`}</style>
    <path d="M20 215 H180 M55 215 V18 H155 V40" fill="none" stroke="#b45309" strokeWidth="7" strokeLinecap="round" />
    {mistakes >= 1 && <circle cx="155" cy="65" r="24" fill="none" stroke="#7c3aed" strokeWidth="6" className="hangman-draw" />}
    {mistakes >= 2 && <path d="M155 89 V153" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="hangman-draw" />}
    {mistakes >= 3 && <path d="M155 105 L119 135" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="hangman-draw" />}
    {mistakes >= 4 && <path d="M155 105 L191 135" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="hangman-draw" />}
    {mistakes >= 5 && <path d="M155 153 L125 195" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="hangman-draw" />}
    {mistakes >= 6 && <path d="M155 153 L185 195" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="hangman-draw" />}
    {mistakes >= 6 && <g aria-label="Derrota" className="hangman-draw"><path d="M128 99 L182 153 M182 99 L128 153" fill="none" stroke="#dc2626" strokeWidth="11" strokeLinecap="round" /></g>}
  </svg>;
}
export default function HangmanPlayPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : user.roles.includes("TEACHER") ? "/teacher/activities" : "/student/activities";
  const backLabel = !user ? t("play.home") : t("play.back");
  const isTeacherOrAdmin = user?.roles.some((role) => role === "TEACHER" || role === "ADMIN") ?? false;
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [wordIndex, setWordIndex] = useState(0);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [ranking, setRanking] = useState<HangmanRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [result, setResult] = useState<HangmanAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [scoreSaving, setScoreSaving] = useState(false);
  const [revealLost, setRevealLost] = useState(false);
  const [attemptToken, setAttemptToken] = useState("");
  const resultRef = useRef(false);

  const words = activity?.version.content.words ?? [];
  const activeWord = words[wordIndex];
  const loadRanking = useCallback(async (): Promise<void> => {
    if (!slug || !isStudent) return;
    setRankingLoading(true);
    setRankingError("");
    try { setRanking(await getHangmanRankingService.execute(slug)); }
    catch (error: unknown) { setRankingError(getErrorMessage(error, t("play.loadingRanking"))); }
    finally { setRankingLoading(false); }
  }, [isStudent, slug, t]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let alive = true;
    void (async () => {
      try {
        const loaded = user
          ? (await (await import("@/lib/api")).default.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`)).data.data
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<ActivityResponse["data"]>(slug);
        if (!alive) return;
        if (loaded.type !== "hangman") throw new Error(t("activities.play.hangman.typeError"));
        setActivity(loaded);
        if (user?.roles.includes("STUDENT")) void loadRanking();
      } catch (error: unknown) { if (alive) setLoadError(getErrorMessage(error, t("activities.play.hangman.loadError"))); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [router.isReady, slug, user, loadRanking, t]);

  const finish = useCallback(async (lost: boolean, mistakesOverride?: number): Promise<void> => {
    if (resultRef.current || !activity) return;
    resultRef.current = true;
    setPhase("finished");
    setRevealLost(lost);
    setSubmitError("");
    if (!isStudent) {
      setSubmitError(t("activities.play.hangman.previewNotice"));
      return;
    }
    setScoreSaving(true);
    try {
      const submitted = await submitHangmanAttemptService.execute(activity.slug, attemptToken, solvedIds, mistakesOverride ?? totalMistakes);
      setResult(submitted);
      setRanking(submitted.ranking);
      if (!lost && submitted.attempt.score > 0) playActivitySound("applause");
    } catch (error: unknown) { setSubmitError(getErrorMessage(error, t("activities.play.hangman.submitError"))); }
    finally { setScoreSaving(false); }
  }, [activity, attemptToken, isStudent, solvedIds, totalMistakes, t]);

  function startGame(): void {
    setWordIndex(0);
    setUsedLetters([]);
    setMistakes(0);
    setTotalMistakes(0);
    setSolvedIds([]);
    setResult(null);
    setSubmitError("");
    setRevealLost(false);
    setAttemptToken(crypto.randomUUID());
    resultRef.current = false;
    setPhase("playing");
  }

  function chooseLetter(letter: string): void {
    if (phase !== "playing" || usedLetters.includes(letter) || !activeWord) return;
    const answer = normalizeAnswer(activeWord.answer ?? activeWord.word);
    if (!answer) {
      setLoadError(t("activities.play.hangman.answerError"));
      return;
    }
    setUsedLetters((current) => [...current, letter]);
    if (answer.includes(letter)) {
      playActivitySound("success");
      const nextUsed = [...usedLetters, letter];
      const answerLetters = [...answer].filter((character) => /[A-Z]/.test(character));
      const complete = answerLetters.every((character) => nextUsed.includes(character));
      if (complete) {
        setSolvedIds((current) => [...current, activeWord.id]);
        playActivitySound("success");
        setPhase("word-complete");
      }
      return;
    }
    playActivitySound("error");
    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setTotalMistakes((current) => current + 1);
    if (nextMistakes >= 6) {
      setUsedLetters((current) => [...current, letter]);
      setPhase("losing");
    }
  }

  function retryWord(): void {
    if (phase !== "losing") return;
    setUsedLetters([]);
    setMistakes(0);
    setPhase("playing");
  }

  function nextWord(): void {
    if (phase !== "word-complete") return;
    if (wordIndex + 1 >= words.length) { void finish(false); return; }
    setWordIndex((current) => current + 1);
    setUsedLetters([]);
    setMistakes(0);
    setPhase("playing");
  }

  const displayLetters = activeWord ? normalizeAnswer(activeWord.answer ?? activeWord.word) : "";
  return <PublicActivityLayout immersive
      title={activity?.version.name ?? t("activities.play.hangman.title")}
      description={activity?.version.description ?? t("activities.play.hangman.description")}
      titleActions={<div className="flex shrink-0 items-center gap-2"><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link></div>}
    >
    {loading ? <div role="status" className="rounded-xl bg-surface p-6 text-sm text-muted"><LoaderCircle className="mr-2 inline animate-spin" size={18} />{t("play.loading")}</div>
    : loadError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
    : activity ? <div className="space-y-5">
      {phase === "ready" && (isStudent || isTeacherOrAdmin) && <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 shadow-sm sm:p-8"><h2 className="text-xl font-bold text-dark">{t("play.readyTitleSimple")}</h2><p className="mt-2 text-sm leading-6 text-muted">{t("play.readyDescription")}</p><div className="mt-4 rounded-xl border border-sky-100 bg-white/80 p-4 text-sm text-slate-600">{t("activities.play.hangman.rules", { count: words.length })}</div><button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Play size={18} aria-hidden="true" />{isStudent ? t("play.start") : t("play.test")}</button>{!isStudent && <p className="mt-3 text-xs text-muted">{t("play.previewNotRanked")}</p>}</section>
        {isStudent && <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6"><div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">{t("play.rankingCurrent")}</h2></div>{rankingLoading ? <p className="mt-4 text-sm text-muted">{t("play.loadingRanking")}</p> : rankingError ? <p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p> : <RankingList ranking={ranking} />}</section>}
      </div>}
      {phase === "ready" && !isStudent && !isTeacherOrAdmin && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("play.notAvailable")}</p>}
      {(phase === "playing" || phase === "word-complete" || phase === "losing") && activeWord && <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">{t("activities.play.hangman.wordProgress", { current: wordIndex + 1, total: words.length })}</p><p className="rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-700">{t("play.errors")}: <strong className="font-bold">{mistakes}/6</strong></p></div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.75fr)]">
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-orange-100 p-4 shadow-inner sm:min-h-[420px] sm:p-6"><GallowsDrawing mistakes={mistakes} /><p className="mt-2 text-center text-xs text-muted">{mistakes > 0 ? t("activities.play.hangman.bodyParts").split("|").slice(0, mistakes).join(" · ") : t("activities.play.hangman.noParts")}</p></div>
          <div className="space-y-4"><div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-700">{t("activities.play.hangman.clue")}</p><p className="mt-2 text-sm leading-6 text-dark">{activeWord.clue}</p>{activeWord.imageUrl && <div className="relative mt-4 aspect-video overflow-hidden rounded-lg"><Image src={activeWord.imageUrl} alt={activeWord.imageAlt || t("activities.play.hangman.clueImageAlt")} fill sizes="(max-width: 1024px) 100vw, 360px" loading="eager" unoptimized className="object-contain" /></div>}</div>
            <div className="flex flex-wrap justify-center gap-2">{Array.from({ length: displayLetters.length }, (_, index) => <span key={index} className="flex size-9 items-center justify-center rounded-t-lg border-b-4 border-indigo-500 bg-white/80 text-lg font-bold text-indigo-900 shadow-sm sm:size-11 sm:text-xl">{displayLetters[index] === " " || displayLetters[index] === "-" ? displayLetters[index] : usedLetters.includes(displayLetters[index] ?? "") ? displayLetters[index] : " "}</span>)}</div>
            {phase === "playing" ? <><p className="text-center text-xs text-muted">{t("play.chooseLetter")}</p><div className="grid grid-cols-7 gap-2 sm:grid-cols-9">{ALPHABET.map((letter) => { const selected = usedLetters.includes(letter); return <button type="button" key={letter} onClick={() => chooseLetter(letter)} disabled={selected} aria-label={t("activities.play.hangman.letterButton", { letter, status: selected ? t("activities.play.hangman.alreadyUsed") : "" })} className={`min-h-10 rounded-lg border px-1 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50 ${selected ? (displayLetters.includes(letter) ? "border-green-200 bg-green-50 text-green-800 line-through" : "border-red-200 bg-red-50 text-red-700 line-through") : "border-sky-200 bg-white text-sky-900 shadow-sm hover:border-sky-500 hover:bg-sky-100"}`}>{letter}</button>; })}</div></> : phase === "losing" ? <div role="status" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center"><p className="font-semibold text-red-800">{t("activities.play.hangman.sixMistakes")}</p><p className="mt-1 text-sm text-red-700">{t("play.tryWordAgain")}</p><div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row"><button type="button" onClick={retryWord} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><RotateCcw size={17} aria-hidden="true" />{t("play.retry")}</button><button type="button" onClick={() => void finish(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Trophy size={17} aria-hidden="true" />{t("activities.play.hangman.finishAndView")}</button></div></div> : <div className="relative rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50 p-4 text-center"><ConfettiCelebration active={phase === "word-complete"} /><p className="font-semibold text-green-800">{t("activities.play.hangman.wordFound")}</p><button type="button" onClick={nextWord} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"><ArrowRight size={17} aria-hidden="true" />{wordIndex + 1 < words.length ? t("play.nextWord") : t("play.viewResult")}</button></div>}
          </div>
        </div>
      </section>}
      {phase === "finished" && <section className="relative rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 shadow-sm sm:p-7"><ConfettiCelebration active={isStudent && result !== null && result.attempt.score >= 80} /><h2 className="text-xl font-bold text-dark">{revealLost ? t("play.gameOver") : t("play.activityCompleted")}</h2>{scoreSaving && <p role="status" className="mt-3 text-sm text-muted">{t("activities.play.hangman.savingResult")}</p>}{result ? <><p className="mt-3 text-4xl font-bold text-dark">{result.attempt.score}/100 {t("play.scoreSuffix")}</p><p className="mt-2 text-sm text-muted">{t("activities.play.hangman.resultSummary", { solved: result.attempt.solvedWords, total: result.attempt.totalWords, mistakes: result.attempt.mistakes })}</p><div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">{t("play.rankingUpdated")}</h3></div><RankingList ranking={result.ranking} /></div><p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm font-semibold text-muted">{result.isInRanking ? t("activities.play.hangman.topFiveMessage") : t("activities.play.hangman.keepPracticing")}</p></> : <p className="mt-3 text-sm text-muted">{submitError || t("activities.play.hangman.notRegistered")}</p>}{!isStudent && <p className="mt-3 text-sm text-muted">{submitError}</p>}<button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"><RotateCcw size={17} aria-hidden="true" />{t("play.playAgain")}</button></section>}
    </div> : null}
  </PublicActivityLayout>;
}
