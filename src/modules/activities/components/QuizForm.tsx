import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import { Plus, Trash2 } from "lucide-react";
import { createQuizSchema } from "@/modules/activities/schemas/createQuizSchema";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";

interface QuizFormProps {
  onSubmit: (values: CreateQuizFormValues) => Promise<void>;
  submitError?: string;
}

const inputClassName = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClassName = "mb-2 block text-sm font-medium text-dark";

function createId(): string {
  return globalThis.crypto.randomUUID();
}

function createOption(index: number) {
  return { id: createId(), text: `Alternativa ${index + 1}`, images: [] as { storageKey: string; altText: string }[] };
}

function createQuestion() {
  const options = [createOption(0), createOption(1), createOption(2), createOption(3)];
  return {
    id: createId(),
    statement: "",
    images: [] as { storageKey: string; altText: string }[],
    options,
    correctOptionId: options[0].id,
    explanation: "",
  };
}

const initialValues: CreateQuizFormValues = {
  name: "",
  description: "",
  difficulty: "EASY",
  timeLimitSeconds: 900,
  content: { questions: [createQuestion()] },
};

export function QuizForm({ onSubmit, submitError }: Readonly<QuizFormProps>) {
  return (
    <Formik<CreateQuizFormValues>
      initialValues={initialValues}
      validationSchema={createQuizSchema}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting, setFieldValue }) => (
        <Form className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-dark">Informações do Quiz</h2>
            <div className="mt-5 grid gap-5">
              <div>
                <label htmlFor="name" className={labelClassName}>Nome do Quiz *</label>
                <Field id="name" name="name" maxLength={120} className={inputClassName} aria-required="true" />
                <ErrorMessage name="name" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label htmlFor="description" className={labelClassName}>Descrição</label>
                <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClassName} />
                <ErrorMessage name="description" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficulty" className={labelClassName}>Dificuldade</label>
                  <Field as="select" id="difficulty" name="difficulty" className={inputClassName}>
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HARD">Difícil</option>
                  </Field>
                </div>
                <div>
                  <label htmlFor="timeLimitSeconds" className={labelClassName}>Tempo limite</label>
                  <Field as="select" id="timeLimitSeconds" name="timeLimitSeconds" className={inputClassName}
                    value={values.timeLimitSeconds === null ? "" : String(values.timeLimitSeconds)}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      void setFieldValue("timeLimitSeconds", event.target.value === "" ? null : Number(event.target.value));
                    }}>
                    <option value="300">5 minutos</option>
                    <option value="600">10 minutos</option>
                    <option value="900">15 minutos</option>
                    <option value="1200">20 minutos</option>
                    <option value="1800">30 minutos</option>
                  </Field>
                  <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                    <input type="checkbox" checked={values.timeLimitSeconds === null}
                      onChange={(event) => void setFieldValue("timeLimitSeconds", event.target.checked ? null : 900)}
                      className="size-4 rounded border-border accent-accent" />
                    Sem limite de tempo
                  </label>
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
                      <h2 className="text-lg font-semibold text-dark">Questão {questionIndex + 1}</h2>
                      <button type="button" onClick={() => remove(questionIndex)} disabled={values.content.questions.length <= 1}
                        aria-label={`Remover questão ${questionIndex + 1}`} title="Remover questão"
                        className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </div>
                    <div>
                      <label htmlFor={`content.questions.${questionIndex}.statement`} className={labelClassName}>Enunciado *</label>
                      <Field as="textarea" id={`content.questions.${questionIndex}.statement`} name={`content.questions.${questionIndex}.statement`} rows={3} maxLength={2000} className={inputClassName} />
                      <ErrorMessage name={`content.questions.${questionIndex}.statement`} component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    <FieldArray name={`content.questions.${questionIndex}.options`}>
                      {({ push: pushOption, remove: removeOption }) => (
                        <fieldset className="mt-5 space-y-3">
                          <legend className="mb-3 text-sm font-semibold text-dark">Alternativas (marque a correta)</legend>
                          {question.options.map((option, optionIndex) => (
                            <div key={option.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                              <input type="radio" name={`correct-option-${question.id}`} checked={question.correctOptionId === option.id}
                                onChange={() => void setFieldValue(`content.questions.${questionIndex}.correctOptionId`, option.id)}
                                aria-label={`Marcar alternativa ${optionIndex + 1} como correta da questão ${questionIndex + 1}`}
                                className="mt-3 size-4 accent-accent" />
                              <div className="min-w-0 flex-1">
                                <label htmlFor={`content.questions.${questionIndex}.options.${optionIndex}.text`} className="sr-only">Texto da alternativa {optionIndex + 1}</label>
                                <Field id={`content.questions.${questionIndex}.options.${optionIndex}.text`} name={`content.questions.${questionIndex}.options.${optionIndex}.text`} maxLength={1000} placeholder={`Alternativa ${optionIndex + 1}`} className={inputClassName} />
                                <ErrorMessage name={`content.questions.${questionIndex}.options.${optionIndex}.text`} component="p" className="mt-1 text-sm text-red-600" />
                              </div>
                              <button type="button" onClick={() => {
                                const nextOptions = question.options.filter((item) => item.id !== option.id);
                                removeOption(optionIndex);
                                if (question.correctOptionId === option.id && nextOptions[0]) {
                                  void setFieldValue(`content.questions.${questionIndex}.correctOptionId`, nextOptions[0].id);
                                }
                              }} disabled={question.options.length <= 3} aria-label={`Remover alternativa ${optionIndex + 1}`}
                                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                                <Trash2 aria-hidden="true" size={17} />
                              </button>
                            </div>
                          ))}
                          <ErrorMessage name={`content.questions.${questionIndex}.options`} component="p" className="text-sm text-red-600" />
                          <button type="button" onClick={() => pushOption(createOption(question.options.length))} disabled={question.options.length >= 6}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40">
                            <Plus aria-hidden="true" size={16} /> Adicionar alternativa
                          </button>
                        </fieldset>
                      )}
                    </FieldArray>

                    <div className="mt-5">
                      <label htmlFor={`content.questions.${questionIndex}.explanation`} className={labelClassName}>Explicação após responder (opcional)</label>
                      <Field as="textarea" id={`content.questions.${questionIndex}.explanation`} name={`content.questions.${questionIndex}.explanation`} rows={2} maxLength={2000} className={inputClassName} />
                      <ErrorMessage name={`content.questions.${questionIndex}.explanation`} component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </section>
                ))}
                <button type="button" onClick={() => push(createQuestion())}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <Plus aria-hidden="true" size={18} /> Adicionar questão
                </button>
              </div>
            )}
          </FieldArray>

          {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color: "var(--primary-foreground)" }}>
              {isSubmitting ? "Salvando Quiz..." : "Salvar Quiz como rascunho"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
