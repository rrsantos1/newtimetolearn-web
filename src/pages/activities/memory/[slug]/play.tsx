import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import axios from "axios";
import { LoaderCircle, Play, Trophy } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { submitMemoryAttemptService, type MemoryAttemptResult } from "@/modules/activities/services/submitMemoryAttemptService";
import { getMemoryRankingService, type MemoryRankingEntry } from "@/modules/activities/services/getMemoryRankingService";
import type { MemoryItemValue } from "@/modules/activities/schemas/createMemorySchema";

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
      timeLimitSeconds: number | null;
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

function formatTime(totalSeconds: number | null): string {
  if (totalSeconds === null) return "Sem limite de tempo";
  return `${Math.floor(totalSeconds / 60).toString().padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}

function RankingList({ ranking }: Readonly<{ ranking: MemoryRankingEntry[] }>) {
  if (ranking.length === 0) {
    return <p className="mt-3 text-sm text-muted">Ainda não há resultados. Você pode ser o primeiro a entrar no ranking!</p>;
  }

  return (
    <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {ranking.slice(0, 5).map((entry) => (
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

export default function MemoryGamePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [seconds, setSeconds] = useState(0);
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
      setRankingError(getErrorMessage(error, "Não foi possível carregar o ranking agora."));
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const response = await (await import("@/lib/api")).default.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        if (response.data.data.type !== "memory") throw new Error("Esta atividade não é um jogo da memória.");
        setActivity(response.data.data);
        if (user?.roles.includes("STUDENT")) void loadRanking(response.data.data.slug);
      } catch (error: unknown) {
        if (active) setLoadError(getErrorMessage(error, "Não foi possível carregar a atividade."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router.isReady, slug, user, loadRanking]);

  const timeLimit = activity?.version.timeLimitSeconds ?? null;

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const finishGame = useCallback(async (
    finalMatchedIds: string[] = matchedIds,
    finalWrongAttempts: number = wrongAttempts,
  ): Promise<void> => {
    if (phase !== "playing" || !activity) return;
    setPhase("finished");
    setSubmitError("");
    if (!isStudent) {
      setSubmitError("Prévia concluída. O resultado não foi registrado no ranking dos alunos.");
      return;
    }
    try {
      const elapsedSeconds = timeLimit === null ? seconds : Math.min(seconds, timeLimit);
      const submitted = await submitMemoryAttemptService.execute(activity.slug, finalMatchedIds, finalWrongAttempts, elapsedSeconds);
      setResult(submitted);
      setRanking(submitted.ranking);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, "Não foi possível salvar seu resultado."));
    }
  }, [activity, isStudent, matchedIds, phase, seconds, timeLimit, wrongAttempts]);

  useEffect(() => {
    if (phase !== "playing" || timeLimit === null || seconds < timeLimit) return;

    const timeout = window.setTimeout(() => {
      void finishGame(matchedIds, wrongAttempts);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [finishGame, matchedIds, phase, seconds, timeLimit, wrongAttempts]);

  function startGame(): void {
    setOpenIds([]);
    setMatchedIds([]);
    setWrongAttempts(0);
    setSeconds(0);
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
      window.setTimeout(() => setOpenIds([]), 500);
      if (nextMatched.length === (activity?.version.content.pairs.length ?? 0)) {
        void finishGame(nextMatched, wrongAttempts);
      }
      return;
    }

    setWrongAttempts((current) => current + 1);
    window.setTimeout(() => setOpenIds([]), 900);
  }

  const visibleIds = new Set([...openIds, ...cards.filter((card) => matchedIds.includes(card.pairId)).map((card) => card.id)]);
  return (
    <RoleBasedLayout area="student" allowedRoles={["STUDENT", "TEACHER", "ADMIN"]} title={activity?.version.name ?? "Jogo da memória"} description={activity?.version.description ?? "Encontre todos os pares."}>
      {loading ? (
        <p role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</p>
      ) : loadError ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
      ) : activity ? (
        <div className="space-y-5">
          <header className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Jogo da memória</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-dark">{activity.version.name}</h1>
            {activity.version.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{activity.version.description}</p>}
          </header>

          {phase === "ready" && (
            <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]" : ""}>
              <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div>
                <h2 className="mt-4 text-xl font-bold text-dark">Preparado para o desafio?</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Encontre todos os pares de cartas. O cronômetro só começa quando você clicar em iniciar.</p>
                <div className="mt-5 grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-2">
                  <div><p className="text-sm text-muted">Quantidade de pares</p><p className="mt-1 font-semibold text-dark">{activity.version.content.pairs.length}</p></div>
                  <div><p className="text-sm text-muted">Tempo disponível</p><p className="mt-1 font-semibold text-dark">{formatTime(timeLimit)}</p></div>
                </div>
                <button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <Play size={18} aria-hidden="true" />{isStudent ? "Iniciar jogo da memória" : "Testar jogo da memória"}
                </button>
                {!isStudent && <p className="mt-3 text-xs text-muted">A execução de teste não será registrada no ranking dos alunos.</p>}
              </section>

              {isStudent && (
                <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking atual — Top 5</h2></div>
                  <p className="mt-1 text-sm text-muted">Tente superar as melhores pontuações desta atividade.</p>
                  {rankingLoading ? (
                    <div role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Carregando ranking...</div>
                  ) : rankingError ? (
                    <div><p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p><button type="button" onClick={() => void loadRanking(activity.slug)} className="mt-3 min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background">Tentar novamente</button></div>
                  ) : <RankingList ranking={ranking} />}
                </section>
              )}
            </div>
          )}

          {phase === "playing" && (
            <>
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <div><p className="text-sm text-muted">Pares encontrados</p><p className="text-xl font-bold text-dark">{matchedIds.length} / {activity.version.content.pairs.length}</p></div>
                <div><p className="text-sm text-muted">Erros</p><p className="text-xl font-bold text-dark">{wrongAttempts}</p></div>
                <div><p className="text-sm text-muted">Tempo</p><p className="text-xl font-bold text-dark">{formatTime(seconds)}</p></div>
                <button type="button" onClick={() => { if (window.confirm("Deseja encerrar esta tentativa agora?")) void finishGame(); }} className="min-h-10 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Encerrar jogo</button>
              </section>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {cards.map((card) => {
                  const visible = visibleIds.has(card.id);
                  return (
                    <button type="button" key={card.id} onClick={() => selectCard(card)} disabled={matchedIds.includes(card.pairId) || (openIds.length >= 2 && !openIds.includes(card.id))} aria-label={visible ? (card.item.type === "text" ? card.item.value : card.item.altText || "Imagem") : "Revelar carta"} className={`flex min-h-32 items-center justify-center overflow-hidden rounded-2xl border p-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:min-h-40 ${visible ? "border-yellow-400 bg-yellow-50 text-dark" : "border-border bg-dark text-white hover:bg-gray-700"}`}>
                      {visible ? card.item.type === "text" ? <span className="wrap-break-word text-sm font-semibold sm:text-base">{card.item.value}</span> : imageUrl(card.item) ? <span className="relative block h-24 w-full sm:h-32"><Image src={imageUrl(card.item)!} alt={card.item.altText} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" unoptimized className="object-contain" /></span> : <span className="text-xs text-red-700">Imagem indisponível</span> : <span aria-hidden="true" className="text-3xl font-bold">?</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {phase === "finished" && (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
              <ConfettiCelebration active={isStudent && result !== null && result.attempt.totalPairs > 0 && result.attempt.matchedPairs === result.attempt.totalPairs} />
                      <h2 className="text-xl font-bold text-dark">{isStudent ? "Resultado final" : "Prévia concluída"}</h2>
              {result ? (
                <>
                  <p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p>
                  <p className="mt-2 text-sm text-muted">{result.attempt.matchedPairs} de {result.attempt.totalPairs} pares · {result.attempt.wrongAttempts} erro(s) · penalidade de {result.attempt.penaltyPoints} pontos.</p>
                  <div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">Ranking atualizado</h3></div><RankingList ranking={result.ranking} /></div>
                  <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${result.isInRanking ? "bg-emerald-50 text-emerald-800" : "bg-background text-muted"}`}>{result.isInRanking ? "Parabéns! Seu resultado entrou no Top 5!" : "Seu resultado não entrou no Top 5 desta vez. Continue praticando!"}</p>
                </>
              ) : <p className="mt-3 text-sm text-muted">{submitError || "Registrando resultado..."}</p>}
              {!isStudent && <p className="mt-3 text-sm text-muted">{submitError || "Como professor ou administrador, você pode testar a atividade sem gerar uma tentativa pontuada."}</p>}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={startGame} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-semibold text-white transition hover:bg-primary-hover"><Play size={17} aria-hidden="true" />{isStudent ? "Jogar novamente" : "Testar novamente"}</button>
              </div>
            </section>
          )}
        </div>
      ) : null}
    </RoleBasedLayout>
  );
}
