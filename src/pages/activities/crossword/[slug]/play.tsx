import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { RoleGuard } from "@/modules/auth/components/RoleGuard";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { CrosswordGame, type CrosswordClue } from "@/modules/activities/components/CrosswordGame";
import { getCrosswordService } from "@/modules/activities/services/crossword/getCrosswordService";
import type { EditableCrosswordActivity } from "@/modules/activities/types/crossword.types";

type CrosswordGrid = (string | null)[][];

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível carregar esta cruzadinha.";
  }
  return "Ocorreu um erro inesperado ao carregar a cruzadinha.";
}

function isCrosswordGrid(value: unknown): value is CrosswordGrid {
  return Array.isArray(value) && value.length > 0 && value.every(
    (row) => Array.isArray(row) && row.every(
      (cell) => cell === null || typeof cell === "string",
    ),
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
    ) {
      return null;
    }

    let length: number;
    if ("length" in item && typeof item.length === "number") {
      length = item.length;
    } else if ("word" in item && typeof item.word === "string") {
      length = item.word.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[\\s-]/g, "").length;
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
    });
  }

  return normalized;
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return "Sem limite de tempo";
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function PlayCrosswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const backHref = isTeacher ? "/teacher/activities" : "/dashboard";
  const backLabel = isTeacher ? "Voltar às atividades" : "Voltar ao painel";

  const [activity, setActivity] = useState<EditableCrosswordActivity | null>(null);
  const [grid, setGrid] = useState<CrosswordGrid>([]);
  const [clues, setClues] = useState<CrosswordClue[]>([]);
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
              <Link href={backHref} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-900">
                <ArrowLeft size={16} aria-hidden="true" /> {backLabel}
              </Link>
            </section>
          ) : activity ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Palavras cruzadas</p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-dark sm:text-2xl">{activity.version.name}</h1>
                  {activity.version.description && (
                    <p className="mt-1 max-w-3xl text-sm leading-5 text-muted">{activity.version.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">Tempo disponível: {formatTime(activity.version.timeLimitSeconds)}</p>
                </div>
                <Link href={backHref} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <ArrowLeft size={16} aria-hidden="true" /> {backLabel}
                </Link>
              </div>
              <CrosswordGame grid={grid} clues={clues} />
            </>
          ) : null}
        </main>
      </div>
    </RoleGuard>
  );
}
