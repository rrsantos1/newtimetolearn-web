import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { MemoryItemEditor } from "@/modules/activities/components/MemoryForm";
import { Field, FieldArray, Form, Formik, getIn, useFormikContext } from "formik";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { AiActivitySuggestionsPanel } from "@/modules/activities/components/AiActivitySuggestionsPanel";
import type {
  CreateSentenceCompletionFormValues,
  CreateWordMatchingFormValues,
  DragDropBaseValues,
  SentencePartValue,
} from "@/modules/activities/schemas/createDragDropSchemas";
import {
  createDragDropId,
  createSentenceCompletionSchema,
  createWordMatchingSchema,
} from "@/modules/activities/schemas/createDragDropSchemas";

interface CommonProps<T> {
  onSubmit: (values: T) => Promise<void>;
  submitError?: string;
  initialValues?: T;
  submitLabel?: string;
}

const inputClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-2 block text-sm font-medium text-dark";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<
    CreateWordMatchingFormValues | CreateSentenceCompletionFormValues
  >();
  const [handledSubmitCount, setHandledSubmitCount] = useState(0);

  useEffect(() => {
    if (submitCount <= handledSubmitCount || isValidating || Object.keys(errors).length === 0) return;

    const timeoutId = window.setTimeout(() => {
      const invalidField = document.querySelector<HTMLElement>(
        'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]',
      );
      const errorSummary = document.getElementById("drag-drop-validation-summary");
      const target = invalidField ?? errorSummary ?? document.querySelector<HTMLElement>('[name="name"]');
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
      setHandledSubmitCount(submitCount);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [errors, handledSubmitCount, isValidating, submitCount]);

  return null;
}

function ValidationErrorSummary() {
  const { errors, submitCount, isValidating } = useFormikContext<
    CreateWordMatchingFormValues | CreateSentenceCompletionFormValues
  >();

  function collectMessages(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(collectMessages);
    if (value !== null && typeof value === "object") {
      return Object.values(value).flatMap(collectMessages);
    }
    return [];
  }

  const messages = collectMessages(errors);
  if (submitCount === 0 || isValidating || messages.length === 0) return null;

  return (
    <section id="drag-drop-validation-summary" role="alert" tabIndex={-1} aria-labelledby="validation-summary-title" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
      <h2 id="validation-summary-title" className="font-semibold">Revise os campos da atividade</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {[...new Set(messages)].map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
      </ul>
    </section>
  );
}

function ActivityDetailsFields() {
  const { t } = useTranslation();
  const { errors, submitCount } = useFormikContext<DragDropBaseValues>();
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-semibold text-dark">{t("activity.form.info")}</h2>
      <div className="mt-5 grid gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>{t("activity.form.title")} *</label>
          <Field id="name" name="name" maxLength={120} className={inputClass} aria-required="true" aria-invalid={Boolean(getIn(errors, "name") && submitCount > 0)} />
          {getIn(errors, "name") && submitCount > 0 ? <p role="alert" className="mt-1 text-sm text-red-600">{String(getIn(errors, "name"))}</p> : <p className="mt-1 text-xs text-muted">{t("activity.form.required")}</p>}
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>{t("activity.form.instructions")}</label>
          <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClass} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="difficulty" className={labelClass}>{t("activity.form.difficulty")}</label>
            <Field as="select" id="difficulty" name="difficulty" className={inputClass}>
              <option value="EASY">{t("activity.form.easy")}</option><option value="MEDIUM">{t("activity.form.medium")}</option><option value="HARD">{t("activity.form.hard")}</option>
            </Field>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WordMatchingForm({ onSubmit, submitError, initialValues: suppliedInitialValues, submitLabel, activityMode = "word_matching" }: Readonly<CommonProps<CreateWordMatchingFormValues> & { activityMode?: "word_matching" | "multiple_choice" }>) {
  const { t } = useTranslation();
  const effectiveSubmitLabel = submitLabel ?? t("activity.form.saveDraft");
  const [aiOpen, setAiOpen] = useState(false);
  const defaultInitialValues = useMemo<CreateWordMatchingFormValues>(() => ({
    name: "", description: "", difficulty: "EASY",
    content: { pairs: Array.from({ length: 3 }, () => ({ id: createDragDropId("pair"), source: { type: "text", value: "" }, target: { type: "text", value: "" } })) },
  }), []);

  const initialValues = suppliedInitialValues ?? defaultInitialValues;
  return (
    <Formik enableReinitialize initialValues={initialValues} validationSchema={createWordMatchingSchema} onSubmit={onSubmit}>
      {({ values, errors, touched, submitCount, isSubmitting, setFieldValue }) => (
        <Form noValidate className="space-y-6">
          <ScrollToFirstError />
          <ActivityCoverField />
          <ValidationErrorSummary />
          <AiActivitySuggestionsPanel activityType="word_matching" open={aiOpen} onClose={() => setAiOpen(false)} />
          <ActivityDetailsFields />
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-lg font-semibold text-dark">{activityMode === "multiple_choice" ? "Questões e correspondências" : "Associações"}</h2><p className="mt-1 text-sm text-muted">{activityMode === "multiple_choice" ? "Cada item de origem será apresentado individualmente, com todas as correspondências disponíveis para escolha." : "Cada item da coluna esquerda será associado a um único item da direita."}</p></div>
              <button type="button" onClick={() => setAiOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles size={16} aria-hidden="true" /> Criar com IA</button>
              <span className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-dark">{values.content.pairs.length}/50</span>
            </div>
            <FieldArray name="content.pairs">
              {({ push, remove }) => (
                <div className="space-y-4">
                  {values.content.pairs.map((pair, index) => (
                    <fieldset key={pair.id} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <legend className="px-1 text-sm font-semibold text-dark">{activityMode === "multiple_choice" ? `${t("activity.form.questionNumber")} ${index + 1}` : `${t("activity.form.pairNumber")} ${index + 1}`}</legend>
                      <div>
                        <MemoryItemEditor
                          name={`content-pairs-${index}-source`}
                          title={activityMode === "multiple_choice" ? "Item apresentado *" : "Palavra / origem *"}
                          value={pair.source}
                          invalid={Boolean(getIn(errors, `content.pairs.${index}.source`) && (getIn(touched, `content.pairs.${index}.source`) || submitCount > 0))}
                          onChange={(item) => void setFieldValue(`content.pairs.${index}.source`, item)}
                        />
                        {getIn(errors, `content.pairs.${index}.source`) && (getIn(touched, `content.pairs.${index}.source`) || submitCount > 0) && <p role="alert" className="mt-1 text-sm text-red-600">{String(getIn(errors, `content.pairs.${index}.source`))}</p>}
                      </div>
                      <div>
                        <MemoryItemEditor
                          name={`content-pairs-${index}-target`}
                          title={activityMode === "multiple_choice" ? `${t("activity.form.correctOption")} *` : `${t("activity.form.matching")} *`}
                          value={pair.target}
                          invalid={Boolean(getIn(errors, `content.pairs.${index}.target`) && (getIn(touched, `content.pairs.${index}.target`) || submitCount > 0))}
                          onChange={(item) => void setFieldValue(`content.pairs.${index}.target`, item)}
                        />
                        {getIn(errors, `content.pairs.${index}.target`) && (getIn(touched, `content.pairs.${index}.target`) || submitCount > 0) && <p role="alert" className="mt-1 text-sm text-red-600">{String(getIn(errors, `content.pairs.${index}.target`))}</p>}
                      </div>
                      <button type="button" onClick={() => remove(index)} disabled={values.content.pairs.length <= 3} aria-label={`${activityMode === "multiple_choice" ? t("activity.form.removeQuestion") : t("activity.form.removePair")} ${index + 1}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-40"><Trash2 size={16} aria-hidden="true" /> {t("activity.form.removeAnswer")}</button>
                    </fieldset>
                  ))}
                  <button type="button" onClick={() => push({ id: createDragDropId("pair"), source: { type: "text", value: "" }, target: { type: "text", value: "" } })} disabled={values.content.pairs.length >= 50} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark disabled:opacity-40"><Plus size={17} aria-hidden="true" /> {activityMode === "multiple_choice" ? t("activity.form.addQuestion") : t("activity.form.addPair")}</button>
                </div>
              )}
            </FieldArray>
            {getIn(errors, "content.pairs") && submitCount > 0 && <p role="alert" className="mt-3 text-sm text-red-600">{typeof getIn(errors, "content.pairs") === "string" ? String(getIn(errors, "content.pairs")) : t("activity.form.reviewMatches")}</p>}
          </section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{isSubmitting ? t("activity.form.saving") : effectiveSubmitLabel}</button></div>
        </Form>
      )}
    </Formik>
  );
}

export function SentenceCompletionForm({ onSubmit, submitError, initialValues: suppliedInitialValues, submitLabel }: Readonly<CommonProps<CreateSentenceCompletionFormValues>>) {
  const { t } = useTranslation();
  const effectiveSubmitLabel = submitLabel ?? t("activity.form.saveDraft");
  const [aiOpen, setAiOpen] = useState(false);
  const defaultInitialValues = useMemo<CreateSentenceCompletionFormValues>(() => ({
    name: "", description: "", difficulty: "EASY",
    content: {
      words: [
        { id: createDragDropId("word"), text: "" },
        { id: createDragDropId("word"), text: "" },
      ],
      sentences: [{
        id: createDragDropId("sentence"),
        parts: [
          { id: createDragDropId("text"), type: "text", value: "" },
          { id: createDragDropId("blank"), type: "blank", expectedWordId: "" },
          { id: createDragDropId("text"), type: "text", value: "" },
        ],
      }],
    },
  }), []);

  const initialValues = suppliedInitialValues ?? defaultInitialValues;
  return (
    <Formik enableReinitialize initialValues={initialValues} validationSchema={createSentenceCompletionSchema} onSubmit={onSubmit}>
      {({ values, errors, touched, submitCount, isSubmitting, setFieldValue }) => (
        <Form noValidate className="space-y-6">
          <ScrollToFirstError />
          <ActivityCoverField />
          <ValidationErrorSummary />
          <AiActivitySuggestionsPanel activityType="sentence_completion" open={aiOpen} onClose={() => setAiOpen(false)} />
          <ActivityDetailsFields />
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-dark">Banco de palavras</h2><p className="mt-1 text-sm text-muted">Inclua as respostas corretas e, se quiser, palavras distratoras.</p></div><button type="button" onClick={() => setAiOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles size={16} aria-hidden="true" /> Criar com IA</button></div>
            <FieldArray name="content.words">
              {({ push, remove }) => (
                <div className="space-y-3">
                  {values.content.words.map((word, index) => (
                    <div key={word.id} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div><label htmlFor={`word-${index}`} className={labelClass}>Palavra {index + 1} *</label><Field id={`word-${index}`} name={`content.words.${index}.text`} maxLength={150} className={inputClass} aria-invalid={Boolean(getIn(errors, `content.words.${index}.text`) && submitCount > 0)} />{getIn(errors, `content.words.${index}.text`) && submitCount > 0 && <p role="alert" className="mt-1 text-sm text-red-600">{String(getIn(errors, `content.words.${index}.text`))}</p>}</div>
                      <button type="button" onClick={() => remove(index)} disabled={values.content.words.length <= 1} aria-label={`Remover palavra ${index + 1}`} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-40"><Trash2 size={16} aria-hidden="true" /> Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => push({ id: createDragDropId("word"), text: "" })} disabled={values.content.words.length >= 200} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark disabled:opacity-40"><Plus size={17} aria-hidden="true" /> Adicionar palavra</button>
                </div>
              )}
            </FieldArray>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-5"><h2 className="text-lg font-semibold text-dark">{t("activity.form.sentencesBlanks")}</h2><p className="mt-1 text-sm text-muted">{t("activity.form.sentenceHelp")}</p></div>
            <FieldArray name="content.sentences">
              {({ push, remove }) => (
                <div className="space-y-5">
                  {values.content.sentences.map((sentence, sentenceIndex) => (
                    <fieldset key={sentence.id} className="rounded-xl border border-border p-4 sm:p-5">
                      <legend className="px-1 text-sm font-semibold text-dark">{t("activity.form.sentencesBlanks")} {sentenceIndex + 1}</legend>
                      <FieldArray name={`content.sentences.${sentenceIndex}.parts`}>
                        {({ push: pushPart, remove: removePart, insert }) => (
                          <div className="space-y-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                              {sentence.parts.map((part, partIndex) => part.type === "text" ? (
                                <div key={part.id} className="min-w-0 flex-[1_1_0%] rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                                  <label htmlFor={`sentence-${sentenceIndex}-part-${partIndex}`} className={labelClass}>{t("activity.form.addSegment")} {partIndex + 1}</label>
                                  <Field as="textarea" id={`sentence-${sentenceIndex}-part-${partIndex}`} name={`content.sentences.${sentenceIndex}.parts.${partIndex}.value`} rows={2} maxLength={2000} className={inputClass} />
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => insert(partIndex + 1, { id: createDragDropId("blank"), type: "blank", expectedWordId: "" } satisfies SentencePartValue)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800"><Plus size={14} aria-hidden="true" /> {t("activity.form.insertBlank")}</button>
                                    <button type="button" onClick={() => removePart(partIndex)} disabled={sentence.parts.length <= 2} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-40"><Trash2 size={14} aria-hidden="true" /> {t("activity.form.removeBlank")}</button>
                                  </div>
                                </div>
                              ) : (
                                <div key={part.id} className="min-w-0 flex-[0_1_13rem] rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3 lg:w-52">
                                  <label htmlFor={`sentence-${sentenceIndex}-blank-${partIndex}`} className={labelClass}>{t("activity.form.wordLabel")} *</label>
                                  <select id={`sentence-${sentenceIndex}-blank-${partIndex}`} value={part.expectedWordId} onChange={(event) => void setFieldValue(`content.sentences.${sentenceIndex}.parts.${partIndex}.expectedWordId`, event.target.value)} className={inputClass} aria-invalid={Boolean(getIn(errors, `content.sentences.${sentenceIndex}.parts.${partIndex}.expectedWordId`) && (getIn(touched, `content.sentences.${sentenceIndex}.parts.${partIndex}.expectedWordId`) || submitCount > 0))}>
                                    <option value="">{t("activity.form.select")}</option>
                                    {values.content.words.filter((word) => word.text.trim()).map((word) => <option key={word.id} value={word.id}>{word.text}</option>)}
                                  </select>
                                  <button type="button" onClick={() => removePart(partIndex)} disabled={sentence.parts.length <= 2} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-40"><Trash2 size={14} aria-hidden="true" /> {t("activity.form.removeBlank")}</button>
                                </div>
                              ))}
                            </div>
                            <button type="button" onClick={() => pushPart({ id: createDragDropId("text"), type: "text", value: "" })} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-dark"><Plus size={14} aria-hidden="true" /> {t("activity.form.addSegment")}</button>
                          </div>
                        )}
                      </FieldArray>
                      <button type="button" onClick={() => remove(sentenceIndex)} disabled={values.content.sentences.length <= 1} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-red-600 disabled:opacity-40"><Trash2 size={15} aria-hidden="true" /> {t("activity.form.removeSentence")}</button>
                    </fieldset>
                  ))}
                  <button type="button" onClick={() => push({ id: createDragDropId("sentence"), parts: [{ id: createDragDropId("text"), type: "text", value: "" }, { id: createDragDropId("blank"), type: "blank", expectedWordId: "" }, { id: createDragDropId("text"), type: "text", value: "" }] })} disabled={values.content.sentences.length >= 100} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark disabled:opacity-40"><Plus size={17} aria-hidden="true" /> {t("activity.form.addSentence")}</button>
                </div>
              )}
            </FieldArray>
          </section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{isSubmitting ? t("activity.form.saving") : effectiveSubmitLabel}</button></div>
        </Form>
      )}
    </Formik>
  );
}
