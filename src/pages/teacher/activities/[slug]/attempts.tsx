import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { useTranslation } from "@/hooks/useTranslation";
import {
  listActivityAttemptsService,
  type ActivityAttemptHistoryData,
} from "@/modules/activities/services/listActivityAttemptsService";

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      responseData?.error?.message ??
      responseData?.message ?? fallback
    );
  }

  return fallback;
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


export default function ActivityAttemptsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const slugValue = router.query.slug;
  const slug = Array.isArray(slugValue) ? slugValue[0] : slugValue;
  const [result, setResult] = useState<ActivityAttemptHistoryData | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!router.isReady || !slug) return;

    let cancelled = false;

    listActivityAttemptsService
      .execute(slug, page, 20)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(getErrorMessage(error, t("attempts.loadError")));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug, page, reloadKey, t]);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title={t("attempts.title")}
      description={t("attempts.description")}
    >
      <div className="mb-6">
        <Link
          href="/teacher/activities"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t("attempts.back")}
        </Link>
      </div>

      {errorMessage && (
        <section
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-6">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((current) => current + 1);
            }}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-red-300 px-3 text-sm font-semibold transition hover:bg-red-100 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={15} aria-hidden="true" />
            {t("attempts.retry")}
          </button>
        </section>
      )}

      {isLoading && !result ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm"
        >
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-sm text-muted">{t("attempts.loading")}</p>
        </section>
      ) : result && result.items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Trophy size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-dark">
            {t("attempts.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {t("attempts.emptyDescription")}
          </p>
        </section>
      ) : result ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {result.pagination.total === 1
                ? t("attempts.oneAttempt")
                : t("attempts.manyAttempts", { count: result.pagination.total })}
            </p>
            {isLoading && <span className="text-xs text-muted">{t("attempts.refreshing")}</span>}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 border-collapse text-left text-sm">
                <thead className="bg-background text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold">{t("attempts.student")}</th>
                    <th scope="col" className="px-5 py-4 font-semibold">{t("attempts.score")}</th>
                    <th scope="col" className="px-5 py-4 font-semibold">{result.activityType === "listening" ? t("attempts.blanks") : t("attempts.words")}</th>
                    <th scope="col" className="px-5 py-4 font-semibold">{t("attempts.date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.items.map((attempt) => (
                    <tr key={attempt.id} className="transition hover:bg-background/60">
                      <td className="px-5 py-4 font-medium text-dark">
                        {attempt.studentName}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                          <Trophy size={14} aria-hidden="true" />
                          {attempt.score}/100
                        </span>
                      </td>
                      <td className="px-5 py-4 text-dark">
                        {result.activityType === "listening"
                          ? `${attempt.correctBlanks ?? 0} de ${attempt.totalBlanks ?? 0}`
                          : `${attempt.wordsFound?.length ?? 0} de ${attempt.totalWords ?? 0}`}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {formatDate(attempt.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.pagination.totalPages > 1 && (
            <nav
              aria-label={t("attempts.pagination")}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) => Math.max(1, current - 1));
                }}
                disabled={page <= 1 || isLoading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                {t("attempts.previous")}
              </button>
              <span className="text-sm text-muted">
                {t("attempts.pageOf", { page: result.pagination.page, total: result.pagination.totalPages })}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) =>
                    Math.min(result.pagination.totalPages, current + 1),
                  );
                }}
                disabled={page >= result.pagination.totalPages || isLoading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("attempts.next")}
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : null}
    </RoleBasedLayout>
  );
}
