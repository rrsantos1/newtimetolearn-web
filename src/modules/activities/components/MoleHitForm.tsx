import { Form, Formik, Field, getIn } from "formik";
import { createMoleHitSchema, type CreateMoleHitFormValues } from "@/modules/activities/schemas/createMoleHitSchema";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { MoleHitAiSuggestionsPanel } from "@/modules/activities/components/MoleHitAiSuggestionsPanel";

interface Props {
  onSubmit: (values: CreateMoleHitFormValues) => Promise<void>;
  submitError: string;
  initialValues?: CreateMoleHitFormValues;
  submitLabel?: string;
}

const labelClass = "mb-1 block text-sm font-semibold text-dark";
const inputClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function parseOptions(value: string): string[] {
  return value.split("\n").map((option) => option.trim());
}

export function MoleHitForm({ onSubmit, submitError, initialValues: suppliedInitialValues, submitLabel = "Salvar atividade como rascunho" }: Readonly<Props>) {
  const defaults: CreateMoleHitFormValues = {
    name: "",
    description: "",
    difficulty: "EASY",
    timeLimitSeconds: 30,
    content: { holeCount: 6, theme: "", correctOptions: [], incorrectOptions: [] },
  };
  const initialValues = suppliedInitialValues ?? defaults;

  return (
    <Formik<CreateMoleHitFormValues>
      initialValues={initialValues}
      enableReinitialize
      validationSchema={createMoleHitSchema}
      onSubmit={(values) => onSubmit({
        ...values,
        content: {
          ...values.content,
          correctOptions: values.content.correctOptions.filter((option) => option.trim().length > 0),
          incorrectOptions: values.content.incorrectOptions.filter((option) => option.trim().length > 0),
        },
      })}
    >
      {({ values, errors, touched, submitCount, isSubmitting, setFieldValue }) => {
        const themeError = getIn(errors, "content.theme") as string | undefined;
        const correctError = getIn(errors, "content.correctOptions") as string | undefined;
        const incorrectError = getIn(errors, "content.incorrectOptions") as string | undefined;
        const showErrors = submitCount > 0;
        return (
          <Form noValidate className="space-y-6">
            <ActivityCoverField />
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold text-dark">Configurações do jogo</h2>
              <p className="mt-1 text-sm text-muted">O aluno verá uma opção sobre cada toupeira e deverá escolher somente as respostas que pertencem ao tema.</p>
              <div className="mt-5 grid gap-5">
                <div>
                  <label htmlFor="name" className={labelClass}>Nome da atividade *</label>
                  <Field id="name" name="name" maxLength={120} className={inputClass} aria-required="true" aria-invalid={Boolean(errors.name && (touched.name || showErrors))} />
                  {errors.name && (touched.name || showErrors) && <p role="alert" className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="description" className={labelClass}>Descrição</label>
                  <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="content.theme" className={labelClass}>Tema / categoria que define as respostas corretas *</label>
                  <Field id="content.theme" name="content.theme" maxLength={160} placeholder="Ex.: Cidades que são capitais de estados brasileiros" className={inputClass} aria-required="true" aria-invalid={Boolean(themeError && showErrors)} />
                  {themeError && showErrors && <p role="alert" className="mt-1 text-sm text-red-600">{themeError}</p>}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="difficulty" className={labelClass}>Dificuldade</label>
                    <Field as="select" id="difficulty" name="difficulty" className={inputClass} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      const difficulty = event.target.value as CreateMoleHitFormValues["difficulty"];
                      void setFieldValue("difficulty", difficulty);
                      void setFieldValue("content.holeCount", difficulty === "EASY" ? 6 : difficulty === "MEDIUM" ? 9 : 12);
                    }}>
                      <option value="EASY">Fácil — 6 buracos</option>
                      <option value="MEDIUM">Média — 9 buracos</option>
                      <option value="HARD">Difícil — 12 buracos</option>
                    </Field>
                  </div>
                  <div>
                    <label htmlFor="timeLimitSeconds" className={labelClass}>Duração</label>
                    <Field as="select" id="timeLimitSeconds" name="timeLimitSeconds" className={inputClass}>
                      <option value={30}>30 segundos (padrão)</option>
                      <option value={45}>45 segundos</option>
                      <option value={60}>60 segundos</option>
                    </Field>
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="correctOptions" className={labelClass}>Opções corretas * (uma por linha)</label>
                    <textarea id="correctOptions" rows={7} maxLength={3000} value={values.content.correctOptions.join("\n")} onChange={(event) => void setFieldValue("content.correctOptions", parseOptions(event.target.value))} placeholder={"Curitiba\nPorto Alegre\nFlorianópolis"} className={inputClass} aria-invalid={Boolean(correctError && showErrors)} />
                    <p className="mt-1 text-xs text-muted">{values.content.correctOptions.length} opção(ões). Mínimo 2, máximo 30.</p>
                    {correctError && showErrors && <p role="alert" className="mt-1 text-sm text-red-600">{correctError}</p>}
                  </div>
                  <div>
                    <label htmlFor="incorrectOptions" className={labelClass}>Opções incorretas * (uma por linha)</label>
                    <textarea id="incorrectOptions" rows={7} maxLength={3000} value={values.content.incorrectOptions.join("\n")} onChange={(event) => void setFieldValue("content.incorrectOptions", parseOptions(event.target.value))} placeholder={"Campinas\nSorocaba\nJoinville"} className={inputClass} aria-invalid={Boolean(incorrectError && showErrors)} />
                    <p className="mt-1 text-xs text-muted">{values.content.incorrectOptions.length} opção(ões). Mínimo 2, máximo 30.</p>
                    {incorrectError && showErrors && <p role="alert" className="mt-1 text-sm text-red-600">{incorrectError}</p>}
                  </div>
                </div>
                <MoleHitAiSuggestionsPanel />
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                  <strong>Como funciona:</strong> as opções serão embaralhadas. O aluno ganha pontos ao acertar uma toupeira com resposta correta e perde a chance de pontuar ao escolher uma incorreta. Quando todas as opções forem exibidas, uma nova sequência será embaralhada.
                </div>
              </div>
            </section>
            {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{isSubmitting ? "Salvando..." : submitLabel}</button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
