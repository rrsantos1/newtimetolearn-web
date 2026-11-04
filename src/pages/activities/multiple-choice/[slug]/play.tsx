import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, LoaderCircle, Play, Trophy } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { playActivitySound } from "@/modules/activities/utils/activitySounds";
import { dragDropActivityService, type DragDropAnswer, type DragDropAttemptResult, type DragDropRankingEntry } from "@/modules/activities/services/dragDropActivityService";
import api from "@/lib/api";

type Item = { id: string; type: "text"; value: string } | { id: string; type: "image"; storageKey: string; altText: string; publicUrl?: string };
interface Pair { id?: string; source: Item; target: Item }
interface ActivityResponse { success: true; data: { slug: string; type: string; version: { name: string; description: string | null; timeLimitSeconds: number | null; content: { pairs: Pair[] } } } }
type Phase = "ready" | "playing" | "finished";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}
function message(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}
function formatTime(seconds: number | null): string {
  if (seconds === null) return "Sem limite";
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
function imageUrl(item: Extract<Item, { type: "image" }>): string | null {
  if (item.publicUrl) return item.publicUrl;
  const base = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${item.storageKey}` : null;
}
function ItemView({ item }: Readonly<{ item: Item }>) {
  if (item.type === "text") return <span className="break-words text-base font-semibold text-dark">{item.value}</span>;
  const src = imageUrl(item);
  return src ? <span className="relative block aspect-video w-full overflow-hidden rounded-lg"><Image src={src} alt={item.altText || "Imagem da opção"} fill sizes="(max-width: 640px) 90vw, 40vw" unoptimized className="object-contain" /></span> : <span className="text-sm text-muted">Imagem indisponível</span>;
}
function Ranking({ entries }: Readonly<{ entries: DragDropRankingEntry[] }>) {
  if (entries.length === 0) return <p className="mt-3 text-sm text-muted">Ainda não há resultados.</p>;
  return <ol className="mt-3 divide-y divide-border rounded-xl border border-border">{entries.slice(0, 5).map((entry) => <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-3 py-3"><span className="min-w-0 truncate text-sm font-semibold text-dark">{entry.position}. {entry.studentName}</span><span className="shrink-0 text-sm font-bold text-dark">{entry.score} pts</span></li>)}</ol>;
}

export default function MultipleChoicePlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [questions, setQuestions] = useState<Pair[]>([]);
  const [options, setOptions] = useState<Item[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [attemptToken, setAttemptToken] = useState("");
  const [result, setResult] = useState<DragDropAttemptResult | null>(null);
  const [ranking, setRanking] = useState<DragDropRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const timeLimit = activity?.version.timeLimitSeconds ?? null;
  const current = questions[currentIndex];
  const selectedAnswers = useMemo(() => Object.keys(answers).length, [answers]);

  const loadRanking = useCallback(async (activitySlug: string) => {
    if (!isStudent) return;
    try { setRanking(await dragDropActivityService.getRanking(activitySlug, "multiple-choice")); }
    catch (loadError: unknown) { setSubmitError(message(loadError)); }
  }, [isStudent]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const response = await api.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        const loaded = response.data.data;
        if (loaded.type !== "multiple_choice") throw new Error("Esta atividade não é de Múltipla Escolha.");
        setActivity(loaded);
        const normalized = loaded.version.content.pairs.map((pair, index) => ({
          source: { ...pair.source, id: pair.source.id || `preview-source-${pair.id ?? index}` } as Item,
          target: { ...pair.target, id: pair.target.id || `preview-target-${pair.id ?? index}` } as Item,
        }));
        setQuestions(shuffle(normalized));
        setOptions(shuffle(normalized.map((pair) => pair.target)));
        if (isStudent) void loadRanking(loaded.slug);
      } catch (loadError: unknown) {
        if (active) setError(message(loadError));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isStudent, loadRanking, router.isReady, slug]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const finish = useCallback(async (finalAnswers: Record<string, string>, seconds: number) => {
    if (!activity || phase !== "playing" || submitting) return;
    setPhase("finished");
    if (!isStudent) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload: DragDropAnswer[] = Object.entries(finalAnswers).map(([itemId, selectedIdValue]) => ({ itemId, selectedId: selectedIdValue }));
      const submitted = await dragDropActivityService.submit(activity.slug, "multiple-choice", payload, seconds, attemptToken);
      setResult(submitted);
      setRanking(submitted.ranking);
      if (submitted.attempt.totalItems > 0 && submitted.attempt.correctCount === submitted.attempt.totalItems) playActivitySound("applause");
      else if (submitted.attempt.correctCount > 0) playActivitySound("success");
      else playActivitySound("error");
    } catch (submitFailure: unknown) {
      setSubmitError(message(submitFailure));
    } finally {
      setSubmitting(false);
    }
  }, [activity, attemptToken, isStudent, phase, submitting]);

  useEffect(() => {
    if (phase !== "playing" || timeLimit === null || elapsed < timeLimit) return;
    const timeout = window.setTimeout(() => void finish(answers, timeLimit), 0);
    return () => window.clearTimeout(timeout);
  }, [answers, elapsed, finish, phase, timeLimit]);

  function start(): void {
    setAnswers({});
    setSelectedId("");
    setCurrentIndex(0);
    setElapsed(0);
    setResult(null);
    setSubmitError("");
    setAttemptToken(globalThis.crypto.randomUUID());
    setPhase("playing");
  }

  function confirmAnswer(): void {
    if (!current || !selectedId) return;
    const nextAnswers = { ...answers, [current.source.id]: selectedId };
    setAnswers(nextAnswers);
    setSelectedId("");
    if (currentIndex + 1 >= questions.length) void finish(nextAnswers, elapsed);
    else setCurrentIndex((value) => value + 1);
  }

  const correctCount = result?.attempt.correctCount ?? 0;
  return (
    <RoleBasedLayout area="student" allowedRoles={["STUDENT", "TEACHER", "ADMIN"]} title={activity?.version.name ?? "Múltipla escolha"} description={activity?.version.description ?? "Escolha a correspondência correta para cada item."}>
      {loading ? <p role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : activity ? <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Múltipla escolha</p><h1 className="mt-1 text-2xl font-bold text-dark">{activity.version.name}</h1>{activity.version.description && <p className="mt-2 text-sm leading-6 text-muted">{activity.version.description}</p>}</div><ActivitySoundToggle /></header>
        {phase === "ready" && <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]" : ""}>
          <section className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6 shadow-sm sm:p-8"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div><h2 className="mt-4 text-xl font-bold text-dark">Pronto para começar?</h2><p className="mt-2 text-sm leading-6 text-muted">Uma questão será exibida por vez. Escolha uma das correspondências; todas as opções permanecerão disponíveis durante a atividade.</p><div className="mt-5 grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-2"><div><p className="text-sm text-muted">Questões</p><p className="mt-1 font-semibold text-dark">{questions.length}</p></div><div><p className="text-sm text-muted">Tempo disponível</p><p className="mt-1 font-semibold text-dark">{formatTime(timeLimit)}</p></div></div><button type="button" onClick={start} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Play size={18} aria-hidden="true" />{isStudent ? "Iniciar atividade" : "Testar atividade"}</button>{!isStudent && <p className="mt-3 text-xs text-muted">O teste não será registrado no ranking dos alunos.</p>}</section>
          {isStudent && <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6 shadow-sm"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking — Top 5</h2></div><Ranking entries={ranking} /></section>}
        </div>}
        {phase === "playing" && current && <div className="space-y-5">
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"><div><p className="text-sm text-muted">Questão</p><p className="text-lg font-bold text-dark">{currentIndex + 1} de {questions.length}</p></div><div><p className="text-sm text-muted">Respondidas</p><p className="text-lg font-bold text-dark">{selectedAnswers} de {questions.length}</p></div><div><p className="text-sm text-muted">Tempo</p><p className="text-lg font-bold text-dark" aria-live="polite">{formatTime(elapsed)}</p></div><button type="button" onClick={() => void finish(answers, elapsed)} disabled={submitting} className="min-h-10 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark disabled:opacity-50">Finalizar</button></section>
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Qual é a correspondência?</p><div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-5"><ItemView item={current.source} /></div><h2 className="mt-6 text-lg font-bold text-dark">Selecione uma opção</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{options.map((option, index) => <button key={option.id} type="button" onClick={() => setSelectedId(option.id)} aria-pressed={selectedId === option.id} className={`min-h-20 rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selectedId === option.id ? "border-orange-500 bg-orange-100 ring-2 ring-orange-300/60" : "border-border bg-white hover:border-orange-300"}`}><span className="mb-2 block text-xs font-semibold text-muted">Opção {index + 1}</span><ItemView item={option} /></button>)}</div><button type="button" onClick={confirmAnswer} disabled={!selectedId} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{currentIndex + 1 === questions.length ? "Concluir atividade" : "Confirmar e avançar"}</button></section>
        </div>}
        {phase === "finished" && <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-7"><ConfettiCelebration active={isStudent && result !== null && result.attempt.totalItems > 0 && correctCount === result.attempt.totalItems} /><h2 className="text-xl font-bold text-dark">{isStudent ? "Resultado final" : "Prévia concluída"}</h2>{submitting ? <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />Corrigindo respostas...</p> : result ? <><p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{correctCount} de {result.attempt.totalItems} questões corretas · {result.attempt.accuracyPoints} pontos de precisão · {result.attempt.speedPoints} pontos de velocidade.</p><div className="mt-5 space-y-2"><h3 className="text-sm font-bold text-dark">Correção das questões</h3>{result.attempt.corrections.map((correction, index) => { const question = questions.find((pair) => pair.source.id === correction.itemId); const selected = options.find((item) => item.id === correction.selectedId); const expected = options.find((item) => item.id === correction.expectedId); return <div key={correction.itemId} className="rounded-xl border border-border bg-surface p-3"><div className="grid gap-3 sm:grid-cols-[1fr_1fr]"><div><p className="mb-1 text-xs text-muted">Questão {index + 1}</p>{question && <ItemView item={question.source} />}</div><div><p className="mb-1 text-xs text-muted">{correction.isCorrect ? "Resposta correta" : "Sua resposta"}</p>{selected ? <ItemView item={selected} /> : <span className="text-sm text-muted">Não respondida</span>}{!correction.isCorrect && expected && <div className="mt-2 rounded-lg bg-emerald-50 p-2"><p className="mb-1 text-xs font-semibold text-emerald-800">Resposta esperada</p><ItemView item={expected} /></div>}</div></div><p className={`mt-2 text-sm font-semibold ${correction.isCorrect ? "text-emerald-700" : "text-red-700"}`}>{correction.isCorrect ? "Correto" : "Incorreto"}</p></div>; })}</div><div className="mt-6 flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">Ranking atualizado</h3></div><Ranking entries={result.ranking} /><p className="mt-4 rounded-xl bg-background p-4 text-sm text-muted">{result.isInRanking ? "Seu resultado entrou no Top 5." : "Seu resultado foi registrado, mas não entrou no Top 5."}</p></> : <p role="alert" className="mt-3 text-sm text-red-600">{submitError || "A prévia foi concluída sem registrar resultado."}</p>}{submitError && <p role="alert" className="mt-3 text-sm text-red-600">{submitError}</p>}<button type="button" onClick={start} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white"><Play size={17} aria-hidden="true" />Tentar novamente</button></section>}
        <div className="pt-2"><button type="button" onClick={() => void router.push("/student/activities")} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark"><ArrowLeft size={16} aria-hidden="true" />Voltar às atividades</button></div>
      </div> : null}
    </RoleBasedLayout>
  );
}
