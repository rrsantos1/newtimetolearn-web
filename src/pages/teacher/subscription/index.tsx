import { useEffect, useState } from "react";
import axios from "axios";
import { Check, CreditCard, RefreshCw, ShieldCheck, Users, X } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { subscriptionFaq } from "@/modules/faq/data/faqContent";
import {
  teacherSubscriptionService,
} from "@/modules/subscriptions/services/teacherSubscriptionService";
import { useTranslation } from "@/hooks/useTranslation";
import type {
  TeacherEntitlements,
  TeacherSubscriptionStatus,
} from "@/modules/subscriptions/types/teacherSubscription.types";

function getErrorMessage(error: unknown, fallback: string, unexpected: string): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data.error?.message ?? fallback;
  }
  return unexpected;
}

function formatStorage(bytes: number, locale: string): string {
  const gigabyte = 1024 ** 3;
  const megabyte = 1024 ** 2;
  if (bytes >= gigabyte) return `${(bytes / gigabyte).toLocaleString(locale, { maximumFractionDigits: 1 })} GB`;
  return `${(bytes / megabyte).toLocaleString(locale, { maximumFractionDigits: 0 })} MB`;
}

function hasSubscriptionToManage(status: TeacherSubscriptionStatus): boolean {
  return status === "PENDING" || status === "ACTIVE" || status === "PAST_DUE";
}

export default function TeacherSubscriptionPage() {
  const { t, locale } = useTranslation();
  const statusLabels: Record<TeacherSubscriptionStatus, string> = {
    FREE: t("subscription.status.free"),
    PENDING: t("subscription.status.pending"),
    ACTIVE: t("subscription.status.active"),
    PAST_DUE: t("subscription.status.pastDue"),
    CANCELLED: t("subscription.status.cancelled"),
    EXPIRED: t("subscription.status.expired"),
  };
  const [entitlements, setEntitlements] = useState<TeacherEntitlements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadEntitlements(): Promise<void> {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await teacherSubscriptionService.getEntitlements();
      setEntitlements(data);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, t("subscription.error.operation"), t("subscription.error.unexpected")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    teacherSubscriptionService.getEntitlements()
      .then((data) => {
        if (active) setEntitlements(data);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error, t("subscription.error.operation"), t("subscription.error.unexpected")));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  async function handleCheckout(): Promise<void> {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await teacherSubscriptionService.createCheckout();
      window.location.assign(result.checkoutUrl);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  async function handleCancel(): Promise<void> {
    const confirmed = window.confirm(t("subscription.cancelConfirm"));
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await teacherSubscriptionService.cancel();
      setSuccessMessage(t("subscription.cancelSuccess"));
      await loadEntitlements();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const status = entitlements?.subscriptionStatus ?? "FREE";
  const isPaid = entitlements?.planCode === "TEACHER_MONTHLY";
  const canManage = hasSubscriptionToManage(status);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title={t("subscription.title")}
      description={t("subscription.description")}
      backLinkPlacement="title"
    >
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted" role="status">
          {t("subscription.loading")}
        </div>
      ) : (
        <div className="space-y-6">
          {errorMessage && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {errorMessage}
              {!entitlements && (
                <button type="button" onClick={() => void loadEntitlements()} className="ml-2 font-semibold underline underline-offset-2">
                  {t("subscription.retry")}
                </button>
              )}
            </div>
          )}
          {successMessage && (
            <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {successMessage}
            </p>
          )}

          {entitlements && (
            <>
              <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted">{t("subscription.currentPlan")}</p>
                    <h2 className="mt-1 text-2xl font-bold text-dark">{entitlements.planName}</h2>
                    <p className="mt-2 text-sm text-muted">{statusLabels[status]}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>
                    {status === "ACTIVE" ? <Check size={15} aria-hidden="true" /> : <CreditCard size={15} aria-hidden="true" />}
                    {statusLabels[status]}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-medium text-muted">{t("subscription.storage")}</p>
                    <p className="mt-1 text-lg font-bold text-dark">{formatStorage(entitlements.storageLimitBytes, locale)}</p>
                  </div>
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-medium text-muted">{t("subscription.students")}</p>
                    <p className="mt-1 text-lg font-bold text-dark">
                      {entitlements.studentLimit === null ? t("subscription.unlimited") : `${entitlements.reservedStudents} ${t("subscription.of")} ${entitlements.studentLimit}`}
                    </p>
                    {entitlements.studentsRemaining !== null && (
                      <p className="mt-1 text-xs text-muted">{entitlements.studentsRemaining} {t("subscription.spotsAvailable")}</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-medium text-muted">{t("subscription.ads")}</p>
                    <p className="mt-1 text-lg font-bold text-dark">{entitlements.removesAds ? t("subscription.adsRemoved") : t("subscription.adsShown")}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => void handleCancel()}
                      disabled={isSubmitting || !entitlements.paymentIntegrationEnabled}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={17} aria-hidden="true" />
                      {isSubmitting ? t("subscription.processing") : entitlements.paymentIntegrationEnabled ? t("subscription.cancel") : t("subscription.manageUnavailable")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleCheckout()}
                      disabled={isSubmitting || !entitlements.paymentIntegrationEnabled}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ color: "var(--primary-foreground)" }}
                    >
                      <CreditCard size={17} aria-hidden="true" />
                      {isSubmitting ? t("subscription.checkoutPreparing") : entitlements.paymentIntegrationEnabled ? t("subscription.subscribePrice") : t("subscription.comingSoon")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void loadEntitlements()}
                    disabled={isLoading || isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-dark transition hover:bg-background disabled:opacity-60"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                    {t("subscription.refresh")}
                  </button>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <article className={`rounded-2xl border p-5 sm:p-6 ${!isPaid ? "border-primary bg-primary/5" : "border-border bg-surface"}`}>
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-primary" aria-hidden="true" />
                    <h3 className="font-bold text-dark">{t("subscription.free")}</h3>
                    {!isPaid && <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{t("subscription.yourPlan")}</span>}
                  </div>
                  <p className="mt-3 text-2xl font-bold text-dark">{t("subscription.freePrice")}</p>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    <li>{t("subscription.freeStorage")}</li>
                    <li>{t("subscription.freeStudents")}</li>
                    <li>{t("subscription.freeAds")}</li>
                  </ul>
                </article>

                <article className={`rounded-2xl border p-5 sm:p-6 ${isPaid ? "border-primary bg-primary/5" : "border-border bg-surface"}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
                    <h3 className="font-bold text-dark">{t("subscription.teacher")}</h3>
                    {isPaid && <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{t("subscription.yourPlan")}</span>}
                  </div>
                  <p className="mt-3 text-2xl font-bold text-dark">{t("subscription.teacherPrice")}<span className="text-sm font-medium text-muted">{t("subscription.perMonth")}</span></p>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    <li>{t("subscription.paidStorage")}</li>
                    <li>{t("subscription.paidStudents")}</li>
                    <li>{t("subscription.noAds")}</li>
                  </ul>
                </article>
              </section>
            </>
          )}
        </div>
      )}
      <FaqSection title={t("subscription.faqTitle")} description={t("subscription.faqDescription")} items={subscriptionFaq} />
    </RoleBasedLayout>
  );
}
