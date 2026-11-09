import { useCallback, useEffect, useMemo, useState } from "react";
import { playActivitySound } from "@/modules/users/utils/activitySounds";
import { ConfettiCelebration } from "@/modules/activities/components/ConfettiCelebration";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, LoaderCircle, Play, Trophy, XCircle } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { getQuizService, type EditableQuizActivity } from "@/modules/activities/services/getQuizService";
import { submitQuizAttemptService, type QuizAttemptResult } from "@/modules/activities/services/submitQuizAttemptService";
import { getQuizRankingService, type QuizRankingEntry } from "@/modules/activities/services/getQuizRankingService";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { useTranslation } from "@/hooks/useTranslation";

interface QuizImage {
  storageKey: string;
  altText: string;
  publicUrl?: string;
}
interface QuizOption {
  id: string;
  text: string;
  images: QuizImage[];
}
interface QuizQuestion {
  id: string;
  statement: string;
  images: QuizImage[];
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}
type RunMode = "question" | "all";
type Phase = "setup" | "playing" | "finished" | "abandoned";

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function shuffleQuiz(questions: QuizQuestion[]): QuizQuestion[] {
  return shuffleArray(questions).map((question) => ({
    ...question,
    options: shuffleArray(question.options),
  }));
}

function RankingList({ ranking }: Readonly<{ ranking: QuizRankingEntry[] }>) {
  const { t } = useTranslation();
  if (ranking.length === 0) return <p className="mt-3 text-sm text-muted">{t("activities.play.noRanking")}</p>;
  return (
    <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {ranking.map((entry) => (
        <li key={`${entry.position}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">{entry.position}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p></div>
          </div>
          <span className="shrink-0 font-bold text-dark">{entry.score} pts</span>
        </li>
      ))}
    </ol>
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseImages(value: unknown): QuizImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): QuizImage[] => {
    if (!isRecord(item) || typeof item.storageKey !== "string") return [];
    return [{
      storageKey: item.storageKey,
      altText: typeof item.altText === "string" ? item.altText : "",
      ...(typeof item.publicUrl === "string" ? { publicUrl: item.publicUrl } : {}),
    }];
  });
}
function parseQuestions(value: unknown): QuizQuestion[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const questions = value.flatMap((item): QuizQuestion[] => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.statement !== "string" ||
      typeof item.correctOptionId !== "string" || !Array.isArray(item.options)) return [];
    const options = item.options.flatMap((option): QuizOption[] => {
      if (!isRecord(option) || typeof option.id !== "string") return [];
      return [{
        id: option.id,
        text: typeof option.text === "string" ? option.text : "",
        images: parseImages(option.images),
      }];
    });
    if (options.length < 3 || !options.some((option) => option.id === item.correctOptionId)) return [];
    return [{
      id: item.id,
      statement: item.statement,
      images: parseImages(item.images),
      options,
      correctOptionId: item.correctOptionId,
      explanation: typeof item.explanation === "string" ? item.explanation : "",
    }];
  });
  return questions.length === value.length ? questions : null;
}
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível carregar o Quiz.";
  }
  return "Não foi possível carregar o Quiz.";
}
function imageUrl(image: QuizImage): string | null {
  if (image.publicUrl) return image.publicUrl;
  const base = process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${image.storageKey}` : null;
}
function ImageList({ images }: Readonly<{ images: QuizImage[] }>) {
  if (images.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((image, index) => {
        const src = imageUrl(image);
        return src ? (
          <div key={image.storageKey} className="relative aspect-video overflow-hidden rounded-xl border border-border bg-background">
            <Image src={src} alt={image.altText || `Imagem ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain" />
          </div>
        ) : (
          <p key={image.storageKey} className="rounded-xl bg-background p-3 text-xs text-muted">Imagem indisponível para visualização.</p>
        );
      })}
    </div>
  );
}

export default function PlayQuizPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : isTeacher ? "/teacher/activities" : "/student/activities";
  const backLabel = !user ? t("play.home") : t("play.back");
  const [activity, setActivity] = useState<EditableQuizActivity | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<RunMode>("question");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResult | null>(null);
  const [ranking, setRanking] = useState<QuizRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");


  const loadRanking = useCallback(async (slug: string): Promise<void> => {
    setRankingLoading(true);
    setRankingError("");
    try { setRanking(await getQuizRankingService.execute(slug)); }
    catch (loadError: unknown) { setRankingError(getErrorMessage(loadError).replace("Não foi possível carregar o Quiz.", "Não foi possível carregar o ranking agora.")); }
    finally { setRankingLoading(false); }
  }, []);
  const correctCount = useMemo(
    () => questions.filter((question) => answers[question.id] === question.correctOptionId).length,
    [answers, questions],
  );
  const localScore = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);

  useEffect(() => {
    if (!router.isReady) return;
    const rawSlug = router.query.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    let cancelled = false;
    async function load(): Promise<void> {
      if (!slug) {
        setError("Não foi possível identificar o Quiz.");
        setLoading(false);
        return;
      }
      try {
        const result = user
          ? await getQuizService.execute(slug)
          : await (await import("@/modules/activities/services/getPublicActivityExecutionService")).getPublicActivityExecutionService.execute<EditableQuizActivity>(slug);
        if (cancelled) return;
        if (result.type !== "quiz") {
          setError("Esta atividade não é um Quiz.");
          return;
        }
        const parsedQuestions = parseQuestions(result.version.content.questions);
        if (!parsedQuestions) {
          setError("As questões deste Quiz estão indisponíveis ou possuem dados inválidos.");
          return;
        }
        setActivity(result);
        setQuestions(shuffleQuiz(parsedQuestions));
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

  const finishQuiz = useCallback(async (finalAnswers: Record<string, string>): Promise<void> => {
    if (!activity || phase !== "playing" || submitting) return;
    setPhase("finished");
    setSubmitError("");
    if (!isStudent) return;
    setSubmitting(true);
    try {
      const selectedOptionIds = questions.flatMap((question) => {
        const answer = finalAnswers[question.id];
        return answer ? [answer] : [];
      });
      const result = await submitQuizAttemptService.execute(activity.slug, selectedOptionIds);
      setAttemptResult(result);
      setRanking(result.ranking);
      const correctAnswers = questions.filter((question) => finalAnswers[question.id] === question.correctOptionId).length;
      if (correctAnswers === questions.length && questions.length > 0) {
        playActivitySound("applause");
      } else if (correctAnswers > 0) {
        playActivitySound("success");
      } else {
        playActivitySound("error");
      }
    } catch (submitFailure: unknown) {
      setSubmitError(getErrorMessage(submitFailure).replace("Não foi possível carregar o Quiz.", "Não foi possível registrar o resultado. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }, [activity, isStudent, phase, questions, submitting]);

  async function retrySubmission(): Promise<void> {
    if (!activity || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const selectedOptionIds = questions.flatMap((question) => {
        const answer = answers[question.id];
        return answer ? [answer] : [];
      });
      const result = await submitQuizAttemptService.execute(activity.slug, selectedOptionIds);
      setAttemptResult(result);
      setRanking(result.ranking);
      const correctAnswers = questions.filter((question) => answers[question.id] === question.correctOptionId).length;
      if (correctAnswers === questions.length && questions.length > 0) {
        playActivitySound("applause");
      } else if (correctAnswers > 0) {
        playActivitySound("success");
      } else {
        playActivitySound("error");
      }
    } catch (submitFailure: unknown) {
      setSubmitError(getErrorMessage(submitFailure).replace("Não foi possível carregar o Quiz.", "Não foi possível registrar o resultado. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  function startQuiz(): void {
    setAnswers({});
    setCurrentIndex(0);
    setAttemptResult(null);
    setSubmitError("");
    setPhase("playing");
  }
  function chooseAnswer(questionId: string, optionId: string): void {
    setAnswers((previous) => ({ ...previous, [questionId]: optionId }));
  }
  function abandonQuiz(): void {
    if (window.confirm(t("activities.play.abandonQuiz"))) {
      setPhase("abandoned");
    }
  }
  function finishFromButton(): void {
    void finishQuiz(answers);
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <PublicActivityLayout immersive
      title={activity?.version.name ?? "Quiz"}
      description={activity?.version.description ?? t("activities.play.quizInstruction")}
      titleActions={<div className="flex shrink-0 items-center gap-2"><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link></div>}
    >

          {loading ? (
            <div role="status" className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
              <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />{t("activities.play.loading")}
            </div>
          ) : error ? (
            <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-lg font-bold text-red-900">{t("activities.play.openError")}</h1>
              <p className="mt-2 text-sm text-red-800">{error}</p>
              <Link href={backHref} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-900"><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link>
            </section>
          ) : activity ? (
            <>
              {phase === "setup" && (
                <div className={isStudent ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]" : ""}>
                <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6 shadow-sm sm:p-8">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Play size={24} aria-hidden="true" /></div>
                  <h2 className="mt-4 text-xl font-bold text-dark">Como deseja responder?</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{t("activities.play.startQuizMode")}</p>
                  <fieldset className="mt-6 grid gap-3 sm:grid-cols-2">
                    <legend className="mb-3 text-sm font-semibold text-dark">{t("activities.play.mode")}</legend>
                    <label className={`cursor-pointer rounded-xl border p-4 transition ${mode === "question" ? "border-sky-500 bg-sky-100 ring-2 ring-sky-300/60" : "border-sky-200 bg-white hover:border-sky-400"}`}>
                      <input type="radio" name="quiz-mode" value="question" checked={mode === "question"} onChange={() => setMode("question")} className="mr-2 accent-accent" />
                      <span className="font-semibold text-dark">{t("play.question")} a questão</span>
                      <span className="mt-2 block text-sm leading-5 text-muted">{t("activities.play.questionByQuestionHelp")}</span>
                    </label>
                    <label className={`cursor-pointer rounded-xl border p-4 transition ${mode === "all" ? "border-sky-500 bg-sky-100 ring-2 ring-sky-300/60" : "border-sky-200 bg-white hover:border-sky-400"}`}>
                      <input type="radio" name="quiz-mode" value="all" checked={mode === "all"} onChange={() => setMode("all")} className="mr-2 accent-accent" />
                      <span className="font-semibold text-dark">{t("activities.play.allQuestions")}</span>
                      <span className="mt-2 block text-sm leading-5 text-muted">{t("activities.play.allQuestionsHelp")}</span>
                    </label>
                  </fieldset>
                  <div className="mt-5 grid gap-3 rounded-xl bg-background p-4 text-sm sm:grid-cols-3">
                    <div><p className="text-muted">{t("play.questions")}</p><p className="mt-1 font-semibold text-dark">{questions.length}</p></div>
                                        <div><p className="text-muted">{t("activities.play.requiredAnswers")}</p><p className="mt-1 font-semibold text-dark">{t("activities.play.allBeforeNext")}</p></div>
                  </div>
                  <button type="button" onClick={startQuiz} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                    <Play size={18} aria-hidden="true" />{isStudent ? t("play.start") : t("play.test")}
                  </button>
                  {!isStudent && <p className="mt-3 text-xs text-muted">{t("activities.play.teacherPreview")}</p>}
                </section>
                {isStudent && (
                  <section className="rounded-2xl border border-[#244a7c]/20 bg-[#244a7c]/4 p-6 shadow-sm sm:p-7">
                    <div className="flex items-center gap-2"><Trophy size={21} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">{t("play.rankingCurrent")}</h2></div>
                    <p className="mt-1 text-sm text-muted">{t("activities.play.rankingHint")}</p>
                    {rankingLoading ? <div role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />{t("play.loadingRanking")}</div> : rankingError ? <div><p role="alert" className="mt-4 text-sm text-amber-800">{rankingError}</p><button type="button" onClick={() => void loadRanking(activity.slug)} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background">{t("play.retry")}</button></div> : <RankingList ranking={ranking} /> }
                  </section>
                )}
                </div>
              )}

              {phase === "playing" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                    <p className="text-sm font-semibold text-dark">{mode === "question" ? `{t("play.question")} ${currentIndex + 1} de ${questions.length}` : `${answeredCount} de ${questions.length} respondidas`}</p>
                    <div className="flex items-center gap-3">
                      
                      <button type="button" onClick={abandonQuiz} className="min-h-9 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Abandonar Quiz</button>
                    </div>
                  </div>

                  {mode === "question" && currentQuestion ? (
                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("play.question")} {currentIndex + 1}</p>
                      <h2 className="mt-3 whitespace-pre-wrap text-lg font-bold leading-7 text-dark sm:text-xl">{currentQuestion.statement}</h2>
                      <div className={currentQuestion.images.length > 0 ? "mt-5 grid gap-6 lg:grid-cols-2 lg:items-start" : "mt-5"}>
                        {currentQuestion.images.length > 0 && (
                          <div className="min-w-0">
                            <ImageList images={currentQuestion.images} />
                          </div>
                        )}
                        <div className={currentQuestion.images.length > 0 ? "min-w-0 space-y-3" : "grid gap-3 sm:grid-cols-2"}>
                          {currentQuestion.options.map((option, index) => (
                            <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${answers[currentQuestion.id] === option.id ? "border-sky-500 bg-sky-100 ring-2 ring-sky-300/60" : "border-sky-200 bg-white hover:border-sky-400"}`}>
                              <input type="radio" name={currentQuestion.id} value={option.id} checked={answers[currentQuestion.id] === option.id} onChange={() => chooseAnswer(currentQuestion.id, option.id)} className="mt-1 size-4 shrink-0 accent-accent" />
                              <span className="min-w-0 flex-1"><span className="font-semibold text-muted">{String.fromCharCode(65 + index)}.</span>{option.text && <span className="ml-2 whitespace-pre-wrap text-sm leading-6 text-dark">{option.text}</span>}<ImageList images={option.images} /></span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0} className="min-h-11 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
                        {currentIndex < questions.length - 1 ? (
                          <button type="button" onClick={() => setCurrentIndex((index) => index + 1)} disabled={!answers[currentQuestion.id]} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40" style={{ color: "var(--primary-foreground)" }}>{t("play.answerAndNext")}</button>
                        ) : (
                          <button type="button" onClick={finishFromButton} disabled={!answers[currentQuestion.id]} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40" style={{ color: "var(--primary-foreground)" }}>{t("activities.play.finishQuiz")}</button>
                        )}
                      </div>
                    </section>
                  ) : (
                    <div className="space-y-5">
                      {questions.map((question, questionIndex) => (
                        <section key={question.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
                          <h2 className="text-base font-bold leading-6 text-dark"><span className="mr-2 text-primary">{questionIndex + 1}.</span>{question.statement}</h2>
                          <div className={question.images.length > 0 ? "mt-4 grid gap-5 lg:grid-cols-2 lg:items-start" : "mt-4"}>
                            {question.images.length > 0 && <div className="min-w-0"><ImageList images={question.images} /></div>}
                            <div className={question.images.length > 0 ? "min-w-0 space-y-2" : "grid gap-2 sm:grid-cols-2"}>
                              {question.options.map((option, index) => (
                                <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${answers[question.id] === option.id ? "border-primary bg-primary/5" : "border-sky-200 bg-white hover:border-sky-400"}`}>
                                  <input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => chooseAnswer(question.id, option.id)} className="mt-1 size-4 shrink-0 accent-accent" />
                                  <span className="min-w-0 flex-1"><span className="mr-2 text-sm font-semibold text-muted">{String.fromCharCode(65 + index)}.</span><span className="whitespace-pre-wrap text-sm leading-6 text-dark">{option.text}</span><ImageList images={option.images} /></span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </section>
                      ))}
                      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted">{answeredCount} de {questions.length} questões respondidas.</p>
                        <button type="button" onClick={finishFromButton} disabled={answeredCount !== questions.length} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40" style={{ color: "var(--primary-foreground)" }}>{t("activities.play.finishQuiz")}</button>
                      </section>
                    </div>
                  )}
                </div>
              )}

              {phase === "abandoned" && (
                <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6 shadow-sm sm:p-8">
                  <h2 className="text-xl font-bold text-dark">{t("activities.play.abandoned")}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{t("activities.play.abandonedText")}</p>
                  <button type="button" onClick={() => setPhase("setup")} className="mt-5 min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}>{t("play.backMode")}</button>
                </section>
              )}

              {phase === "finished" && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-8">
                  {submitting ? (
                    <div role="status" className="flex items-center gap-3 text-sm font-medium text-muted"><LoaderCircle size={20} className="animate-spin" aria-hidden="true" />{t("activities.play.submitting")}</div>
                  ) : submitError ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p>{submitError}</p>
                      <button type="button" onClick={() => void retrySubmission()} disabled={submitting} className="mt-3 min-h-10 rounded-lg border border-red-300 px-3 font-semibold hover:bg-red-100 disabled:opacity-60">{t("play.submitRetry")}</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <ConfettiCelebration active={isStudent && attemptResult !== null && questions.length > 0 && correctCount === questions.length} />
                      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("play.result")}</p>
                          <p className="mt-1 text-3xl font-bold text-dark">{isStudent && attemptResult ? attemptResult.attempt.score : localScore}<span className="text-lg text-muted">/100 {t("activities.play.points")}</span></p>
                          <p className="mt-2 text-sm text-muted">{t("activities.play.correctAnswers")}: {correctCount} de {questions.length}</p>
                          
                          
                        </div>
                        {isStudent && attemptResult && <p className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${attemptResult.isInRanking ? "bg-emerald-50 text-emerald-800" : "bg-background text-muted"}`}><Trophy size={18} aria-hidden="true" />{attemptResult.isInRanking ? t("activities.play.congratsTop5") : t("activities.play.resultNotTop5")}</p>}
                      </div>
                      {isStudent && attemptResult && (
                        <div className="mt-7">
                          <div className="flex items-center gap-2"><Trophy size={20} className="text-primary" aria-hidden="true" /><h2 className="text-lg font-bold text-dark">{t("play.rankingUpdated")} — Top 5</h2></div>
                          <RankingList ranking={ranking} />
                        </div>
                      )}
                      <div className="mt-7 space-y-4">
                        <h2 className="text-lg font-bold text-dark">{t("activities.play.reviewAnswers")}</h2>
                        {questions.map((question, index) => {
                          const isCorrect = answers[question.id] === question.correctOptionId;
                          const correctOption = question.options.find((option) => option.id === question.correctOptionId);
                          const chosenOption = question.options.find((option) => option.id === answers[question.id]);
                          return (
                            <article key={question.id} className="rounded-xl border border-border p-4">
                              <div className="flex items-start gap-2">
                                {isCorrect ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />}
                                <div className="min-w-0">
                                  <h3 className="font-semibold leading-6 text-dark">{index + 1}. {question.statement}</h3>
                                  <p className="mt-2 text-sm text-muted">{t("play.yourAnswer")}: <span className="font-medium text-dark">{chosenOption?.text ?? t("play.unanswered")}</span></p>
                                  {!isCorrect && <p className="mt-1 text-sm text-emerald-700">{t("play.correctAnswer")}: {correctOption?.text ?? "Indisponível"}</p>}
                                  {question.explanation && <p className="mt-2 text-sm leading-6 text-muted">{question.explanation}</p>}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button type="button" onClick={() => setPhase("setup")} className="min-h-11 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-dark hover:bg-background">{t("play.backMode")}</button>
                        <button type="button" onClick={startQuiz} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}><Play size={17} className="mr-2 inline" aria-hidden="true" />{isStudent ? t("play.retry") : t("play.tryAgain")}</button>
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          ) : null}
    </PublicActivityLayout>
  );
}
