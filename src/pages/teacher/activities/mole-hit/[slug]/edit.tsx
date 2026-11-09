import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { MoleHitForm } from "@/modules/activities/components/MoleHitForm";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import type { CreateMoleHitFormValues } from "@/modules/activities/schemas/createMoleHitSchema";

interface EditableMoleHitActivity {
  slug: string;
  type: string;
  status: string;
  visibility: string;
  executionCount: number;
  createdAt: string;
  isOwner: boolean;
  coverMediaAssetId: string | null;
  coverImageUrl: string | null;
  coverAltText: string | null;
  version: {
    name: string;
    description: string | null;
    difficulty: CreateMoleHitFormValues["difficulty"];
    status: string;
    revision: number;
    content: { holeCount: 6 | 9 | 12; theme?: string; correctOptions: string[]; incorrectOptions: string[] };
    reviewFeedback: string | null;
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível carregar ou atualizar a atividade.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export default function EditMoleHitPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activity, setActivity] = useState<EditableMoleHitActivity | null>(null);
  const [initialValues, setInitialValues] = useState<CreateMoleHitFormValues | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [message, setMessage] = useState("");
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const slug = typeof router.query.slug === "string" ? router.query.slug : "";
    let active = true;
    async function load(): Promise<void> {
      if (!slug) { setError("Não foi possível identificar a atividade."); setLoading(false); return; }
      try {
        const api = (await import("@/lib/api")).default;
        const response = await api.get<{ success: true; data: EditableMoleHitActivity }>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        if (response.data.data.type !== "mole_hit") { setError("Esta atividade não é Acertar a Toupeira."); return; }
        const loaded = response.data.data;
        setActivity(loaded);
        setInitialValues({
          coverMediaAssetId: loaded.coverMediaAssetId,
          coverImageUrl: loaded.coverImageUrl,
          coverAltText: loaded.coverAltText,
          name: loaded.version.name,
          description: loaded.version.description ?? "",
          difficulty: loaded.version.difficulty,
          content: {
            holeCount: loaded.version.content.holeCount,
            correctOptions: loaded.version.content.correctOptions ?? [],
            incorrectOptions: loaded.version.content.incorrectOptions ?? [],
          },
        });
      } catch (cause: unknown) { if (active) setError(getErrorMessage(cause)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [router.isReady, router.query.slug]);

  async function handleSubmit(values: CreateMoleHitFormValues): Promise<void> {
    if (!activity) return;
    setSubmitError("");
    setMessage("");
    try {
      const api = (await import("@/lib/api")).default;
      const response = await api.patch<{ success: true; data: { version: { status: string; revision: number } } }>(`/activities/${encodeURIComponent(activity.slug)}/mole-hit`, {
        name: values.name.trim(),
        description: values.description.trim() || null,
        difficulty: values.difficulty,
        content: {
          holeCount: values.content.holeCount,
          correctOptions: values.content.correctOptions,
          incorrectOptions: values.content.incorrectOptions,
        },
      });
      if (values.coverMediaAssetId !== undefined) await activityCoverService.update(activity.slug, values.coverMediaAssetId);
      setActivity((current) => current ? { ...current, version: { ...current.version, ...values, status: response.data.data.version.status, revision: response.data.data.version.revision, reviewFeedback: null } } : current);
      setInitialValues(values);
      setMessage(t("activity.page.updatedDraft"));
    } catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
  }

  async function handleResubmit(): Promise<void> {
    if (!activity || resubmitting) return;
    setResubmitting(true);
    setSubmitError("");
    try {
      await submitActivityVersionService.execute(activity.slug);
      setActivity((current) => current ? { ...current, version: { ...current.version, status: "PENDING_REVIEW", reviewFeedback: null } } : current);
      setMessage(t("activity.page.resubmitSuccess"));
    } catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
    finally { setResubmitting(false); }
  }

  const canSubmit = activity !== null && ["DRAFT", "REJECTED", "CHANGES_REQUESTED"].includes(activity.version.status);
  return (
    <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title={t("activity.page.edit.moleHit")} description={t("activity.page.editDescription.moleHit")}>
      <div className="mb-6"><Link href="/teacher/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft aria-hidden="true" size={16} /> Voltar às atividades</Link></div>
      {loading ? <section role="status" className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6"><LoaderCircle aria-hidden="true" className="size-8 animate-spin" /><span>Carregando atividade...</span></section>
      : error ? <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</section>
      : activity && initialValues ? <>
        {message && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 aria-hidden="true" size={18} />{message}</p>}
        {activity.version.reviewFeedback && <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-amber-900">Observações da revisão</h2><p className="mt-2 whitespace-pre-wrap text-sm text-amber-800">{activity.version.reviewFeedback}</p></section>}
        <MoleHitForm initialValues={initialValues} onSubmit={handleSubmit} submitError={submitError} submitLabel="Salvar alterações" />
        {canSubmit && <section className="mt-6 rounded-2xl border border-border bg-surface p-5"><h2 className="font-semibold text-dark">Enviar para aprovação</h2><p className="mt-1 text-sm text-muted">Salve as alterações antes de enviar a versão para análise administrativa.</p><button type="button" onClick={() => void handleResubmit()} disabled={resubmitting} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{resubmitting ? "Enviando..." : t("activity.page.sendApproval")}</button></section>}
      </> : null}
    </RoleBasedLayout>
  );
}
