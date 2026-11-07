import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { LoaderCircle, Play, Trophy } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { submitMoleHitAttemptService, type MoleHitAttemptResult } from "@/modules/activities/services/submitMoleHitAttemptService";
import { getMoleHitRankingService } from "@/modules/activities/services/getMoleHitRankingService";
import type { MoleHitRankingEntry } from "@/modules/activities/services/getMoleHitRankingService";

interface ActivityResponse {
  success: true;
  data: {
    slug: string;
    type: string;
    version: {
      name: string;
      description: string | null;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      timeLimitSeconds: number | null;
      content: { holeCount: 6 | 9 | 12; theme?: string; correctOptions: string[]; incorrectOptions: string[] };
    };
  };
}

type GamePhase = "ready" | "playing" | "finished";
type ActiveMole = { index: number; option: string; isCorrect: boolean; resolved: "correct" | "incorrect" | null };

function shuffleOptions(options: string[], previousFirst: string): string[] {
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  if (shuffled.length > 1 && shuffled[0] === previousFirst) {
    const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
  }
  return shuffled;
}

const DIFFICULTY_SETTINGS = {
  EASY: { spawnMs: 1000, visibleMs: 850 },
  MEDIUM: { spawnMs: 800, visibleMs: 700 },
  HARD: { spawnMs: 650, visibleMs: 550 },
} as const;

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}

function RankingList({ ranking }: Readonly<{ ranking: MoleHitRankingEntry[] }>) {
  if (ranking.length === 0) return <p className="mt-3 text-sm text-muted">Ainda não há resultados. Seja o primeiro no ranking!</p>;
  return (
    <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {ranking.slice(0, 5).map((entry) => (
        <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p><p className="text-xs text-muted">{entry.elapsedSeconds}s</p></div>
          <strong className="shrink-0 text-dark">{entry.score} pts</strong>
        </li>
      ))}
    </ol>
  );
}

export default function MoleHitPlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [activeHole, setActiveHole] = useState<ActiveMole | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [remaining, setRemaining] = useState(30);
  const [result, setResult] = useState<MoleHitAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [ranking, setRanking] = useState<MoleHitRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [scoreSaving, setScoreSaving] = useState(false);
  const startAtRef = useRef<number>(0);
  const lastSpawnRef = useRef<number | null>(null);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const remainingRef = useRef(30);
  const gameEndedRef = useRef(false);
  const attemptTokenRef = useRef("");
  const spawnTimeoutRef = useRef<number | null>(null);
  const visibleTimeoutRef = useRef<number | null>(null);
  const optionQueueRef = useRef<string[]>([]);
  const previousCycleFirstRef = useRef("");

  const holeCount = selectedDifficulty === "EASY" ? 6 : selectedDifficulty === "MEDIUM" ? 9 : 12;
  const duration = activity?.version.timeLimitSeconds ?? 30;
  const settings = useMemo(() => DIFFICULTY_SETTINGS[selectedDifficulty], [selectedDifficulty]);

  const loadRanking = useCallback(async (activitySlug: string): Promise<void> => {
    setRankingLoading(true);
    setRankingError("");
    try {
      setRanking(await getMoleHitRankingService.execute(activitySlug));
    } catch (error: unknown) {
      setRankingError(getErrorMessage(error, "Não foi possível carregar o ranking."));
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const loaded = user
          ? (await (await import("@/lib/api")).default.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`)).data.data
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<ActivityResponse["data"]>(slug);
        if (!active) return;
        if (loaded.type !== "mole_hit") throw new Error("Esta atividade não é Acertar a Toupeira.");
        setActivity(loaded);
        setSelectedDifficulty(loaded.version.difficulty);
        if (user?.roles.includes("STUDENT")) void loadRanking(slug);
      } catch (error: unknown) {
        if (active) setLoadError(getErrorMessage(error, "Não foi possível carregar a atividade."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router.isReady, slug, user, loadRanking]);

  const finishGame = useCallback(async (): Promise<void> => {
    if (phase !== "playing" || !activity || gameEndedRef.current) return;
    gameEndedRef.current = true;
    const elapsedSeconds = Math.min(duration, Math.max(0, Math.floor((Date.now() - startAtRef.current) / 1000)));
    setPhase("finished");
    setActiveHole(null);
    setScoreSaving(isStudent);
    if (spawnTimeoutRef.current !== null) window.clearTimeout(spawnTimeoutRef.current);
    if (visibleTimeoutRef.current !== null) window.clearTimeout(visibleTimeoutRef.current);
    setSubmitError("");
    if (!isStudent) {
      setScoreSaving(false);
      setSubmitError("Prévia concluída. O resultado não foi registrado no ranking dos alunos.");
      return;
    }
    try {
      const submitted = await submitMoleHitAttemptService.execute(activity.slug, attemptTokenRef.current, hitsRef.current, missesRef.current, elapsedSeconds);
      setResult(submitted);
      setRanking(submitted.ranking);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, "Não foi possível salvar seu resultado."));
    } finally {
      setScoreSaving(false);
    }
  }, [activity, duration, isStudent, phase]);

  const spawnMole = useCallback(() => {
    if (phase !== "playing" || gameEndedRef.current) return;
    const nextHole = Math.floor(Math.random() * holeCount);
    const safeHole = lastSpawnRef.current === nextHole && holeCount > 1 ? (nextHole + 1) % holeCount : nextHole;
    lastSpawnRef.current = safeHole;
    const content = activity?.version.content;
    const correctOptions = content?.correctOptions?.length ? content.correctOptions : ["Toupeira"];
    const incorrectOptions = content?.incorrectOptions?.length ? content.incorrectOptions : ["Tente novamente"];
    const options = [...correctOptions, ...incorrectOptions];
    if (optionQueueRef.current.length === 0) {
      optionQueueRef.current = shuffleOptions(options, previousCycleFirstRef.current);
      previousCycleFirstRef.current = optionQueueRef.current[0] ?? "";
    }
    const option = optionQueueRef.current.shift() ?? "";
    const isCorrect = correctOptions.includes(option);
    setActiveHole({ index: safeHole, option, isCorrect, resolved: null });
    const elapsed = (Date.now() - startAtRef.current) / 1000;
    const acceleration = Math.min(0.55, elapsed / Math.max(1, duration) * 0.55);
    const visibleMs = Math.max(260, Math.round(settings.visibleMs * (1 - acceleration)));
    if (visibleTimeoutRef.current !== null) window.clearTimeout(visibleTimeoutRef.current);
    visibleTimeoutRef.current = window.setTimeout(() => setActiveHole((current) => current?.index === safeHole ? null : current), visibleMs);
  }, [activity, duration, holeCount, phase, settings.visibleMs]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startAtRef.current) / 1000);
      const nextRemaining = Math.max(0, duration - elapsed);
      remainingRef.current = nextRemaining;
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) void finishGame();
    }, 100);
    return () => window.clearInterval(timer);
  }, [duration, finishGame, phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    let timer: number;
    const scheduleNext = (): void => {
      spawnMole();
      const elapsedNow = Math.max(0, (Date.now() - startAtRef.current) / 1000);
      const progress = Math.min(0.55, elapsedNow / Math.max(1, duration) * 0.55);
      const nextInterval = Math.max(280, Math.round(settings.spawnMs * (1 - progress)));
      timer = window.setTimeout(scheduleNext, nextInterval);
      spawnTimeoutRef.current = timer;
    };
    scheduleNext();
    return () => {
      window.clearTimeout(timer);
      if (spawnTimeoutRef.current !== null) window.clearTimeout(spawnTimeoutRef.current);
      if (visibleTimeoutRef.current !== null) window.clearTimeout(visibleTimeoutRef.current);
    };
  }, [duration, phase, settings.spawnMs, spawnMole]);

  function startGame(): void {
    hitsRef.current = 0;
    missesRef.current = 0;
    remainingRef.current = duration;
    lastSpawnRef.current = null;
    optionQueueRef.current = [];
    previousCycleFirstRef.current = "";
    setHits(0);
    setMisses(0);
    setRemaining(duration);
    setActiveHole(null);
    setResult(null);
    setSubmitError("");
    startAtRef.current = Date.now();
    attemptTokenRef.current = crypto.randomUUID();
    gameEndedRef.current = false;
    setPhase("playing");
  }

  function hitHole(index: number): void {
    if (phase !== "playing" || gameEndedRef.current) return;
    if (activeHole?.index === index && activeHole.resolved !== null) return;
    if (activeHole?.index === index) {
      if (activeHole.isCorrect) {
        hitsRef.current += 1;
        setHits(hitsRef.current);
        setActiveHole({ ...activeHole, resolved: "correct" });
      } else {
        missesRef.current += 1;
        setMisses(missesRef.current);
        setActiveHole({ ...activeHole, resolved: "incorrect" });
      }
      return;
    }
    missesRef.current += 1;
    setMisses(missesRef.current);
  }

  const boardCols = holeCount === 6 ? 3 : 4;
  return (
    <PublicActivityLayout title={activity?.version.name ?? "Acertar a Toupeira"} description={activity?.version.description ?? "Teste sua atenção e agilidade."}>
      {loading ? <p role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</p> : loadError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p> : activity ? (
        <div className="space-y-5">
          <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Acertar a toupeira</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-dark">{activity.version.name}</h1>{activity.version.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{activity.version.description}</p>}</div>
          </header>
          {phase === "ready" && (
            <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]" : ""}>
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3"><Image src="/moles/normal.png" alt="" width={64} height={64} className="object-contain" /><div><h2 className="text-xl font-bold text-dark">Preparado para o desafio?</h2><p className="mt-1 text-sm text-muted">Acerte o máximo de toupeiras em {duration} segundos!</p></div></div>
                <div className="mt-5 grid gap-4 rounded-xl bg-background p-4 sm:grid-cols-2">
                  <div><label htmlFor="mole-hit-difficulty" className="mb-1 block text-sm font-semibold text-dark">Escolha a dificuldade</label><select id="mole-hit-difficulty" value={selectedDifficulty} onChange={(event) => setSelectedDifficulty(event.target.value as "EASY" | "MEDIUM" | "HARD")} className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><option value="EASY">Fácil — 6 buracos</option><option value="MEDIUM">Média — 9 buracos</option><option value="HARD">Difícil — 12 buracos</option></select><p className="mt-1 text-xs text-muted">A dificuldade escolhida vale somente para esta execução.</p></div>
                  <div><p className="text-sm text-muted">Tempo de jogo</p><p className="mt-1 font-semibold text-dark">{duration} segundos</p><p className="mt-1 text-xs text-muted">A velocidade das toupeiras também muda conforme a dificuldade.</p></div>
                </div>
                <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}><Play size={18} aria-hidden="true" />{isStudent ? "Iniciar jogo" : "Testar jogo"}</button>
                {!isStudent && <p className="mt-3 text-xs text-muted">A prévia não será registrada no ranking dos alunos.</p>}
              </section>
              {isStudent && <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/4 p-6 shadow-sm sm:p-7"><div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking atual — Top 5</h2></div>{rankingLoading ? <div role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Carregando ranking...</div> : rankingError ? <p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p> : <RankingList ranking={ranking} />}</section>}
            </div>
          )}
          {phase === "playing" && (
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <div className="mb-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-background p-3"><p className="text-xs text-muted">Tempo</p><p className="text-2xl font-bold text-dark tabular-nums">{remaining}s</p></div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Acertos</p><p className="text-2xl font-bold text-emerald-800 tabular-nums">{hits}</p></div><div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-red-700">Erros</p><p className="text-2xl font-bold text-red-800 tabular-nums">{misses}</p></div></div>
              <div className="mx-auto grid max-w-3xl gap-3 rounded-2xl bg-[#d6b47b] bg-cover bg-center p-3 sm:gap-4 sm:p-5" style={{ gridTemplateColumns: `repeat(${boardCols}, minmax(0, 1fr))`, backgroundImage: "url(/moles/background.jpg)" }}>
                {Array.from({ length: holeCount }, (_, index) => {
                  const mole = activeHole?.index === index ? activeHole : null;
                  const moleImage = mole?.resolved === "correct" ? "/moles/hit.png" : mole?.resolved === "incorrect" ? "/moles/surprised.png" : "/moles/normal.png";
                  return (
                    <button type="button" key={index} onClick={() => hitHole(index)} aria-label={mole ? `Opção ${mole.option}${mole.resolved === "correct" ? ", correta" : mole.resolved === "incorrect" ? ", incorreta" : ""}` : "Buraco vazio"} className="relative flex aspect-square min-h-0 items-end justify-center overflow-hidden rounded-[50%] border-4 border-[#9a6b35] bg-[#70451f] shadow-inner focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                      {mole && <>
                        <Image src={moleImage} alt="" fill sizes="(max-width: 640px) 28vw, 160px" className="object-contain" />
                        <span className="absolute inset-x-1 top-1 z-10 rounded-lg bg-white/95 px-1 py-1 text-center text-[clamp(0.55rem,2vw,0.85rem)] font-extrabold leading-tight text-gray-900 shadow-sm wrap-anywhere">{mole.option}</span>
                      </>}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-xs text-muted">Escolha as toupeiras com respostas corretas. A cada rodada, as opções são embaralhadas novamente quando todas já apareceram.</p>
              <div className="mt-4 flex justify-end"><button type="button" onClick={() => { if (window.confirm("Deseja encerrar esta tentativa agora?")) void finishGame(); }} className="min-h-10 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Encerrar jogo</button></div>
            </section>
          )}
          {phase === "finished" && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-bold text-dark">{isStudent ? "Resultado final" : "Prévia concluída"}</h2>
              {scoreSaving && <p role="status" className="mt-3 text-sm text-muted">Registrando seu resultado...</p>}
              {result ? <><p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{result.attempt.hits} acertos · {result.attempt.misses} erros · {result.attempt.elapsedSeconds}s</p><div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">Ranking atualizado</h3></div><RankingList ranking={result.ranking} /></div><p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm font-semibold text-muted">{result.isInRanking ? "Parabéns! Seu resultado entrou no Top 5!" : "Continue praticando para alcançar o Top 5!"}</p></> : <p className="mt-3 text-sm text-muted">{submitError || "Registrando resultado..."}</p>}
              {!isStudent && <p className="mt-3 text-sm text-muted">{submitError}</p>}
              <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}><Play size={17} aria-hidden="true" />Jogar novamente</button>
            </section>
          )}
        </div>
      ) : null}
    </PublicActivityLayout>
  );
}
