import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { FieldArray, Form, Formik } from "formik";
import { ArrowLeft, CheckCircle2, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { createRouletteSchema, type CreateRouletteFormValues } from "@/modules/activities/schemas/createRouletteSchema";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";
import api from "@/lib/api";

interface EditableRouletteActivity {
  slug: string;
  type: string;
  version: { name: string; description: string | null; difficulty: CreateRouletteFormValues["difficulty"]; status: string; reviewFeedback: string | null; content: { topics: string[] } };
}
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) { const data = error.response?.data as { error?: { message?: string } } | undefined; return data?.error?.message ?? "Não foi possível atualizar a roleta."; }
  return "Ocorreu um erro inesperado.";
}
export default function EditRoulettePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activity, setActivity] = useState<EditableRouletteActivity | null>(null);
  const [initialValues, setInitialValues] = useState<CreateRouletteFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!router.isReady) return;
    const slug = typeof router.query.slug === "string" ? router.query.slug : "";
    let active = true;
    void (async () => {
      if (!slug) { setError("Não foi possível identificar a atividade."); setLoading(false); return; }
      try {
        const response = await api.get<{ success: true; data: EditableRouletteActivity }>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        const loaded = response.data.data;
        if (loaded.type !== "roulette") { setError("Esta atividade não é uma Roleta."); return; }
        setActivity(loaded);
        setInitialValues({ name: loaded.version.name, description: loaded.version.description ?? "", difficulty: loaded.version.difficulty, content: { topics: [...loaded.version.content.topics] } });
      } catch (cause: unknown) { if (active) setError(getErrorMessage(cause)); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [router.isReady, router.query.slug]);
  async function handleSubmit(values: CreateRouletteFormValues): Promise<void> {
    if (!activity) return;
    setSubmitError(""); setNotice("");
    try {
      const response = await api.patch<{ success: true; data: { version: { status: string } } }>(`/activities/${encodeURIComponent(activity.slug)}/roulette`, {
        name: values.name.trim(), description: values.description.trim() || null, difficulty: values.difficulty, content: { topics: values.content.topics.map((topic) => topic.trim()) },
      });
      setInitialValues(values);
      setActivity((current) => current ? { ...current, version: { ...current.version, ...values, status: response.data.data.version.status, reviewFeedback: null } } : current);
      setNotice(t("activity.page.updatedTitle"));
    } catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
  }
  async function handleResubmit(): Promise<void> {
    if (!activity || submitting) return;
    setSubmitting(true); setSubmitError("");
    try { await submitActivityVersionService.execute(activity.slug); setActivity((current) => current ? { ...current, version: { ...current.version, status: "PENDING_REVIEW", reviewFeedback: null } } : current); setNotice(t("activity.page.resubmitSuccess")); }
    catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
    finally { setSubmitting(false); }
  }
  const canSubmit = activity !== null && ["DRAFT", "REJECTED", "CHANGES_REQUESTED"].includes(activity.version.status);
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title={t("activity.page.edit.roulette")} description={t("activity.page.editDescription.roulette")}>
    <div className="mb-6"><Link href="/teacher/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted"><ArrowLeft size={16} aria-hidden="true" />{t("activity.page.backActivities")}</Link></div>
    {loading ? <div role="status" className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-border bg-surface"><LoaderCircle size={20} className="animate-spin" />{t("activity.page.loading")}</div>
    : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
    : activity && initialValues ? <>
      {notice && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 size={18} aria-hidden="true" />{notice}</p>}
      {activity.version.reviewFeedback && <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-amber-900">{t("activity.roulette.reviewNotes")}</h2><p className="mt-2 whitespace-pre-wrap text-sm text-amber-800">{activity.version.reviewFeedback}</p></section>}
      <Formik initialValues={initialValues} enableReinitialize validationSchema={createRouletteSchema} onSubmit={async (values, helpers) => { await handleSubmit(values); helpers.setSubmitting(false); }}>
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => <Form className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><h2 className="text-lg font-semibold text-dark">{t("activity.roulette.details")}</h2>
            <label htmlFor="roulette-name" className="mt-5 block text-sm font-medium text-dark">{t("activity.form.title")}</label><input id="roulette-name" name="name" value={values.name} onChange={handleChange} maxLength={120} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />{touched.name && errors.name && <p className="mt-1 text-sm text-red-700">{errors.name}</p>}
            <label htmlFor="roulette-description" className="mt-4 block text-sm font-medium text-dark">{t("activity.roulette.descriptionOptional")}</label><textarea id="roulette-description" name="description" value={values.description} onChange={handleChange} rows={3} maxLength={2000} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm" />
            <label htmlFor="roulette-difficulty" className="mt-4 block text-sm font-medium text-dark">{t("activity.form.difficulty")}</label><select id="roulette-difficulty" name="difficulty" value={values.difficulty} onChange={handleChange} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="EASY">{t("activity.form.easy")}</option><option value="MEDIUM">{t("activity.form.medium")}</option><option value="HARD">{t("activity.form.hard")}</option></select>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-dark">{t("activity.roulette.topics")}</h2><p className="mt-1 text-sm text-muted">{t("activity.roulette.topicHelpEdit")}</p></div><span className="text-sm text-muted">{values.content.topics.length}/30</span></div>
            <FieldArray name="content.topics">{({ push, remove }) => <div className="mt-4 space-y-3">{values.content.topics.map((topic, index) => <div key={index} className="flex items-center gap-2"><label htmlFor={`roulette-topic-${index}`} className="sr-only">{t("activity.roulette.topic")} {index + 1}</label><input id={`roulette-topic-${index}`} value={topic} maxLength={100} onChange={(event) => setFieldValue(`content.topics[${index}]`, event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm" /><button type="button" onClick={() => remove(index)} disabled={values.content.topics.length <= 1} aria-label={`${t("activity.roulette.removeTopic")} ${index + 1}`} className="flex size-10 items-center justify-center rounded-xl border border-border text-muted disabled:opacity-40"><Trash2 size={17} aria-hidden="true" /></button></div>)}<button type="button" onClick={() => push("")} disabled={values.content.topics.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-dark disabled:opacity-40"><Plus size={16} aria-hidden="true" />{t("activity.roulette.addTopic")}</button></div>}</FieldArray>
            {typeof errors.content === "object" && errors.content !== null && "topics" in errors.content && typeof errors.content.topics === "string" && <p className="mt-2 text-sm text-red-700">{errors.content.topics}</p>}
          </section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{submitError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-dark px-6 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? t("activity.page.saving") : t("activity.roulette.saveChanges")}</button></div>
        </Form>}
      </Formik>
      {canSubmit && <section className="mt-6 rounded-2xl border border-border bg-surface p-5"><h2 className="font-semibold text-dark">Enviar para aprovação</h2><p className="mt-1 text-sm text-muted">Salve as alterações antes de enviar a versão para análise administrativa.</p><button type="button" onClick={() => void handleResubmit()} disabled={submitting} className="mt-4 min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? t("activity.page.saving") : t("activity.page.sendApproval")}</button></section>}
    </> : null}
  </RoleBasedLayout>;
}
