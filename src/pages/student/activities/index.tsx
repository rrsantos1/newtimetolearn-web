import { useEffect, useState } from "react";
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
import { activityTypeLabels } from "@/modules/activities/types/activityCatalog";

const PAGE_SIZE = 12;

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
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = JSON.stringify({
    page,
    search: search.trim(),
    typeFilter,
    difficultyFilter,
    reloadKey,
  });
  const isLoading = loadedRequestKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    listActivitiesService
      .execute(page, PAGE_SIZE, "explore", {
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
        ...(difficultyFilter !== "ALL" ? { difficulty: difficultyFilter } : {}),
      })
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setErrorMessage("");
        setLoadedRequestKey(requestKey);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(getErrorMessage(error));
        setLoadedRequestKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, typeFilter, difficultyFilter, reloadKey, requestKey]);

  return (
    <RoleBasedLayout
      area="student"
      allowedRoles={["STUDENT"]}
      title="Atividades disponíveis"
      description="Encontre atividades publicadas e pratique seus conhecimentos."
    >
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Painel inicial
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
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar atividade..."
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as ActivityType | "ALL");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="ALL">Todos os tipos</option>
              {Object.entries(activityTypeLabels).map(([value, label]) => (
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
              onChange={(event) => {
                setDifficultyFilter(
                  event.target.value as ActivityDifficulty | "ALL",
                );
                setPage(1);
              }}
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
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="ml-auto shrink-0 rounded-lg border border-red-300 px-3 py-2 font-semibold transition hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </section>
      )}

      {isLoading ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm"
        >
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-sm text-muted">Carregando atividades...</p>
        </section>
      ) : !errorMessage && result && result.items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-dark">
            Nenhuma atividade encontrada
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {search || typeFilter !== "ALL" || difficultyFilter !== "ALL"
              ? "Tente alterar os termos da busca ou os filtros selecionados."
              : "Quando novas atividades forem publicadas, elas aparecerão aqui."}
          </p>
          {(search || typeFilter !== "ALL" || difficultyFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
                setDifficultyFilter("ALL");
                setPage(1);
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
              {result.pagination.total === 1
                ? "1 atividade encontrada"
                : `${result.pagination.total} atividades encontradas`}
            </p>
            <p className="text-xs text-muted">
              Exibindo atividades publicadas disponíveis para você
            </p>
          </div>

          <section
            aria-label="Atividades disponíveis"
            className="grid gap-4 lg:grid-cols-2"
          >
            {result.items.map((activity) => (
              <article
                key={activity.slug}
                className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md sm:p-6"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {activityTypeLabels[activity.type] ?? activity.type}
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
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      <Gamepad2 size={16} aria-hidden="true" />
                      Executar
                    </Link>
                  ) : activity.type === "crossword" ? (
                    <Link
                      href={`/activities/crossword/${encodeURIComponent(activity.slug)}/play`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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

          {result.pagination.totalPages > 1 && (
            <nav
              aria-label="Paginação da biblioteca"
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                Anterior
              </button>
              <span className="text-sm text-muted">
                Página {result.pagination.page} de {result.pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(result.pagination.totalPages, current + 1),
                  )
                }
                disabled={page >= result.pagination.totalPages || isLoading}
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
