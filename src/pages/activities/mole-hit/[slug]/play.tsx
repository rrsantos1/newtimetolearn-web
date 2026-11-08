import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import axios from "axios";
import { ArrowLeft, LoaderCircle, Play, Trophy } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { playActivitySound } from "@/modules/users/utils/activitySounds";
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
      content: { holeCount: 6 | 9 | 12; theme?: string; correctOptions: string[]; incorrectOptions: string[] };
    };
  };
}

type GamePhase = "ready" | "countdown" | "playing" | "finished";
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
  EASY: { spawnMs: 1800, visibleMs: 1600 },
  MEDIUM: { spawnMs: 1600, visibleMs: 1400 },
  HARD: { spawnMs: 1400, visibleMs: 1200 },
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
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p></div>
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
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : user.roles.includes("TEACHER") ? "/teacher/activities" : "/student/activities";
  const backLabel = !user ? "Página inicial" : isStudent ? "Voltar às atividades" : "Voltar às atividades";
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [activeHole, setActiveHole] = useState<ActiveMole | null>(null);
  const [hitEffect, setHitEffect] = useState<{ index: number; key: number } | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState<MoleHitAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [ranking, setRanking] = useState<MoleHitRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [scoreSaving, setScoreSaving] = useState(false);
  const gameBoardRef = useRef<HTMLElement | null>(null);
  const countdownValueRef = useRef(3);
  const lastSpawnRef = useRef<number | null>(null);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const gameEndedRef = useRef(false);
  const attemptTokenRef = useRef("");
  const spawnTimeoutRef = useRef<number | null>(null);
  const visibleTimeoutRef = useRef<number | null>(null);
  const hitEffectTimeoutRef = useRef<number | null>(null);
  const hitEffectCounterRef = useRef(0);
  const optionQueueRef = useRef<string[]>([]);
  const previousCycleFirstRef = useRef("");
  const completedCyclesRef = useRef(0);

  const holeCount = selectedDifficulty === "EASY" ? 6 : selectedDifficulty === "MEDIUM" ? 9 : 12;
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
    setPhase("finished");
    setActiveHole(null);
    setHitEffect(null);
    if (hitEffectTimeoutRef.current !== null) window.clearTimeout(hitEffectTimeoutRef.current);
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
      const submitted = await submitMoleHitAttemptService.execute(activity.slug, attemptTokenRef.current, hitsRef.current, missesRef.current);
      setResult(submitted);
      setRanking(submitted.ranking);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, "Não foi possível salvar seu resultado."));
    } finally {
      setScoreSaving(false);
    }
  }, [activity, isStudent, phase]);

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
      if (completedCyclesRef.current >= 3) {
        void finishGame();
        return;
      }
      optionQueueRef.current = shuffleOptions(options, previousCycleFirstRef.current);
      previousCycleFirstRef.current = optionQueueRef.current[0] ?? "";
      completedCyclesRef.current += 1;
    }
    const option = optionQueueRef.current.shift() ?? "";
    const isCorrect = correctOptions.includes(option);
    setActiveHole({ index: safeHole, option, isCorrect, resolved: null });
    if (visibleTimeoutRef.current !== null) window.clearTimeout(visibleTimeoutRef.current);
    const visibleMs = settings.visibleMs;
    visibleTimeoutRef.current = window.setTimeout(
      () => setActiveHole((current) => current?.index === safeHole ? null : current),
      visibleMs,
    );
  }, [activity, finishGame, holeCount, phase, settings.visibleMs]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = window.setInterval(() => {
      if (countdownValueRef.current <= 1) {
        window.clearInterval(timer);
        countdownValueRef.current = 0;
        setCountdown(0);
        attemptTokenRef.current = crypto.randomUUID();
        gameEndedRef.current = false;
        setPhase("playing");
        return;
      }
      countdownValueRef.current -= 1;
      setCountdown(countdownValueRef.current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    let timer: number;
    const scheduleNext = (): void => {
      spawnMole();
      const spawnMs = settings.spawnMs;
      timer = window.setTimeout(scheduleNext, spawnMs);
      spawnTimeoutRef.current = timer;
    };
    scheduleNext();
    return () => {
      window.clearTimeout(timer);
      if (spawnTimeoutRef.current !== null) window.clearTimeout(spawnTimeoutRef.current);
      if (visibleTimeoutRef.current !== null) window.clearTimeout(visibleTimeoutRef.current);
    };
  }, [phase, settings.spawnMs, spawnMole]);

  function startGame(): void {
    hitsRef.current = 0;
    missesRef.current = 0;
    lastSpawnRef.current = null;
    optionQueueRef.current = [];
    previousCycleFirstRef.current = "";
    completedCyclesRef.current = 0;
    setHits(0);
    setMisses(0);
    setActiveHole(null);
    setHitEffect(null);
    if (hitEffectTimeoutRef.current !== null) window.clearTimeout(hitEffectTimeoutRef.current);
    setResult(null);
    setSubmitError("");
    countdownValueRef.current = 3;
    setCountdown(3);
    gameEndedRef.current = false;
    setPhase("countdown");
    window.requestAnimationFrame(() => {
      gameBoardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function hitHole(index: number): void {
    if (phase !== "playing" || gameEndedRef.current) return;
    if (activeHole?.index === index && activeHole.resolved !== null) return;
    if (activeHole?.index === index) {
      if (activeHole.isCorrect) {
        hitsRef.current += 1;
        setHits(hitsRef.current);
        setActiveHole({ ...activeHole, resolved: "correct" });
        setHitEffect({ index, key: ++hitEffectCounterRef.current });
        playActivitySound("success");
        if (hitEffectTimeoutRef.current !== null) window.clearTimeout(hitEffectTimeoutRef.current);
        hitEffectTimeoutRef.current = window.setTimeout(() => setHitEffect(null), 650);
      } else {
        missesRef.current += 1;
        setMisses(missesRef.current);
        setActiveHole({ ...activeHole, resolved: "incorrect" });
        playActivitySound("error");
      }
      return;
    }
    missesRef.current += 1;
    setMisses(missesRef.current);
    playActivitySound("error");
  }

  return (
    <PublicActivityLayout immersive
        title={activity?.version.name ?? "Acertar a Toupeira"}
        description={activity?.version.description ?? "Teste sua atenção e agilidade."}
        titleActions={<div className="flex shrink-0 items-center gap-2"><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link></div>}
      >
      {loading ? <p role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</p> : loadError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p> : activity ? (
        <div className="space-y-5">
          {phase === "ready" && (
            <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]" : ""}>
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3"><Image src="/moles/normal.png" alt="" width={64} height={64} className="object-contain" /><div><h2 className="text-xl font-bold text-dark">Preparado para o desafio?</h2><p className="mt-1 text-sm text-muted">Encontre as opções corretas ao longo de três ciclos completos.</p></div></div>
                <div className="mt-5 grid gap-4 rounded-xl bg-background p-4 sm:grid-cols-2">
                  <div><label htmlFor="mole-hit-difficulty" className="mb-1 block text-sm font-semibold text-dark">Escolha a dificuldade</label><select id="mole-hit-difficulty" value={selectedDifficulty} onChange={(event) => setSelectedDifficulty(event.target.value as "EASY" | "MEDIUM" | "HARD")} className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><option value="EASY">Fácil — 6 buracos</option><option value="MEDIUM">Média — 9 buracos</option><option value="HARD">Difícil — 12 buracos</option></select><p className="mt-1 text-xs text-muted">A dificuldade escolhida vale somente para esta execução.</p></div>
                </div>
                <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}><Play size={18} aria-hidden="true" />{isStudent ? "Iniciar jogo" : "Testar jogo"}</button>
                {!isStudent && <p className="mt-3 text-xs text-muted">A prévia não será registrada no ranking dos alunos.</p>}
              </section>
              {isStudent && <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/4 p-6 shadow-sm sm:p-7"><div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking atual — Top 5</h2></div>{rankingLoading ? <div role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Carregando ranking...</div> : rankingError ? <p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p> : <RankingList ranking={ranking} />}</section>}
            </div>
          )}
          {(phase === "countdown" || phase === "playing") && (
            <section ref={gameBoardRef} className="scroll-mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <div className="mb-5 grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Acertos</p><p className="text-2xl font-bold text-emerald-800 tabular-nums">{hits}</p></div><div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-red-700">Erros</p><p className="text-2xl font-bold text-red-800 tabular-nums">{misses}</p></div></div>
              <div
                className="relative mx-auto h-[min(68vh,560px)] min-h-110 w-full max-w-6xl overflow-hidden rounded-2xl bg-[#d6b47b] bg-cover bg-center shadow-sm"
                style={{
                  backgroundImage: "url(/moles/background.jpg)",
                  backgroundPosition: "center bottom",
                }}
              >
                {phase === "countdown" && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/45 text-center" role="status" aria-live="assertive">
                    <span className="text-sm font-bold uppercase tracking-[0.25em] text-white">Prepare-se!</span>
                    <span key={countdown} className="mt-2 text-8xl font-black leading-none text-white drop-shadow-lg">{countdown}</span>
                    <span className="mt-3 text-sm font-semibold text-white">O jogo começa em instantes</span>
                  </div>
                )}
                {Array.from({ length: holeCount }, (_, index) => {
                  const mole = activeHole?.index === index ? activeHole : null;
                  const moleImage = mole?.resolved === "correct" ? "/moles/hit.png" : mole?.resolved === "incorrect" ? "/moles/surprised.png" : "/moles/normal.png";
                  const rows = Math.ceil(holeCount / 3);
                  const left = ((index % 3) + 0.5) / 3 * 100;
                  const top = 42 + (Math.floor(index / 3) + 0.5) * (53 / rows);
                  const holeSize = holeCount === 6
                    ? "w-[82px] h-[92px] sm:w-[96px] sm:h-[108px]"
                    : holeCount === 9
                      ? "w-[68px] h-[78px] sm:w-[80px] sm:h-[92px]"
                      : "w-[56px] h-[66px] sm:w-[66px] sm:h-[76px]";
                  const shadowSize = holeCount === 6
                    ? "w-[72px] h-[22px] sm:w-[84px] sm:h-[26px]"
                    : holeCount === 9
                      ? "w-[60px] h-[19px] sm:w-[70px] sm:h-[22px]"
                      : "w-[48px] h-[16px] sm:w-[58px] sm:h-[18px]";
                  return (
                    <button
                      type="button"
                      key={index}
                      onClick={() => hitHole(index)}
                      aria-label={mole ? `Opção ${mole.option}${mole.resolved === "correct" ? ", correta" : mole.resolved === "incorrect" ? ", incorreta" : ""}` : "Buraco vazio"}
                      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${holeSize}`}
                      style={{ left: `${left}%`, top: `${top}%` }}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-1 left-1/2 -translate-x-1/2 rounded-[50%] bg-black/25 blur-[2px] ${shadowSize}`}
                      />
                      {mole && (
                        <>
                          <span className="absolute bottom-2 left-1/2 z-10 h-22 w-22 -translate-x-1/2 sm:h-26 sm:w-26">
                            <Image src={moleImage} alt="" fill sizes="(max-width: 640px) 88px, 104px" className="object-contain" />
                          </span>
                          <span className="absolute -top-5 left-1/2 z-20 w-max max-w-[min(220px,38vw)] -translate-x-1/2 rounded-md bg-white px-2 py-1 text-center text-[clamp(0.62rem,1.8vw,0.84rem)] font-extrabold leading-tight text-gray-900 shadow-md wrap-anywhere">
                            {mole.option}
                          </span>
                        </>
                      )}
                      {hitEffect?.index === index && (
                        <span key={hitEffect.key} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
                          {Array.from({ length: 10 }, (_, particleIndex) => {
                            const angle = (Math.PI * 2 * particleIndex) / 10;
                            const dx = Math.round(Math.cos(angle) * 43);
                            const dy = Math.round(Math.sin(angle) * 43);
                            return (
                              <span
                                key={particleIndex}
                                className="mole-hit-particle absolute left-1/2 top-1/2 size-2 rounded-full bg-amber-300 shadow-sm"
                                style={{ "--particle-x": `${dx}px`, "--particle-y": `${dy}px` } as CSSProperties}
                              />
                            );
                          })}
                        </span>
                      )}
                    </button>
                  );
                })}
                <style jsx>{`
                  @keyframes mole-hit-burst {
                    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(calc(-50% + var(--particle-x)), calc(-50% + var(--particle-y))) scale(0.25); }
                  }
                  .mole-hit-particle { animation: mole-hit-burst 550ms ease-out forwards; }
                `}</style>
              </div>
              <p className="mt-4 text-center text-xs text-muted">Escolha as toupeiras com respostas corretas. Todas as opções aparecem uma vez por ciclo; o jogo termina após três ciclos completos.</p>
            </section>
          )}
          {phase === "finished" && (
            <section className="relative rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-7">
              <ConfettiCelebration active={isStudent && result !== null && result.attempt.hits > 0 && result.attempt.misses === 0} />
              <h2 className="text-xl font-bold text-dark">{isStudent ? "Resultado final" : "Prévia concluída"}</h2>
              {scoreSaving && <p role="status" className="mt-3 text-sm text-muted">Registrando seu resultado...</p>}
              {result ? <><p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{result.attempt.hits} acertos · {result.attempt.misses} erros</p><div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">Ranking atualizado</h3></div><RankingList ranking={result.ranking} /></div><p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm font-semibold text-muted">{result.isInRanking ? "Parabéns! Seu resultado entrou no Top 5!" : "Continue praticando para alcançar o Top 5!"}</p></> : <p className="mt-3 text-sm text-muted">{submitError || "Registrando resultado..."}</p>}
              {!isStudent && <p className="mt-3 text-sm text-muted">{submitError}</p>}
              <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}><Play size={17} aria-hidden="true" />Jogar novamente</button>
            </section>
          )}
        </div>
      ) : null}
    </PublicActivityLayout>
  );
}
