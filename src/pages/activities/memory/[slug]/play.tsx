import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { submitMemoryAttemptService, type MemoryAttemptResult } from "@/modules/activities/services/submitMemoryAttemptService";
import { getMemoryRankingService, type MemoryRankingEntry } from "@/modules/activities/services/getMemoryRankingService";
import type { MemoryItemValue } from "@/modules/activities/schemas/createMemorySchema";
import { playActivitySound } from "@/modules/users/utils/activitySounds";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import { useTranslation } from "@/hooks/useTranslation";

interface Pair {
  id: string;
  first: MemoryItemValue;
  second: MemoryItemValue;
}
interface ActivityResponse {
  success: true;
  data: {
    slug: string;
    type: string;
    version: {
      name: string;
      description: string | null;
      content: { pairs: Pair[] };
    };
  };
}
interface Card {
  id: string;
  pairId: string;
  item: MemoryItemValue;
}
type GamePhase = "ready" | "playing" | "finished";

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

function imageUrl(item: Extract<MemoryItemValue, { type: "image" }>): string | undefined {
  const base = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base && item.storageKey ? `${base}/${item.storageKey}` : undefined;
}


function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}

function RankingList({ ranking }: Readonly<{ ranking: MemoryRankingEntry[] }>) {
  const { t } = useTranslation();
  if (ranking.length === 0) {
    return <p className="mt-3 text-sm text-muted">{t("play.noRanking")}</p>;
  }

  return (
    <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {ranking.slice(0, 5).map((entry) => (
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

export default function MemoryGamePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : user.roles.includes("TEACHER") ? "/teacher/activities" : "/student/activities";
  const backLabel = !user ? t("play.home") : t("play.back");
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [result, setResult] = useState<MemoryAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [ranking, setRanking] = useState<MemoryRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");

  const cards = useMemo<Card[]>(() => activity ? shuffle(activity.version.content.pairs.flatMap((pair) => [
    { id: `${pair.id}-first`, pairId: pair.id, item: pair.first },
    { id: `${pair.id}-second`, pairId: pair.id, item: pair.second },
  ])) : [], [activity]);

  const loadRanking = useCallback(async (activitySlug: string): Promise<void> => {
    setRankingLoading(true);
    setRankingError("");
    try {
      setRanking(await getMemoryRankingService.execute(activitySlug));
    } catch (error: unknown) {
      setRankingError(getErrorMessage(error, t("play.loadingRanking")));
    } finally {
      setRankingLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const loaded = user
          ? (await (await import("@/lib/api")).default.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`)).data.data
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<ActivityResponse["data"]>(slug);
        if (!active) return;
        if (loaded.type !== "memory") throw new Error(t("activities.play.memory.typeError"));
        setActivity(loaded);
        if (user?.roles.includes("STUDENT")) void loadRanking(loaded.slug);
      } catch (error: unknown) {
        if (active) setLoadError(error instanceof Error && error.message === t("activities.play.memory.typeError") ? error.message : getErrorMessage(error, t("activities.play.memory.loadError")));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router.isReady, slug, user, loadRanking, t]);



  const finishGame = useCallback(async (
    finalMatchedIds: string[] = matchedIds,
    finalWrongAttempts: number = wrongAttempts,
  ): Promise<void> => {
    if (phase !== "playing" || !activity) return;
    setPhase("finished");
    setSubmitError("");
    if (!isStudent) {
      setSubmitError(`${t("play.previewFinished")}. ${t("activities.play.memory.previewNotice")}`);
      return;
    }
    try {
      const submitted = await submitMemoryAttemptService.execute(activity.slug, finalMatchedIds, finalWrongAttempts);
      setResult(submitted);
      setRanking(submitted.ranking);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, t("activities.play.memory.submitError")));
    }
  }, [activity, isStudent, matchedIds, phase, wrongAttempts, t]);


  function startGame(): void {
    setOpenIds([]);
    setMatchedIds([]);
    setWrongAttempts(0);
    setResult(null);
    setSubmitError("");
    setPhase("playing");
  }

  function selectCard(card: Card): void {
    if (phase !== "playing" || matchedIds.includes(card.pairId) || openIds.includes(card.id) || openIds.length >= 2) return;
    const nextOpen = [...openIds, card.id];
    setOpenIds(nextOpen);
    if (nextOpen.length !== 2) return;

    const selectedCards = nextOpen
      .map((id) => cards.find((item) => item.id === id))
      .filter((item): item is Card => Boolean(item));

    if (selectedCards.length === 2 && selectedCards[0].pairId === selectedCards[1].pairId) {
      const nextMatched = [...matchedIds, selectedCards[0].pairId];
      setMatchedIds(nextMatched);
      playActivitySound("success");
      window.setTimeout(() => setOpenIds([]), 500);
      if (nextMatched.length === (activity?.version.content.pairs.length ?? 0)) {
        void finishGame(nextMatched, wrongAttempts);
      }
      return;
    }

    setWrongAttempts((current) => current + 1);
    playActivitySound("error");
    window.setTimeout(() => setOpenIds([]), 900);
  }

  const visibleIds = new Set([...openIds, ...cards.filter((card) => matchedIds.includes(card.pairId)).map((card) => card.id)]);
  return (
    <PublicActivityLayout immersive
        title={activity?.version.name ?? t("activities.type.memory")}
        description={activity?.version.description ?? t("play.readyDescription")}
        titleActions={<div className="flex shrink-0 items-center gap-2"><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link></div>}
      >
      {loading ? (
        <p role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">{t("play.loading")}</p>
      ) : loadError ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
      ) : activity ? (
        <div className="space-y-5">
          {phase === "ready" && (
            <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]" : ""}>
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div>
                <h2 className="mt-4 text-xl font-bold text-dark">{t("play.readyTitle")}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{t("activities.play.memory.instruction")}</p>
                <div className="mt-5 grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-2">
                  <div><p className="text-sm text-muted">{t("activities.play.memory.pairCount")}</p><p className="mt-1 font-semibold text-dark">{activity.version.content.pairs.length}</p></div>
                  
                </div>
                <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                  <Play size={18} aria-hidden="true" />{isStudent ? t("play.start") : t("play.test")}
                </button>
                {!isStudent && <p className="mt-3 text-xs text-muted">{t("play.teacherTestNotice")}</p>}
              </section>

              {isStudent && (
                <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/4 p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">{t("play.rankingCurrent")}</h2></div>
                  <p className="mt-1 text-sm text-muted">{t("play.bestScoresHint")}</p>
                  {rankingLoading ? (
                    <div role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />{t("play.loadingRanking")}</div>
                  ) : rankingError ? (
                    <div><p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p><button type="button" onClick={() => void loadRanking(activity.slug)} className="mt-3 min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background">{t("play.retry")}</button></div>
                  ) : <RankingList ranking={ranking} />}
                </section>
              )}
            </div>
          )}

          {phase === "playing" && (
            <>
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <div><p className="text-sm text-muted">{t("activities.play.memory.pairsFound")}</p><p className="text-xl font-bold text-dark">{matchedIds.length} / {activity.version.content.pairs.length}</p></div>
                <div><p className="text-sm text-muted">{t("play.errors")}</p><p className="text-xl font-bold text-dark">{wrongAttempts}</p></div>
                
                <button type="button" onClick={() => { if (window.confirm(t("activities.play.memory.endConfirm"))) void finishGame(); }} className="min-h-10 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{t("activities.play.memory.endGame")}</button>
              </section>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {cards.map((card) => {
                  const visible = visibleIds.has(card.id);
                  return (
                    <button type="button" key={card.id} onClick={() => selectCard(card)} disabled={matchedIds.includes(card.pairId) || (openIds.length >= 2 && !openIds.includes(card.id))} aria-label={visible ? (card.item.type === "text" ? card.item.value : card.item.altText || t("activities.play.memory.imageAlt")) : t("activities.play.memory.revealCard")} className={`flex min-h-32 items-center justify-center overflow-hidden rounded-2xl border p-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:min-h-40 ${visible ? "border-amber-400 bg-amber-100 text-amber-950" : "border-slate-300 bg-violet-700 text-white hover:bg-violet-800"}`}>
                      {visible ? card.item.type === "text" ? <span className="wrap-break-word text-sm font-semibold sm:text-base">{card.item.value}</span> : imageUrl(card.item) ? <span className="relative block h-24 w-full sm:h-32"><Image src={imageUrl(card.item)!} alt={card.item.altText} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" className="object-contain" /></span> : <span className="text-xs text-red-700">{t("activities.play.memory.unavailableImage")}</span> : <span aria-hidden="true" className="text-3xl font-bold">?</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {phase === "finished" && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-7">
              <ConfettiCelebration active={isStudent && result !== null && result.attempt.totalPairs > 0 && result.attempt.matchedPairs === result.attempt.totalPairs} />
                      <h2 className="text-xl font-bold text-dark">{isStudent ? t("play.result") : t("play.previewFinished")}</h2>
              {result ? (
                <>
                  <p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 {t("activities.play.memory.points")}</p>
                  <p className="mt-2 text-sm text-muted">{t("activities.play.memory.resultSummary", { matched: result.attempt.matchedPairs, total: result.attempt.totalPairs, errors: result.attempt.wrongAttempts, penalty: result.attempt.penaltyPoints })}</p>
                  <div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">{t("play.rankingUpdated")}</h3></div><RankingList ranking={result.ranking} /></div>
                  <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${result.isInRanking ? "bg-emerald-50 text-emerald-800" : "bg-background text-muted"}`}>{result.isInRanking ? t("play.rankingSuccess") : t("play.rankingMiss")}</p>
                </>
              ) : <p className="mt-3 text-sm text-muted">{submitError || t("activities.play.memory.savingResult")}</p>}
              {!isStudent && <p className="mt-3 text-sm text-muted">{submitError || t("activities.play.memory.teacherPreview")}</p>}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={startGame} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}><Play size={17} aria-hidden="true" />{isStudent ? t("play.playAgain") : t("play.tryAgain")}</button>
              </div>
            </section>
          )}
        </div>
      ) : null}
    </PublicActivityLayout>
  );
}
