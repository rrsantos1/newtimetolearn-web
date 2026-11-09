import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { translateValidationMessage } from "@/modules/activities/components/LocalizedErrorMessage";
import Link from "next/link";
import axios from "axios";
import { FieldArray, Form, Formik, getIn, useFormikContext } from "formik";
import { ArrowLeft, CheckCircle2, Plus, Sparkles, Trash2 } from "lucide-react";
import { AiActivitySuggestionsPanel } from "@/modules/activities/components/AiActivitySuggestionsPanel";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { createRouletteSchema, type CreateRouletteFormValues } from "@/modules/activities/schemas/createRouletteSchema";
import { createRouletteService } from "@/modules/activities/services/createRouletteService";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<CreateRouletteFormValues>();
  const [handledSubmitCount, setHandledSubmitCount] = useState(0);

  useEffect(() => {
    if (submitCount <= handledSubmitCount || isValidating || Object.keys(errors).length === 0) return;
    const timeoutId = window.setTimeout(() => {
      const invalidField = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?? document.querySelector<HTMLElement>('[name="name"]');
      invalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
      invalidField?.focus({ preventScroll: true });
      setHandledSubmitCount(submitCount);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [errors, handledSubmitCount, isValidating, submitCount]);

  return null;
}

const initialValues: CreateRouletteFormValues = { name: "", description: "", difficulty: "MEDIUM", content: { topics: [""] } };
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) { const data = error.response?.data as { error?: { message?: string } } | undefined; return data?.error?.message ?? t("activity.creation.error"); }
  return t("activity.creation.unexpectedError");
}
export default function NewRoulettePage() {
  const { t, locale } = useTranslation();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title={t("activity.page.create.roulette")} description={t("activity.page.description.roulette")}>
    {success ? <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center"><CheckCircle2 className="mx-auto size-14 text-green-600" aria-hidden="true" /><h2 className="mt-4 text-2xl font-semibold text-dark">{t("activity.roulette.saved")}</h2><p className="mt-2 text-sm text-muted">{t("activity.page.savedDraft")}</p><Link href="/teacher/activities" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-dark px-5 text-sm font-semibold text-white">{t("activity.page.viewActivities")}</Link></section> : <>
      <Link href="/teacher/activities/new" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm text-muted"><ArrowLeft size={16} aria-hidden="true" />{t("activity.roulette.backFormats")}</Link>
      <Formik initialValues={initialValues} validationSchema={createRouletteSchema} onSubmit={async (values, helpers) => { setSubmitError(""); try { await createRouletteService.execute(values); setSuccess(true); } catch (error: unknown) { setSubmitError(getErrorMessage(error)); } finally { helpers.setSubmitting(false); } }}>
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting, submitCount }) => <Form noValidate className="space-y-6">
          <ScrollToFirstError />
          <AiActivitySuggestionsPanel activityType="roulette" open={aiSuggestionsOpen} onClose={() => setAiSuggestionsOpen(false)} />
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><h2 className="text-lg font-semibold text-dark">{t("activity.roulette.details")}</h2>
            <label htmlFor="roulette-name" className="mt-5 block text-sm font-medium text-dark">{t("activity.form.title")}</label><input id="roulette-name" name="name" value={values.name} onChange={handleChange} maxLength={120} aria-invalid={Boolean(errors.name && submitCount > 0)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />{touched.name && errors.name && <p className="mt-1 text-sm text-red-700">{translateValidationMessage(String(errors.name), locale)}</p>}
            <label htmlFor="roulette-description" className="mt-4 block text-sm font-medium text-dark">{t("activity.roulette.descriptionOptional")}</label><textarea id="roulette-description" name="description" value={values.description} onChange={handleChange} rows={3} maxLength={2000} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm" />
            <label htmlFor="roulette-difficulty" className="mt-4 block text-sm font-medium text-dark">{t("activity.form.difficulty")}</label><select id="roulette-difficulty" name="difficulty" value={values.difficulty} onChange={handleChange} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="EASY">{t("activity.form.easy")}</option><option value="MEDIUM">{t("activity.form.medium")}</option><option value="HARD">{t("activity.form.hard")}</option></select>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold text-dark">{t("activity.roulette.topics")}</h2><button type="button" onClick={() => setAiSuggestionsOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles size={16} aria-hidden="true" />{t("activity.roulette.getAiHelp")}</button></div><p className="mt-1 text-sm text-muted">{t("activity.roulette.topicHelp")}</p></div><span className="text-sm text-muted">{values.content.topics.filter((item) => item.trim()).length}/30</span></div>
            <FieldArray name="content.topics">{({ push, remove }) => <div className="mt-4 space-y-3">{values.content.topics.map((topic, index) => <div key={index} className="flex items-center gap-2"><label htmlFor={`roulette-topic-${index}`} className="sr-only">{t("activity.roulette.topic")} {index + 1}</label><input id={`roulette-topic-${index}`} value={topic} maxLength={100} aria-invalid={Boolean((getIn(errors, `content.topics[${index}]`) || (index === 0 && getIn(errors, "content.topics"))) && submitCount > 0)} onChange={(event) => setFieldValue(`content.topics[${index}]`, event.target.value)} placeholder={`${t("activity.roulette.topic")} ${index + 1}`} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm" /><button type="button" onClick={() => remove(index)} disabled={values.content.topics.length <= 1} aria-label={`${t("activity.roulette.removeTopic")} ${index + 1}`} className="flex size-10 items-center justify-center rounded-xl border border-border text-muted disabled:opacity-40"><Trash2 size={17} aria-hidden="true" /></button></div>)}<button type="button" onClick={() => push("")} disabled={values.content.topics.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-dark disabled:opacity-40"><Plus size={16} aria-hidden="true" />{t("activity.roulette.addTopic")}</button></div>}</FieldArray>
            {typeof errors.content === "object" && errors.content !== null && "topics" in errors.content && typeof errors.content.topics === "string" && <p className="mt-2 text-sm text-red-700">{translateValidationMessage(String(errors.content.topics), locale)}</p>}
          </section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{submitError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-dark px-6 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? t("activity.roulette.saving") : t("activity.roulette.save")}</button></div>
        </Form>}
      </Formik>
    </>}
  </RoleBasedLayout>;
}
