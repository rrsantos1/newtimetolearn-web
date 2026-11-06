import { useRouter } from "next/router";
import { playActivitySound } from "@/modules/activities/utils/activitySounds";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import api from "@/lib/api";
import { dragDropActivityService, type DragDropAttemptResult, type DragDropRankingEntry, type DragDropAnswer } from "@/modules/activities/services/dragDropActivityService";

interface WordItem { id: string; text: string; }
interface BlankItem { id: string; expectedWordId?: string; }
interface SentenceItem { id: string; text: string; blanks: BlankItem[]; }
interface ActivityResponse {
  success: true;
  data: {
    slug: string;
    type: string;
    isOwner: boolean;
    version: {
      name: string;
      description: string | null;
      timeLimitSeconds: number | null;
      content: { words: WordItem[]; sentences: SentenceItem[] };
    };
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
function RankingList({ ranking }: Readonly<{ ranking: DragDropRankingEntry[] }>) {
  if (ranking.length === 0) return <p className="mt-3 text-sm text-muted">Ainda não há resultados para esta atividade.</p>;
  return <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">{ranking.slice(0, 5).map((entry) => <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">{entry.position}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p><p className="text-xs text-muted">{formatTime(entry.elapsedSeconds)}</p></div></div><span className="shrink-0 text-sm font-bold text-dark">{entry.score} pts</span></li>)}</ol>;
}

export default function SentenceCompletionPlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedWordId, setSelectedWordId] = useState("");
  const [draggedWordId, setDraggedWordId] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptToken, setAttemptToken] = useState("");
  const [result, setResult] = useState<DragDropAttemptResult | null>(null);
  const [ranking, setRanking] = useState<DragDropRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const timeLimit = activity?.version.timeLimitSeconds ?? null;
  const assignedWords = useMemo(() => new Set(Object.values(answers)), [answers]);
  const blanks = useMemo(() => activity?.version.content.sentences.flatMap((sentence) => sentence.blanks) ?? [], [activity]);

  const loadRanking = useCallback(async (activitySlug: string) => {
    if (!isStudent) return;
    setRankingLoading(true);
    setRankingError("");
    try { setRanking(await dragDropActivityService.getRanking(activitySlug, "sentence-completion")); }
    catch (loadError: unknown) { setRankingError(getErrorMessage(loadError, "Não foi possível carregar o ranking.")); }
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
        if (loaded.type !== "sentence_completion") throw new Error("Esta atividade não é do tipo Complete as Frases.");
        setActivity(loaded);
        setWords(shuffle(loaded.version.content.words));
        if (isStudent) void loadRanking(loaded.slug);
      } catch (loadError: unknown) {
        if (active) setError(getErrorMessage(loadError, "Não foi possível carregar a atividade."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isStudent, loadRanking, router.isReady, slug, user]);

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
      const submitted = await dragDropActivityService.submit(activity.slug, "sentence-completion", answersToSubmit, elapsed, attemptToken);
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

  useEffect(() => {
    if (phase !== "playing" || timeLimit === null || elapsedSeconds < timeLimit) return;
    const timeout = window.setTimeout(() => void finishActivity(answers, timeLimit), 0);
    return () => window.clearTimeout(timeout);
  }, [answers, elapsedSeconds, finishActivity, phase, timeLimit]);

  function assign(blankId: string, wordId: string): void {
    if (phase !== "playing") return;
    setAnswers((previous) => {
      const next = { ...previous };
      for (const [assignedBlankId, assignedWordId] of Object.entries(next)) {
        if (assignedBlankId === blankId || assignedWordId === wordId) delete next[assignedBlankId];
      }
      next[blankId] = wordId;
      return next;
    });
    setSelectedWordId("");
  }

  function start(): void {
    setAttemptToken(globalThis.crypto.randomUUID());
    setAnswers({});
    setSelectedWordId("");
    setElapsedSeconds(0);
    setResult(null);
    setSubmitError("");
    setPhase("playing");
  }

  function renderSentence(sentence: SentenceItem) {
    const segments = sentence.text.split(/(\{\{[^{}]+\}\})/g);
    return segments.map((segment, index) => {
      const match = /^\{\{([^{}]+)\}\}$/.exec(segment);
      if (!match) return <span key={`${sentence.id}-text-${index}`}>{segment}</span>;
      const blankId = match[1];
      const assignedWordId = answers[blankId] ?? "";
      const assignedWord = words.find((word) => word.id === assignedWordId);
      return (
        <button
          key={`${sentence.id}-blank-${blankId}`}
          type="button"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); const wordId = draggedWordId || selectedWordId; if (wordId) assign(blankId, wordId); setDraggedWordId(""); }}
          onClick={() => { if (selectedWordId) assign(blankId, selectedWordId); else if (assignedWordId) setAnswers((previous) => { const next = { ...previous }; delete next[blankId]; return next; }); }}
          aria-label={`Lacuna ${index + 1}${assignedWord ? `: ${assignedWord.text}` : ", vazia"}`}
          className={`mx-1 inline-flex min-h-10 min-w-28 items-center justify-center rounded-lg border-2 border-dashed px-3 py-1 align-middle text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${assignedWord ? "border-primary bg-primary/10 text-dark" : "border-border bg-background text-muted"}`}
        >
          {assignedWord?.text ?? "Solte aqui"}
        </button>
      );
    });
  }

  return (
    <PublicActivityLayout title={activity?.version.name ?? "Atividade"} description={activity?.version.description ?? "Experimente esta atividade."}>
      {loading ? <div role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</div> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : activity ? (
        <div className="space-y-5">
          <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Complete as frases</p><h1 className="mt-1 text-2xl font-bold text-dark">{activity.version.name}</h1>{activity.version.description && <p className="mt-2 text-sm leading-6 text-muted">{activity.version.description}</p>}</div><ActivitySoundToggle /></header>
          {phase === "ready" && <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]" : ""}>
            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm sm:p-8"><div className="flex size-12 items-center justify-center rounded-2xl bg-amber-200/70 text-amber-900"><Play size={24} aria-hidden="true" /></div><h2 className="mt-4 text-xl font-bold text-dark">Antes de começar</h2><p className="mt-2 text-sm leading-6 text-muted">Arraste as palavras para as lacunas. Em celular ou teclado, selecione primeiro a palavra e depois a lacuna desejada.</p><div className="mt-5 grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-2"><div><p className="text-sm text-muted">Frases</p><p className="mt-1 font-semibold text-dark">{activity.version.content.sentences.length}</p></div><div><p className="text-sm text-muted">Tempo disponível</p><p className="mt-1 font-semibold text-dark">{formatTime(timeLimit)}</p></div></div><button type="button" onClick={start} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}><Play size={18} aria-hidden="true" />{isStudent ? "Iniciar atividade" : "Testar atividade"}</button>{!isStudent && <p className="mt-3 text-xs text-muted">O teste não será registrado no ranking dos alunos.</p>}</section>
            {isStudent && <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/[0.04] p-6 shadow-sm"><div className="flex items-center gap-2"><Trophy size={20} className="text-violet-700" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking — Top 5</h2></div><p className="mt-1 text-sm text-muted">Veja as melhores pontuações antes de começar.</p>{rankingLoading ? <p role="status" className="mt-4 text-sm text-muted">Carregando ranking...</p> : rankingError ? <div><p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p><button type="button" onClick={() => void loadRanking(activity.slug)} className="mt-3 min-h-9 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-900">Tentar novamente</button></div> : <RankingList ranking={ranking} />}</section>}
          </div>}
          {phase === "playing" && <div className="space-y-5">
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"><div><p className="text-sm text-muted">Lacunas preenchidas</p><p className="text-lg font-bold text-dark">{Object.keys(answers).length} / {blanks.length}</p></div><div><p className="text-sm text-muted">Tempo</p><p className="text-lg font-bold text-dark" aria-live="polite">{formatTime(elapsedSeconds)}</p></div><button type="button" onClick={() => void finishActivity(answers, elapsedSeconds)} disabled={submitting} className="min-h-10 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ color: "var(--primary-foreground)" }}>Finalizar e corrigir</button></section>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start"><section className="order-1 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-6 lg:order-2 lg:sticky lg:top-5"><h2 className="text-lg font-bold text-dark">Banco de palavras</h2><p className="mt-1 text-sm text-muted">Cada item pode ser utilizado uma vez. As palavras usadas saem do banco, mas podem ser movidas para outra lacuna.</p><div className="mt-4 flex flex-col gap-2">{words.filter((word) => !assignedWords.has(word.id)).map((word) => <button key={word.id} type="button" draggable onDragStart={() => setDraggedWordId(word.id)} onClick={() => setSelectedWordId((current) => current === word.id ? "" : word.id)} aria-pressed={selectedWordId === word.id} className={`min-h-11 w-full rounded-xl border px-4 py-2 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selectedWordId === word.id ? "border-amber-500 bg-amber-200 text-amber-950 ring-2 ring-amber-300" : "border-amber-200 bg-white text-dark hover:border-amber-400"}`}>{word.text}</button>)}</div></section>
            <section className="order-2 rounded-2xl border border-sky-200 bg-sky-50/40 p-4 sm:p-6 lg:order-1"><h2 className="text-lg font-bold text-dark">Frases</h2><div className="mt-4 space-y-4">{activity.version.content.sentences.map((sentence, index) => <article key={sentence.id} className="rounded-xl border border-border bg-background p-4 sm:p-5"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Frase {index + 1}</h3><p className="whitespace-pre-wrap text-base leading-9 text-dark">{renderSentence(sentence)}</p></article>)}</div></section>
            </div>
          </div>}
          {phase === "finished" && <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7"><ConfettiCelebration active={isStudent && result !== null && result.attempt.totalItems > 0 && result.attempt.correctCount === result.attempt.totalItems} />
                      <h2 className="text-xl font-bold text-dark">{isStudent ? "Resultado final" : "Prévia concluída"}</h2>{submitting ? <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />Corrigindo respostas...</p> : result ? <><p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{result.attempt.correctCount} de {result.attempt.totalItems} lacunas corretas · {result.attempt.accuracyPoints} pontos de precisão · {result.attempt.speedPoints} pontos de velocidade.</p><div className="mt-5 space-y-2"><h3 className="text-sm font-bold text-dark">Correção das lacunas</h3>{result.attempt.corrections.map((correction, index) => { const selectedWord = correction.selectedId ? words.find((word) => word.id === correction.selectedId) : undefined; const expectedWord = words.find((word) => word.id === correction.expectedId); return <div key={correction.itemId} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[auto_1fr_1fr] sm:items-center"><span className={`text-sm font-bold ${correction.isCorrect ? "text-emerald-700" : "text-red-700"}`}>Lacuna {index + 1}: {correction.isCorrect ? "Correta" : "Incorreta"}</span><div><p className="text-xs text-muted">Sua resposta</p><p className="text-sm font-semibold text-dark">{selectedWord?.text ?? "Não preenchida"}</p></div><div><p className="text-xs text-muted">Resposta correta</p><p className="text-sm font-semibold text-dark">{expectedWord?.text ?? "Indisponível"}</p></div></div>; })}</div><div className="mt-6 flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">Ranking atualizado</h3></div><RankingList ranking={result.ranking} /><p className="mt-4 rounded-xl bg-background p-4 text-sm text-muted">{result.isInRanking ? "Seu resultado entrou no Top 5." : "Seu resultado foi registrado, mas não entrou no Top 5."}</p></> : <p className="mt-3 text-sm text-muted">{submitError || "A prévia foi concluída sem registrar resultado."}</p>}{submitError && <p role="alert" className="mt-3 text-sm text-red-600">{submitError}</p>}<button type="button" onClick={start} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white" style={{ color: "var(--primary-foreground)" }}><Play size={17} aria-hidden="true" />{isStudent ? "Tentar novamente" : "Testar novamente"}</button></section>}
          <div className="pt-2"><button type="button" onClick={() => void router.push(user ? "/student/activities" : "/")} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark"><ArrowLeft size={16} aria-hidden="true" />{user ? "Voltar às atividades" : "Página inicial"}</button></div>
        </div>
      ) : null}
    </PublicActivityLayout>
  );
}
