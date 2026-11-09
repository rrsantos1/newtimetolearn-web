import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { LocalizedErrorMessage } from "@/modules/activities/components/LocalizedErrorMessage";
import { Field, FieldArray, Form, Formik, getIn, useFormikContext } from "formik";
import { Plus, Trash2 } from "lucide-react";
import { createMoleHitSchema, type CreateMoleHitFormValues } from "@/modules/activities/schemas/createMoleHitSchema";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { MoleHitAiSuggestionsPanel } from "@/modules/activities/components/MoleHitAiSuggestionsPanel";

interface Props {
  onSubmit: (values: CreateMoleHitFormValues) => Promise<void>;
  submitError: string;
  initialValues?: CreateMoleHitFormValues;
  submitLabel?: string;
}

const defaultInitialValues: CreateMoleHitFormValues = {
  name: "",
  description: "",
  difficulty: "EASY",
  content: { holeCount: 6, correctOptions: ["", ""], incorrectOptions: ["", ""] },
};
const inputClassName = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClassName = "mb-2 block text-sm font-medium text-dark";
const errorClassName = "mt-1 text-sm text-red-600";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<CreateMoleHitFormValues>();
  const [handledSubmitCount, setHandledSubmitCount] = useState(0);
  useEffect(() => {
    if (submitCount <= handledSubmitCount || isValidating || Object.keys(errors).length === 0) return;
    const timeoutId = window.setTimeout(() => {
      const invalidField = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      invalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
      invalidField?.focus({ preventScroll: true });
      setHandledSubmitCount(submitCount);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [errors, handledSubmitCount, isValidating, submitCount]);
  return null;
}

export function MoleHitForm({ onSubmit, submitError, initialValues = defaultInitialValues, submitLabel }: Readonly<Props>) {
  const { t } = useTranslation();
  const effectiveSubmitLabel = submitLabel ?? t("activity.form.create");
  return (
    <Formik<CreateMoleHitFormValues>
      initialValues={initialValues}
      enableReinitialize
      validationSchema={createMoleHitSchema}
      onSubmit={(values) => onSubmit({
        ...values,
        content: {
          holeCount: values.content.holeCount,
          correctOptions: values.content.correctOptions.map((option) => option.trim()).filter(Boolean),
          incorrectOptions: values.content.incorrectOptions.map((option) => option.trim()).filter(Boolean),
        },
      })}
    >
      {({ isSubmitting, values, errors, submitCount, setFieldValue }) => (
        <Form noValidate className="space-y-6">
          <ScrollToFirstError />
          <ActivityCoverField />
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">{t("activity.form.info")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{t("activity.form.descriptionPlaceholder")}</p>
            </div>
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className={labelClassName}>{t("activity.form.title")} <span className="text-red-600">*</span></label>
                <Field id="name" name="name" type="text" maxLength={120} placeholder={t("activity.ai.topicPlaceholder")} className={inputClassName} aria-required="true" aria-invalid={Boolean(getIn(errors, "name") && submitCount > 0)} />
                <LocalizedErrorMessage name="name" component="p" className={errorClassName} />
              </div>
              <div>
                <label htmlFor="description" className={labelClassName}>{t("activity.form.description")}</label>
                <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} placeholder={t("activity.form.descriptionPlaceholder")} className={inputClassName} />
                <LocalizedErrorMessage name="description" component="p" className={errorClassName} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficulty" className={labelClassName}>{t("activity.form.defaultDifficulty")} <span className="text-red-600">*</span></label>
                  <Field as="select" id="difficulty" name="difficulty" className={inputClassName} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    const difficulty = event.target.value as CreateMoleHitFormValues["difficulty"];
                    void setFieldValue("difficulty", difficulty);
                    void setFieldValue("content.holeCount", difficulty === "EASY" ? 6 : difficulty === "MEDIUM" ? 9 : 12);
                  }}>
                    <option value="EASY">{t("activity.form.easy")}</option><option value="MEDIUM">{t("activity.form.medium")}</option><option value="HARD">{t("activity.form.hard")}</option>
                  </Field>
                  <p className="mt-1 text-xs text-muted">{t("activity.form.difficultyHelp")}</p>
                </div>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">{t("activity.form.challengeOptions")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{t("activity.form.challengeHelp")}</p>
            </div>
            <div className="mb-5"><MoleHitAiSuggestionsPanel /></div>
            <div className="grid gap-6 lg:grid-cols-2">
              <FieldArray name="content.correctOptions">
                {({ push, remove }) => (
                  <div className="space-y-3">
                    <div><h3 className="text-sm font-semibold text-emerald-800">{t("activity.form.correctOptions")} <span className="text-red-600">*</span></h3><p className="mt-1 text-xs text-muted">{t("activity.form.correctItemsHelp")}</p></div>
                    {values.content.correctOptions.map((_, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <label htmlFor={`content.correctOptions.${index}`} className="sr-only">{t("activity.form.correctOptions")} {index + 1}</label>
                          <Field id={`content.correctOptions.${index}`} name={`content.correctOptions.${index}`} maxLength={80} placeholder={`${t("activity.form.correctOptions")} ${index + 1}`} className={inputClassName} aria-invalid={Boolean(getIn(errors, `content.correctOptions.${index}`) && submitCount > 0)} />
                          <LocalizedErrorMessage name={`content.correctOptions.${index}`} component="p" className={errorClassName} />
                        </div>
                        <button type="button" onClick={() => remove(index)} disabled={values.content.correctOptions.length <= 2} aria-label={`${t("activity.form.removeCorrectOption")} ${index + 1}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={18} aria-hidden="true" /></button>
                      </div>
                    ))}
                    <LocalizedErrorMessage name="content.correctOptions" component="p" className={errorClassName} />
                    <button type="button" onClick={() => push("")} disabled={values.content.correctOptions.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:border-accent/40 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Plus size={17} aria-hidden="true" />{t("activity.form.addOption")}</button>
                    <p className="text-xs text-muted">{values.content.correctOptions.length} / 30 {t("activity.form.correctOptions")}</p>
                  </div>
                )}
              </FieldArray>
              <FieldArray name="content.incorrectOptions">
                {({ push, remove }) => (
                  <div className="space-y-3">
                    <div><h3 className="text-sm font-semibold text-red-800">{t("activity.form.incorrectOptions")} <span className="text-red-600">*</span></h3><p className="mt-1 text-xs text-muted">{t("activity.form.incorrectItemsHelp")}</p></div>
                    {values.content.incorrectOptions.map((_, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <label htmlFor={`content.incorrectOptions.${index}`} className="sr-only">{t("activity.form.incorrectOptions")} {index + 1}</label>
                          <Field id={`content.incorrectOptions.${index}`} name={`content.incorrectOptions.${index}`} maxLength={80} placeholder={`${t("activity.form.incorrectOptions")} ${index + 1}`} className={inputClassName} aria-invalid={Boolean(getIn(errors, `content.incorrectOptions.${index}`) && submitCount > 0)} />
                          <LocalizedErrorMessage name={`content.incorrectOptions.${index}`} component="p" className={errorClassName} />
                        </div>
                        <button type="button" onClick={() => remove(index)} disabled={values.content.incorrectOptions.length <= 2} aria-label={`${t("activity.form.removeIncorrectOption")} ${index + 1}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={18} aria-hidden="true" /></button>
                      </div>
                    ))}
                    <LocalizedErrorMessage name="content.incorrectOptions" component="p" className={errorClassName} />
                    <button type="button" onClick={() => push("")} disabled={values.content.incorrectOptions.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:border-accent/40 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Plus size={17} aria-hidden="true" />{t("activity.form.addOption")}</button>
                    <p className="text-xs text-muted">{values.content.incorrectOptions.length} / 30 {t("activity.form.incorrectOptions")}</p>
                  </div>
                )}
              </FieldArray>
            </div>
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>{t("activity.form.attention")}</strong></p>
          </section>
          {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? t("activity.form.saving") : effectiveSubmitLabel}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
