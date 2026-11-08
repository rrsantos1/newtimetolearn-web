import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { FieldArray, Form, Formik } from "formik";
import { ArrowLeft, CheckCircle2, Plus, Sparkles, Trash2 } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { createRouletteSchema, type CreateRouletteFormValues } from "@/modules/activities/schemas/createRouletteSchema";
import { createRouletteService } from "@/modules/activities/services/createRouletteService";
import api from "@/lib/api";

interface AiResponse { success: true; data: { activityType: "roulette"; topics: string[] }; }
const initialValues: CreateRouletteFormValues = { name: "", description: "", difficulty: "MEDIUM", content: { topics: [""] } };
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) { const data = error.response?.data as { error?: { message?: string } } | undefined; return data?.error?.message ?? "Não foi possível salvar a roleta."; }
  return "Ocorreu um erro inesperado.";
}
export default function NewRoulettePage() {
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiQuantity, setAiQuantity] = useState(8);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  async function generate(): Promise<void> {
    if (aiTopic.trim().length < 2 || aiQuantity < 2 || aiQuantity > 30) { setAiError("Informe um tema e uma quantidade entre 2 e 30."); return; }
    setAiLoading(true); setAiError(""); setGenerated([]);
    try { const response = await api.post<AiResponse>("/activities/ai/suggestions", { activityType: "roulette", topic: aiTopic.trim(), quantity: aiQuantity }); setGenerated(response.data.data.topics); }
    catch (error: unknown) { setAiError(getErrorMessage(error)); }
    finally { setAiLoading(false); }
  }
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title="Criar roleta" description="Cadastre assuntos para estimular a conversação em sala de aula.">
    {success ? <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center"><CheckCircle2 className="mx-auto size-14 text-green-600" aria-hidden="true" /><h2 className="mt-4 text-2xl font-semibold text-dark">Roleta salva com sucesso!</h2><p className="mt-2 text-sm text-muted">A atividade foi salva como rascunho. Envie para aprovação em Minhas atividades.</p><Link href="/teacher/activities" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-dark px-5 text-sm font-semibold text-white">Ver minhas atividades</Link></section> : <>
      <Link href="/teacher/activities/new" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm text-muted"><ArrowLeft size={16} aria-hidden="true" />Voltar aos formatos</Link>
      <Formik initialValues={initialValues} validationSchema={createRouletteSchema} onSubmit={async (values, helpers) => { setSubmitError(""); try { await createRouletteService.execute(values); setSuccess(true); } catch (error: unknown) { setSubmitError(getErrorMessage(error)); } finally { helpers.setSubmitting(false); } }}>
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => <Form className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><h2 className="text-lg font-semibold text-dark">Dados da atividade</h2>
            <label htmlFor="roulette-name" className="mt-5 block text-sm font-medium text-dark">Nome da atividade</label><input id="roulette-name" name="name" value={values.name} onChange={handleChange} maxLength={120} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />{touched.name && errors.name && <p className="mt-1 text-sm text-red-700">{errors.name}</p>}
            <label htmlFor="roulette-description" className="mt-4 block text-sm font-medium text-dark">Descrição (opcional)</label><textarea id="roulette-description" name="description" value={values.description} onChange={handleChange} rows={3} maxLength={2000} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm" />
            <label htmlFor="roulette-difficulty" className="mt-4 block text-sm font-medium text-dark">Dificuldade</label><select id="roulette-difficulty" name="difficulty" value={values.difficulty} onChange={handleChange} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="EASY">Fácil</option><option value="MEDIUM">Média</option><option value="HARD">Difícil</option></select>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-dark">Assuntos da roleta</h2><p className="mt-1 text-sm text-muted">Cada assunto será removido após ser sorteado. Cadastre de 2 a 30 itens.</p></div><span className="text-sm text-muted">{values.content.topics.filter((item) => item.trim()).length}/30</span></div>
            <FieldArray name="content.topics">{({ push, remove }) => <div className="mt-4 space-y-3">{values.content.topics.map((topic, index) => <div key={index} className="flex items-center gap-2"><label htmlFor={`roulette-topic-${index}`} className="sr-only">Assunto {index + 1}</label><input id={`roulette-topic-${index}`} value={topic} maxLength={100} onChange={(event) => setFieldValue(`content.topics[${index}]`, event.target.value)} placeholder={`Assunto ${index + 1}`} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm" /><button type="button" onClick={() => remove(index)} disabled={values.content.topics.length <= 1} aria-label={`Remover assunto ${index + 1}`} className="flex size-10 items-center justify-center rounded-xl border border-border text-muted disabled:opacity-40"><Trash2 size={17} aria-hidden="true" /></button></div>)}<button type="button" onClick={() => push("")} disabled={values.content.topics.length >= 30} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-dark disabled:opacity-40"><Plus size={16} aria-hidden="true" />Adicionar assunto</button></div>}</FieldArray>
            {typeof errors.content === "object" && errors.content !== null && "topics" in errors.content && typeof errors.content.topics === "string" && <p className="mt-2 text-sm text-red-700">{errors.content.topics}</p>}
          </section>
          <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-5 sm:p-6"><div className="flex items-center gap-2 font-semibold text-dark"><Sparkles size={18} aria-hidden="true" />Ajuda da IA</div><p className="mt-1 text-sm text-muted">Gere sugestões de assuntos para conversação a partir de um tema.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px_auto]"><label className="block text-sm font-medium text-dark">Tema<input value={aiTopic} onChange={(event) => setAiTopic(event.target.value)} maxLength={160} placeholder="Ex.: Meio ambiente" className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3 font-normal" /></label><label className="block text-sm font-medium text-dark">Quantidade<input type="number" min={2} max={30} value={aiQuantity} onChange={(event) => setAiQuantity(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3 font-normal" /></label><button type="button" onClick={() => void generate()} disabled={aiLoading} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-4 text-sm font-semibold text-white disabled:opacity-50"><Sparkles size={16} aria-hidden="true" />{aiLoading ? "Gerando..." : "Gerar"}</button></div>{aiError && <p role="alert" className="mt-3 text-sm text-red-700">{aiError}</p>}{generated.length > 0 && <div className="mt-4 rounded-xl border border-border bg-surface p-4"><p className="text-sm font-semibold text-dark">Sugestões geradas</p><ul className="mt-2 grid gap-2 sm:grid-cols-2">{generated.map((item, index) => <li key={item + index} className="rounded-lg bg-background p-2 text-sm text-dark">{item}</li>)}</ul><button type="button" onClick={() => { const existing = values.content.topics.map((item) => item.trim().toLocaleLowerCase("pt-BR")); const additions = generated.filter((item) => !existing.includes(item.trim().toLocaleLowerCase("pt-BR"))); void setFieldValue("content.topics", [...values.content.topics.filter((item) => item.trim()), ...additions].slice(0, 30)); setGenerated([]); }} disabled={values.content.topics.filter((item) => item.trim()).length >= 30} className="mt-4 min-h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-40">Adicionar sugestões à roleta</button></div>}</section>
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{submitError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-dark px-6 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Salvando..." : "Salvar roleta"}</button></div>
        </Form>}
      </Formik>
    </>}
  </RoleBasedLayout>;
}
