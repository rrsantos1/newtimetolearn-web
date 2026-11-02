import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { MemoryForm } from "@/modules/activities/components/MemoryForm";
import { createMemoryService } from "@/modules/activities/services/createMemoryService";
import type { CreateMemoryFormValues } from "@/modules/activities/schemas/createMemorySchema";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível criar o jogo da memória.";
  }
  return "Ocorreu um erro inesperado ao criar a atividade.";
}

export default function NewMemoryPage() {
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function handleSubmit(values: CreateMemoryFormValues): Promise<void> {
    setSubmitError("");
    try { await createMemoryService.execute(values); setSuccess(true); }
    catch (error: unknown) { setSubmitError(getErrorMessage(error)); }
  }
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title="Criar jogo da memória" description="Combine conceitos, palavras e imagens em uma atividade pedagógica.">
    {success ? <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8" aria-labelledby="memory-created-title">
      <CheckCircle2 aria-hidden="true" className="mx-auto mb-4 size-14 text-green-600" /><h2 id="memory-created-title" className="text-2xl font-semibold text-dark">Jogo salvo com sucesso!</h2>
      <p className="mt-3 text-sm leading-6 text-muted">A atividade foi salva como rascunho. Abra Minhas atividades para revisar e enviá-la para aprovação quando estiver pronta.</p>
      <Link href="/teacher/activities" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}><ClipboardList aria-hidden="true" size={18} /> Ver minhas atividades</Link>
    </section> : <>
      <div className="mb-6"><Link href="/teacher/activities/new" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft aria-hidden="true" size={16} /> Voltar aos formatos</Link></div>
      <MemoryForm onSubmit={handleSubmit} submitError={submitError} />
    </>}
  </RoleBasedLayout>;
}
