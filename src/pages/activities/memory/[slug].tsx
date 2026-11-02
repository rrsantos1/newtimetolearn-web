import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { submitMemoryAttemptService, type MemoryAttemptResult } from "@/modules/activities/services/submitMemoryAttemptService";
import type { MemoryItemValue } from "@/modules/activities/schemas/createMemorySchema";

interface Pair { id: string; first: MemoryItemValue; second: MemoryItemValue; }
interface ActivityResponse {
  success: true;
  data: { slug: string; type: string; version: { name: string; description: string | null; timeLimitSeconds: number | null; content: { pairs: Pair[] } } };
}
interface Card { id: string; pairId: string; item: MemoryItemValue; }

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

export default function MemoryGamePage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<MemoryAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const cards = useMemo<Card[]>(() => activity ? shuffle(activity.version.content.pairs.flatMap((pair) => [
    { id: `${pair.id}-first`, pairId: pair.id, item: pair.first },
    { id: `${pair.id}-second`, pairId: pair.id, item: pair.second },
  ])) : [], [activity]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const response = await (await import("@/lib/api")).default.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        if (response.data.data.type !== "memory") throw new Error("Esta atividade não é um jogo da memória.");
        setActivity(response.data.data);
      } catch (error: unknown) {
        if (active) setLoadError(axios.isAxiosError(error) ? ((error.response?.data as { error?: { message?: string } } | undefined)?.error?.message ?? "Não foi possível carregar a atividade.") : error instanceof Error ? error.message : "Não foi possível carregar a atividade.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [slug]);

  const timeLimit = activity?.version.timeLimitSeconds ?? null;
  useEffect(() => {
    if (!activity || finished || loading) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [activity, finished, loading]);

  useEffect(() => {
    if (timeLimit !== null && seconds >= timeLimit && !finished) void finishGame();
    // finishGame is intentionally triggered only when the time limit is reached.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, timeLimit, finished]);

  async function finishGame(finalMatchedIds = matchedIds, finalWrongAttempts = wrongAttempts): Promise<void> {
    if (finished || !activity) return;
    setFinished(true);
    setSubmitError("");
    try {
      const submitted = await submitMemoryAttemptService.execute(activity.slug, finalMatchedIds, finalWrongAttempts, seconds);
      setResult(submitted);
    } catch (error: unknown) {
      setSubmitError(axios.isAxiosError(error) ? ((error.response?.data as { error?: { message?: string } } | undefined)?.error?.message ?? "Não foi possível salvar seu resultado.") : "Não foi possível salvar seu resultado.");
    }
  }

  function selectCard(card: Card): void {
    if (finished || matchedIds.includes(card.pairId) || openIds.includes(card.id) || openIds.length >= 2) return;
    const nextOpen = [...openIds, card.id];
    setOpenIds(nextOpen);
    if (nextOpen.length === 2) {
      const selectedCards = nextOpen.map((id) => cards.find((item) => item.id === id)).filter((item): item is Card => Boolean(item));
      if (selectedCards.length === 2 && selectedCards[0].pairId === selectedCards[1].pairId) {
        const nextMatched = [...matchedIds, selectedCards[0].pairId];
        setMatchedIds(nextMatched);
        window.setTimeout(() => setOpenIds([]), 500);
        if (nextMatched.length === activity?.version.content.pairs.length) void finishGame(nextMatched, wrongAttempts);
      } else {
        setWrongAttempts((current) => current + 1);
        window.setTimeout(() => setOpenIds([]), 900);
      }
    }
  }

  const visibleIds = new Set([...openIds, ...cards.filter((card) => matchedIds.includes(card.pairId)).map((card) => card.id)]);
  return <RoleBasedLayout area="student" allowedRoles={["STUDENT"]} title={activity?.version.name ?? "Jogo da memória"} description={activity?.version.description ?? "Encontre todos os pares."}>
    {loading ? <p role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</p>
    : loadError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
    : activity ? <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div><p className="text-sm text-muted">Pares encontrados</p><p className="text-xl font-bold text-dark">{matchedIds.length} / {activity.version.content.pairs.length}</p></div>
        <div><p className="text-sm text-muted">Erros</p><p className="text-xl font-bold text-dark">{wrongAttempts}</p></div>
        <div><p className="text-sm text-muted">Tempo</p><p className="text-xl font-bold text-dark">{Math.floor(seconds / 60).toString().padStart(2, "0")}:{(seconds % 60).toString().padStart(2, "0")}</p></div>
        {!finished && <button type="button" onClick={() => { if (window.confirm("Deseja encerrar esta tentativa agora?")) void finishGame(); }} className="min-h-10 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Encerrar jogo</button>}
      </section>
      {!finished && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {cards.map((card) => {
          const visible = visibleIds.has(card.id);
          return <button type="button" key={card.id} onClick={() => selectCard(card)} disabled={finished || matchedIds.includes(card.pairId) || openIds.length >= 2 && !openIds.includes(card.id)} aria-label={visible ? (card.item.type === "text" ? card.item.value : card.item.altText || "Imagem") : "Revelar carta"} className={`flex min-h-32 items-center justify-center overflow-hidden rounded-2xl border p-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:min-h-40 ${visible ? "border-yellow-400 bg-yellow-50 text-dark" : "border-border bg-dark text-white hover:bg-gray-700"}`}>
            {visible ? card.item.type === "text" ? <span className="break-words text-sm font-semibold sm:text-base">{card.item.value}</span> : imageUrl(card.item) ? <span className="relative block h-24 w-full sm:h-32"><Image src={imageUrl(card.item)!} alt={card.item.altText} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" unoptimized className="object-contain" /></span> : <span className="text-xs text-red-700">Imagem indisponível</span> : <span aria-hidden="true" className="text-3xl font-bold">?</span>}
          </button>;
        })}
      </div>}
      {finished && <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><h2 className="text-xl font-bold text-dark">Resultado da atividade</h2>{result ? <><p className="mt-3 text-3xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{result.attempt.matchedPairs} de {result.attempt.totalPairs} pares · {result.attempt.wrongAttempts} erro(s) · penalidade de {result.attempt.penaltyPoints} pontos.</p><h3 className="mt-6 font-semibold text-dark">Ranking — melhores resultados</h3>{result.ranking.length ? <ol className="mt-3 space-y-2">{result.ranking.slice(0, 5).map((entry) => <li key={`${entry.position}-${entry.studentName}`} className="flex justify-between gap-3 rounded-lg bg-background p-3 text-sm"><span>{entry.position}. {entry.studentName}</span><strong>{entry.score} pontos</strong></li>)}</ol> : <p className="mt-3 text-sm text-muted">Ainda não há resultados no ranking.</p>}</> : <p className="mt-3 text-sm text-muted">{submitError || "Seu resultado está sendo registrado."}</p>}</section>}
    </div> : null}
  </RoleBasedLayout>;
}
