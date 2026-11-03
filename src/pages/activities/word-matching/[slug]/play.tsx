import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { dragDropActivityService, type DragDropAttemptResult, type DragDropRankingEntry } from "@/modules/activities/services/dragDropActivityService";
import type { DragDropAnswer } from "@/modules/activities/services/dragDropActivityService";
import api from "@/lib/api";

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
    version: { name: string; description: string | null; timeLimitSeconds: number | null; content: { pairs: MatchingPair[] } };
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
function formatTime(seconds: number | null): string {
  if (seconds === null) return "Sem limite";
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
function imageUrl(item: Extract<DragItem, { type: "image" }>): string | null {
  if (item.publicUrl) return item.publicUrl;
  const base = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${item.storageKey}` : null;
}
function ItemView({ item }: Readonly<{ item: DragItem }>) {
  if (item.type === "text") return <span className="break-words text-sm font-semibold text-dark sm:text-base">{item.value}</span>;
  const src = imageUrl(item);
  return src ? <span className="relative block aspect-video w-full overflow-hidden rounded-lg"><Image src={src} alt={item.altText || "Imagem da associação"} fill sizes="(max-width: 640px) 80vw, 30vw" unoptimized className="object-contain" /></span> : <span className="text-sm text-muted">Imagem indisponível</span>;
}
function RankingList({ ranking }: Readonly<{ ranking: DragDropRankingEntry[] }>) {
  if (ranking.length === 0) return <p className="mt-3 text-sm text-muted">Ainda não há resultados para esta atividade.</p>;
  return <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">{ranking.slice(0, 5).map((entry) => <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">{entry.position}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p><p className="text-xs text-muted">{formatTime(entry.elapsedSeconds)}</p></div></div><span className="shrink-0 text-sm font-bold text-dark">{entry.score} pts</span></li>)}</ol>;
}

export default function WordMatchingPlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [sources, setSources] = useState<DragItem[]>([]);
  const [targets, setTargets] = useState<DragItem[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [draggedSourceId, setDraggedSourceId] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptToken, setAttemptToken] = useState("");
  const [result, setResult] = useState<DragDropAttemptResult | null>(null);
  const [ranking, setRanking] = useState<DragDropRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const timeLimit = activity?.version.timeLimitSeconds ?? null;
  const assignedSources = useMemo(() => new Set(Object.keys(answers)), [answers]);
  const correctPreviewCount = result?.attempt.correctCount ?? 0;

  const loadRanking = useCallback(async (activitySlug: string) => {
    if (!isStudent) return;
    setRankingLoading(true);
    try { setRanking(await dragDropActivityService.getRanking(activitySlug, "word-matching")); }
    catch (loadError: unknown) { setSubmitError(getErrorMessage(loadError, "Não foi possível carregar o ranking.")); }
    finally { setRankingLoading(false); }
  }, [isStudent]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const response = await api.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        if (response.data.data.type !== "word_matching") throw new Error("Esta atividade não é uma Associação de Palavras.");
        const loaded = response.data.data;
        const normalized = loaded.version.content.pairs.map((pair, index) => ({
          source: { ...pair.source, id: pair.source.id ?? `preview-source-${pair.id ?? index}` } as DragItem,
          target: { ...pair.target, id: pair.target.id ?? `preview-target-${pair.id ?? index}` } as DragItem,
        }));
        setActivity(loaded);
        setSources(shuffle(normalized.map((pair) => pair.source)));
        setTargets(shuffle(normalized.map((pair) => pair.target)));
        if (isStudent) void loadRanking(loaded.slug);
      } catch (loadError: unknown) {
        if (active) setError(getErrorMessage(loadError, "Não foi possível carregar a atividade."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isStudent, loadRanking, router.isReady, slug]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const finishActivity = useCallback(async (finalAnswers: Record<string, string>, elapsed: number) => {
    if (phase !== "playing" || !activity || submitting) return;
    setPhase("finished");
    setSubmitError("");
    if (!isStudent) return;
    setSubmitting(true);
    try {
      const answersToSubmit: DragDropAnswer[] = Object.entries(finalAnswers).map(([itemId, selectedId]) => ({ itemId, selectedId }));
      const submitted = await dragDropActivityService.submit(activity.slug, "word-matching", answersToSubmit, elapsed, attemptToken);
      setResult(submitted);
      setRanking(submitted.ranking);
    } catch (submitFailure: unknown) {
      setSubmitError(getErrorMessage(submitFailure, "Não foi possível registrar o resultado."));
    } finally {
      setSubmitting(false);
    }
  }, [activity, attemptToken, isStudent, phase, submitting]);

  useEffect(() => {
    if (phase !== "playing" || timeLimit === null || elapsedSeconds < timeLimit) return;
    const timeout = window.setTimeout(() => void finishActivity(answers, timeLimit), 0);
    return () => window.clearTimeout(timeout);
  }, [answers, elapsedSeconds, finishActivity, phase, timeLimit]);

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
    setElapsedSeconds(0);
    setResult(null);
    setSubmitError("");
    setPhase("playing");
  }

  return (
    <RoleBasedLayout area="student" allowedRoles={["STUDENT", "TEACHER", "ADMIN"]} title={activity?.version.name ?? "Associação de palavras"} description={activity?.version.description ?? "Arraste cada palavra até sua correspondência."}>
      {loading ? <div role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</div> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : activity ? (
        <div className="space-y-5">
          <header className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Associação de palavras</p><h1 className="mt-1 text-2xl font-bold text-dark">{activity.version.name}</h1>{activity.version.description && <p className="mt-2 text-sm leading-6 text-muted">{activity.version.description}</p>}</header>
          {phase === "ready" && <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]" : ""}>
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div><h2 className="mt-4 text-xl font-bold text-dark">Pronto para associar?</h2><p className="mt-2 text-sm leading-6 text-muted">Arraste cada item da área superior até a correspondência correta. Em celular ou teclado, selecione primeiro uma palavra e depois seu destino.</p><div className="mt-5 grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-2"><div><p className="text-sm text-muted">Associações</p><p className="mt-1 font-semibold text-dark">{sources.length}</p></div><div><p className="text-sm text-muted">Tempo disponível</p><p className="mt-1 font-semibold text-dark">{formatTime(timeLimit)}</p></div></div><button type="button" onClick={start} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Play size={18} aria-hidden="true" />{isStudent ? "Iniciar atividade" : "Testar atividade"}</button>{!isStudent && <p className="mt-3 text-xs text-muted">O teste não será registrado no ranking dos alunos.</p>}</section>
            {isStudent && <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking — Top 5</h2></div>{rankingLoading ? <p role="status" className="mt-4 text-sm text-muted">Carregando ranking...</p> : <RankingList ranking={ranking} />}</section>}
          </div>}
          {phase === "playing" && <div className="space-y-5">
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"><div><p className="text-sm text-muted">Associações preenchidas</p><p className="text-lg font-bold text-dark">{Object.keys(answers).length} / {sources.length}</p></div><div><p className="text-sm text-muted">Tempo</p><p className="text-lg font-bold text-dark" aria-live="polite">{formatTime(elapsedSeconds)}</p></div><button type="button" onClick={() => void finishActivity(answers, elapsedSeconds)} disabled={submitting} className="min-h-10 rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Finalizar e corrigir</button></section>
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6"><h2 className="text-lg font-bold text-dark">1. Banco de palavras</h2><p className="mt-1 text-sm text-muted">Arraste uma palavra ou selecione-a e toque na correspondência.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sources.filter((source) => !assignedSources.has(source.id ?? "")).map((source) => { const sourceId = source.id ?? ""; const selected = selectedSourceId === sourceId; return <button key={sourceId} type="button" draggable onDragStart={() => setDraggedSourceId(sourceId)} onClick={() => setSelectedSourceId(selected ? "" : sourceId)} aria-pressed={selected} className={`min-h-14 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selected ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border bg-background hover:border-primary/50"}`}><ItemView item={source} /></button>; })}</div></section>
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6"><h2 className="text-lg font-bold text-dark">2. Correspondências</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{targets.map((target) => { const targetId = target.id ?? ""; const assignedEntry = Object.entries(answers).find(([, assignedTarget]) => assignedTarget === targetId); const assignedSource = assignedEntry ? sources.find((source) => source.id === assignedEntry[0]) : undefined; return <button key={targetId} type="button" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const sourceId = draggedSourceId || selectedSourceId; if (sourceId) assign(sourceId, targetId); setDraggedSourceId(""); }} onClick={() => { const sourceId = selectedSourceId; if (sourceId) assign(sourceId, targetId); else if (assignedEntry) setAnswers((previous) => { const next = { ...previous }; delete next[assignedEntry[0]]; return next; }); }} aria-label={`Destino: ${target.type === "text" ? target.value : target.altText || "imagem"}${assignedSource ? ", preenchido" : ", vazio"}`} className={`flex min-h-28 flex-col justify-between gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selectedSourceId ? "border-primary/60 hover:bg-primary/5" : "border-border"}`}><span className="w-full"><ItemView item={target} /></span><span className="w-full border-t border-dashed border-border pt-2 text-xs text-muted">{assignedSource ? <span className="block rounded-lg bg-background p-2"><span className="mb-1 block font-semibold text-dark">Palavra posicionada</span><ItemView item={assignedSource} /></span> : "Solte a palavra aqui"}</span></button>; })}</div></section>
          </div>}
          {phase === "finished" && <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7"><ConfettiCelebration active={isStudent && result !== null && result.attempt.totalItems > 0 && result.attempt.correctCount === result.attempt.totalItems} />
                      <h2 className="text-xl font-bold text-dark">{isStudent ? "Resultado final" : "Prévia concluída"}</h2>{submitting ? <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />Corrigindo respostas...</p> : result ? <><p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{correctPreviewCount} de {result.attempt.totalItems} associações corretas · {result.attempt.accuracyPoints} pontos de precisão · {result.attempt.speedPoints} pontos de velocidade.</p><div className="mt-5 space-y-2"><h3 className="text-sm font-bold text-dark">Correção das associações</h3>{result.attempt.corrections.map((correction) => { const source = sources.find((item) => item.id === correction.itemId); const expectedTarget = targets.find((item) => item.id === correction.expectedId); const selectedTarget = correction.selectedId ? targets.find((item) => item.id === correction.selectedId) : undefined; return <div key={correction.itemId} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div><p className="mb-1 text-xs text-muted">Palavra</p>{source ? <ItemView item={source} /> : <span className="text-sm text-muted">Item</span>}</div><span className={`text-sm font-bold ${correction.isCorrect ? "text-emerald-700" : "text-red-700"}`}>{correction.isCorrect ? "Correto" : "Incorreto"}</span><div><p className="mb-1 text-xs text-muted">{correction.isCorrect ? "Correspondência" : "Sua resposta / correta"}</p>{selectedTarget ? <ItemView item={selectedTarget} /> : <span className="text-sm text-muted">Não respondida</span>}{!correction.isCorrect && expectedTarget && <div className="mt-2 rounded-lg bg-emerald-50 p-2"><p className="mb-1 text-xs font-semibold text-emerald-800">Resposta correta</p><ItemView item={expectedTarget} /></div>}</div></div>; })}</div><div className="mt-6 flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">Ranking atualizado</h3></div><RankingList ranking={result.ranking} /><p className="mt-4 rounded-xl bg-background p-4 text-sm text-muted">{result.isInRanking ? "Seu resultado entrou no Top 5." : "Seu resultado foi registrado, mas não entrou no Top 5."}</p></> : <p className="mt-3 text-sm text-muted">{submitError || "A prévia foi concluída sem registrar resultado."}</p>}{submitError && <p role="alert" className="mt-3 text-sm text-red-600">{submitError}</p>}<button type="button" onClick={start} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white"><Play size={17} aria-hidden="true" />{isStudent ? "Tentar novamente" : "Testar novamente"}</button></section>}
          <div className="pt-2"><button type="button" onClick={() => void router.push("/student/activities")} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark"><ArrowLeft size={16} aria-hidden="true" />Voltar às atividades</button></div>
        </div>
      ) : null}
    </RoleBasedLayout>
  );
}
