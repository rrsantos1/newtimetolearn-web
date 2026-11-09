import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import { updateActivityVisibilityService } from "@/modules/activities/services/updateActivityVisibilityService";
import { activityTypeTranslationKeys } from "@/modules/activities/types/activityCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  ActivityDifficulty,
  ActivityType,
  ListedActivity,
} from "@/modules/activities/types/activityList.types";

const PAGE_SIZE = 9;

const difficultyKeys: Record<ActivityDifficulty, TranslationKey> = {
  EASY: "activities.difficulty.easy",
  MEDIUM: "activities.difficulty.medium",
  HARD: "activities.difficulty.hard",
};

function getErrorMessage(error: unknown, t: (key: TranslationKey) => string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? t("adminPublic.operationError");
  }
  return t("adminPublic.unexpectedError");
}

function getActivityName(activity: ListedActivity, t: (key: TranslationKey) => string): string {
  return activity.publishedVersion?.name ?? activity.latestVersion?.name ?? t("adminPublic.untitled");
}

export default function PublicActivitiesAdminPage() {
  const { t, locale } = useTranslation();
  const [activities, setActivities] = useState<ListedActivity[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityType | "ALL">("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<ActivityDifficulty | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [loadedReloadKey, setLoadedReloadKey] = useState<number | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const isLoading = loadedReloadKey !== reloadKey;

  useEffect(() => {
    let cancelled = false;

    async function loadActivities(): Promise<void> {
      try {
        const firstPage = await listActivitiesService.execute(1, 100, "all");
        const allActivities = [...firstPage.items];

        for (let currentPage = 2; currentPage <= firstPage.pagination.totalPages; currentPage += 1) {
          const nextPage = await listActivitiesService.execute(currentPage, 100, "all");
          allActivities.push(...nextPage.items);
        }

        if (!cancelled) {
          setActivities(allActivities.filter(
            (activity) => activity.status === "PUBLISHED" && activity.publishedVersion !== null,
          ));
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (!cancelled) setErrorMessage(getErrorMessage(error, t));
      } finally {
        if (!cancelled) setLoadedReloadKey(reloadKey);
      }
    }

    void loadActivities();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);

    return activities.filter((activity) => {
      const matchesSearch = !normalizedSearch
        || getActivityName(activity, t).toLocaleLowerCase(locale).includes(normalizedSearch)
        || (activity.latestVersion?.description ?? "").toLocaleLowerCase(locale).includes(normalizedSearch);
      const matchesType = typeFilter === "ALL" || activity.type === typeFilter;
      const matchesDifficulty = difficultyFilter === "ALL"
        || activity.latestVersion?.difficulty === difficultyFilter;

      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [activities, search, typeFilter, difficultyFilter, locale, t]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
  const visibleActivities = filteredActivities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Boolean(search.trim()) || typeFilter !== "ALL" || difficultyFilter !== "ALL";

  async function toggleVisibility(activity: ListedActivity): Promise<void> {
    if (busySlug) return;
    const visibility = activity.visibility === "PUBLIC" ? "AUTHENTICATED" : "PUBLIC";
    setBusySlug(activity.slug);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateActivityVisibilityService.execute(activity.slug, visibility);
      setActivities((current) => current.map((item) => item.slug === activity.slug ? { ...item, visibility } : item));
      setSuccessMessage(visibility === "PUBLIC"
        ? t("adminPublic.visibilityEnabled", { name: getActivityName(activity, t) })
        : t("adminPublic.visibilityDisabled", { name: getActivityName(activity, t) }));
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, t));
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <RoleBasedLayout
      area="admin"
      allowedRoles={["ADMIN"]}
      title={t("adminPublic.title")}
      description={t("adminPublic.description")}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark">
          <ArrowLeft size={16} aria-hidden="true" /> Atividades pendentes
        </Link>
        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          disabled={isLoading}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark transition hover:bg-background disabled:opacity-50"
        >
          <RefreshCw size={15} aria-hidden="true" /> Atualizar
        </button>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-dark">
          <SlidersHorizontal size={17} aria-hidden="true" /> {t("adminPublic.filtersTitle")}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative block">
            <span className="sr-only">{t("adminPublic.searchLabel")}</span>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("adminPublic.searchPlaceholder")}
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label>
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
                <option key={value} value={value}>{t(label)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">{t("activities.filterDifficulty")}</span>
            <select
              value={difficultyFilter}
              onChange={(event) => {
                setDifficultyFilter(event.target.value as ActivityDifficulty | "ALL");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="ALL">{t("activities.allDifficulties")}</option>
              {(["EASY", "MEDIUM", "HARD"] as const).map((value) => (
                <option key={value} value={value}>{t(difficultyKeys[value])}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {successMessage && (
        <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <section role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 px-3 font-semibold transition hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw size={15} aria-hidden="true" /> Tentar novamente
          </button>
        </section>
      )}

      {isLoading ? (
        <section aria-live="polite" className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
          {t("adminPublic.loading")}
        </section>
      ) : filteredActivities.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-10 text-center">
          <Globe size={28} className="mx-auto text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-dark">
            {hasFilters ? t("adminPublic.emptyFiltered") : t("adminPublic.emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {hasFilters
              ? t("teacherExplore.adjustFilters")
              : t("adminPublic.emptyDescription")}
          </p>
          {hasFilters && (
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
              {t("activities.clearFilters")}
            </button>
          )}
        </section>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted" aria-live="polite">
              {filteredActivities.length === 1
                ? t("teacherExplore.oneResult")
                : t("teacherExplore.manyResults").replace("{count}", String(filteredActivities.length))}
            </p>
            {isLoading && <span className="text-xs text-muted">{t("adminPublic.updating")}</span>}
          </div>

          <section aria-label={t("adminPublic.approvedListLabel")} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleActivities.map((activity) => (
              <article key={activity.slug} className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <ActivityCoverImage
                  type={activity.type}
                  coverImageUrl={activity.coverImageUrl}
                  altText={activity.coverAltText ?? getActivityName(activity, t)}
                />
                <h2 className="mt-4 text-lg font-semibold text-dark">{getActivityName(activity, t)}</h2>
                {activity.latestVersion?.status === "PUBLISHED" && activity.latestVersion.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{activity.latestVersion.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <span>{t(activityTypeTranslationKeys[activity.type])}</span>
                  {activity.latestVersion && (
                    <span>• {t(difficultyKeys[activity.latestVersion.difficulty])}</span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className={activity.visibility === "PUBLIC"
                    ? "rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
                    : "rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted"}>
                    {activity.visibility === "PUBLIC" ? t("adminPublic.onHome") : t("adminPublic.authenticatedOnly")}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggleVisibility(activity)}
                    disabled={Boolean(busySlug)}
                    title={activity.visibility === "PUBLIC" ? t("adminPublic.removeFromHome") : t("adminPublic.showOnHome")}
                    aria-label={activity.visibility === "PUBLIC"
                      ? t("adminPublic.removeFromHomeAria", { name: getActivityName(activity, t) })
                      : t("adminPublic.showOnHomeAria", { name: getActivityName(activity, t) })}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-dark transition hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busySlug === activity.slug
                      ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                      : activity.visibility === "PUBLIC"
                        ? <Lock size={16} aria-hidden="true" />
                        : <Globe size={16} aria-hidden="true" />}
                  </button>
                </div>
                {busySlug === activity.slug && <p className="mt-2 text-xs text-muted" aria-live="polite">{t("adminPublic.updatingVisibility")}</p>}
              </article>
            ))}
          </section>

          {totalPages > 1 && (
            <nav aria-label={t("adminPublic.pagination")} className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" /> {t("activities.previous")}
              </button>
              <span className="text-sm text-muted">{t("activities.pageOf", { page, total: totalPages })}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("activities.next")} <ChevronRight size={17} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </RoleBasedLayout>
  );
}
