import { useEffect, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik, getIn, useFormikContext } from "formik";
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
  timeLimitSeconds: 30,
  content: { holeCount: 6, theme: "", correctOptions: ["", ""], incorrectOptions: ["", ""] },
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

export function MoleHitForm({ onSubmit, submitError, initialValues = defaultInitialValues, submitLabel = "Criar atividade" }: Readonly<Props>) {
  return (
    <Formik<CreateMoleHitFormValues>
      initialValues={initialValues}
      enableReinitialize
      validationSchema={createMoleHitSchema}
      onSubmit={(values) => onSubmit({
        ...values,
        content: {
          ...values.content,
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
              <h2 className="text-lg font-semibold text-dark">Informações da atividade</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Defina o título, o tema e as configurações padrão para a execução.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className={labelClassName}>Nome da atividade <span className="text-red-600">*</span></label>
                <Field id="name" name="name" type="text" maxLength={120} placeholder="Ex.: Capitais do Brasil" className={inputClassName} aria-required="true" aria-invalid={Boolean(getIn(errors, "name") && submitCount > 0)} />
                <ErrorMessage name="name" component="p" className={errorClassName} />
              </div>
              <div>
                <label htmlFor="description" className={labelClassName}>Descrição</label>
                <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} placeholder="Descreva o objetivo da atividade..." className={inputClassName} />
                <ErrorMessage name="description" component="p" className={errorClassName} />
              </div>
              <div>
                <label htmlFor="content.theme" className={labelClassName}>Tema / categoria <span className="text-red-600">*</span></label>
                <Field id="content.theme" name="content.theme" maxLength={160} placeholder="Ex.: Cidades que são capitais de estados brasileiros" className={inputClassName} aria-required="true" aria-invalid={Boolean(getIn(errors, "content.theme") && submitCount > 0)} />
                <ErrorMessage name="content.theme" component="p" className={errorClassName} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficulty" className={labelClassName}>Dificuldade padrão <span className="text-red-600">*</span></label>
                  <Field as="select" id="difficulty" name="difficulty" className={inputClassName} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    const difficulty = event.target.value as CreateMoleHitFormValues["difficulty"];
                    void setFieldValue("difficulty", difficulty);
                    void setFieldValue("content.holeCount", difficulty === "EASY" ? 6 : difficulty === "MEDIUM" ? 9 : 12);
                  }}>
                    <option value="EASY">Fácil</option><option value="MEDIUM">Média</option><option value="HARD">Difícil</option>
                  </Field>
                  <p className="mt-1 text-xs text-muted">Será a opção selecionada inicialmente na tela de execução. O aluno poderá alterá-la antes de começar.</p>
                </div>
                <div>
                  <label htmlFor="timeLimitSeconds" className={labelClassName}>Tempo limite</label>
                  <Field as="select" id="timeLimitSeconds" name="timeLimitSeconds" className={inputClassName}>
                    <option value={30}>30 segundos</option><option value={45}>45 segundos</option><option value={60}>60 segundos</option>
                  </Field>
                </div>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">Opções do desafio</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Cadastre as respostas que pertencem ao tema e as que não pertencem. O aluno deverá selecionar apenas as corretas.</p>
            </div>
            <div className="mb-5"><MoleHitAiSuggestionsPanel /></div>
            <div className="grid gap-6 lg:grid-cols-2">
              <FieldArray name="content.correctOptions">
                {({ push, remove }) => (
                  <div className="space-y-3">
                    <div><h3 className="text-sm font-semibold text-emerald-800">Opções corretas <span className="text-red-600">*</span></h3><p className="mt-1 text-xs text-muted">Itens que atendem ao tema informado.</p></div>
                    {values.content.correctOptions.map((_, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <label htmlFor={`content.correctOptions.${index}`} className="sr-only">Opção correta {index + 1}</label>
                          <Field id={`content.correctOptions.${index}`} name={`content.correctOptions.${index}`} maxLength={80} placeholder={`Opção correta ${index + 1}`} className={inputClassName} aria-invalid={Boolean(getIn(errors, `content.correctOptions.${index}`) && submitCount > 0)} />
                          <ErrorMessage name={`content.correctOptions.${index}`} component="p" className={errorClassName} />
                        </div>
                        <button type="button" onClick={() => remove(index)} disabled={values.content.correctOptions.length <= 2} aria-label={`Remover opção correta ${index + 1}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={18} aria-hidden="true" /></button>
                      </div>
                    ))}
                    <ErrorMessage name="content.correctOptions" component="p" className={errorClassName} />
                    <button type="button" onClick={() => push("")} disabled={values.content.correctOptions.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:border-accent/40 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Plus size={17} aria-hidden="true" />Adicionar opção correta</button>
                    <p className="text-xs text-muted">{values.content.correctOptions.length} de 30 opções</p>
                  </div>
                )}
              </FieldArray>
              <FieldArray name="content.incorrectOptions">
                {({ push, remove }) => (
                  <div className="space-y-3">
                    <div><h3 className="text-sm font-semibold text-red-800">Opções incorretas <span className="text-red-600">*</span></h3><p className="mt-1 text-xs text-muted">Itens que não atendem ao tema informado.</p></div>
                    {values.content.incorrectOptions.map((_, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <label htmlFor={`content.incorrectOptions.${index}`} className="sr-only">Opção incorreta {index + 1}</label>
                          <Field id={`content.incorrectOptions.${index}`} name={`content.incorrectOptions.${index}`} maxLength={80} placeholder={`Opção incorreta ${index + 1}`} className={inputClassName} aria-invalid={Boolean(getIn(errors, `content.incorrectOptions.${index}`) && submitCount > 0)} />
                          <ErrorMessage name={`content.incorrectOptions.${index}`} component="p" className={errorClassName} />
                        </div>
                        <button type="button" onClick={() => remove(index)} disabled={values.content.incorrectOptions.length <= 2} aria-label={`Remover opção incorreta ${index + 1}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:border-red-300 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={18} aria-hidden="true" /></button>
                      </div>
                    ))}
                    <ErrorMessage name="content.incorrectOptions" component="p" className={errorClassName} />
                    <button type="button" onClick={() => push("")} disabled={values.content.incorrectOptions.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:border-accent/40 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"><Plus size={17} aria-hidden="true" />Adicionar opção incorreta</button>
                    <p className="text-xs text-muted">{values.content.incorrectOptions.length} de 30 opções</p>
                  </div>
                )}
              </FieldArray>
            </div>
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Atenção:</strong> revise as sugestões da IA antes de salvar. Uma opção incorretamente classificada pode prejudicar a experiência do aluno.</p>
          </section>
          {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />Salvando atividade...</> : submitLabel}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
