import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { LoaderCircle, Play, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { playActivitySound } from "@/modules/users/utils/activitySounds";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { getHangmanRankingService, type HangmanRankingEntry } from "@/modules/activities/services/getHangmanRankingService";
import { submitHangmanAttemptService, type HangmanAttemptResult } from "@/modules/activities/services/submitHangmanAttemptService";

interface PublicHangmanWord { id: string; answer: string; clue: string; imageUrl: string | null; imageAlt: string; }
interface ActivityResponse {
  success: true;
  data: {
    slug: string;
    type: string;
    version: {
      name: string;
      description: string | null;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      content: { words: PublicHangmanWord[] };
    };
  };
}
type Phase = "ready" | "playing" | "word-complete" | "finished";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function normalizeAnswer(value: string): string {
  return value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[\\s-]/g, "").toLocaleUpperCase("pt-BR");
}
function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}
function RankingList({ ranking }: Readonly<{ ranking: HangmanRankingEntry[] }>) {
  if (!ranking.length) return <p className="mt-3 text-sm text-muted">Ainda não há resultados. Seja o primeiro no ranking!</p>;
  return <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">{ranking.slice(0, 5).map((entry) =>
    <li key={entry.position + entry.createdAt} className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="truncate text-sm font-semibold text-dark">{entry.position}. {entry.studentName}</span>
      <strong className="shrink-0 text-dark">{entry.score} pts</strong>
    </li>)}</ol>;
}
function GallowsDrawing({ mistakes }: Readonly<{ mistakes: number }>) {
  return <svg viewBox="0 0 240 230" role="img" aria-label={`Forca: ${mistakes} de 6 partes desenhadas`} className="mx-auto h-52 w-full max-w-xs">
    <path d="M20 215 H180 M55 215 V18 H155 V40" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    {mistakes >= 1 && <circle cx="155" cy="65" r="24" fill="none" stroke="currentColor" strokeWidth="6" />}
    {mistakes >= 2 && <path d="M155 89 V153" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
    {mistakes >= 3 && <path d="M155 105 L119 135" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
    {mistakes >= 4 && <path d="M155 105 L191 135" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
    {mistakes >= 5 && <path d="M155 153 L125 195" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
    {mistakes >= 6 && <path d="M155 153 L185 195" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
  </svg>;
}
export default function HangmanPlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ActivityResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [wordIndex, setWordIndex] = useState(0);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [ranking, setRanking] = useState<HangmanRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [result, setResult] = useState<HangmanAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [scoreSaving, setScoreSaving] = useState(false);
  const [revealLost, setRevealLost] = useState(false);
  const [attemptToken, setAttemptToken] = useState("");
  const resultRef = useRef(false);

  const words = activity?.version.content.words ?? [];
  const activeWord = words[wordIndex];
  // Answers are intentionally only loaded for the activity owner in preview; student execution receives sanitized hints.
  const loadRanking = useCallback(async (): Promise<void> => {
    if (!slug || !isStudent) return;
    setRankingLoading(true);
    setRankingError("");
    try { setRanking(await getHangmanRankingService.execute(slug)); }
    catch (error: unknown) { setRankingError(getErrorMessage(error, "Não foi possível carregar o ranking.")); }
    finally { setRankingLoading(false); }
  }, [isStudent, slug]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let alive = true;
    void (async () => {
      try {
        const loaded = user
          ? (await (await import("@/lib/api")).default.get<ActivityResponse>(`/activities/${encodeURIComponent(slug)}`)).data.data
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<ActivityResponse["data"]>(slug);
        if (!alive) return;
        if (loaded.type !== "hangman") throw new Error("Esta atividade não é um Jogo da Forca.");
        setActivity(loaded);
        if (user?.roles.includes("STUDENT")) void loadRanking();
      } catch (error: unknown) { if (alive) setLoadError(getErrorMessage(error, "Não foi possível carregar a atividade.")); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [router.isReady, slug, user, loadRanking]);

  const finish = useCallback(async (lost: boolean): Promise<void> => {
    if (resultRef.current || !activity) return;
    resultRef.current = true;
    setPhase("finished");
    setRevealLost(lost);
    setSubmitError("");
    if (!isStudent) {
      setSubmitError("Prévia concluída. O resultado não será registrado no ranking dos alunos.");
      return;
    }
    setScoreSaving(true);
    try {
      const submitted = await submitHangmanAttemptService.execute(activity.slug, attemptToken, solvedIds, totalMistakes);
      setResult(submitted);
      setRanking(submitted.ranking);
      if (!lost && submitted.score > 0) playActivitySound("applause");
    } catch (error: unknown) { setSubmitError(getErrorMessage(error, "Não foi possível registrar seu resultado.")); }
    finally { setScoreSaving(false); }
  }, [activity, attemptToken, isStudent, solvedIds, totalMistakes]);

  function startGame(): void {
    setWordIndex(0);
    setUsedLetters([]);
    setMistakes(0);
    setTotalMistakes(0);
    setSolvedIds([]);
    setResult(null);
    setSubmitError("");
    setRevealLost(false);
    setAttemptToken(crypto.randomUUID());
    resultRef.current = false;
    setPhase("playing");
  }

  function chooseLetter(letter: string): void {
    if (phase !== "playing" || usedLetters.includes(letter) || !activeWord) return;
    const answer = normalizeAnswer(activeWord.answer);
    if (!answer) {
      setLoadError("Não foi possível carregar a resposta desta palavra. Confira a publicação da atividade.");
      return;
    }
    setUsedLetters((current) => [...current, letter]);
    if (answer.includes(letter)) {
      playActivitySound("success");
      const nextUsed = [...usedLetters, letter];
      const complete = [...answer].every((character) => nextUsed.includes(character));
      if (complete) {
        setSolvedIds((current) => [...current, activeWord.id]);
        setPhase("word-complete");
      }
      return;
    }
    playActivitySound("error");
    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setTotalMistakes((current) => current + 1);
    if (nextMistakes >= 6) void finish(true);
  }

  function nextWord(): void {
    if (phase !== "word-complete") return;
    if (wordIndex + 1 >= words.length) { void finish(false); return; }
    setWordIndex((current) => current + 1);
    setUsedLetters([]);
    setMistakes(0);
    setPhase("playing");
  }

  const displayLetters = activeWord ? normalizeAnswer(activeWord.answer) : "";
  return <PublicActivityLayout title={activity?.version.name ?? "Jogo da Forca"} description={activity?.version.description ?? "Descubra a palavra a partir das dicas."}>
    {loading ? <div role="status" className="rounded-xl bg-surface p-6 text-sm text-muted"><LoaderCircle className="mr-2 inline animate-spin" size={18} />Carregando atividade...</div>
    : loadError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
    : activity ? <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Jogo da Forca</p><h1 className="mt-1 text-2xl font-bold text-dark">{activity.version.name}</h1>{activity.version.description && <p className="mt-2 max-w-3xl text-sm text-muted">{activity.version.description}</p>}</div><ActivitySoundToggle /></header>
      {phase === "ready" && <div className={isStudent ? "grid gap-5 lg:grid-cols-2" : ""}>
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"><h2 className="text-xl font-bold text-dark">Pronto para jogar?</h2><p className="mt-2 text-sm leading-6 text-muted">Descubra cada palavra escolhendo letras no banco. Você terá seis erros por palavra; a cada erro, uma parte do desenho será formada.</p><div className="mt-4 rounded-xl bg-background p-4 text-sm text-muted">{words.length} palavras • 6 erros por palavra • Dica e imagem quando cadastradas</div><button type="button" onClick={startGame} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Play size={18} aria-hidden="true" />{isStudent ? "Iniciar jogo" : "Testar jogo"}</button>{!isStudent && <p className="mt-3 text-xs text-muted">A prévia não altera o ranking dos alunos.</p>}</section>
        {isStudent && <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6"><div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking atual — Top 5</h2></div>{rankingLoading ? <p className="mt-4 text-sm text-muted">Carregando ranking...</p> : rankingError ? <p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p> : <RankingList ranking={ranking} />}</section>}
      </div>}
      {(phase === "playing" || phase === "word-complete") && activeWord && <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-dark">Palavra {wordIndex + 1} de {words.length}</p><p className="text-sm text-muted">Erros: <strong className="text-red-700">{mistakes}/6</strong></p></div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.75fr)]">
          <div className="rounded-2xl bg-background p-4 sm:p-6"><GallowsDrawing mistakes={mistakes} /><p className="mt-2 text-center text-xs text-muted">{["cabeça", "tronco", "braço direito", "braço esquerdo", "perna direita", "perna esquerda"].slice(0, mistakes).join(" · ") || "Nenhuma parte desenhada"}</p></div>
          <div className="space-y-4"><div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Dica</p><p className="mt-2 text-sm leading-6 text-dark">{activeWord.clue}</p>{activeWord.imageUrl && <div className="relative mt-4 aspect-video overflow-hidden rounded-lg"><Image src={activeWord.imageUrl} alt={activeWord.imageAlt || "Imagem da dica"} fill sizes="(max-width: 1024px) 100vw, 360px" unoptimized className="object-contain" /></div>}</div>
            <div className="flex flex-wrap justify-center gap-2">{Array.from({ length: displayLetters.length }, (_, index) => <span key={index} className="flex size-9 items-center justify-center border-b-4 border-primary text-lg font-bold text-dark sm:size-11 sm:text-xl">{usedLetters.includes(displayLetters[index] ?? "") ? displayLetters[index] : " "}</span>)}</div>
            {phase === "playing" ? <><p className="text-center text-xs text-muted">Escolha uma letra. As letras certas são reveladas em todas as posições.</p><div className="grid grid-cols-7 gap-2 sm:grid-cols-9">{ALPHABET.map((letter) => { const selected = usedLetters.includes(letter); return <button type="button" key={letter} onClick={() => chooseLetter(letter)} disabled={selected} aria-label={`Letra ${letter}${selected ? ", já utilizada" : ""}`} className={`min-h-10 rounded-lg border px-1 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50 ${selected ? (displayLetters.includes(letter) ? "border-green-200 bg-green-50 text-green-800 line-through" : "border-red-200 bg-red-50 text-red-700 line-through") : "border-border bg-surface text-dark hover:border-primary"}`}>{letter}</button>; })}</div></> : <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center"><p className="font-semibold text-green-800">Palavra descoberta!</p><button type="button" onClick={nextWord} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"><ArrowRight size={17} aria-hidden="true" />{wordIndex + 1 < words.length ? "Próxima palavra" : "Ver resultado"}</button></div>}
          </div>
        </div>
      </section>}
      {phase === "finished" && <section className="relative rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7"><ConfettiCelebration active={isStudent && result !== null && result.attempt.score >= 80} /><h2 className="text-xl font-bold text-dark">{revealLost ? "Fim de jogo!" : "Atividade concluída!"}</h2>{scoreSaving && <p role="status" className="mt-3 text-sm text-muted">Registrando seu resultado...</p>}{result ? <><p className="mt-3 text-4xl font-bold text-dark">{result.attempt.score}/100 pontos</p><p className="mt-2 text-sm text-muted">{result.attempt.solvedWords} de {result.attempt.totalWords} palavras descobertas · {result.attempt.mistakes} erros</p><div className="mt-6"><div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-dark">Ranking atualizado</h3></div><RankingList ranking={result.ranking} /></div><p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm font-semibold text-muted">{result.isInRanking ? "Seu resultado entrou no Top 5!" : "Continue praticando para alcançar o Top 5!"}</p></> : <p className="mt-3 text-sm text-muted">{submitError || "Resultado não registrado."}</p>}{!isStudent && <p className="mt-3 text-sm text-muted">{submitError}</p>}<button type="button" onClick={startGame} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"><RotateCcw size={17} aria-hidden="true" />Jogar novamente</button></section>}
    </div> : null}
  </PublicActivityLayout>;
}
