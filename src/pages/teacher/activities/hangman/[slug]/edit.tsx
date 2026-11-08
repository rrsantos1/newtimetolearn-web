import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { HangmanForm } from "@/modules/activities/components/HangmanForm";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";
import { updateHangmanWordImageService } from "@/modules/activities/services/updateHangmanWordImageService";
import type { CreateHangmanFormValues } from "@/modules/activities/schemas/createHangmanSchema";

interface EditableHangmanActivity {
  slug: string;
  type: string;
  coverMediaAssetId: string | null;
  coverImageUrl: string | null;
  coverAltText: string | null;
  version: {
    name: string;
    description: string | null;
    difficulty: CreateHangmanFormValues["difficulty"];
    status: string;
    reviewFeedback: string | null;
    content: { words: CreateHangmanFormValues["content"]["words"] };
  };
}
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível carregar ou atualizar a atividade.";
  }
  return "Ocorreu um erro inesperado.";
}
export default function EditHangmanPage() {
  const router = useRouter();
  const [activity, setActivity] = useState<EditableHangmanActivity | null>(null);
  const [initialValues, setInitialValues] = useState<CreateHangmanFormValues | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const slug = typeof router.query.slug === "string" ? router.query.slug : "";
    let active = true;
    async function load(): Promise<void> {
      if (!slug) { setError("Não foi possível identificar a atividade."); setLoading(false); return; }
      try {
        const api = (await import("@/lib/api")).default;
        const response = await api.get<{ success: true; data: EditableHangmanActivity }>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        const loaded = response.data.data;
        if (loaded.type !== "hangman") { setError("Esta atividade não é um Jogo da Forca."); return; }
        setActivity(loaded);
        setInitialValues({
          coverMediaAssetId: loaded.coverMediaAssetId,
          coverImageUrl: loaded.coverImageUrl,
          coverAltText: loaded.coverAltText,
          name: loaded.version.name,
          description: loaded.version.description ?? "",
          difficulty: loaded.version.difficulty,
          content: { words: loaded.version.content.words.map((word) => ({ ...word, imageUrl: word.coverImageUrl ?? word.imageUrl ?? "", coverMediaAssetId: word.coverMediaAssetId ?? null, coverImageUrl: word.coverImageUrl ?? null, coverAltText: word.coverAltText ?? word.imageAlt ?? null })) },
        });
      } catch (cause: unknown) { if (active) setError(getErrorMessage(cause)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [router.isReady, router.query.slug]);

  async function handleSubmit(values: CreateHangmanFormValues): Promise<void> {
    if (!activity) return;
    setSubmitError("");
    setNotice("");
    try {
      const api = (await import("@/lib/api")).default;
      const response = await api.patch<{ success: true; data: { version: { status: string } } }>(`/activities/${encodeURIComponent(activity.slug)}/hangman`, {
        name: values.name.trim(),
        description: values.description.trim() || null,
        difficulty: values.difficulty,
        content: { words: values.content.words.map((word) => ({
          id: word.id,
          word: word.word,
          clue: word.clue,
          imageUrl: null,
          imageAlt: word.coverAltText ?? "",
          coverMediaAssetId: null,
          coverImageUrl: null,
          coverAltText: null,
        })) },
      });
      if (values.coverMediaAssetId !== undefined) await activityCoverService.update(activity.slug, values.coverMediaAssetId);
      for (const word of values.content.words) {
        await updateHangmanWordImageService.execute(activity.slug, word.id, word.coverMediaAssetId ?? null);
      }
      setInitialValues(values);
      setActivity((current) => current ? { ...current, version: { ...current.version, ...values, status: response.data.data.version.status, reviewFeedback: null } } : current);
      setNotice("Alterações salvas com sucesso.");
    } catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
  }

  async function handleResubmit(): Promise<void> {
    if (!activity || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitActivityVersionService.execute(activity.slug);
      setActivity((current) => current ? { ...current, version: { ...current.version, status: "PENDING_REVIEW", reviewFeedback: null } } : current);
      setNotice("Atividade enviada para aprovação.");
    } catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
    finally { setSubmitting(false); }
  }

  const canSubmit = activity !== null && ["DRAFT", "REJECTED", "CHANGES_REQUESTED"].includes(activity.version.status);
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title="Editar Jogo da Forca" description="Atualize as palavras, pistas e imagens da atividade.">
    <div className="mb-6"><Link href="/teacher/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted"><ArrowLeft size={16} aria-hidden="true" />Voltar às atividades</Link></div>
    {loading ? <div role="status" className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-border bg-surface"><LoaderCircle size={20} className="animate-spin" />Carregando atividade...</div>
    : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
    : activity && initialValues ? <>
      {notice && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 size={18} aria-hidden="true" />{notice}</p>}
      {activity.version.reviewFeedback && <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-amber-900">Observações da revisão</h2><p className="mt-2 whitespace-pre-wrap text-sm text-amber-800">{activity.version.reviewFeedback}</p></section>}
      <HangmanForm initialValues={initialValues} onSubmit={handleSubmit} submitError={submitError} submitLabel="Salvar alterações" />
      {canSubmit && <section className="mt-6 rounded-2xl border border-border bg-surface p-5"><h2 className="font-semibold text-dark">Enviar para aprovação</h2><p className="mt-1 text-sm text-muted">Salve as alterações antes de enviar a versão para análise administrativa.</p><button type="button" onClick={() => void handleResubmit()} disabled={submitting} className="mt-4 min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Enviando..." : "Enviar para aprovação"}</button></section>}
    </> : null}
  </RoleBasedLayout>;
}
