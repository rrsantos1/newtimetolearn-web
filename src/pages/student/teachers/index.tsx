import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Check, Clock, GraduationCap, X } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { studentFaq, studentFaqEn } from "@/modules/faq/data/faqContent";
import {
  cancelInvitation,
  listStudentRelationships,
  respondToInvitation,
} from "@/modules/teacher-students/services/teacherStudentService";
import type {
  TeacherStudentRelationship,
  TeacherStudentStatus,
} from "@/modules/teacher-students/types/teacherStudent.types";
import { useTranslation } from "@/hooks/useTranslation";

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data.error?.message ?? fallback;
  }
  return fallback;
}

export default function StudentTeachersPage() {
  const { t, locale } = useTranslation();
  const statusLabels: Record<TeacherStudentStatus, string> = {
    PENDING: t("studentTeachers.statusPending"),
    ACTIVE: t("studentTeachers.statusActive"),
    REJECTED: t("studentTeachers.statusRejected"),
    CANCELLED: t("studentTeachers.statusCancelled"),
  };
  const [relationships, setRelationships] = useState<TeacherStudentRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState("");

  const loadRelationships = useCallback(async () => {
    setIsLoading(true);
    setNotice("");
    try {
      setRelationships(await listStudentRelationships());
    } catch (error: unknown) {
      setNotice(getErrorMessage(error, t("studentTeachers.operationError")));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    async function fetchRelationships(): Promise<void> {
      try {
        const data = await listStudentRelationships();
        if (isMounted) setRelationships(data);
      } catch (error: unknown) {
        if (isMounted) setNotice(getErrorMessage(error, t("studentTeachers.operationError")));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void fetchRelationships();

    return () => {
      isMounted = false;
    };
  }, [t]);

  async function handleResponse(relationshipId: string, accept: boolean) {
    setBusyId(relationshipId);
    setNotice("");
    setSuccess("");
    try {
      await respondToInvitation(relationshipId, accept);
      setSuccess(accept ? t("studentTeachers.acceptSuccess") : t("studentTeachers.rejectSuccess"));
      await loadRelationships();
    } catch (error: unknown) {
      setNotice(getErrorMessage(error, t("studentTeachers.operationError")));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(relationshipId: string) {
    setBusyId(relationshipId);
    setNotice("");
    try {
      await cancelInvitation(relationshipId, "student");
      setSuccess(t("studentTeachers.cancelSuccess"));
      await loadRelationships();
    } catch (error: unknown) {
      setNotice(getErrorMessage(error, t("studentTeachers.operationError")));
    } finally {
      setBusyId(null);
    }
  }

  const active = relationships.filter((item) => item.status === "ACTIVE");
  const pending = relationships.filter((item) => item.status === "PENDING");
  const history = relationships.filter((item) => item.status === "REJECTED" || item.status === "CANCELLED");

  return (
    <RoleBasedLayout
      area="student"
      allowedRoles={["STUDENT"]}
      title={t("studentTeachers.title")}
      description={t("studentTeachers.description")}
    >
      {notice && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{notice}</p>}
      {success && <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{success}</p>}

      {isLoading ? (
        <p className="text-sm text-muted">{t("studentTeachers.loading")}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-semibold text-dark">{t("studentTeachers.receivedInvitations")}</h2>
            {pending.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
                <Clock className="mx-auto text-muted" size={26} aria-hidden="true" />
                <p className="mt-3 text-sm text-muted">{t("studentTeachers.noPendingInvitations")}</p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {pending.map((relationship) => (
                  <article key={relationship.id} className="py-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <GraduationCap size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-dark">{relationship.teacher.name}</h3>
                        <p className="text-sm text-muted">{relationship.teacher.email}</p>
                        <p className="mt-1 text-xs text-amber-700">{statusLabels[relationship.status]}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={busyId === relationship.id} onClick={() => void handleResponse(relationship.id, true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60" style={{ color: "var(--primary-foreground)" }}>
                        <Check size={16} aria-hidden="true" /> {t("studentTeachers.accept")}
                      </button>
                      <button type="button" disabled={busyId === relationship.id} onClick={() => void handleResponse(relationship.id, false)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-dark hover:bg-background disabled:opacity-60">
                        <X size={16} aria-hidden="true" /> {t("studentTeachers.reject")}
                      </button>
                      <button type="button" disabled={busyId === relationship.id} onClick={() => void handleCancel(relationship.id)} className="min-h-10 px-2 text-sm text-muted underline-offset-4 hover:underline disabled:opacity-60">
                        {t("studentTeachers.cancel")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-semibold text-dark">{t("studentTeachers.currentTeacher")}</h2>
            {active.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{t("studentTeachers.noCurrentTeacher")}</p>
            ) : (
              active.map((relationship) => (
                <article key={relationship.id} className="mt-4 rounded-xl bg-green-50 p-4">
                  <h3 className="font-semibold text-green-900">{relationship.teacher.name}</h3>
                  <p className="mt-1 text-sm text-green-800">{relationship.teacher.email}</p>
                  <span className="mt-3 inline-block rounded-full bg-white px-2.5 py-1 text-xs font-medium text-green-700">{statusLabels[relationship.status]}</span>
                  <Link
                    href="/student/notebook"
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:opacity-90"
                    style={{ color: "var(--primary-foreground)" }}
                  >
                    {t("studentTeachers.openNotebook")}
                  </Link>
                </article>
              ))
            )}
            {history.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-dark">{t("studentTeachers.history")}</h3>
                {history.map((relationship) => (
                  <div key={relationship.id} className="flex items-center justify-between gap-2 py-3">
                    <span className="text-sm text-muted">{relationship.teacher.name}</span>
                    <span className="text-xs text-muted">{statusLabels[relationship.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      <FaqSection title={t("studentTeachers.faqTitle")} description={t("studentTeachers.faqDescription")} items={locale === "pt-BR" ? studentFaq : studentFaqEn} />
    </RoleBasedLayout>
  );
}
