import { useEffect, useState } from "react";
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

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      data?.error?.message ??
      data?.message ??
      "Não foi possível carregar esta atividade."
    );
  }

  return "Ocorreu um erro inesperado ao carregar a atividade.";
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
          <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
            <BrandLogo href="/dashboard" />
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {backLabel}
          </Link>

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
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Caça-palavras
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-dark sm:text-3xl">
                  {activity.version.name}
                </h1>
                {activity.version.description && (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                    {activity.version.description}
                  </p>
                )}
              </div>
              <WordSearchGame
                grid={grid}
                words={words}
                wordPositions={wordPositions}
              />
            </>
          ) : null}
        </main>
      </div>
    </RoleGuard>
  );
}
