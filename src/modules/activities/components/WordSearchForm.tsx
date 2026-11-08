import { AiActivitySuggestionsPanel } from "@/modules/activities/components/AiActivitySuggestionsPanel";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { useEffect, useState } from "react";
import {
  ErrorMessage,
  Field,
  FieldArray,
  Form,
  Formik,
  getIn,
  useFormikContext,
} from "formik";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import type { CreateWordSearchFormValues } from "@/modules/activities/schemas/createWordSearchSchema";
import { createWordSearchSchema } from "@/modules/activities/schemas/createWordSearchSchema";
import type { ActivityDifficulty } from "@/modules/activities/types/activities.types";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<CreateWordSearchFormValues>();
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

interface WordSearchFormProps {
  onSubmit: (values: CreateWordSearchFormValues) => Promise<void>;
  submitError?: string | null;
  initialValues?: CreateWordSearchFormValues;
  mode?: "create" | "edit";
}

const defaultInitialValues: CreateWordSearchFormValues = {
  name: "",
  description: "",
  difficulty: "EASY",
  words: ["", "", ""],
};

const difficulties: {
  value: ActivityDifficulty;
  label: string;
}[] = [
  { value: "EASY", label: "Fácil" },
  { value: "MEDIUM", label: "Média" },
  { value: "HARD", label: "Difícil" },
];

const inputClassName =
  "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";

const labelClassName = "mb-2 block text-sm font-medium text-dark";

const errorClassName = "mt-1 text-sm text-red-600";

export function WordSearchForm({
  onSubmit,
  submitError,
  initialValues = defaultInitialValues,
  mode = "create",
}: Readonly<WordSearchFormProps>) {
  const isEditing = mode === "edit";
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  return (
    <Formik<CreateWordSearchFormValues>
      initialValues={initialValues}
      enableReinitialize
      validationSchema={createWordSearchSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, values, errors, submitCount }) => (
        <Form noValidate className="space-y-6">
          <ScrollToFirstError />
          <ActivityCoverField />
          <AiActivitySuggestionsPanel activityType="word_search" open={aiSuggestionsOpen} onClose={() => setAiSuggestionsOpen(false)} />
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-dark">Informações da atividade</h2>
                <button type="button" onClick={() => setAiSuggestionsOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-dark hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles aria-hidden="true" size={16} /> Criar com IA</button>
              </div>

              <p className="mt-1 text-sm leading-6 text-muted">
                Defina o título, a dificuldade e o tempo disponível para os
                alunos.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className={labelClassName}>
                  Nome da atividade <span className="text-red-600">*</span>
                </label>

                <Field
                  id="name"
                  name="name"
                  type="text"
                  maxLength={120}
                  placeholder="Ex.: Animals and Pets"
                  className={inputClassName}
                  aria-required="true"
                  aria-invalid={Boolean(getIn(errors, "name") && submitCount > 0)}
                />

                <ErrorMessage
                  name="name"
                  component="p"
                  className={errorClassName}
                />
              </div>

              <div>
                <label htmlFor="description" className={labelClassName}>
                  Descrição
                </label>

                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows={3}
                  maxLength={2000}
                  placeholder="Descreva o objetivo da atividade..."
                  className={`${inputClassName} resize-y`}
                />

                <ErrorMessage
                  name="description"
                  component="p"
                  className={errorClassName}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficulty" className={labelClassName}>
                    Dificuldade <span className="text-red-600">*</span>
                  </label>

                  <Field
                    as="select"
                    id="difficulty"
                    name="difficulty"
                    className={inputClassName}
                    aria-required="true"
                  >
                    {difficulties.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Field>

                  <ErrorMessage
                    name="difficulty"
                    component="p"
                    className={errorClassName}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">
                Palavras do caça-palavras
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted">
                Informe de 3 a 30 palavras. Cada palavra deve ter entre 2 e 20
                letras, desconsiderando espaços e hífens.
              </p>
            </div>

            <FieldArray name="words">
              {({ push, remove }) => (
                <div className="space-y-3">
                  {values.words.map((_, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`words.${index}`}
                          className="sr-only"
                        >
                          Palavra {index + 1}
                        </label>

                        <Field
                          id={`words.${index}`}
                          name={`words.${index}`}
                          type="text"
                          maxLength={50}
                          placeholder={`Palavra ${index + 1}`}
                          className={inputClassName}
                          aria-label={`Palavra ${index + 1}`}
                          aria-invalid={Boolean(getIn(errors, `words.${index}`) && submitCount > 0)}
                        />

                        <ErrorMessage
                          name={`words.${index}`}
                          component="p"
                          className={errorClassName}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={values.words.length <= 3}
                        aria-label={`Remover palavra ${index + 1}`}
                        title={
                          values.words.length <= 3
                            ? "A atividade precisa de pelo menos 3 palavras."
                            : "Remover palavra"
                        }
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  ))}

                  <ErrorMessage
                    name="words"
                    component="p"
                    className={errorClassName}
                  />

                  <button
                    type="button"
                    onClick={() => push("")}
                    disabled={values.words.length >= 30}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:border-accent/40 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={17} aria-hidden="true" />
                    Adicionar palavra
                  </button>

                  <p className="text-xs text-muted">
                    {values.words.length} de 30 palavras
                  </p>
                </div>
              )}
            </FieldArray>
          </section>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
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
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                    aria-hidden="true"
                  />
                  {isEditing ? "Salvando alterações..." : "Criando atividade..."}
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Criar caça-palavras"
              )}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}