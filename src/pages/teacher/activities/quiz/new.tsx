import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { QuizForm } from "@/modules/activities/components/QuizForm";
import { createQuizService } from "@/modules/activities/services/createQuizService";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? t("activity.creation.error");
  }
  return t("activity.creation.unexpectedError");
}

export default function NewQuizPage() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(values: CreateQuizFormValues): Promise<void> {
    setSubmitError("");
    try {
      const result = await createQuizService.execute(values);
      const coverId = (values as CreateQuizFormValues & { coverMediaAssetId?: string | null }).coverMediaAssetId;
      if (coverId) await activityCoverService.update(result.activity.slug, coverId);
      setSuccess(true);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error));
    }
  }

  return (
    <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title={t("activity.page.create.quiz")}
      description={t("activity.page.description.quiz")}>
      {success ? (
        <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8" aria-labelledby="quiz-created-title">
          <CheckCircle2 aria-hidden="true" className="mx-auto mb-4 size-14 text-green-600" />
          <h2 id="quiz-created-title" className="text-2xl font-semibold text-dark">{t("activity.page.savedTitle")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{t("activity.page.savedDraft")}</p>
          <Link href="/teacher/activities" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
            <ClipboardList aria-hidden="true" size={18} /> {t("activity.page.viewActivities")}
          </Link>
        </section>
      ) : (
        <>
          <div className="mb-6">
            <Link href="/teacher/activities/new" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              <ArrowLeft aria-hidden="true" size={16} /> {t("activity.page.backToFormats")}
            </Link>
          </div>
          <QuizForm onSubmit={handleSubmit} submitError={submitError} />
        </>
      )}
    </RoleBasedLayout>
  );
}
