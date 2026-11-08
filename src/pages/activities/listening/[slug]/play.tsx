import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playActivitySound } from "@/modules/users/utils/activitySounds";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Headphones, LoaderCircle, Play, Trophy, XCircle } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { listeningService } from "@/modules/activities/services/listeningService";
import type {
  ListeningAttemptResult,
  ListeningExecutionActivity,
  ListeningExecutionBlank,
  ListeningExecutionPassage,
} from "@/modules/activities/services/listeningService";

type Phase = "ready" | "playing" | "finished";
type Answers = Record<string, string>;

function answerKey(passageId: string, blankId: string): string {
  return JSON.stringify([passageId, blankId]);
}


function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function getAudioUrl(passage: ListeningExecutionPassage): string | null {
  if (passage.audio.publicUrl) return passage.audio.publicUrl;
  const baseUrl = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl || !passage.audio.storageKey) return null;
  return `${baseUrl}/${passage.audio.storageKey}`;
}

function PassageText({
  passage,
  passageIndex,
  answers,
  onAnswerChange,
  disabled,
}: Readonly<{
  passage: ListeningExecutionPassage;
  passageIndex: number;
  answers: Answers;
  onAnswerChange: (key: string, value: string) => void;
  disabled: boolean;
}>) {
  const content: ReactNode[] = [];
  let cursor = 0;

  passage.blanks.forEach((blank: ListeningExecutionBlank, blankIndex: number) => {
    if (blank.startOffset < cursor || blank.endOffset > passage.text.length) return;
    content.push(
      <Fragment key={`text-${blank.id}`}>
        <span className="whitespace-pre-wrap">{passage.text.slice(cursor, blank.startOffset)}</span>
        <input
          aria-label={`Lacuna ${blankIndex + 1} do texto ${passage.title || passageIndex + 1}`}
          autoComplete="off"
          spellCheck={false}
          value={answers[answerKey(passage.id, blank.id)] ?? ""}
          onChange={(event) => onAnswerChange(answerKey(passage.id, blank.id), event.target.value)}
          disabled={disabled}
          className="mx-1 inline-block min-h-10 w-28 max-w-full rounded-lg border border-primary/50 bg-background px-2 text-center text-base font-medium text-dark outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-80 sm:w-36"
        />
      </Fragment>,
    );
    cursor = blank.endOffset;
  });

  content.push(
    <span key="text-tail" className="whitespace-pre-wrap">
      {passage.text.slice(cursor)}
    </span>,
  );

  return <p className="text-base leading-10 text-dark sm:text-lg">{content}</p>;
}

function RankingList({ result }: Readonly<{ result: ListeningAttemptResult }>) {
  if (result.ranking.length === 0) {
    return <p className="mt-3 text-sm text-muted">Ainda não há resultados no ranking.</p>;
  }

  return (
    <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {result.ranking.map((entry) => (
        <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">{entry.position}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p>
              
            </div>
          </div>
          <span className="shrink-0 font-bold text-dark">{entry.score} pts</span>
        </li>
      ))}
    </ol>
  );
}

export default function PlayListeningPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : user.roles.includes("TEACHER") ? "/teacher/activities" : "/student/activities";
  const backLabel = !user ? "Página inicial" : isStudent ? "Voltar às atividades" : "Voltar às atividades";
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [activity, setActivity] = useState<ListeningExecutionActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ListeningAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [previewNotice, setPreviewNotice] = useState("");
  const submittedRef = useRef(false);

  const passages = useMemo(
    () => activity?.version.content.passages ?? [],
    [activity],
  );
  const totalBlanks = useMemo(
    () => passages.reduce((total, passage) => total + passage.blanks.length, 0),
    [passages],
  );
  const answeredCount = useMemo(
    () => passages.reduce(
      (total, passage) => total + passage.blanks.filter((blank) => (answers[answerKey(passage.id, blank.id)] ?? "").trim().length > 0).length,
      0,
    ),
    [answers, passages],
  );

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;

    async function loadActivity(): Promise<void> {
      try {
        if (!slug) throw new Error("Não foi possível identificar a atividade.");
        const loaded = user
          ? await listeningService.getExecution(slug)
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<ListeningExecutionActivity>(slug);
        if (cancelled) return;
        if (loaded.type !== "listening") throw new Error("Esta atividade não é do tipo Listening.");
        if (loaded.version.content.passages.length === 0) throw new Error("Esta atividade ainda não possui textos.");
        if (loaded.version.content.passages.some((passage) => passage.audio.status !== "READY" || !passage.audio.storageKey || passage.blanks.length === 0)) {
          throw new Error("Esta atividade ainda não está pronta para execução.");
        }
        setActivity(loaded);
      } catch (caught: unknown) {
        if (!cancelled) setLoadError(getErrorMessage(caught, "Não foi possível carregar a atividade."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadActivity();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug, user]);

  const finishAttempt = useCallback(async (retry = false): Promise<void> => {
    if ((phase !== "playing" && !(retry && phase === "finished")) || submittedRef.current || !activity) return;
    submittedRef.current = true;
    setPhase("finished");
    setSubmitting(isStudent);
    setSubmitError("");

    if (!isStudent) {
      setSubmitting(false);
      setPreviewNotice("Prévia concluída. O resultado não foi registrado no histórico dos alunos.");
      return;
    }

    const submittedAnswers = passages.flatMap((passage) =>
      passage.blanks.map((blank) => ({
        passageId: passage.id,
        blankId: blank.id,
        answer: answers[answerKey(passage.id, blank.id)] ?? "",
      })),
    );

    try {
      const attemptResult = await listeningService.submitAttempt(activity.slug, submittedAnswers);
      setResult(attemptResult);
      if (attemptResult.attempt.totalBlanks > 0 && attemptResult.attempt.correctBlanks === attemptResult.attempt.totalBlanks) {
        playActivitySound("applause");
      } else if (attemptResult.attempt.correctBlanks > 0) {
        playActivitySound("success");
      } else {
        playActivitySound("error");
      }
    } catch (caught: unknown) {
      setSubmitError(getErrorMessage(caught, "Não foi possível registrar suas respostas. Tente novamente."));
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [activity, answers, isStudent, passages, phase]);



  function startActivity(): void {
    submittedRef.current = false;
    setAnswers({});
    setResult(null);
    setSubmitError("");
    setPreviewNotice("");
    setPhase("playing");
  }

  function updateAnswer(key: string, value: string): void {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  return (
    <PublicActivityLayout immersive
      title={activity?.version.name ?? "Listening"}
      description={activity?.version.description ?? "Ouça os áudios e preencha as lacunas."}
      titleActions={
        <div className="flex shrink-0 items-center gap-2">
          <ActivitySoundToggle />
          <Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
            <ArrowLeft size={16} aria-hidden="true" />{backLabel}
          </Link>
        </div>
      }
    >
      <div className="space-y-3">

        {loading ? (
          <div role="status" className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />Carregando atividade...
          </div>
        ) : loadError ? (
          <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{loadError}</section>
        ) : activity ? (
          <>
            {phase === "ready" && (
              <section className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 shadow-sm sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Headphones size={24} aria-hidden="true" /></div>
                <h2 className="mt-4 text-xl font-bold text-dark">Ouça com atenção e complete os textos</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{activity.version.content.instructions || "Ouça o áudio e preencha as lacunas."}</p>
                <div className="mt-5 grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-3">
                  <div><p className="text-sm text-muted">Textos</p><p className="mt-1 font-semibold text-dark">{passages.length}</p></div>
                  <div><p className="text-sm text-muted">Lacunas</p><p className="mt-1 font-semibold text-dark">{totalBlanks}</p></div>
                  
                </div>
                <button type="button" onClick={startActivity} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                  <Play size={18} aria-hidden="true" />{isStudent ? "Iniciar atividade" : "Testar atividade"}
                </button>
                {!isStudent && <p className="mt-3 text-xs text-muted">A prévia não será registrada no histórico dos alunos.</p>}
              </section>
            )}

            {phase === "playing" && (
              <div className="space-y-5">
                <section className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2.5">
                  <p className="text-sm font-semibold text-dark">{answeredCount} de {totalBlanks} lacunas preenchidas</p>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-background sm:w-36" role="progressbar" aria-label="Progresso das lacunas" aria-valuemin={0} aria-valuemax={totalBlanks} aria-valuenow={answeredCount}>
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: totalBlanks > 0 ? `${(answeredCount / totalBlanks) * 100}%` : "0%" }} />
                  </div>
                </section>
                {passages.map((passage, passageIndex) => {
                  const audioUrl = getAudioUrl(passage);
                  return (
                    <article key={passage.id} className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-7">
                      <div>
                        <h2 className="text-lg font-bold text-dark">{passage.title || `Texto ${passageIndex + 1}`}</h2>
                        {passage.audio.disclosure && <p className="mt-1 text-xs text-muted">{passage.audio.disclosure}</p>}
                      </div>
                      {audioUrl ? (
                        <audio controls preload="none" src={audioUrl} className="w-full" aria-label={`Áudio de ${passage.title || `texto ${passageIndex + 1}`}`} />
                      ) : (
                        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">O áudio deste texto está indisponível.</p>
                      )}
                      <PassageText passage={passage} passageIndex={passageIndex + 1} answers={answers} onAnswerChange={updateAnswer} disabled={false} />
                    </article>
                  );
                })}
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <p className="text-sm text-muted">Você pode revisar as respostas antes de enviar.</p>
                  <button type="button" onClick={() => void finishAttempt(false)} disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                    {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}Finalizar atividade
                  </button>
                </div>
              </div>
            )}

            {phase === "finished" && (
              <section className="space-y-6 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 shadow-sm sm:p-8">
                {submitting ? (
                  <div role="status" className="flex items-center gap-3 text-sm font-medium text-muted"><LoaderCircle size={20} className="animate-spin" aria-hidden="true" />Corrigindo as respostas e registrando o resultado...</div>
                ) : submitError ? (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p>{submitError}</p>
                    <button type="button" onClick={() => void finishAttempt(true)} className="mt-3 min-h-10 rounded-lg border border-red-300 px-3 font-semibold hover:bg-red-100">Tentar registrar novamente</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <ConfettiCelebration active={isStudent && result !== null && result.attempt.totalBlanks > 0 && result.attempt.correctBlanks === result.attempt.totalBlanks} />
                      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Resultado final</p>
                      {result ? (
                        <>
                          <p className="mt-1 text-3xl font-bold text-dark">{result.attempt.score}<span className="text-lg text-muted">/100 pontos</span></p>
                          <p className="mt-2 text-sm text-muted">Respostas corretas: {result.attempt.correctBlanks} de {result.attempt.totalBlanks}</p>
                          
                          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-dark"><Trophy size={18} aria-hidden="true" />{result.isInRanking ? "Seu resultado entrou no Top 5!" : "Resultado registrado. Continue praticando!"}</p>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-muted">{previewNotice || "Prévia concluída."}.</p>
                      )}
                    </div>

                    {result && (
                      <>
                        <div>
                          <div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">Ranking — Top 5</h2></div>
                          <RankingList result={result} />
                        </div>
                        <div className="space-y-3">
                          <h2 className="text-lg font-bold text-dark">Revisão das respostas</h2>
                          {result.review.map((item, index) => (
                            <article key={answerKey(item.passageId, item.blankId)} className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
                              <div className="flex items-start gap-2">
                                {item.isCorrect ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-dark">Lacuna {index + 1}: {item.isCorrect ? "correta" : "incorreta"}</p>
                                  <p className="mt-1 text-sm text-muted">Sua resposta: <span className="font-medium text-dark">{item.answer.trim() || "Não respondida"}</span></p>
                                  {!item.isCorrect && <p className="mt-1 text-sm text-emerald-700">Resposta correta: {item.expectedAnswer}</p>}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button type="button" onClick={startActivity} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}>Tentar novamente</button>
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        ) : null}
      </div>
    </PublicActivityLayout>
  );
}