import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  SlidersHorizontal,
  Heart,
  Gamepad2,
  History,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { deleteActivityService } from "@/modules/activities/services/deleteActivityService";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";
import { favoriteActivityService } from "@/modules/activities/services/favoriteActivityService";
import { activityTypeTranslationKeys } from "@/modules/activities/types/activityCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  ActivityListData,
  ListedActivity,
} from "@/modules/activities/types/activityList.types";

const CREATE_ACTIVITY_ROUTE = "/teacher/activities/new";

const statusTranslationKeys: Record<string, TranslationKey> = {
  DRAFT: "activities.status.draft",
  PENDING_REVIEW: "activities.status.pending",
  PUBLISHED: "activities.status.published",
  REJECTED: "activities.status.rejected",
  CHANGES_REQUESTED: "activities.status.changes",
  ARCHIVED: "activities.status.archived",
};

const difficultyTranslationKeys: Record<string, TranslationKey> = {
  EASY: "activities.difficulty.easy",
  MEDIUM: "activities.difficulty.medium",
  HARD: "activities.difficulty.hard",
};

function getErrorMessage(error: unknown, t: (key: TranslationKey) => string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      responseData?.error?.message ??
      responseData?.message ??
      t("activities.teacher.loadError")
    );
  }

  return t("activities.teacher.unexpectedLoadError");
}

function getDeleteErrorMessage(error: unknown, t: (key: TranslationKey) => string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      responseData?.error?.message ??
      responseData?.message ??
      t("activities.teacher.deleteError")
    );
  }

  return t("activities.teacher.unexpectedDeleteError");
}

function getStatusLabel(activity: ListedActivity, t: (key: TranslationKey) => string): string {
  const status = activity.latestVersion?.status ?? activity.status;
  const key = statusTranslationKeys[status];
  return key ? t(key) : status;
}

function getStatusClass(activity: ListedActivity): string {
  const status = activity.latestVersion?.status ?? activity.status;

  if (status === "PUBLISHED") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "PENDING_REVIEW") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "REJECTED" || status === "CHANGES_REQUESTED") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-border bg-background text-muted";
}

function canEditActivity(activity: ListedActivity): boolean {
  if (
    (activity.type !== "word_search" && activity.type !== "crossword" && activity.type !== "quiz" && activity.type !== "memory" && activity.type !== "listening" && activity.type !== "word_matching" && activity.type !== "sentence_completion" && activity.type !== "multiple_choice" && activity.type !== "mole_hit" && activity.type !== "hangman" && activity.type !== "roulette") ||
    !activity.latestVersion
  ) {
    return false;
  }

  return [
    "DRAFT",
    "PUBLISHED",
    "REJECTED",
    "CHANGES_REQUESTED",
  ].includes(activity.latestVersion.status);
}

function getActivityTypeLabel(type: ListedActivity["type"], t: (key: TranslationKey) => string): string {
  const key = activityTypeTranslationKeys[type];
  return t(key);
}


function getEditHref(activity: ListedActivity): string {
  const slug = encodeURIComponent(activity.slug);
  if (activity.type === "quiz") return "/teacher/activities/quiz/" + slug + "/edit";
  if (activity.type === "crossword") return "/teacher/activities/crossword/" + slug + "/edit";
  if (activity.type === "memory") return "/teacher/activities/memory/" + slug + "/edit";
  if (activity.type === "listening") return "/teacher/activities/listening/" + slug + "/edit";
  if (activity.type === "word_matching") return "/teacher/activities/word-matching/" + slug + "/edit";
  if (activity.type === "sentence_completion") return "/teacher/activities/sentence-completion/" + slug + "/edit";
  if (activity.type === "multiple_choice") return "/teacher/activities/multiple-choice/" + slug + "/edit";
  if (activity.type === "mole_hit") return "/teacher/activities/mole-hit/" + slug + "/edit";
  if (activity.type === "hangman") return "/teacher/activities/hangman/" + slug + "/edit";
  if (activity.type === "roulette") return "/teacher/activities/roulette/" + slug + "/edit";
  return "/teacher/activities/word-search/" + slug + "/edit";
}

function formatDate(value: string, locale: string, t: (key: TranslationKey) => string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("activities.teacher.dateUnavailable");
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getActivityName(activity: ListedActivity, t: (key: TranslationKey) => string): string {
  return (
    activity.latestVersion?.name ??
    activity.publishedVersion?.name ??
    t("activities.teacher.untitled")
  );
}

export default function TeacherActivitiesPage() {
  const { t, locale } = useTranslation();
  const [result, setResult] = useState<ActivityListData | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activityToDelete, setActivityToDelete] =
    useState<ListedActivity | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [submittingSlug, setSubmittingSlug] = useState<string | null>(null);
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    listActivitiesService
      .execute(page, 12, "mine", {
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(typeFilter !== "ALL" ? { type: typeFilter as ListedActivity["type"] } : {}),
        ...(difficultyFilter !== "ALL" ? { difficulty: difficultyFilter as "EASY" | "MEDIUM" | "HARD" } : {}),
        ...(favoritesOnly ? { favoritesOnly: true } : {}),
      })
      .then((data) => {
        if (cancelled) return;

        setResult(data);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setErrorMessage(getErrorMessage(error, t));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, search, typeFilter, difficultyFilter, favoritesOnly]);

  async function handleSubmitForApproval(activity: ListedActivity): Promise<void> {
    if (submittingSlug || activity.latestVersion?.status !== "DRAFT") {
      return;
    }

    setSubmittingSlug(activity.slug);
    setSubmissionErrorMessage("");
    setSuccessMessage("");

    try {
      await submitActivityVersionService.execute(activity.slug);
      setSuccessMessage(
        t("activities.teacher.submitSuccess").replace("{name}", getActivityName(activity, t)),
      );
      setReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setSubmissionErrorMessage(getErrorMessage(error, t));
    } finally {
      setSubmittingSlug(null);
    }
  }

  async function handleDeleteActivity() {
    if (!activityToDelete || deletingSlug) {
      return;
    }

    const activity = activityToDelete;
    setDeletingSlug(activity.slug);
    setDeleteErrorMessage("");

    try {
      await deleteActivityService.execute(activity.slug);

      setResult((current) => {
        if (!current) return current;

        const items = current.items.filter(
          (item) => item.slug !== activity.slug,
        );
        const total = Math.max(0, current.pagination.total - 1);
        const totalPages = Math.max(1, Math.ceil(total / 9));

        return {
          ...current,
          items,
          pagination: {
            ...current.pagination,
            total,
            totalPages,
          },
        };
      });

      setActivityToDelete(null);
      setSuccessMessage(
        t("activities.teacher.deleteSuccess").replace("{name}", getActivityName(activity, t)),
      );
      setErrorMessage("");

      if (result && result.items.length === 1 && page > 1) {
        setIsLoading(true);
        setPage((currentPage) => Math.max(1, currentPage - 1));
      } else {
        setReloadKey((current) => current + 1);
      }
    } catch (error: unknown) {
      setDeleteErrorMessage(getDeleteErrorMessage(error, t));
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title={t("activities.teacher.title")}
      description={t("activities.teacher.description")}
      titleActions={(
        <Link
          href={CREATE_ACTIVITY_ROUTE}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          style={{ color: "var(--primary-foreground)" }}
        >
          <Plus size={18} aria-hidden="true" />
          {t("activities.create")}
        </Link>
      )}
    >
      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-dark"><SlidersHorizontal size={17} aria-hidden="true" /> {t("activities.filters")}</div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative block">
            <span className="sr-only">{t("activities.searchLabel")}</span>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder={t("activities.searchPlaceholder")}
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label>
            <span className="sr-only">{t("activities.filterType")}</span>
            <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-dark">
              <option value="ALL">{t("activities.allTypes")}</option>
              {Object.entries(activityTypeTranslationKeys).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">{t("activities.filterDifficulty")}</span>
            <select value={difficultyFilter} onChange={(event) => { setDifficultyFilter(event.target.value); setPage(1); }} className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-dark">
              <option value="ALL">{t("activities.allDifficulties")}</option>
              <option value="EASY">{t("activities.difficulty.easy")}</option>
              <option value="MEDIUM">{t("activities.difficulty.medium")}</option>
              <option value="HARD">{t("activities.difficulty.hard")}</option>
            </select>
          </label>
        </div>
        <label className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-dark">
          <input type="checkbox" checked={favoritesOnly} onChange={(event) => { setFavoritesOnly(event.target.checked); setPage(1); }} className="size-4 accent-current" />
          {t("activities.favoritesOnly")}
        </label>
      </section>

      {successMessage && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p className="flex-1 leading-6">{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label={t("activities.closeSuccess")}
            className="rounded-md p-1 transition hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {submissionErrorMessage && (
        <section
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {submissionErrorMessage}
        </section>
      )}

      {errorMessage && (
        <section
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm leading-6">{errorMessage}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((current) => current + 1);
            }}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-red-300 px-3 text-sm font-semibold transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={15} aria-hidden="true" />
            {t("activities.retry")}
          </button>
        </section>
      )}

      {isLoading && !result ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm"
        >
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-sm text-muted">{t("activities.loading")}</p>
        </section>
      ) : result && result.items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList size={26} aria-hidden="true" />
          </span>

          <h2 className="mt-5 text-lg font-semibold text-dark">
            {t("activities.emptyTeacherTitle")}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {t("activities.emptyTeacherDescription")}
          </p>

          <Link
            href={CREATE_ACTIVITY_ROUTE}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold transition hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}
          >
            <Plus size={18} aria-hidden="true" />
            {t("activities.create")}
          </Link>
        </section>
      ) : result ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {result.pagination.total === 1
                ? t("activities.countOne")
                : t("activities.countMany").replace("{count}", String(result.pagination.total))}
            </p>

            {isLoading && (
              <span className="text-xs text-muted">{t("activities.updating")}</span>
            )}
          </div>

          <section
            aria-label={t("activities.teacher.listLabel")}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {result.items.map((activity, index) => (
              <article
                key={activity.slug}
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
              >
                <div className="mb-4 flex items-start gap-4">
                  <ActivityCoverImage type={activity.type} coverImageUrl={activity.coverImageUrl} altText={activity.coverAltText ?? getActivityName(activity, t)} className="w-[42%] max-w-56 shrink-0" loading={index === 0 ? "eager" : "lazy"} />
                  <div className="flex min-w-0 flex-col gap-2 pt-1 text-xs text-muted">
                    {activity.latestVersion && (
                      <span>
                        {t("activities.difficulty")}{" "}
                        <strong className="font-semibold text-dark">
                          {t(difficultyTranslationKeys[activity.latestVersion.difficulty] ?? "activities.difficulty.medium")}
                        </strong>
                      </span>
                    )}
                    
                    <span>{t("activities.teacher.createdAt", { date: formatDate(activity.createdAt, locale, t) })}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {getActivityTypeLabel(activity.type, t)}
                    </p>

                    <h2 className="mt-2 wrap-break-word text-lg font-semibold text-dark">
                      {getActivityName(activity, t)}
                    </h2>

                    {activity.latestVersion?.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                        {activity.latestVersion.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(activity)}`}
                  >
                    {getStatusLabel(activity, t)}
                  </span>
                </div>

                {activity.latestVersion?.status === "REJECTED" &&
                  activity.latestVersion.revision > 0 && (
                    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">
                      {t("activities.rejectedNotice")}
                    </p>
                  )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {activity.executionCount}{" "}
                    {activity.executionCount === 1 ? t("activities.executionOne") : t("activities.executionMany")}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={async () => { try { await favoriteActivityService.set(activity.slug, !activity.isFavorite); setResult((current) => current ? { ...current, items: current.items.map((item) => item.slug === activity.slug ? { ...item, isFavorite: !item.isFavorite } : item) } : current); if (favoritesOnly && activity.isFavorite) setReloadKey((current) => current + 1); } catch (error: unknown) { setErrorMessage(getErrorMessage(error, t)); } }} aria-label={activity.isFavorite ? t("activities.teacher.removeFavoriteAria").replace("{name}", getActivityName(activity, t)) : t("activities.teacher.addFavoriteAria").replace("{name}", getActivityName(activity, t))} title={activity.isFavorite ? t("activities.teacher.removeFavorite") : t("activities.teacher.addFavorite")} className={`inline-flex size-9 items-center justify-center rounded-lg border border-border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${activity.isFavorite ? "text-red-600" : "text-muted hover:text-red-600"}`}><Heart size={16} fill={activity.isFavorite ? "currentColor" : "none"} aria-hidden="true" /></button>
                    {(activity.type === "word_search" || activity.type === "crossword" || activity.type === "quiz" || activity.type === "memory" || activity.type === "listening" || activity.type === "word_matching" || activity.type === "sentence_completion" || activity.type === "multiple_choice" || activity.type === "mole_hit" || activity.type === "hangman") && (
                      <Link
                        href={`/teacher/activities/${encodeURIComponent(activity.slug)}/attempts`}
                        title={t("activities.history")}
                        aria-label={`Ver histórico de ${getActivityName(activity, t)}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-dark transition hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        <History size={16} aria-hidden="true" />
                      </Link>
                    )}

                    {(activity.type === "word_search" || activity.type === "crossword" || activity.type === "quiz" || activity.type === "memory" || activity.type === "listening" || activity.type === "word_matching" || activity.type === "sentence_completion" || activity.type === "multiple_choice" || activity.type === "mole_hit" || activity.type === "hangman" || activity.type === "roulette") && (
                      <Link
                        href={activity.type === "quiz"
                          ? `/activities/quiz/${encodeURIComponent(activity.slug)}/play`
                          : activity.type === "crossword"
                            ? `/activities/crossword/${encodeURIComponent(activity.slug)}/play`
                            : activity.type === "memory"
                              ? `/activities/memory/${encodeURIComponent(activity.slug)}/play`
                              : activity.type === "listening"
                                ? `/activities/listening/${encodeURIComponent(activity.slug)}/play`
                                : activity.type === "word_matching"
                                  ? `/activities/word-matching/${encodeURIComponent(activity.slug)}/play`
                                  : activity.type === "sentence_completion"
                                    ? `/activities/sentence-completion/${encodeURIComponent(activity.slug)}/play`
                                    : activity.type === "multiple_choice"
                                    ? `/activities/multiple-choice/${encodeURIComponent(activity.slug)}/play`
                                      : activity.type === "mole_hit"
                                        ? `/activities/mole-hit/${encodeURIComponent(activity.slug)}/play`
                                        : activity.type === "hangman"
                                          ? `/activities/hangman/${encodeURIComponent(activity.slug)}/play`
                                          : activity.type === "roulette"
                                            ? `/activities/roulette/${encodeURIComponent(activity.slug)}/play`
                                            : `/activities/word-search/${encodeURIComponent(activity.slug)}/play`}
                        title={t("activities.run")}
                        aria-label={`Executar ${getActivityName(activity, t)}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg bg-dark text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        style={{ color: "var(--primary-foreground)" }}
                      >
                        <Gamepad2 size={16} aria-hidden="true" />
                      </Link>
                    )}

                    {activity.latestVersion?.status === "DRAFT" &&
                      (activity.type === "word_search" || activity.type === "crossword" || activity.type === "quiz" || activity.type === "memory" || activity.type === "listening" || activity.type === "word_matching" || activity.type === "sentence_completion" || activity.type === "multiple_choice" || activity.type === "mole_hit" || activity.type === "hangman" || activity.type === "roulette") && (
                        <button
                          type="button"
                          onClick={() => void handleSubmitForApproval(activity)}
                          disabled={Boolean(submittingSlug)}
                          title={t("activities.submitApproval")}
                          aria-label={`Enviar ${getActivityName(activity, t)} para aprovação`}
                          className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ color: "var(--primary-foreground)" }}
                        >
                          {submittingSlug === activity.slug
                            ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                            : <Send size={16} aria-hidden="true" />}
                        </button>
                      )}

                    {canEditActivity(activity) && (
                      <Link
                        href={getEditHref(activity)}
                        title={t("activities.edit")}
                        aria-label={`Editar ${getActivityName(activity, t)}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-dark transition hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        <ClipboardList size={16} aria-hidden="true" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActivityToDelete(activity);
                        setDeleteErrorMessage("");
                      }}
                      title={t("activities.delete")}
                      aria-label={`Excluir atividade ${getActivityName(activity, t)}`}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {result.pagination.totalPages > 1 && (
            <nav
              aria-label={t("activities.pagination")}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((currentPage) => Math.max(1, currentPage - 1));
                }}
                disabled={page <= 1 || isLoading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                Anterior
              </button>

              <span className="text-sm text-muted">
                {t("activities.pageOf").replace("{page}", String(result.pagination.page)).replace("{total}", String(result.pagination.totalPages))}
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((currentPage) =>
                    Math.min(result.pagination.totalPages, currentPage + 1),
                  );
                }}
                disabled={
                  page >= result.pagination.totalPages || isLoading
                }
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("activities.next")}
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : null}

      {activityToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingSlug) {
              setActivityToDelete(null);
              setDeleteErrorMessage("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-activity-title"
            aria-describedby="delete-activity-description"
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <Trash2 size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="delete-activity-title"
                  className="text-lg font-semibold text-dark"
                >
                  {t("activities.deleteTitle")}
                </h2>
                <p className="mt-2 wrap-break-word text-sm font-semibold text-dark">
                  {getActivityName(activityToDelete, t)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivityToDelete(null);
                  setDeleteErrorMessage("");
                }}
                disabled={Boolean(deletingSlug)}
                aria-label={t("activities.confirmClose")}
                className="rounded-lg p-1.5 text-muted transition hover:bg-background hover:text-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p
              id="delete-activity-description"
              className="mt-4 text-sm leading-6 text-muted"
            >
              {t("activities.deleteDescription")}
            </p>

            {deleteErrorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800"
              >
                {deleteErrorMessage}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setActivityToDelete(null);
                  setDeleteErrorMessage("");
                }}
                disabled={Boolean(deletingSlug)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("activities.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteActivity}
                disabled={Boolean(deletingSlug)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingSlug ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} aria-hidden="true" />
                    {t("activities.confirmDelete")}
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </RoleBasedLayout>
  );
}
