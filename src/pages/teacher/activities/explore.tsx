import { useEffect, useState } from "react";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Heart,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import { favoriteActivityService } from "@/modules/activities/services/favoriteActivityService";
import type {
  ActivityDifficulty,
  ActivityType,
  ActivityListData,
  ListedActivity,
} from "@/modules/activities/types/activityList.types";
import { activityTypeTranslationKeys } from "@/modules/activities/types/activityCatalog";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const [result, setResult] = useState<ActivityListData | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityType | "ALL">("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<
    ActivityDifficulty | "ALL"
  >("ALL");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteActionSlug, setFavoriteActionSlug] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = JSON.stringify({
    page,
    search: search.trim(),
    typeFilter,
    difficultyFilter,
    favoritesOnly,
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
        ...(favoritesOnly ? { favoritesOnly: true } : {}),
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
  }, [page, search, typeFilter, difficultyFilter, favoritesOnly, reloadKey, requestKey]);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      backLinkPlacement="title"
      title={t("teacherExplore.title")}
      description={t("teacherExplore.description")}
    >
      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-dark">
          <SlidersHorizontal size={17} aria-hidden="true" />
          {t("teacherExplore.filtersTitle")}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative block md:col-span-1">
            <span className="sr-only">{t("teacherExplore.searchLabel")}</span>
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
              placeholder={t("teacherExplore.searchPlaceholder")}
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <label className="block">
            <span className="sr-only">{t("activities.filterType")}</span>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as ActivityType | "ALL");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="ALL">{t("activities.allTypes")}</option>
              {Object.entries(activityTypeTranslationKeys).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">{t("activities.filterDifficulty")}</span>
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
              <option value="ALL">{t("activities.allDifficulties")}</option>
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-dark">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(event) => {
              setFavoritesOnly(event.target.checked);
              setPage(1);
            }}
            className="size-4 accent-current"
          />
          {t("teacherExplore.favoritesOnly")}
        </label>
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
            {t("common.tryAgain")}
          </button>
        </section>
      )}

      {isLoading ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm"
        >
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-sm text-muted">{t("teacherExplore.loading")}</p>
        </section>
      ) : !errorMessage && result && result.items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-dark">
            {t("teacherExplore.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {search || typeFilter !== "ALL" || difficultyFilter !== "ALL" || favoritesOnly
              ? "{t("teacherExplore.adjustFilters")}"
              : "{t("teacherExplore.emptyDescription")}"}
          </p>
          {(search || typeFilter !== "ALL" || difficultyFilter !== "ALL" || favoritesOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
                setDifficultyFilter("ALL");
                setFavoritesOnly(false);
                setPage(1);
              }}
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:bg-background"
            >
              {t("activities.clearFilters")}
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
          </div>

          <section
            aria-label={t("teacherExplore.libraryLabel")}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {result.items.map((activity) => (
              <article
                key={activity.slug}
                className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md sm:p-6"
              >
                <div className="mb-4 flex items-start gap-4">
                <ActivityCoverImage type={activity.type} coverImageUrl={activity.coverImageUrl} altText={activity.coverAltText ?? getActivityName(activity)} className="w-[42%] max-w-56 shrink-0" />
                <div className="flex min-w-0 flex-col gap-2 pt-1 text-xs text-muted">
                  {activity.latestVersion && (
                    <span>
                      Dificuldade:{" "}
                      <strong className="font-semibold text-dark">
                        {difficultyLabels[activity.latestVersion.difficulty]}
                      </strong>
                    </span>
                  )}
                  
                  <span>{t("teacherExplore.published")} em {formatDate(activity.createdAt)}</span>
                </div>
              </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {activityTypeLabels[activity.type] ?? activity.type}
                    </p>
                    <span className="inline-flex shrink-0 items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                      {t("teacherExplore.published")}
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

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {activity.executionCount}{" "}
                    {activity.executionCount === 1 ? t("teacherExplore.executionSingular") : t("teacherExplore.executionPlural")}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={favoriteActionSlug === activity.slug}
                      onClick={async () => {
                        const nextFavorite = !activity.isFavorite;
                        setFavoriteActionSlug(activity.slug);
                        try {
                          await favoriteActivityService.set(activity.slug, nextFavorite);
                          setResult((current) => current
                            ? {
                                ...current,
                                items: current.items.map((item) =>
                                  item.slug === activity.slug
                                    ? { ...item, isFavorite: nextFavorite }
                                    : item,
                                ),
                              }
                            : current);
                          if (favoritesOnly && !nextFavorite) {
                            setReloadKey((current) => current + 1);
                          }
                        } catch (error: unknown) {
                          setErrorMessage(getErrorMessage(error));
                        } finally {
                          setFavoriteActionSlug(null);
                        }
                      }}
                      aria-label={activity.isFavorite
                        ? t("teacherExplore.removeFavoriteAria", { name: getActivityName(activity) })
                        : t("teacherExplore.addFavoriteAria", { name: getActivityName(activity) })}
                      title={activity.isFavorite ? t("teacherExplore.removeFavorite") : t("teacherExplore.addFavorite")}
                      className={`inline-flex size-10 items-center justify-center rounded-lg border border-border transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-50 ${activity.isFavorite ? "text-red-600" : "text-muted hover:text-red-600"}`}
                    >
                      <Heart size={17} fill={activity.isFavorite ? "currentColor" : "none"} aria-hidden="true" />
                    </button>

                  {activity.type === "word_search" ? (
                    <Link
                      href={`/activities/word-search/${encodeURIComponent(activity.slug)}/play`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}
                    >
                      <Gamepad2 size={16} aria-hidden="true" />
                      {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "crossword" ? (
                    <Link
                      href={`/activities/crossword/${encodeURIComponent(activity.slug)}/play`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}
                    >
                      <Gamepad2 size={16} aria-hidden="true" />
                      {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "quiz" ? (
                    <Link
                      href={`/activities/quiz/${encodeURIComponent(activity.slug)}/play`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      style={{ color: "var(--primary-foreground)" }}
                    >
                      <Gamepad2 size={16} aria-hidden="true" />
                      {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "memory" ? (
                    <Link href={`/activities/memory/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "listening" ? (
                    <Link href={`/activities/listening/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "multiple_choice" ? (
                    <Link href={`/activities/multiple-choice/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "word_matching" ? (
                    <Link href={`/activities/word-matching/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "sentence_completion" ? (
                    <Link href={`/activities/sentence-completion/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "mole_hit" ? (
                    <Link href={`/activities/mole_hit/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "hangman" ? (
                    <Link href={`/activities/hangman/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : activity.type === "roulette" ? (
                    <Link href={`/activities/roulette/${encodeURIComponent(activity.slug)}/play`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                      <Gamepad2 size={16} aria-hidden="true" /> {t("teacherExplore.execute")}
                    </Link>
                  ) : ( 
                    <span className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted">
                      {t("teacherExplore.comingSoon")}
                    </span>
                  )}
                  </div>
                </div>
              </article>
            ))}
          </section>

          {result.pagination.totalPages > 1 && (
            <nav
              aria-label={t("teacherExplore.pagination")}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                {t("activities.previous")}
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
                {t("activities.next")}
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : null}
    </RoleBasedLayout>
  );
}