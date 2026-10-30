import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { RoleGuard } from "@/modules/auth/components/RoleGuard";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { WordSearchGame } from "@/modules/activities/components/WordSearchGame";
import { getWordSearchActivityService } from "@/modules/activities/services/wordSearch/getWordSearchActivityService";
import type { EditableWordSearchActivity } from "@/modules/activities/types/activities.types";
import { submitWordSearchAttemptService, type WordSearchAttemptResult } from "@/modules/activities/services/wordSearch/submitWordSearchAttemptService";

interface GeneratedData {
  grid?: unknown;
  wordPositions?: unknown;
}

interface WordPosition {
  word: string;
  row: number;
  col: number;
  direction: string;
}

function getErrorMessage(
  error: unknown,
  fallback = "Não foi possível carregar esta atividade.",
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      data?.error?.message ??
      data?.message ??
      fallback
    );
  }

  return fallback === "Não foi possível carregar esta atividade."\n    ? "Ocorreu um erro inesperado ao carregar a atividade."\n    : fallback;
}

function isGrid(value: unknown): value is string[][] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.every((cell) => typeof cell === "string"),
    )
  );
}

function isWordPositions(value: unknown): value is WordPosition[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "word" in item &&
        typeof item.word === "string" &&
        "row" in item &&
        typeof item.row === "number" &&
        "col" in item &&
        typeof item.col === "number" &&
        "direction" in item &&
        typeof item.direction === "string",
    )
  );
}

export default function PlayWordSearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const backHref = user?.roles.includes("TEACHER")
    ? "/teacher/activities"
    : "/dashboard";
  const backLabel = user?.roles.includes("TEACHER")
    ? "Voltar às atividades"
    : "Voltar ao painel";
  const [activity, setActivity] =
    useState<EditableWordSearchActivity | null>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptResult, setAttemptResult] = useState<WordSearchAttemptResult | null>(null);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [attemptError, setAttemptError] = useState("");
  const [pendingAttempt, setPendingAttempt] = useState<{
    wordsFound: string[];
    elapsedSeconds: number;
  } | null>(null);

  const handleComplete = useCallback(
    async (wordsFound: string[], elapsedSeconds: number): Promise<void> => {
      if (!activity || attemptResult) return;

      setPendingAttempt({ wordsFound, elapsedSeconds });
      setSubmittingAttempt(true);
      setAttemptError("");

      try {
        const result = await submitWordSearchAttemptService.execute(
          activity.slug,
          wordsFound,
          elapsedSeconds,
        );
        setAttemptResult(result);
        setPendingAttempt(null);
      } catch (submitError: unknown) {
        setAttemptError(
          getErrorMessage(
            submitError,
            "Não foi possível registrar sua pontuação. Tente novamente mais tarde.",
          ),
        );
      } finally {
        setSubmittingAttempt(false);
      }
    },
    [activity, attemptResult],
  );

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
        const result = await getWordSearchActivityService.execute(slug);
        if (cancelled) return;

        if (result.type !== "word_search") {
          setError("Esta atividade não é um caça-palavras.");
          return;
        }

        const generatedData =
          result.version.generatedData as GeneratedData | null;
        const generatedGrid = generatedData?.grid;
        const generatedPositions = generatedData?.wordPositions;
        const contentWords = result.version.content.words;

        if (!isGrid(generatedGrid) || !isWordPositions(generatedPositions)) {
          setError("A grade desta atividade não está disponível ou está inválida.");
          return;
        }

        if (
          !Array.isArray(contentWords) ||
          !contentWords.every((word) => typeof word === "string")
        ) {
          setError("Não foi possível carregar a lista de palavras desta atividade.");
          return;
        }

        setActivity(result);
        setGrid(generatedGrid);
        setWordPositions(generatedPositions);
        setWords(contentWords);
      } catch (loadError: unknown) {
        if (!cancelled) setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.slug]);

  return (
    <RoleGuard allowedRoles={["ADMIN", "TEACHER", "STUDENT"]}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
            <BrandLogo href="/dashboard" />
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-8 sm:py-5">

          {loading ? (
            <div
              role="status"
              className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6"
            >
              <LoaderCircle
                className="size-8 animate-spin text-primary"
                aria-hidden="true"
              />
              <p className="text-sm text-muted">
                Carregando caça-palavras...
              </p>
            </div>
          ) : error ? (
            <section
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6"
            >
              <h1 className="text-lg font-semibold text-red-900">
                Não foi possível abrir o jogo
              </h1>
              <p className="mt-2 text-sm leading-6 text-red-800">{error}</p>
            </section>
          ) : activity ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Caça-palavras
                    </p>
                    <h1 className="text-xl font-bold tracking-tight text-dark sm:text-2xl">
                      {activity.version.name}
                    </h1>
                  </div>
                  {activity.version.description && (
                    <p className="mt-1 max-w-3xl text-sm leading-5 text-muted">
                      {activity.version.description}
                    </p>
                  )}
                </div>
                <Link
                  href={backHref}
                  className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-dark sm:self-auto"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  {backLabel}
                </Link>
              </div>
              <WordSearchGame
                grid={grid}
                words={words}
                wordPositions={wordPositions}
                timeLimitSeconds={activity.version.timeLimitSeconds}
                onComplete={handleComplete}
              />

              {(submittingAttempt || attemptError || attemptResult) && (
                <section
                  aria-live="polite"
                  className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
                >
                  {submittingAttempt && (
                    <p role="status" className="text-sm font-medium text-muted">
                      Calculando e registrando sua pontuação...
                    </p>
                  )}

                  {attemptError && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      <p>{attemptError}</p>
                      {pendingAttempt && (
                        <button
                          type="button"
                          onClick={() => void handleComplete(
                            pendingAttempt.wordsFound,
                            pendingAttempt.elapsedSeconds,
                          )}
                          disabled={submittingAttempt}
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300 px-3 font-semibold transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Tentar registrar novamente
                        </button>
                      )}
                    </div>
                  )}

                  {attemptResult && (
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                            Resultado final
                          </p>
                          <p className="mt-1 text-3xl font-bold text-dark">
                            {attemptResult.attempt.score}<span className="text-lg text-muted">/100 pontos</span>
                          </p>
                          <p className="mt-2 text-sm text-muted">
                            Precisão: {attemptResult.attempt.accuracyPoints}/80 · Velocidade: {attemptResult.attempt.speedPoints}/20
                          </p>
                        </div>
                        <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${attemptResult.isInRanking ? "bg-emerald-50 text-emerald-800" : "bg-background text-muted"}`}>
                          {attemptResult.isInRanking
                            ? "Você entrou no Top 5!"
                            : "Desta vez, você não entrou no Top 5."}
                        </p>
                      </div>

                      <div className="mt-6">
                        <h2 className="text-lg font-semibold text-dark">Ranking — melhores resultados</h2>
                        {attemptResult.ranking.length > 0 ? (
                          <ol className="mt-3 divide-y divide-border rounded-xl border border-border">
                            {attemptResult.ranking.map((entry) => (
                              <li key={`${entry.position}-${entry.studentName}-${entry.createdAt}`} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-dark">
                                    {entry.position}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-dark">{entry.studentName}</p>
                                    <p className="text-xs text-muted">
                                      {Math.floor(entry.elapsedSeconds / 60).toString().padStart(2, "0")}:{(entry.elapsedSeconds % 60).toString().padStart(2, "0")}
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 font-bold text-dark">{entry.score} pts</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="mt-2 text-sm text-muted">Ainda não há resultados no ranking.</p>
                        )}
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          ) : null}
        </main>
      </div>
    </RoleGuard>
  );
}
