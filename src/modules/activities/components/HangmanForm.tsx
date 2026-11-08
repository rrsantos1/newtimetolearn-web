import { useEffect, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik, getIn, useFormikContext } from "formik";
import { Plus, Trash2 } from "lucide-react";
import { ActivityCoverField } from "@/modules/activities/components/ActivityCoverField";
import { HangmanAiSuggestionsPanel } from "@/modules/activities/components/HangmanAiSuggestionsPanel";
import { createHangmanSchema, type CreateHangmanFormValues } from "@/modules/activities/schemas/createHangmanSchema";

interface Props { onSubmit: (values: CreateHangmanFormValues) => Promise<void>; submitError: string; initialValues?: CreateHangmanFormValues; submitLabel?: string; }
const defaultValues: CreateHangmanFormValues = { name: "", description: "", difficulty: "EASY", content: { words: [0,1,2].map(() => ({ id: crypto.randomUUID(), word: "", clue: "", imageUrl: "", imageAlt: "" })) } };
const inputClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const errorClass = "mt-1 text-sm text-red-600";

function ScrollToFirstError() {
  const { errors, submitCount, isValidating } = useFormikContext<CreateHangmanFormValues>();
  const [handled, setHandled] = useState(0);
  useEffect(() => {
    if (submitCount <= handled || isValidating || Object.keys(errors).length === 0) return;
    const id = window.setTimeout(() => { const element = document.querySelector<HTMLElement>('[aria-invalid="true"]'); element?.scrollIntoView({ behavior: "smooth", block: "center" }); element?.focus({ preventScroll: true }); setHandled(submitCount); }, 0);
    return () => window.clearTimeout(id);
  }, [errors, handled, isValidating, submitCount]);
  return null;
}
function newWord(): CreateHangmanFormValues["content"]["words"][number] { return { id: crypto.randomUUID(), word: "", clue: "", imageUrl: "", imageAlt: "" }; }

export function HangmanForm({ onSubmit, submitError, initialValues = defaultValues, submitLabel = "Criar atividade" }: Readonly<Props>) {
  return <Formik<CreateHangmanFormValues> initialValues={initialValues} enableReinitialize validationSchema={createHangmanSchema} onSubmit={(values) => onSubmit({ ...values, content: { words: values.content.words.map((item) => ({ ...item, word: item.word.trim(), clue: item.clue.trim(), imageUrl: item.imageUrl.trim() })) } })}>
    {({ isSubmitting, values, errors, submitCount }) => <Form noValidate className="space-y-6"><ScrollToFirstError /><ActivityCoverField />
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7"><h2 className="text-lg font-semibold text-dark">Informações da atividade</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label htmlFor="name" className="mb-2 block text-sm font-medium text-dark">Nome da atividade *</label><Field id="name" name="name" maxLength={120} className={inputClass} aria-invalid={Boolean(getIn(errors, "name") && submitCount > 0)} /><ErrorMessage name="name" component="p" className={errorClass} /></div>
        <div className="sm:col-span-2"><label htmlFor="description" className="mb-2 block text-sm font-medium text-dark">Descrição</label><Field as="textarea" id="description" name="description" rows={3} maxLength={2000} className={inputClass} /></div>
        <div><label htmlFor="difficulty" className="mb-2 block text-sm font-medium text-dark">Dificuldade padrão</label><Field as="select" id="difficulty" name="difficulty" className={inputClass}><option value="EASY">Fácil</option><option value="MEDIUM">Média</option><option value="HARD">Difícil</option></Field></div>
      </div></section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7"><h2 className="text-lg font-semibold text-dark">Palavras e pistas</h2><p className="mt-1 text-sm text-muted">Cada palavra precisa de uma dica. A imagem é opcional. O aluno terá seis erros permitidos por palavra.</p><div className="my-5"><HangmanAiSuggestionsPanel /></div>
        <FieldArray name="content.words">{({ push, remove }) => <div className="space-y-5">{values.content.words.map((item, index) => <article key={item.id || index} className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold text-dark">Palavra {index + 1}</h3><button type="button" onClick={() => remove(index)} disabled={values.content.words.length <= 3} aria-label={`Remover palavra ${index + 1}`} className="flex size-10 items-center justify-center rounded-xl border border-border text-muted hover:text-red-600 disabled:opacity-40"><Trash2 size={17} aria-hidden="true" /></button></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor={`content.words.${index}.word`} className="mb-1 block text-sm font-medium text-dark">Palavra correta *</label><Field id={`content.words.${index}.word`} name={`content.words.${index}.word`} maxLength={50} className={inputClass} aria-invalid={Boolean(getIn(errors, `content.words.${index}.word`) && submitCount > 0)} /><ErrorMessage name={`content.words.${index}.word`} component="p" className={errorClass} /></div>
          <div><label htmlFor={`content.words.${index}.clue`} className="mb-1 block text-sm font-medium text-dark">Dica *</label><Field id={`content.words.${index}.clue`} name={`content.words.${index}.clue`} maxLength={240} className={inputClass} aria-invalid={Boolean(getIn(errors, `content.words.${index}.clue`) && submitCount > 0)} /><ErrorMessage name={`content.words.${index}.clue`} component="p" className={errorClass} /></div>
          <div><label htmlFor={`content.words.${index}.imageUrl`} className="mb-1 block text-sm font-medium text-dark">URL da imagem (opcional)</label><Field id={`content.words.${index}.imageUrl`} name={`content.words.${index}.imageUrl`} type="url" maxLength={2048} placeholder="https://..." className={inputClass} aria-invalid={Boolean(getIn(errors, `content.words.${index}.imageUrl`) && submitCount > 0)} /><ErrorMessage name={`content.words.${index}.imageUrl`} component="p" className={errorClass} /></div>
          <div><label htmlFor={`content.words.${index}.imageAlt`} className="mb-1 block text-sm font-medium text-dark">Descrição da imagem</label><Field id={`content.words.${index}.imageAlt`} name={`content.words.${index}.imageAlt`} maxLength={180} className={inputClass} /></div></div>
        </article>)}<button type="button" onClick={() => push(newWord())} disabled={values.content.words.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-dark disabled:opacity-40"><Plus size={17} aria-hidden="true" />Adicionar palavra</button><p className="text-xs text-muted">{values.content.words.length} de 30 palavras</p></div>}</FieldArray>
      </section>
      {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
      <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Salvando..." : submitLabel}</button></div>
    </Form>}
  </Formik>;
}
