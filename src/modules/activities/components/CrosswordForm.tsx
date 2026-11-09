import { AiActivitySuggestionsPanel } from "@/modules/activities/components/AiActivitySuggestionsPanel";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { LocalizedErrorMessage } from "@/modules/activities/components/LocalizedErrorMessage";
import {
  Field,
  FieldArray,
  Form,
  Formik,
  getIn,
  useFormikContext,
} from "formik";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { createCrosswordSchema } from "@/modules/activities/schemas/createCrosswordSchema";
import type { CreateCrosswordFormValues } from "@/modules/activities/schemas/createCrosswordSchema";
import type { ActivityDifficulty } from "@/modules/activities/types/activities.types";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<CreateCrosswordFormValues>();
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

interface CrosswordFormProps {
  onSubmit: (values: CreateCrosswordFormValues) => Promise<void>;
  submitError?: string | null;
  initialValues?: CreateCrosswordFormValues;
  mode?: "create" | "edit";
}

const defaultInitialValues: CreateCrosswordFormValues = {
  name: "",
  description: "",
  difficulty: "EASY",
  words: [
    { word: "", clue: "" },
    { word: "", clue: "" },
    { word: "", clue: "" },
  ],
};

const inputClassName =
  "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClassName = "mb-2 block text-sm font-medium text-dark";
const errorClassName = "mt-1 text-sm text-red-600";

export function CrosswordForm({
  onSubmit,
  submitError,
  initialValues = defaultInitialValues,
  mode = "create",
}: Readonly<CrosswordFormProps>) {
  const { t } = useTranslation();
  const difficulties: { value: ActivityDifficulty; label: string }[] = [
    { value: "EASY", label: t("activity.form.easy") },
    { value: "MEDIUM", label: t("activity.form.medium") },
    { value: "HARD", label: t("activity.form.hard") },
  ];
  const isEditing = mode === "edit";
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  return (
    <Formik<CreateCrosswordFormValues>
      initialValues={initialValues}
      enableReinitialize
      validationSchema={createCrosswordSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, values, errors, submitCount }) => (
        <Form noValidate className="space-y-6">
          <ScrollToFirstError />
          <ActivityCoverField />
          <AiActivitySuggestionsPanel activityType="crossword" open={aiSuggestionsOpen} onClose={() => setAiSuggestionsOpen(false)} />
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-dark">{t("activity.form.info")}</h2>
                <button type="button" onClick={() => setAiSuggestionsOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles aria-hidden="true" size={16} />{t("activity.form.createWithAi")}</button>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">
                {t("activity.form.descriptionPlaceholder")}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className={labelClassName}>
                  {t("activity.form.title")} <span className="text-red-600">*</span>
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  maxLength={120}
                  placeholder={t("activity.form.namePlaceholder")}
                  className={inputClassName}
                  aria-required="true"
                  aria-invalid={Boolean(getIn(errors, "name") && submitCount > 0)}
                />
                <LocalizedErrorMessage name="name" component="p" className={errorClassName} />
              </div>

              <div>
                <label htmlFor="description" className={labelClassName}>
                  {t("activity.form.description")}
                </label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows={3}
                  maxLength={2000}
                  placeholder={t("activity.form.descriptionPlaceholder")}
                  className={`${inputClassName} resize-y`}
                />
                <LocalizedErrorMessage name="description" component="p" className={errorClassName} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficulty" className={labelClassName}>
                    {t("activity.form.difficulty")} <span className="text-red-600">*</span>
                  </label>
                  <Field
                    as="select"
                    id="difficulty"
                    name="difficulty"
                    className={inputClassName}
                    aria-required="true"
                  >
                    {difficulties.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Field>
                  <LocalizedErrorMessage name="difficulty" component="p" className={errorClassName} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">{t("activity.form.crosswordAnswers")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {t("activity.form.crosswordHelp")}
              </p>
            </div>

            <FieldArray name="words">
              {({ push, remove }) => (
                <div className="space-y-4">
                  {values.words.map((_, index) => (
                    <fieldset key={index} className="rounded-xl border border-border p-4">
                      <legend className="px-1 text-sm font-semibold text-dark">
                        {t("activity.form.addAnswer")} {index + 1}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-start">
                        <div>
                          <label htmlFor={`words.${index}.word`} className={labelClassName}>
                            {t("activity.form.word")}
                          </label>
                          <Field
                            id={`words.${index}.word`}
                            name={`words.${index}.word`}
                            type="text"
                            maxLength={100}
                            placeholder={t("activity.form.answerPlaceholder")}
                            className={inputClassName}
                            aria-required="true"
                            aria-invalid={Boolean(getIn(errors, `words.${index}.word`) && submitCount > 0)}
                          />
                          <LocalizedErrorMessage name={`words.${index}.word`} component="p" className={errorClassName} />
                        </div>
                        <div>
                          <label htmlFor={`words.${index}.clue`} className={labelClassName}>
                            {t("activity.form.clueLabel")}
                          </label>
                          <Field
                            id={`words.${index}.clue`}
                            name={`words.${index}.clue`}
                            type="text"
                            maxLength={500}
                            placeholder={t("activity.form.cluePlaceholder")}
                            className={inputClassName}
                            aria-required="true"
                            aria-invalid={Boolean(getIn(errors, `words.${index}.clue`) && submitCount > 0)}
                          />
                          <LocalizedErrorMessage name={`words.${index}.clue`} component="p" className={errorClassName} />
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={values.words.length <= 3}
                          aria-label={t("activity.form.removeAnswerLabel", { number: index + 1 })}
                          title={values.words.length <= 3 ? t("activity.form.minimumAnswers") : t("activity.form.removeAnswer")}
                          className="mt-0 flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40 sm:mt-7"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </fieldset>
                  ))}
                  {typeof errors.words === "string" ? (
                    <p className={errorClassName} role="alert">{errors.words}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => push({ word: "", clue: "" })}
                    disabled={values.words.length >= 20}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:border-accent/40 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={17} aria-hidden="true" />
                    {t("activity.form.addAnswer")}
                  </button>
                  <p className="text-xs text-muted">{values.words.length} / 20 {t("activity.form.words")}</p>
                </div>
              )}
            </FieldArray>
          </section>

          {submitError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
                  {isEditing ? t("activity.form.savingChanges") : t("activity.form.creating")}
                </>
              ) : isEditing ? t("activity.form.saveChanges") : t("activity.form.createCrossword")}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
