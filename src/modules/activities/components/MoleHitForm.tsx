import { Form, Formik, Field } from "formik";
import { createMoleHitSchema, type CreateMoleHitFormValues } from "@/modules/activities/schemas/createMoleHitSchema";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";

interface Props {
  onSubmit: (values: CreateMoleHitFormValues) => Promise<void>;
  submitError: string;
}

const labelClass = "mb-1 block text-sm font-semibold text-dark";
const inputClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function MoleHitForm({ onSubmit, submitError }: Readonly<Props>) {
  const initialValues: CreateMoleHitFormValues = {
    name: "",
    description: "",
    difficulty: "EASY",
    timeLimitSeconds: 30,
    content: { holeCount: 6 },
  };

  return (
    <Formik<CreateMoleHitFormValues>
      initialValues={initialValues}
      validationSchema={createMoleHitSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, submitCount, isSubmitting, setFieldValue }) => (
        <Form noValidate className="space-y-6">
          <ActivityCoverField />
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-dark">Configurações do jogo</h2>
            <p className="mt-1 text-sm text-muted">A dificuldade altera o número de buracos e a velocidade inicial. O ritmo aumenta progressivamente durante a partida.</p>
            <div className="mt-5 grid gap-5">
              <div>
                <label htmlFor="name" className={labelClass}>Nome da atividade *</label>
                <Field id="name" name="name" maxLength={120} className={inputClass} aria-required="true" aria-invalid={Boolean(errors.name && (touched.name || submitCount > 0))} />
                {errors.name && (touched.name || submitCount > 0) && <p role="alert" className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="description" className={labelClass}>Descrição</label>
                <Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClass} />
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
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                <strong>Como funciona:</strong> acerte as toupeiras com um toque. Cada acerto soma pontos; clicar em um buraco vazio conta como erro. A velocidade cresce ao longo dos 30 segundos.
              </div>
            </div>
          </section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{isSubmitting ? "Salvando..." : "Salvar atividade como rascunho"}</button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
