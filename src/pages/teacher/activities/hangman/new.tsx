import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { HangmanForm } from "@/modules/activities/components/HangmanForm";
import { createHangmanService } from "@/modules/activities/services/createHangmanService";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import type { CreateHangmanFormValues } from "@/modules/activities/schemas/createHangmanSchema";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) { const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined; return data?.error?.message ?? data?.message ?? "Não foi possível criar o Jogo da Forca."; }
  return "Ocorreu um erro inesperado ao criar a atividade.";
}
export default function NewHangmanPage() {
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function handleSubmit(values: CreateHangmanFormValues): Promise<void> {
    setSubmitError("");
    try { const result = await createHangmanService.execute(values); if (values.coverMediaAssetId) await activityCoverService.update(result.activity.slug, values.coverMediaAssetId); setSuccess(true); }
    catch (error: unknown) { setSubmitError(getErrorMessage(error)); }
  }
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title="Criar Jogo da Forca" description="Crie palavras com dicas e imagens para os alunos descobrirem.">
    {success ? <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8"><CheckCircle2 aria-hidden="true" className="mx-auto mb-4 size-14 text-green-600" /><h2 className="text-2xl font-semibold text-dark">Atividade salva com sucesso!</h2><p className="mt-3 text-sm text-muted">O Jogo da Forca foi salvo como rascunho. Revise e envie para aprovação em Minhas atividades.</p><Link href="/teacher/activities" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white" style={{ color: "var(--primary-foreground)" }}><ClipboardList size={18} aria-hidden="true" />Ver minhas atividades</Link></section> : <><div className="mb-6"><Link href="/teacher/activities/new" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted"><ArrowLeft size={16} aria-hidden="true" />Voltar aos formatos</Link></div><HangmanForm onSubmit={handleSubmit} submitError={submitError} /></>}
  </RoleBasedLayout>;
}
