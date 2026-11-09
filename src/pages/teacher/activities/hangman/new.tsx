import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { HangmanForm } from "@/modules/activities/components/HangmanForm";
import { createHangmanService } from "@/modules/activities/services/createHangmanService";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import { updateHangmanWordImageService } from "@/modules/activities/services/updateHangmanWordImageService";
import type { CreateHangmanFormValues } from "@/modules/activities/schemas/createHangmanSchema";

function getErrorMessage(error: unknown, t: (key: TranslationKey) => string): string {
  if (axios.isAxiosError(error)) { const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined; return data?.error?.message ?? data?.message ?? t("activity.creation.error"); }
  return t("activity.creation.unexpectedError");
}
export default function NewHangmanPage() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function handleSubmit(values: CreateHangmanFormValues): Promise<void> {
    setSubmitError("");
    try {
      const result = await createHangmanService.execute(values);
      if (values.coverMediaAssetId) await activityCoverService.update(result.activity.slug, values.coverMediaAssetId);
      for (const word of values.content.words) {
        if (word.coverMediaAssetId) {
          await updateHangmanWordImageService.execute(result.activity.slug, word.id, word.coverMediaAssetId);
        }
      }
      setSuccess(true);
    }
    catch (error: unknown) { setSubmitError(getErrorMessage(error, t)); }
  }
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title={t("activity.page.create.hangman")} description={t("activity.page.description.hangman")}>
    {success ? <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8"><CheckCircle2 aria-hidden="true" className="mx-auto mb-4 size-14 text-green-600" /><h2 className="text-2xl font-semibold text-dark">{t("activity.page.savedTitle")}</h2><p className="mt-3 text-sm text-muted">{t("activity.page.savedDraft")}</p><Link href="/teacher/activities" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white" style={{ color: "var(--primary-foreground)" }}><ClipboardList size={18} aria-hidden="true" />{t("activity.page.viewActivities")}</Link></section> : <><div className="mb-6"><Link href="/teacher/activities/new" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted"><ArrowLeft size={16} aria-hidden="true" />{t("activity.page.backToFormats")}</Link></div><HangmanForm onSubmit={handleSubmit} submitError={submitError} /></>}
  </RoleBasedLayout>;
}
