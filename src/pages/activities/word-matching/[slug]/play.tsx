import Image from "next/image";
import Link from "next/link";
import { playActivitySound } from "@/modules/users/utils/activitySounds";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { dragDropActivityService, type DragDropAttemptResult, type DragDropRankingEntry } from "@/modules/activities/services/dragDropActivityService";
import type { DragDropAnswer } from "@/modules/activities/services/dragDropActivityService";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

type DragItem =
  | { id?: string; type: "text"; value: string }
  | { id?: string; type: "image"; storageKey: string; altText: string; publicUrl?: string };
interface MatchingPair { id?: string; source: DragItem; target: DragItem; }
interface ActivityResponse {
  success: true;
  data: {
    slug: string;
    type: string;
    isOwner: boolean;
    version: { name: string; description: string | null;  content: { pairs: MatchingPair[] } };
  };
}
type Phase = "ready" | "playing" | "finished";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}
function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}
function imageUrl(item: Extract<DragItem, { type: "image" }>): string | null {
  if (item.publicUrl) return item.publicUrl;
  const base = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${item.storageKey}` : null;
}
function ItemView({ item }: Readonly<{ item: DragItem }>) {
  if (item.type === "text") return <span className="wrap-break-word text-sm font-semibold text-dark sm:text-base">{item.value}</span>;
  const src = imageUrl(item);
  return src ? <span className="relative block aspect-video w-full overflow-hidden rounded-lg"><Image src={src} alt={item.altText || t("activities.type.wordMatching")} fill sizes="(max-width: 640px) 80vw, 30vw" className="object-contain" /></span> : <span className="text-sm text-muted">Imagem indisponível</span>;
}
function RankingList({ ranking }: Readonly<{ ranking: DragDropRankingEntry[] }>) {
  const { t } = useTranslation();
  if (ranking.length === 0) return <p className="mt-3 text-sm text-muted">{t("play.noRanking")}</p>;
  return <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">{ranking.slice(0, 5).map((entry) => <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">{entry.position}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p></div></div><span className="shrink-0 text-sm font-bold text-dark">{entry.score} pts</span></li>)}</ol>;
}

export default function WordMatchingPlayPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : user.roles.includes("TEACHER") ? "/teacher/activities" : "/student/activities";
  const backLabel = !user ? t("play.home") : t("play.back");
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [sources, setSources] = useState<DragItem[]>([]);
  const [targets, setTargets] = useState<DragItem[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [draggedSourceId, setDraggedSourceId] = useState("");
  const [attemptToken, setAttemptToken] = useState("");
  const [result, setResult] = useState<DragDropAttemptResult | null>(null);
  const [ranking, setRanking] = useState<DragDropRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const assignedSources = useMemo(() => new Set(Object.keys(answers)), [answers]);
  const correctPreviewCount = result?.attempt.correctCount ?? 0;

  const loadRanking = useCallback(async (activitySlug: string) => {
    if (!isStudent) return;
    setRankingLoading(true);
    try { setRanking(await dragDropActivityService.getRanking(activitySlug, "word-matching")); }
    catch (loadError: unknown) { setSubmitError(getErrorMessage(loadError, t("play.loadingRanking"))); }
    finally { setRankingLoading(false); }
  }, [isStudent]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const loaded = user
          ? (await api.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`)).data.data
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<ActivityResponse["data"]>(slug);
        if (!active) return;
        if (loaded.type !== "word_matching") throw new Error(t("activities.type.wordMatching"));
        const normalized = loaded.version.content.pairs.map((pair, index) => ({
          source: { ...pair.source, id: pair.source.id ?? `preview-source-${pair.id ?? index}` } as DragItem,
          target: { ...pair.target, id: pair.target.id ?? `preview-target-${pair.id ?? index}` } as DragItem,
        }));
        setActivity(loaded);
        setSources(shuffle(normalized.map((pair) => pair.source)));
        setTargets(shuffle(normalized.map((pair) => pair.target)));
        if (isStudent) void loadRanking(loaded.slug);
      } catch (loadError: unknown) {
        if (active) setError(getErrorMessage(loadError, t("play.loading")));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isStudent, loadRanking, router.isReady, slug, user]);


  const finishActivity = useCallback(async (finalAnswers: Record<string, string>) => {
    if (phase !== "playing" || !activity || submitting) return;
    setPhase("finished");
    setSubmitError("");
    if (!isStudent) return;
    setSubmitting(true);
    try {
      const answersToSubmit: DragDropAnswer[] = Object.entries(finalAnswers).map(([itemId, selectedId]) => ({ itemId, selectedId }));
      const submitted = await dragDropActivityService.submit(activity.slug, "word-matching", answersToSubmit, attemptToken);
      setResult(submitted);
      setRanking(submitted.ranking);
      if (submitted.attempt.totalItems > 0 && submitted.attempt.correctCount === submitted.attempt.totalItems) {
        playActivitySound("applause");
      } else if (submitted.attempt.correctCount > 0) {
        playActivitySound("success");
      } else {
        playActivitySound("error");
      }
    } catch (submitFailure: unknown) {
      setSubmitError(getErrorMessage(submitFailure, "Não foi possível registrar o resultado."));
    } finally {
      setSubmitting(false);
    }
  }, [activity, attemptToken, isStudent, phase, submitting]);


  function assign(sourceId: string, targetId: string): void {
    if (phase !== "playing") return;
    setAnswers((previous) => {
      const next = { ...previous };
      for (const [assignedSourceId, assignedTargetId] of Object.entries(next)) {
        if (assignedSourceId === sourceId || assignedTargetId === targetId) delete next[assignedSourceId];
      }
      next[sourceId] = targetId;
      return next;
    });
    setSelectedSourceId("");
  }

  function start(): void {
    setAttemptToken(globalThis.crypto.randomUUID());
    setAnswers({});
    setSelectedSourceId("");
    setResult(null);
    setSubmitError("");
    setPhase("playing");
  }

  return (
    <PublicActivityLayout immersive title={activity?.version.name ?? "Atividade"} description={activity?.version.description ?? "Experimente esta atividade."} titleActions={<div className="flex shrink-0 items-center gap-2"><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link></div>}>
      {loading ? <div role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">{t("play.loading")}</div> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : activity ? (
        <div className="space-y-5">
          {phase === "ready" && <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]" : ""}>
            <section className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6 shadow-sm sm:p-8"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div><h2 className="mt-4 text-xl font-bold text-dark">Pronto para associar?</h2><p className="mt-2 text-sm leading-6 text-muted">Arraste cada item da área superior até a correspondência correta. Em celular ou teclado, selecione primeiro uma palavra e depois seu destino.</p><div className="mt-5 grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-2"><div><p className="text-sm text-muted">Associações</p><p className="mt-1 font-semibold text-dark">{sources.length}</p></div></div><button type="button" onClick={start} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}><Play size={18} aria-hidden="true" />{isStudent ? t("play.start") : t("play.test")}</button>{!isStudent && <p className="mt-3 text-xs text-muted">{t("play.teacherTestNotice")}</p>}</section>
            {isStudent && <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/[0.04] p-6 shadow-sm"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">{t("play.ranking")}</h2></div>{rankingLoading ? <p role="status" className="mt-4 text-sm text-muted">{t("play.loadingRanking")}</p> : <RankingList ranking={ranking} />}</section>}
          </div>}
          {phase === "playing" && <div className="space-y-5">
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"><div><p className="text-sm text-muted">Associações preenchidas</p><p className="text-lg font-bold text-dark">{Object.keys(answers).length} / {sources.length}</p></div><button type="button" onClick={() => void finishActivity(answers)} disabled={submitting} className="min-h-10 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ color: "var(--primary-foreground)" }}>{t("play.finishAndCorrect")}</button></section>
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6"><h2 className="text-lg font-bold text-dark">1. Banco de palavras</h2><p className="mt-1 text-sm text-muted">Arraste uma palavra ou selecione-a e toque na correspondência.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sources.filter((source) => !assignedSources.has(source.id ?? "")).map((source) => { const sourceId = source.id ?? ""; const selected = selectedSourceId === sourceId; return <button key={sourceId} type="button" draggable onDragStart={() => setDraggedSourceId(sourceId)} onClick={() => setSelectedSourceId(selected ? "" : sourceId)} aria-pressed={selected} className={`min-h-14 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selected ? "border-orange-500 bg-orange-100 ring-2 ring-orange-300/60" : "border-orange-200 bg-white hover:border-orange-400"}`}><ItemView item={source} /></button>; })}</div></section>
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6"><h2 className="text-lg font-bold text-dark">2. Correspondências</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{targets.map((target) => { const targetId = target.id ?? ""; const assignedEntry = Object.entries(answers).find(([, assignedTarget]) => assignedTarget === targetId); const assignedSource = assignedEntry ? sources.find((source) => source.id === assignedEntry[0]) : undefined; return <button key={targetId} type="button" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const sourceId = draggedSourceId || selectedSourceId; if (sourceId) assign(sourceId, targetId); setDraggedSourceId(""); }} onClick={() => { const sourceId = selectedSourceId; if (sourceId) assign(sourceId, targetId); else if (assignedEntry) setAnswers((previous) => { const next = { ...previous }; delete next[assignedEntry[0]]; return next; }); }} aria-label={`Destino: ${target.type === "text" ? target.value : target.altText || "imagem"}${assignedSource ? ", preenchido" : ", vazio"}`} className={`flex min-h-28 flex-col justify-between gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selectedSourceId ? "border-orange-400 bg-orange-50 hover:bg-orange-100" : "border-border"}`}><span className="w-full"><ItemView item={target} /></span><span className="w-full border-t border-dashed border-border pt-2 text-xs text-muted">{assignedSource ? <span className="block rounded-lg bg-background p-2"><span className="mb-1 block font-semibold text-dark">Palavra posicionada</span><ItemView item={assignedSource} /></span> : "Solte a palavra aqui"}</span></button>; })}</div></section>
          </div>}
          {phase === "finished" && <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-7"><ConfettiCelebration active={isStudent && result !== null && result.attempt.totalItems > 0 && result.attempt.correctCount === result.attempt.totalItems} />
                      <h2 className="text-xl font-bold text-dark">{isStudent ? t("play.result") : t("play.previewFinished")}</h2>{submitting ? <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />{t("play.correcting")}</p> : result ? <><p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{correctPreviewCount} de {result.attempt.totalItems} associações corretas</p><div className="mt-5 space-y-2"><h3 className="text-sm font-bold text-dark">Correção das associações</h3>{result.attempt.corrections.map((correction) => { const source = sources.find((item) => item.id === correction.itemId); const expectedTarget = targets.find((item) => item.id === correction.expectedId); const selectedTarget = correction.selectedId ? targets.find((item) => item.id === correction.selectedId) : undefined; return <div key={correction.itemId} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div><p className="mb-1 text-xs text-muted">Palavra</p>{source ? <ItemView item={source} /> : <span className="text-sm text-muted">Item</span>}</div><span className={`text-sm font-bold ${correction.isCorrect ? "text-emerald-700" : "text-red-700"}`}>{correction.isCorrect ? t("play.correct") : t("play.incorrect")}</span><div><p className="mb-1 text-xs text-muted">{correction.isCorrect ? "Correspondência" : t("play.yourAnswer") + " / correta"}</p>{selectedTarget ? <ItemView item={selectedTarget} /> : <span className="text-sm text-muted">{t("play.unanswered")}</span>}{!correction.isCorrect && expectedTarget && <div className="mt-2 rounded-lg bg-emerald-50 p-2"><p className="mb-1 text-xs font-semibold text-emerald-800">{t("play.correctAnswer")}</p><ItemView item={expectedTarget} /></div>}</div></div>; })}</div><div className="mt-6 flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">{t("play.rankingUpdated")}</h3></div><RankingList ranking={result.ranking} /><p className="mt-4 rounded-xl bg-background p-4 text-sm text-muted">{result.isInRanking ? t("play.rankingSuccess") : t("play.rankingMiss")}</p></> : <p className="mt-3 text-sm text-muted">{submitError || t("play.previewFinished")}</p>}{submitError && <p role="alert" className="mt-3 text-sm text-red-600">{submitError}</p>}<button type="button" onClick={start} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white" style={{ color: "var(--primary-foreground)" }}><Play size={17} aria-hidden="true" />{isStudent ? t("play.retry") : "Testar novamente"}</button></section>}
        </div>
      ) : null}
    </PublicActivityLayout>
  );
}
