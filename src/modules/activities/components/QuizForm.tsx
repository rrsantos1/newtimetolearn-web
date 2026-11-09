import { AiActivitySuggestionsPanel } from "@/modules/activities/components/AiActivitySuggestionsPanel";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { LocalizedErrorMessage } from "@/modules/activities/components/LocalizedErrorMessage";
import { Field, FieldArray, Form, Formik, getIn, useFormikContext } from "formik";
import { Eye, Plus, Sparkles, Trash2, X } from "lucide-react";
import { createQuizSchema } from "@/modules/activities/schemas/createQuizSchema";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<CreateQuizFormValues>();
  const [handledSubmitCount, setHandledSubmitCount] = useState(0);

  useEffect(() => {
    if (submitCount <= handledSubmitCount || isValidating || Object.keys(errors).length === 0) return;

    const timeoutId = window.setTimeout(() => {
      const invalidField = document.querySelector<HTMLElement>(
        'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"], button[aria-invalid="true"]',
      );
      const invalidGroup = document.querySelector<HTMLElement>('fieldset[aria-invalid="true"]');
      const target = invalidField ?? invalidGroup?.querySelector<HTMLElement>("input, textarea, select, button");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
      setHandledSubmitCount(submitCount);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [errors, handledSubmitCount, isValidating, submitCount]);

  return null;
}

interface QuizFormProps {
  onSubmit: (values: CreateQuizFormValues) => Promise<void>;
  submitError?: string;
  initialValues?: CreateQuizFormValues;
  submitLabel?: string;
}

const inputClassName = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClassName = "mb-2 block text-sm font-medium text-dark";

type QuizImageValue = {
  storageKey: string;
  altText: string;
  publicUrl?: string;
};

function createId(): string {
  return globalThis.crypto.randomUUID();
}

function createOption(index: number, alternativeLabel: string) {
  return { id: createId(), text: `${alternativeLabel} ${index + 1}` };
}

function createQuestion(alternativeLabel: string) {
  const options = [createOption(0, alternativeLabel), createOption(1, alternativeLabel), createOption(2, alternativeLabel), createOption(3, alternativeLabel)];
  return {
    id: createId(),
    statement: "",
    images: [] as { storageKey: string; altText: string }[],
    options,
    correctOptionId: options[0].id,
    explanation: "",
  };
}

export function QuizForm({ onSubmit, submitError, initialValues: suppliedInitialValues, submitLabel }: Readonly<QuizFormProps>) {
  const { t } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const defaultInitialValues = useMemo<CreateQuizFormValues>(() => ({
    name: "",
    description: "",
    difficulty: "EASY",
    content: { questions: [createQuestion(t("activity.form.alternative"))] },
  }), [t]);
  const formInitialValues = suppliedInitialValues ?? defaultInitialValues;

  return (
    <Formik<CreateQuizFormValues>
      initialValues={formInitialValues}
      enableReinitialize
      validationSchema={createQuizSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, submitCount, isSubmitting, setFieldValue }) => {
        const fieldClassName = (path: string) => {
          const hasError = Boolean(getIn(errors, path));
          const shouldShowError = Boolean(getIn(touched, path)) || submitCount > 0;
          return hasError && shouldShowError
            ? `${inputClassName} border-red-500 focus:border-red-500 focus:ring-red-500/20`
            : inputClassName;
        };

        return (
        <Form className="space-y-6" noValidate>
          <AiActivitySuggestionsPanel activityType="quiz" open={aiSuggestionsOpen} onClose={() => setAiSuggestionsOpen(false)} />
          <ScrollToFirstError />
          <ActivityCoverField />
          <div className="flex justify-end">
            <button type="button" onClick={() => setPreviewOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              <Eye aria-hidden="true" size={17} /> {t("activity.form.previewQuiz")}
            </button>
          </div>
          {previewOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="quiz-preview-title">
              <section className="mx-auto my-4 max-w-4xl rounded-2xl bg-surface p-5 shadow-xl sm:my-8 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("activity.form.teacherPreview")}</p>
                    <h2 id="quiz-preview-title" className="mt-2 text-2xl font-bold text-dark">{values.name.trim() || t("activity.form.quizNoTitle")}</h2>
                    {values.description?.trim() && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{values.description}</p>}
                  </div>
                  <button type="button" onClick={() => setPreviewOpen(false)} aria-label={t("activity.form.closePreview")} className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    <X aria-hidden="true" size={18} />
                  </button>
                </div>
                <div className="mt-6 space-y-5">
                  {values.content.questions.map((question, questionIndex) => (
                    <article key={question.id} className="rounded-xl border border-border p-4 sm:p-5">
                      <h3 className="text-sm font-semibold text-muted">{t("activity.form.question")} {questionIndex + 1}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-dark">{question.statement || t("activity.form.statementEmpty")}</p>
                      {question.images.length > 0 && <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{question.images.map((image, index) => {
                        const imageUrl = resolveImageUrl(image);
                        return imageUrl ? <div key={image.storageKey} className="relative aspect-video overflow-hidden rounded-xl bg-background"><Image src={imageUrl} alt={image.altText || `${t("activity.form.statementImage")} ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain" /></div> : null;
                      })}</div>}
                      <ol className="mt-4 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <li key={option.id} className={`rounded-xl border p-3 text-sm ${question.correctOptionId === option.id ? "border-green-500 bg-green-50 text-green-900" : "border-border text-dark"}`}>
                            <span className="mr-2 font-semibold">{String.fromCharCode(65 + optionIndex)}.</span>
                            {option.text?.trim() || t("activity.form.emptyAlternative")}
                            {question.correctOptionId === option.id && <span className="ml-2 font-semibold">— {t("activity.form.correctAnswer")}</span>}
                          </li>
                        ))}
                      </ol>
                      {question.explanation?.trim() && <p className="mt-4 rounded-lg bg-background p-3 text-sm leading-6 text-muted"><strong>{t("activity.form.explanation")}:</strong> {question.explanation}</p>}
                    </article>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={() => setPreviewOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>{t("activity.form.backToEditing")}</button>
                </div>
              </section>
            </div>
          )}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-dark">{t("activity.form.quizInfo")}</h2><button type="button" onClick={() => setAiSuggestionsOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles aria-hidden="true" size={16} /> {t("activity.form.createWithAi")}</button></div>
            <div className="mt-5 grid gap-5">
              <div>
                <label htmlFor="name" className={labelClassName}>{t("activity.form.quizName")} *</label>
                <Field id="name" name="name" maxLength={120} className={fieldClassName("name")} aria-required="true" aria-invalid={Boolean(getIn(errors, "name") && (getIn(touched, "name") || submitCount > 0))} />
                <LocalizedErrorMessage name="name" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label htmlFor="description" className={labelClassName}>{t("activity.form.description")}</label>
                <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={fieldClassName("description")} aria-invalid={Boolean(getIn(errors, "description") && (getIn(touched, "description") || submitCount > 0))} />
                <LocalizedErrorMessage name="description" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficulty" className={labelClassName}>{t("activity.form.difficulty")}</label>
                  <Field as="select" id="difficulty" name="difficulty" className={inputClassName}>
                    <option value="EASY">{t("activity.form.easy")}</option>
                    <option value="MEDIUM">{t("activity.form.medium")}</option>
                    <option value="HARD">{t("activity.form.hard")}</option>
                  </Field>
                </div>
              </div>
            </div>
          </section>

          <FieldArray name="content.questions">
            {({ push, remove }) => (
              <div className="space-y-5">
                {values.content.questions.map((question, questionIndex) => (
                  <section key={question.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-dark">{t("activity.form.question")} {questionIndex + 1}</h2>
                      <button type="button" onClick={() => remove(questionIndex)} disabled={values.content.questions.length <= 1}
                        aria-label={`${t("activity.form.removeQuestion")} ${questionIndex + 1}`} title={t("activity.form.removeQuestion")}
                        className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </div>
                    <div>
                      <label htmlFor={`content.questions.${questionIndex}.statement`} className={labelClassName}>{t("activity.form.statementLabel")} *</label>
                      <Field as="textarea" id={`content.questions.${questionIndex}.statement`} name={`content.questions.${questionIndex}.statement`} rows={3} maxLength={2000} className={fieldClassName(`content.questions.${questionIndex}.statement`)} aria-required="true" aria-invalid={Boolean(getIn(errors, `content.questions.${questionIndex}.statement`) && (getIn(touched, `content.questions.${questionIndex}.statement`) || submitCount > 0))} />
                      <LocalizedErrorMessage name={`content.questions.${questionIndex}.statement`} component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                    <ImageAttachments
                      idPrefix={`question-${question.id}-images`}
                      label={t("activity.form.statementImages")}
                      images={question.images}
                      onChange={(images) => void setFieldValue(`content.questions.${questionIndex}.images`, images)}
                    />

                    <FieldArray name={`content.questions.${questionIndex}.options`}>
                      {({ push: pushOption, remove: removeOption }) => (
                        <fieldset aria-invalid={Boolean((getIn(errors, `content.questions.${questionIndex}.correctOptionId`) || getIn(errors, `content.questions.${questionIndex}.options`)) && submitCount > 0)} className={`mt-5 space-y-3 rounded-xl ${Boolean((getIn(errors, `content.questions.${questionIndex}.correctOptionId`) || getIn(errors, `content.questions.${questionIndex}.options`)) && submitCount > 0) ? "border border-red-300 p-3" : ""}`}>
                          <legend className="mb-3 text-sm font-semibold text-dark">{t("activity.form.alternatives")}</legend>
                          {question.options.map((option, optionIndex) => (
                            <div key={option.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                              <input type="radio" name={`correct-option-${question.id}`} checked={question.correctOptionId === option.id}
                                onChange={() => void setFieldValue(`content.questions.${questionIndex}.correctOptionId`, option.id)}
                                aria-label={`${t("activity.form.alternative")} ${optionIndex + 1}`}
                                className="mt-3 size-4 accent-accent" />
                              <div className="min-w-0 flex-1">
                                <label htmlFor={`content.questions.${questionIndex}.options.${optionIndex}.text`} className="sr-only">{t("activity.form.alternativeTextLabel", { number: optionIndex + 1 })}</label>
                                <Field id={`content.questions.${questionIndex}.options.${optionIndex}.text`} name={`content.questions.${questionIndex}.options.${optionIndex}.text`} maxLength={1000} placeholder={`${t("activity.form.alternative")} ${optionIndex + 1}`} className={fieldClassName(`content.questions.${questionIndex}.options.${optionIndex}.text`)} aria-invalid={Boolean(getIn(errors, `content.questions.${questionIndex}.options.${optionIndex}.text`) && (getIn(touched, `content.questions.${questionIndex}.options.${optionIndex}.text`) || submitCount > 0))} />
                                <LocalizedErrorMessage name={`content.questions.${questionIndex}.options.${optionIndex}.text`} component="p" className="mt-1 text-sm text-red-600" />
                              </div>
                              <button type="button" onClick={() => {
                                const nextOptions = question.options.filter((item) => item.id !== option.id);
                                removeOption(optionIndex);
                                if (question.correctOptionId === option.id && nextOptions[0]) {
                                  void setFieldValue(`content.questions.${questionIndex}.correctOptionId`, nextOptions[0].id);
                                }
                              }} disabled={question.options.length <= 3} aria-label={`${t("activity.form.removeAlternative")} ${optionIndex + 1}`}
                                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                                <Trash2 aria-hidden="true" size={17} />
                              </button>
                            </div>
                          ))}
                          <LocalizedErrorMessage name={`content.questions.${questionIndex}.options`} component="p" className="text-sm text-red-600" />
                          <LocalizedErrorMessage name={`content.questions.${questionIndex}.correctOptionId`} component="p" className="text-sm text-red-600" />
                          <button type="button" onClick={() => pushOption(createOption(question.options.length, t("activity.form.alternative")))} disabled={question.options.length >= 6}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                            <Plus aria-hidden="true" size={16} /> {t("activity.form.addAlternative")}
                          </button>
                        </fieldset>
                      )}
                    </FieldArray>

                    <div className="mt-5">
                      <label htmlFor={`content.questions.${questionIndex}.explanation`} className={labelClassName}>{t("activity.form.explanation")}</label>
                      <Field as="textarea" id={`content.questions.${questionIndex}.explanation`} name={`content.questions.${questionIndex}.explanation`} rows={2} maxLength={2000} className={inputClassName} />
                      <LocalizedErrorMessage name={`content.questions.${questionIndex}.explanation`} component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </section>
                ))}
                <button type="button" onClick={() => push(createQuestion(t("activity.form.alternative")))}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <Plus aria-hidden="true" size={18} /> {t("activity.form.addQuestion")}
                </button>
              </div>
            )}
          </FieldArray>

          {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color: "var(--primary-foreground)" }}>
              {isSubmitting ? t("activity.form.saving") : submitLabel}
            </button>
          </div>
        </Form>
        );
      }}
    </Formik>
  );
}
