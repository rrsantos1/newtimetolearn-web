import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { MemoryForm } from "@/modules/activities/components/MemoryForm";
import { getMemoryService, type EditableMemoryActivity } from "@/modules/activities/services/getMemoryService";
import { updateMemoryService } from "@/modules/activities/services/updateMemoryService";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";
import { createMemorySchema, type CreateMemoryFormValues, type MemoryItemValue } from "@/modules/activities/schemas/createMemorySchema";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readItem(value: unknown): MemoryItemValue {
  if (isRecord(value) && value.type === "image" && typeof value.storageKey === "string") {
    return { type: "image", storageKey: value.storageKey, altText: typeof value.altText === "string" ? value.altText : "" };
  }
  return { type: "text", value: isRecord(value) && typeof value.value === "string" ? value.value : "" };
}
function toFormValues(activity: EditableMemoryActivity): CreateMemoryFormValues {
  const pairs = Array.isArray(activity.version.content.pairs) ? activity.version.content.pairs.flatMap((raw): CreateMemoryFormValues["content"]["pairs"] => {
    if (!isRecord(raw) || typeof raw.id !== "string") return [];
    return [{ id: raw.id, first: readItem(raw.first), second: readItem(raw.second) }];
  }) : [];
  const fallback = Array.from({ length: 6 }, (_, index) => ({
    id: globalThis.crypto?.randomUUID?.() ?? `pair-${index}`,
    first: { type: "text" as const, value: "" },
    second: { type: "text" as const, value: "" },
  }));
  const candidate: CreateMemoryFormValues = {
    coverMediaAssetId: activity.coverMediaAssetId,
    coverImageUrl: activity.coverImageUrl,
    coverAltText: activity.coverAltText,
    name: activity.version.name,
    description: activity.version.description ?? "",
    difficulty: activity.version.difficulty,
    content: { pairs: pairs.length >= 3 ? pairs : fallback },
  };
  const parsed = createMemorySchema.cast(candidate) as CreateMemoryFormValues;
  return parsed;
}
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível carregar ou atualizar o jogo.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export default function EditMemoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activity, setActivity] = useState<EditableMemoryActivity | null>(null);
  const [initialValues, setInitialValues] = useState<CreateMemoryFormValues | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [message, setMessage] = useState("");
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const rawSlug = router.query.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    let active = true;
    async function load(): Promise<void> {
      if (!slug) { setError("Não foi possível identificar a atividade."); setLoading(false); return; }
      try {
        const result = await getMemoryService.execute(slug);
        if (!active) return;
        if (result.type !== "memory") { setError("Esta atividade não é um jogo da memória."); return; }
        setActivity(result);
        setInitialValues(toFormValues(result));
      } catch (cause: unknown) { if (active) setError(getErrorMessage(cause)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [router.isReady, router.query.slug]);

  async function handleSubmit(values: CreateMemoryFormValues): Promise<void> {
    if (!activity) return;
    setSubmitError(""); setMessage("");
    try {
      const result = await updateMemoryService.execute(activity.slug, values);
      const coverId = (values as CreateMemoryFormValues & { coverMediaAssetId?: string | null }).coverMediaAssetId;
      if (coverId !== undefined) await activityCoverService.update(activity.slug, coverId);
      setActivity((current) => current ? { ...current, version: { ...current.version, name: values.name, description: values.description.trim() || null, difficulty: values.difficulty, status: result.version.status, revision: result.version.revision, content: values.content, reviewFeedback: null } } : current);
      setInitialValues(values);
      setMessage(t("activity.page.updatedDraft"));
    } catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
  }

  async function handleResubmit(): Promise<void> {
    if (!activity || resubmitting) return;
    setResubmitting(true); setMessage("");
    try {
      await submitActivityVersionService.execute(activity.slug);
      setActivity((current) => current ? { ...current, version: { ...current.version, status: "PENDING_REVIEW", reviewFeedback: null, submittedAt: new Date().toISOString() } } : current);
      setMessage(t("activity.page.resubmitSuccess"));
    } catch (cause: unknown) { setSubmitError(getErrorMessage(cause)); }
    finally { setResubmitting(false); }
  }

  const canSubmit = activity !== null && ["DRAFT", "REJECTED", "CHANGES_REQUESTED"].includes(activity.version.status);
  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title={t("activity.page.edit.memory")} description={t("activity.page.editDescription.memory")}>
    <div className="mb-6"><Link href="/teacher/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft aria-hidden="true" size={16} /> Voltar às atividades</Link></div>
    {loading ? <section role="status" className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6"><LoaderCircle aria-hidden="true" className="size-8 animate-spin" /><span>Carregando atividade...</span></section>
    : error ? <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</section>
    : activity && initialValues ? <>
      {message && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 aria-hidden="true" size={18} />{message}</p>}
      {activity.version.reviewFeedback && <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-amber-900">Observações da revisão</h2><p className="mt-2 whitespace-pre-wrap text-sm text-amber-800">{activity.version.reviewFeedback}</p></section>}
      <MemoryForm initialValues={initialValues} onSubmit={handleSubmit} submitError={submitError} submitLabel="Salvar alterações" />
      {canSubmit && <section className="mt-6 rounded-2xl border border-border bg-surface p-5"><h2 className="font-semibold text-dark">Enviar para aprovação</h2><p className="mt-1 text-sm text-muted">Salve as alterações antes de enviar a versão para análise administrativa.</p><button type="button" onClick={() => void handleResubmit()} disabled={resubmitting} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">{resubmitting ? "Enviando..." : t("activity.page.sendApproval")}</button></section>}
    </> : null}
  </RoleBasedLayout>;
}
