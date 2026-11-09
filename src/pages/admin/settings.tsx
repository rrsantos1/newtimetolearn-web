import { useState } from "react";
import axios from "axios";
import { AlertTriangle, ArrowLeft, CheckCircle2, HardDrive, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

interface CleanupResult {
  scanned: number;
  referenced: number;
  deleted: number;
  skippedRecent: number;
  eligibleForDeletion: number;
  dryRun: boolean;
}

interface CleanupResponse {
  success: true;
  data: CleanupResult;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? fallback;
  }
  return fallback;
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function runCleanup(confirmDeletion: boolean): Promise<void> {
    if (loading) return;

    if (confirmDeletion) {
      const confirmed = window.confirm(
        t("adminSettings.deleteConfirm"),
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.post<CleanupResponse>(
        "/activities/media-library/cleanup-orphans",
        confirmDeletion ? { confirm: true } : {},
      );
      setResult(response.data.data);
      setSuccessMessage(
        confirmDeletion
          ? t("adminSettings.cleanupSuccess")
          : t("adminSettings.checkSuccess"),
      );
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, t("adminSettings.operationError")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <RoleBasedLayout
      area="admin"
      allowedRoles={["ADMIN"]}
      title={t("adminSettings.title")}
      description={t("adminSettings.description")}
    >
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t("adminSettings.back")}
        </Link>
      </div>

      {successMessage && (
        <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {errorMessage}
        </p>
      )}

      <section className="max-w-3xl rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <HardDrive size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-dark">{t("adminSettings.cleanupTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {t("adminSettings.cleanupDescription")}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2 text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-6">
              {t("adminSettings.cleanupWarning")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void runCleanup(false)}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} aria-hidden="true" className={loading ? "animate-spin" : undefined} />
            {loading ? t("adminSettings.checking") : t("adminSettings.checkFiles")}
          </button>
          {result?.dryRun && result.eligibleForDeletion > 0 && (
            <button
              type="button"
              onClick={() => void runCleanup(true)}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} aria-hidden="true" />
              {loading ? t("adminSettings.processing") : t("adminSettings.deleteFiles", { count: result.eligibleForDeletion })}
            </button>
          )}
        </div>

        {result && (
          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" aria-hidden="true" />
              <h3 className="font-semibold text-dark">
                {result.dryRun ? t("adminSettings.checkResult") : t("adminSettings.cleanupResult")}
              </h3>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                [t("adminSettings.scanned"), result.scanned],
                [t("adminSettings.referenced"), result.referenced],
                [t("adminSettings.eligible"), result.eligibleForDeletion],
                [t("adminSettings.preservedRecent"), result.skippedRecent],
                ...(!result.dryRun ? [[t("adminSettings.deleted"), result.deleted] as [string, number]] : []),
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-background p-4">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-dark">{value}</dd>
                </div>
              ))}
            </dl>
            {result.dryRun && result.eligibleForDeletion === 0 && (
              <p className="mt-4 text-sm text-muted">{t("adminSettings.noneEligible")}</p>
            )}
          </div>
        )}
      </section>
    </RoleBasedLayout>
  );
}
