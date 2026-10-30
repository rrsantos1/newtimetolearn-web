import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { RoleGuard } from "@/modules/auth/components/RoleGuard";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { CrosswordGame, type CrosswordClue } from "@/modules/activities/components/CrosswordGame";
import { getCrosswordService } from "@/modules/activities/services/crossword/getCrosswordService";
import { getCrosswordRankingService, type CrosswordRankingEntry } from "@/modules/activities/services/crossword/getCrosswordRankingService";
import { submitCrosswordAttemptService, type CrosswordAttemptResult } from "@/modules/activities/services/crossword/submitCrosswordAttemptService";
import type { EditableCrosswordActivity } from "@/modules/activities/types/crossword.types";

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

function formatTime(seconds: number | null): string {
  if (seconds === null) return "Sem limite de tempo";
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function RankingList({ ranking }: Readonly<{ ranking: CrosswordRankingEntry[] }>) {
  if (ranking.length === 0) {
    return <p className="mt-3 text-sm text-muted">Ainda não há resultados. Você pode ser o primeiro a entrar no ranking!</p>;
  }

  return (
    <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {ranking.map((entry) => (
        <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">{entry.position}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p>
              <p className="text-xs text-muted">Tempo: {formatTime(entry.elapsedSeconds)}</p>
            </div>
          </div>
          <span className="shrink-0 font-bold text-dark">{entry.score} pts</span>
        </li>
      ))}
    </ol>
  );
}

export default function PlayCrosswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const backHref = isTeacher ? "/teacher/activities" : "/dashboard";
  const backLabel = isTeacher ? "Voltar às atividades" : "Voltar ao painel";

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
  const [pendingAttempt, setPendingAttempt] = useState<{ answers: string[]; elapsedSeconds: number } | null>(null);

  const loadRanking = useCallback(async (slug: string): Promise<void> => {
    setRankingLoading(true);
    setRankingError("");
    try {
      setRanking(await getCrosswordRankingService.execute(slug));
    } catch (loadError: unknown) {
      setRankingError(getErrorMessage(loadError, "Não foi possível carregar o recorde agora."));
    } finally {
      setRankingLoading(false);
    }
  }, []);

  const handleComplete = useCallback(async (answers: string[], elapsedSeconds: number): Promise<void> => {
    if (!activity) return;
    if (!isStudent) {
      setPhase("finished");
      return;
    }
    if (attemptResult || submittingAttempt) return;

    setPendingAttempt({ answers, elapsedSeconds });
    setSubmittingAttempt(true);
    setAttemptError("");
    setPhase("finished");

    try {
      const result = await submitCrosswordAttemptService.execute(activity.slug, answers, elapsedSeconds);
      setAttemptResult(result);
      setRanking(result.ranking);
      setPendingAttempt(null);
    } catch (submitError: unknown) {
      setAttemptError(getErrorMessage(submitError, "Não foi possível registrar sua pontuação. Tente novamente."));
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
        const result = await getCrosswordService.execute(slug);
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
    <RoleGuard allowedRoles={["ADMIN", "TEACHER", "STUDENT"]}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
            <BrandLogo href="/dashboard" />
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-5 xl:px-8">
          {loading ? (
            <div role="status" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6">
              <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-muted">Carregando palavras cruzadas...</p>
            </div>
          ) : error ? (
            <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-lg font-semibold text-red-900">Não foi possível abrir a atividade</h1>
              <p className="mt-2 text-sm leading-6 text-red-800">{error}</p>
              <Link href={backHref} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-900"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link>
            </section>
          ) : activity ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Palavras cruzadas</p>
                    <h1 className="text-xl font-bold tracking-tight text-dark sm:text-2xl">{activity.version.name}</h1>
                  </div>
                  {activity.version.description && <p className="mt-1 max-w-3xl text-sm leading-5 text-muted">{activity.version.description}</p>}
                </div>
                <Link href={backHref} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link>
              </div>

              {phase === "ready" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                  <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div>
                    <h2 className="mt-4 text-xl font-bold text-dark">Preparado para o desafio?</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">Complete as palavras usando as pistas horizontais e verticais. O cronômetro começa somente quando você iniciar.</p>
                    <div className="mt-5 rounded-xl bg-background p-4">
                      <p className="text-sm font-semibold text-dark">Tempo disponível</p>
                      <p className="mt-1 text-sm text-muted">{formatTime(activity.version.timeLimitSeconds)}</p>
                    </div>
                    <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                      <Play size={18} aria-hidden="true" />{isStudent ? "Iniciar cruzadinha" : "Testar cruzadinha"}
                    </button>
                    {!isStudent && <p className="mt-3 text-xs text-muted">A execução de teste não é registrada no recorde dos alunos.</p>}
                  </section>

                  {isStudent && (
                    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7">
                      <div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Record atual — Top 5</h2></div>
                      <p className="mt-1 text-sm text-muted">Tente superar as melhores pontuações desta atividade.</p>
                      {rankingLoading ? <div role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Carregando recorde...</div> : rankingError ? (
                        <div><p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p><button type="button" onClick={() => void loadRanking(activity.slug)} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background">Tentar novamente</button></div>
                      ) : <RankingList ranking={ranking} />}
                    </section>
                  )}
                </div>
              )}

              {phase === "playing" && <CrosswordGame key={gameKey} grid={grid} clues={clues} timeLimitSeconds={activity.version.timeLimitSeconds} onComplete={handleComplete} canAutoFill={!isStudent} />}

              {phase === "finished" && !isStudent && (
                <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                  <h2 className="text-xl font-bold text-dark">Teste concluído</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">A prévia foi encerrada. Tentativas de professor não são registradas no recorde dos alunos.</p>
                  <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-semibold text-white hover:bg-primary-hover"><Play size={17} aria-hidden="true" />Testar novamente</button>
                </section>
              )}

              {phase === "finished" && isStudent && (
                <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
                  {submittingAttempt ? (
                    <div role="status" className="flex items-center gap-3 text-sm font-medium text-muted"><LoaderCircle size={20} className="animate-spin" aria-hidden="true" />Conferindo respostas e registrando sua pontuação...</div>
                  ) : attemptError ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p>{attemptError}</p>
                      {pendingAttempt && <button type="button" onClick={() => void handleComplete(pendingAttempt.answers, pendingAttempt.elapsedSeconds)} disabled={submittingAttempt} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300 px-3 font-semibold hover:bg-red-100 disabled:opacity-60">Tentar registrar novamente</button>}
                    </div>
                  ) : attemptResult ? (
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Resultado final</p>
                          <p className="mt-1 text-3xl font-bold text-dark">{attemptResult.attempt.score}<span className="text-lg text-muted">/100 pontos</span></p>
                          <p className="mt-2 text-sm text-muted">Palavras corretas: {attemptResult.attempt.wordsFound.length} de {attemptResult.attempt.totalWords}</p>
                          <p className="mt-1 text-sm text-muted">Tempo utilizado: {formatTime(attemptResult.attempt.elapsedSeconds)}</p>
                          <p className="mt-1 text-sm text-muted">Precisão: {attemptResult.attempt.accuracyPoints}/80 · Velocidade: {attemptResult.attempt.speedPoints}/20</p>
                        </div>
                        <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${attemptResult.isInRanking ? "bg-emerald-50 text-emerald-800" : "bg-background text-muted"}`}>
                          {attemptResult.isInRanking ? "Parabéns! Seu resultado entrou no Top 5!" : "Seu resultado não entrou no Top 5 desta vez. Continue praticando!"}
                        </p>
                      </div>
                      <div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Record atualizado</h2></div><RankingList ranking={ranking} /></div>
                      <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-semibold text-white hover:bg-primary-hover"><Play size={17} aria-hidden="true" />Jogar novamente</button>
                    </>
                  ) : null}
                </section>
              )}
            </>
          ) : null}
        </main>
      </div>
    </RoleGuard>
  );
}
