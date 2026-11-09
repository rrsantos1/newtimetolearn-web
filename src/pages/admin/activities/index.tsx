import { useEffect, useState } from "react";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import axios from "axios";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Play,
  RefreshCw,
  XCircle,
  Globe,
  Lock,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { adminFaq } from "@/modules/faq/data/faqContent";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import type {
  ActivityDifficulty,
  ListedActivity,
} from "@/modules/activities/types/activityList.types";
import { activityTypeTranslationKeys } from "@/modules/activities/types/activityCatalog";
import type { TranslationKey } from "@/lib/i18n/translations";
import api from "@/lib/api";
import { updateActivityVisibilityService } from "@/modules/activities/services/updateActivityVisibilityService";
import { useTranslation } from "@/hooks/useTranslation";

function getErrorMessage(
  error: unknown,
  t: (key: TranslationKey) => string,
): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return (
      responseData?.error?.message ??
      responseData?.message ??
      t("adminPublic.operationError")
    );
  }
  return t("adminPublic.unexpectedError");
}

const PAGE_SIZE = 9;

const difficultyKeys: Record<ActivityDifficulty, TranslationKey> = {
  EASY: "activities.difficulty.easy",
  MEDIUM: "activities.difficulty.medium",
  HARD: "activities.difficulty.hard",
};

function formatDate(
  value: string,
  locale: string,
  t: (key: TranslationKey) => string,
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return t("activities.teacher.dateUnavailable");
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getActivityName(
  activity: ListedActivity,
  t: (key: TranslationKey) => string,
): string {
  return (
    activity.latestVersion?.name ??
    activity.publishedVersion?.name ??
    t("activities.teacher.untitled")
  );
}

function getActivityTypeLabel(
  type: ListedActivity["type"],
  t: (key: TranslationKey) => string,
): string {
  return t(activityTypeTranslationKeys[type]);
}

export default function PendingActivitiesPage() {
  const { t, locale } = useTranslation();
  const [activities, setActivities] = useState<ListedActivity[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const visibleActivities = activities.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadActivities(): Promise<void> {
      try {
        const firstPage = await listActivitiesService.execute(1, 100, "all");
        const allActivities = [...firstPage.items];

        for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
          const result = await listActivitiesService.execute(page, 100, "all");
          allActivities.push(...result.items);
        }

        if (!cancelled) {
          setActivities(
            allActivities.filter(
              (activity) => activity.latestVersion?.status === "PENDING_REVIEW",
            ),
          );
          setPage(1);
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error, t));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadActivities();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  async function handleVisibility(activity: ListedActivity): Promise<void> {
    if (busySlug || activity.status !== "PUBLISHED") return;
    setBusySlug(activity.slug);
    setErrorMessage("");
    try {
      const visibility =
        activity.visibility === "PUBLIC" ? "AUTHENTICATED" : "PUBLIC";
      await updateActivityVisibilityService.execute(activity.slug, visibility);
      setActivities((current) =>
        current.map((item) =>
          item.slug === activity.slug ? { ...item, visibility } : item,
        ),
      );
      setSuccessMessage(
        visibility === "PUBLIC"
          ? t("adminPublic.visibilityEnabled", {
              name: getActivityName(activity, t),
            })
          : t("adminPublic.visibilityDisabled", {
              name: getActivityName(activity, t),
            }),
      );
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, t));
    } finally {
      setBusySlug(null);
    }
  }

  async function handleDecision(
    activity: ListedActivity,
    decision: "approve" | "request-changes" | "reject",
  ): Promise<void> {
    if (busySlug) return;

    let feedback: string | undefined;
    if (decision !== "approve") {
      const promptLabel =
        decision === "request-changes"
          ? t("adminActivities.requestChangesPrompt")
          : t("adminActivities.rejectPrompt");
      const enteredFeedback = window.prompt(promptLabel);
      if (enteredFeedback === null) return;
      feedback = enteredFeedback.trim();
      if (feedback.length < 10) {
        setErrorMessage(t("adminActivities.feedbackTooShort"));
        return;
      }
    }

    setBusySlug(activity.slug);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (decision === "approve") {
        await api.patch(
          `/activities/${encodeURIComponent(activity.slug)}/approve`,
        );
        setSuccessMessage(
          t("adminActivities.approved", { name: getActivityName(activity, t) }),
        );
      } else {
        await api.patch(
          `/activities/${encodeURIComponent(activity.slug)}/review`,
          {
            decision: decision === "reject" ? "REJECT" : "REQUEST_CHANGES",
            feedback,
          },
        );
        setSuccessMessage(
          decision === "reject"
            ? t("adminActivities.rejected", {
                name: getActivityName(activity, t),
              })
            : t("adminActivities.changesRequested", {
                name: getActivityName(activity, t),
              }),
        );
      }
      setIsLoading(true);
      setReloadKey((current) => current + 1);
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
      title={t("adminActivities.title")}
      description={t("adminActivities.description")}
    >
      <div className="mb-5 flex justify-end">
        <Link
          href="/admin/activities/public"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
        >
          <Globe size={16} aria-hidden="true" />{" "}
          {t("adminActivities.managePublic")}
        </Link>
      </div>
      {successMessage && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <div
          className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted"
          aria-live="polite"
        >
          {t("adminActivities.loading")}
        </div>
      ) : activities.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <CheckCircle2
            className="mx-auto text-green-600"
            size={30}
            aria-hidden="true"
          />
          <h2 className="mt-3 font-semibold text-dark">
            {t("adminActivities.emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t("adminActivities.emptyDescription")}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((current) => current + 1);
            }}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background"
          >
            <RefreshCw size={15} aria-hidden="true" />{" "}
            {t("adminActivities.refresh")}
          </button>
        </section>
      ) : (
        <section
          aria-label={t("adminActivities.pendingListLabel")}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleActivities.map((activity) => (
            <article
              key={activity.slug}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="mb-4 flex items-start gap-4">
                <ActivityCoverImage
                  type={activity.type}
                  coverImageUrl={activity.coverImageUrl}
                  altText={
                    activity.coverAltText ?? getActivityName(activity, t)
                  }
                  className="w-[42%] max-w-56 shrink-0"
                />
                <div className="flex min-w-0 flex-col gap-2 pt-1 text-xs text-muted">
                  {activity.latestVersion && (
                    <span>
                      {t("adminActivities.difficulty")}:{" "}
                      <strong className="font-semibold text-dark">
                        {t(difficultyKeys[activity.latestVersion.difficulty])}
                      </strong>
                    </span>
                  )}

                  <span>
                    {t("activities.teacher.createdAt", {
                      date: formatDate(activity.createdAt, locale, t),
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {getActivityTypeLabel(activity.type, t)}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  <Clock3 size={13} aria-hidden="true" />{" "}
                  {t("adminActivities.awaitingApproval")}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-dark">
                {getActivityName(activity, t)}
              </h2>
              {activity.latestVersion?.description && (
                <p className="mt-2 text-sm leading-6 text-muted">
                  {activity.latestVersion.description}
                </p>
              )}
              <p className="mt-3 text-xs text-muted">
                {t("adminActivities.version").replace(
                  "{version}",
                  String(activity.latestVersion?.versionNumber ?? "—"),
                )}
              </p>
              <Link
                href={
                  activity.type === "quiz"
                    ? `/activities/quiz/${encodeURIComponent(activity.slug)}/play`
                    : activity.type === "crossword"
                      ? `/activities/crossword/${encodeURIComponent(activity.slug)}/play`
                      : activity.type === "memory"
                        ? `/activities/memory/${encodeURIComponent(activity.slug)}/play`
                        : activity.type === "listening"
                          ? `/activities/listening/${encodeURIComponent(activity.slug)}/play`
                          : activity.type === "multiple_choice"
                            ? `/activities/multiple-choice/${encodeURIComponent(activity.slug)}/play`
                            : activity.type === "word_matching"
                              ? `/activities/word-matching/${encodeURIComponent(activity.slug)}/play`
                              : activity.type === "sentence_completion"
                                ? `/activities/sentence-completion/${encodeURIComponent(activity.slug)}/play`
                                : activity.type === "mole_hit"
                                  ? `/activities/mole_hit/${encodeURIComponent(activity.slug)}/play`
                                  : `/activities/word-search/${encodeURIComponent(activity.slug)}/play`
                }
                className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Play size={16} aria-hidden="true" />
                {t("adminActivities.testActivity")}
              </Link>
              {activity.status === "PUBLISHED" && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void handleVisibility(activity)}
                    disabled={Boolean(busySlug)}
                    aria-label={
                      activity.visibility === "PUBLIC"
                        ? t("adminPublic.removeFromHomeAria", {
                            name: getActivityName(activity, t),
                          })
                        : t("adminPublic.showOnHomeAria", {
                            name: getActivityName(activity, t),
                          })
                    }
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activity.visibility === "PUBLIC" ? (
                      <>
                        <Lock size={15} aria-hidden="true" />{" "}
                        {t("adminPublic.removeFromHome")}
                      </>
                    ) : (
                      <>
                        <Globe size={15} aria-hidden="true" />{" "}
                        {t("adminPublic.showOnHome")}
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => void handleDecision(activity, "approve")}
                  disabled={Boolean(busySlug)}
                  title={t("adminActivities.approveTitle")}
                  aria-label={t("adminActivities.approveAria", {
                    name: getActivityName(activity, t),
                  })}
                  className="inline-flex size-9 items-center justify-center rounded-lg bg-green-700 text-white transition hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDecision(activity, "request-changes")
                  }
                  disabled={Boolean(busySlug)}
                  title={t("adminActivities.requestChangesTitle")}
                  aria-label={t("adminActivities.requestChangesAria", {
                    name: getActivityName(activity, t),
                  })}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-amber-300 text-amber-800 transition hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDecision(activity, "reject")}
                  disabled={Boolean(busySlug)}
                  title={t("adminActivities.rejectTitle")}
                  aria-label={t("adminActivities.rejectAria", {
                    name: getActivityName(activity, t),
                  })}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle size={16} aria-hidden="true" />
                </button>
              </div>
              {busySlug === activity.slug && (
                <p className="mt-3 text-xs text-muted" aria-live="polite">
                  {t("adminActivities.processing")}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
      {!isLoading && activities.length > PAGE_SIZE && (
        <nav
          aria-label={t("adminActivities.pagination")}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} aria-hidden="true" />{" "}
            {t("activities.previous")}
          </button>
          <span className="text-sm text-muted">
            {t("activities.pageOf", { page, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("activities.next")} <ChevronRight size={17} aria-hidden="true" />
          </button>
        </nav>
      )}
      <FaqSection
        title={t("adminActivities.faqTitle")}
        description={t("adminActivities.faqDescription")}
        items={adminFaq}
      />
    </RoleBasedLayout>
  );
}