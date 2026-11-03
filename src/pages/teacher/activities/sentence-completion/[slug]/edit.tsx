import { useEffect, useState } from "react";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { SentenceCompletionForm } from "@/modules/activities/components/DragDropActivityForms";
import { createDragDropActivityService } from "@/modules/activities/services/createDragDropActivityService";
import { createDragDropId, type CreateSentenceCompletionFormValues, type SentencePartValue } from "@/modules/activities/schemas/createDragDropSchemas";
import api from "@/lib/api";

interface Response {
  success: true;
  data: {
    slug: string;
    type: string;
    coverMediaAssetId: string | null;
    coverImageUrl: string | null;
    coverAltText: string | null;
    version: {
      name: string;
      description: string | null;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      timeLimitSeconds: number | null;
      content: {
        words: Array<{ id: string; text: string }>;
        sentences: Array<{ id: string; text: string; blanks: Array<{ id: string; expectedWordId: string }> }>;
      };
    };
  };
}
function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível carregar a atividade.";
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}
function toParts(text: string, blanks: Array<{ id: string; expectedWordId: string }>): SentencePartValue[] {
  const parts: SentencePartValue[] = [];
  const blankMap = new Map(blanks.map((blank) => [blank.id, blank.expectedWordId]));
  const segments = text.split(/(\{\{[^{}]+\}\})/g);
  segments.forEach((segment) => {
    const match = /^\{\{([^{}]+)\}\}$/.exec(segment);
    if (match) {
      const id = match[1];
      parts.push({ id, type: "blank", expectedWordId: blankMap.get(id) ?? "" });
    } else if (segment.length > 0) {
      parts.push({ id: createDragDropId("text"), type: "text", value: segment });
    }
  });
  return parts;
}

export default function EditSentenceCompletionPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [initialValues, setInitialValues] = useState<CreateSentenceCompletionFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const response = await api.get<Response>(`/activities/${encodeURIComponent(slug)}`);
        if (!active) return;
        const activity = response.data.data;
        if (activity.type !== "sentence_completion") throw new Error("Esta atividade não é do tipo Complete as Frases.");
        setInitialValues({
          name: activity.version.name,
          description: activity.version.description ?? "",
          difficulty: activity.version.difficulty,
          timeLimitSeconds: activity.version.timeLimitSeconds,
          content: {
            words: activity.version.content.words.map((word) => ({ ...word })),
            sentences: activity.version.content.sentences.map((sentence) => ({ id: sentence.id, parts: toParts(sentence.text, sentence.blanks) })),
          },
        });
      } catch (loadError: unknown) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router.isReady, slug]);

  async function handleSubmit(values: CreateSentenceCompletionFormValues): Promise<void> {
    setSubmitError("");
    try {
      await createDragDropActivityService.updateSentenceCompletion(slug, values);
      const coverId = (values as CreateSentenceCompletionFormValues & { coverMediaAssetId?: string | null }).coverMediaAssetId;
      if (coverId !== undefined) await activityCoverService.update(slug, coverId);
      setSuccess(true);
    }
    catch (updateError: unknown) { setSubmitError(errorMessage(updateError)); }
  }

  return <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title="Editar Complete as Frases" description="Revise o banco de palavras, as frases e as respostas esperadas.">
    <div className="mb-6"><Link href="/teacher/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><ArrowLeft size={16} aria-hidden="true" />Voltar às atividades</Link></div>
    {loading ? <p role="status" className="rounded-xl bg-surface p-6 text-sm text-muted">Carregando atividade...</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : success ? <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8"><CheckCircle2 aria-hidden="true" className="mx-auto mb-4 size-14 text-green-600" /><h2 className="text-2xl font-semibold text-dark">Alterações salvas!</h2><p className="mt-3 text-sm leading-6 text-muted">A atividade foi atualizada. Se necessário, envie a nova versão para aprovação.</p><Link href="/teacher/activities" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-white"><ClipboardList size={18} aria-hidden="true" />Minhas atividades</Link></section> : initialValues ? <SentenceCompletionForm initialValues={initialValues} submitLabel="Salvar alterações" onSubmit={handleSubmit} submitError={submitError} /> : null}
  </RoleBasedLayout>;
}
