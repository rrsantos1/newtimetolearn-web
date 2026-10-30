import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gamepad2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import type {
  ActivityDifficulty,
  ActivityType,
  ActivityListData,
  ListedActivity,
} from "@/modules/activities/types/activityList.types";

const PAGE_SIZE = 12;

const typeLabels: Record<ActivityType, string> = {
  quiz: "Quiz",
  word_search: "Caça-palavras",
  crossword: "Palavras cruzadas",
  cloze: "Texto lacunado",
  multiple_choice: "Múltipla escolha",
  fill_in_the_blank: "Complete a lacuna",
  drag_drop: "Arrastar e soltar",
  sentence_order: "Ordenar frases",
  board_game: "Jogo de tabuleiro",
  roulette: "Roleta",
  hangman: "Forca",
  memory: "Jogo da memória",
  fill_in_blanks: "Preencher lacunas",
  mole_hit: "Acertar a toupeira",
};

const difficultyLabels: Record<ActivityDifficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Média",
  HARD: "Difícil",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      responseData?.error?.message ??
      responseData?.message ??
      "Não foi possível carregar a biblioteca de atividades."
    );
  }

  return "Ocorreu um erro inesperado ao carregar a biblioteca.";
}

function getActivityName(activity: ListedActivity): string {
  return (
    activity.publishedVersion?.name ??
    activity.latestVersion?.name ??
    "Atividade sem título"
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ExploreActivitiesPage() {
  const [result, setResult] = useState<ActivityListData | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityType | "ALL">("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<
    ActivityDifficulty | "ALL"
  >("ALL");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    listActivitiesService
      .execute(1, 100, "explore")
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return (result?.items ?? []).filter((activity) => {
      const name = getActivityName(activity).toLocaleLowerCase("pt-BR");
      const description = (
        activity.latestVersion?.description ?? ""
      ).toLocaleLowerCase("pt-BR");

      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch);
      const matchesType = typeFilter === "ALL" || activity.type === typeFilter;
      const matchesDifficulty =
        difficultyFilter === "ALL" ||
        activity.latestVersion?.difficulty === difficultyFilter;

      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [result, search, typeFilter, difficultyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
  const visibleActivities = filteredActivities.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, difficultyFilter]);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Biblioteca de atividades"
      description="Explore atividades publicadas por outros professores e encontre materiais para usar com seus alunos."
    >
      <div className="mb-6">
        <Link
          href="/teacher"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Área do professor
        </Link>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-dark">
          <SlidersHorizontal size={17} aria-hidden="true" />
          Buscar e filtrar atividades
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative block md:col-span-1">
            <span className="sr-only">Buscar por título ou descrição</span>
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar atividade..."
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por tipo</span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as ActivityType | "ALL")
              }
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="ALL">Todos os tipos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por dificuldade</span>
            <select
              value={difficultyFilter}
              onChange={(event) =>
                setDifficultyFilter(
                  event.target.value as ActivityDifficulty | "ALL",
                )
              }
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="ALL">Todas as dificuldades</option>
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {errorMessage && (
        <section
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p className="leading-6">{errorMessage}</p>
        </section>
      )}

      {isLoading ? (
        <section aria-live="polite" className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-sm text-muted">Carregando biblioteca...</p>
        </section>
      ) : !errorMessage && visibleActivities.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-dark">
            {result?.items.length
              ? "Nenhuma atividade encontrada"
              : "A biblioteca ainda está vazia"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {result?.items.length
              ? "Tente alterar os termos da busca ou os filtros selecionados."
              : "Quando outros professores publicarem atividades elegíveis para compartilhamento, elas aparecerão aqui."}
          </p>
          {(search || typeFilter !== "ALL" || difficultyFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
                setDifficultyFilter("ALL");
              }}
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:bg-background"
            >
              Limpar filtros
            </button>
          )}
        </section>
      ) : !errorMessage && result ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted" aria-live="polite">
              {filteredActivities.length === 1
                ? "1 atividade encontrada"
                : `${filteredActivities.length} atividades encontradas`}
            </p>
            <p className="text-xs text-muted">
              Exibindo atividades publicadas de outros professores
            </p>
          </div>

          <section
            aria-label="Biblioteca de atividades"
            className="grid gap-4 lg:grid-cols-2"
          >
            {visibleActivities.map((activity) => (
              <article
                key={activity.slug}
                className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md sm:p-6"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {typeLabels[activity.type] ?? activity.type}
                    </p>
                    <span className="inline-flex shrink-0 items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                      Publicada
                    </span>
                  </div>

                  <h2 className="mt-2 wrap-break-word text-lg font-semibold text-dark">
                    {getActivityName(activity)}
                  </h2>

                  {activity.latestVersion?.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                      {activity.latestVersion.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
                  {activity.latestVersion && (
                    <span>
                      Dificuldade:{" "}
                      <strong className="font-semibold text-dark">
                        {difficultyLabels[activity.latestVersion.difficulty]}
                      </strong>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} aria-hidden="true" />
                    {activity.latestVersion?.timeLimitSeconds == null
                      ? "Sem limite de tempo"
                      : `${Math.floor(activity.latestVersion.timeLimitSeconds / 60)} min`}
                  </span>
                  <span>Publicada em {formatDate(activity.createdAt)}</span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {activity.executionCount}{" "}
                    {activity.executionCount === 1 ? "execução" : "execuções"}
                  </span>

                  {activity.type === "word_search" ? (
                    <Link
                      href={`/activities/word-search/${encodeURIComponent(activity.slug)}/play`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      <Gamepad2 size={16} aria-hidden="true" />
                      Executar
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted">
                      Execução em breve
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>

          {totalPages > 1 && (
            <nav
              aria-label="Paginação da biblioteca"
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                Anterior
              </button>
              <span className="text-sm text-muted">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : null}
    </RoleBasedLayout>
  );
}
