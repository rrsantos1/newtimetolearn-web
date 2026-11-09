import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { CrosswordGame, type CrosswordClue } from "@/modules/activities/components/CrosswordGame";
import { getCrosswordService } from "@/modules/activities/services/crossword/getCrosswordService";
import { getCrosswordRankingService, type CrosswordRankingEntry } from "@/modules/activities/services/crossword/getCrosswordRankingService";
import { submitCrosswordAttemptService, type CrosswordAttemptResult } from "@/modules/activities/services/crossword/submitCrosswordAttemptService";
import type { EditableCrosswordActivity } from "@/modules/activities/types/crossword.types";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { useTranslation } from "@/hooks/useTranslation";

type CrosswordGrid = (string | null)[][];
type GamePhase = "ready" | "playing" | "finished";

function getErrorMessage(error: unknown, fallback = "Não foi possível carregar esta atividade."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}

function isCrosswordGrid(value: unknown): value is CrosswordGrid {
  return Array.isArray(value) && value.length > 0 && value.every(
    (row) => Array.isArray(row) && row.every((cell) => cell === null || typeof cell === "string"),
  );
}

function normalizeCrosswordClues(value: unknown): CrosswordClue[] | null {
  if (!Array.isArray(value)) return null;
  const normalized: CrosswordClue[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" || item === null ||
      !("number" in item) || typeof item.number !== "number" ||
      !("clue" in item) || typeof item.clue !== "string" ||
      !("direction" in item) || (item.direction !== "across" && item.direction !== "down") ||
      !("row" in item) || typeof item.row !== "number" ||
      !("col" in item) || typeof item.col !== "number"
    ) return null;

    let length: number;
    if ("length" in item && typeof item.length === "number") {
      length = item.length;
    } else if ("word" in item && typeof item.word === "string") {
      length = item.word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]/g, "").length;
    } else {
      return null;
    }

    if (!Number.isInteger(length) || length < 1) return null;
    normalized.push({
      number: item.number,
      clue: item.clue,
      direction: item.direction,
      row: item.row,
      col: item.col,
      length,
      answer: "word" in item && typeof item.word === "string" ? item.word : undefined,
    });
  }
  return normalized;
}

function RankingList({ ranking }: Readonly<{ ranking: CrosswordRankingEntry[] }>) {
  const { t } = useTranslation();
  if (ranking.length === 0) {
    return <p className="mt-3 text-sm text-muted">{t("activities.play.noRanking")}</p>;
  }

  return (
    <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {ranking.map((entry) => (
        <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">{entry.position}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p>
              
            </div>
          </div>
          <span className="shrink-0 font-bold text-dark">{entry.score} pts</span>
        </li>
      ))}
    </ol>
  );
}

export default function PlayCrosswordPage() {
  const { t } = useTranslation();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : isTeacher ? "/teacher/activities" : "/student/activities";
  const backLabel = !user ? t("activities.play.home") : t("activities.play.back");

  const [activity, setActivity] = useState<EditableCrosswordActivity | null>(null);
  const [grid, setGrid] = useState<CrosswordGrid>([]);
  const [clues, setClues] = useState<CrosswordClue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [gameKey, setGameKey] = useState(0);
  const [ranking, setRanking] = useState<CrosswordRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [attemptResult, setAttemptResult] = useState<CrosswordAttemptResult | null>(null);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [attemptError, setAttemptError] = useState("");
  const [pendingAttempt, setPendingAttempt] = useState<{ answers: string[] } | null>(null);

  const loadRanking = useCallback(async (slug: string): Promise<void> => {
    setRankingLoading(true);
    setRankingError("");
    try {
      setRanking(await getCrosswordRankingService.execute(slug));
    } catch (loadError: unknown) {
      setRankingError(getErrorMessage(loadError, t("activities.play.loadingRecord")));
    } finally {
      setRankingLoading(false);
    }
  }, []);

  const handleComplete = useCallback(async (answers: string[]): Promise<void> => {
    if (!activity) return;
    if (!isStudent) {
      setPhase("finished");
      return;
    }
    if (attemptResult || submittingAttempt) return;

    setPendingAttempt({ answers });
    setSubmittingAttempt(true);
    setAttemptError("");
    setPhase("finished");

    try {
      const result = await submitCrosswordAttemptService.execute(activity.slug, answers);
      setAttemptResult(result);
      setRanking(result.ranking);
      setPendingAttempt(null);
    } catch (submitError: unknown) {
      setAttemptError(getErrorMessage(submitError, t("activities.play.retrySubmit")));
    } finally {
      setSubmittingAttempt(false);
    }
  }, [activity, attemptResult, isStudent, submittingAttempt]);

  useEffect(() => {
    if (!router.isReady) return;
    const querySlug = router.query.slug;
    const slug = Array.isArray(querySlug) ? querySlug[0] : querySlug;
    let cancelled = false;

    async function load(): Promise<void> {
      if (!slug) {
        setError("Não foi possível identificar a atividade.");
        setLoading(false);
        return;
      }
      try {
        const result = user
          ? await getCrosswordService.execute(slug)
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<EditableCrosswordActivity>(slug);
        if (cancelled) return;
        if (result.type !== "crossword") {
          setError("Esta atividade não é uma cruzadinha.");
          return;
        }
        const generatedData = result.version.generatedData;
        const rawGrid = generatedData?.grid;
        const rawClues = normalizeCrosswordClues(generatedData?.clues);
        if (!isCrosswordGrid(rawGrid) || !rawClues || rawClues.length === 0) {
          setError("A grade ou as pistas desta cruzadinha estão indisponíveis ou inválidas.");
          return;
        }
        setActivity(result);
        setGrid(rawGrid);
        setClues(rawClues);
        if (user?.roles.includes("STUDENT")) void loadRanking(result.slug);
      } catch (loadError: unknown) {
        if (!cancelled) setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [router.isReady, router.query.slug, user, loadRanking]);

  function startGame(): void {
    setAttemptResult(null);
    setAttemptError("");
    setPendingAttempt(null);
    setPhase("playing");
    setGameKey((current) => current + 1);
  }

  return (
    <PublicActivityLayout immersive
      title={activity?.version.name ?? t("activities.type.crossword")}
      description={activity?.version.description ?? t("activities.play.crosswordInstruction")}
      titleActions={<div className="flex shrink-0 items-center gap-2"><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link></div>}
    >

          {loading ? (
            <div role="status" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6">
              <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-muted">{t("activities.play.loadingGame")}</p>
            </div>
          ) : error ? (
            <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-lg font-semibold text-red-900">{t("activities.play.openError")}</h1>
              <p className="mt-2 text-sm leading-6 text-red-800">{error}</p>
              <Link href={backHref} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-900"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link>
            </section>
          ) : activity ? (
            <>
              {phase === "ready" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                  <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/[0.04] p-6 shadow-sm sm:p-8">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div>
                    <h2 className="mt-4 text-xl font-bold text-dark">{t("activities.play.prepared")}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{t("activities.play.crosswordInstruction")}</p>
                                        <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Play size={18} aria-hidden="true" />{isStudent ? t("play.start") : t("play.test")}
                    </button>
                    {!isStudent && <p className="mt-3 text-xs text-muted">{t("activities.play.teacherPreview")}</p>}
                  </section>

                  {isStudent && (
                    <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6 shadow-sm sm:p-7">
                      <div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">{t("play.rankingRecord")}</h2></div>
                      <p className="mt-1 text-sm text-muted">{t("activities.play.rankingHint")}</p>
                      {rankingLoading ? <div role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />{t("play.loadingRanking")}</div> : rankingError ? (
                        <div><p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p><button type="button" onClick={() => void loadRanking(activity.slug)} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background">{t("play.retry")}</button></div>
                      ) : <RankingList ranking={ranking} />}
                    </section>
                  )}
                </div>
              )}

              {phase === "playing" && <CrosswordGame key={gameKey} grid={grid} clues={clues}  onComplete={handleComplete} canAutoFill={!isStudent} />}

              {phase === "finished" && !isStudent && (
                <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/[0.04] p-6 shadow-sm sm:p-8">
                  <h2 className="text-xl font-bold text-dark">{t("activities.play.previewDone")}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{t("activities.play.previewDoneText")}</p>
                  <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}><Play size={17} aria-hidden="true" />Testar novamente</button>
                </section>
              )}

              {phase === "finished" && isStudent && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-7">
                  {submittingAttempt ? (
                    <div role="status" className="flex items-center gap-3 text-sm font-medium text-muted"><LoaderCircle size={20} className="animate-spin" aria-hidden="true" />{t("activities.play.submitting")}</div>
                  ) : attemptError ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p>{attemptError}</p>
                      {pendingAttempt && <button type="button" onClick={() => void handleComplete(pendingAttempt.answers)} disabled={submittingAttempt} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300 px-3 font-semibold hover:bg-red-100 disabled:opacity-60">{t("play.submitRetry")}</button>}
                    </div>
                  ) : attemptResult ? (
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <ConfettiCelebration active={attemptResult.attempt.wordsFound.length === attemptResult.attempt.totalWords} />
                      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("play.result")}</p>
                          <p className="mt-1 text-3xl font-bold text-dark">{attemptResult.attempt.score}<span className="text-lg text-muted">/100 {t("activities.play.points")}</span></p>
                          <p className="mt-2 text-sm text-muted">{t("activities.play.correctWords")}: {attemptResult.attempt.wordsFound.length} de {attemptResult.attempt.totalWords}</p>
                          
                          <p className="mt-1 text-sm text-muted">{t("play.accuracy")}:  {attemptResult.attempt.accuracyPoints}/100</p>
                        </div>
                        <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${attemptResult.isInRanking ? "bg-emerald-50 text-emerald-800" : "bg-background text-muted"}`}>
                          {attemptResult.isInRanking ? "{t("activities.play.congratsTop5")}" : "{t("activities.play.notTop5")}"}
                        </p>
                      </div>
                      <div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">{t("activities.play.recordUpdated")}</h2></div><RankingList ranking={ranking} /></div>
                      <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}><Play size={17} aria-hidden="true" />{t("play.playAgain")}</button>
                    </>
                  ) : null}
                </section>
              )}
            </>
          ) : null}
    </PublicActivityLayout>
  );
}
