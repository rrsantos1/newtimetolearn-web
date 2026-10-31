import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList, LoaderCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { QuizForm } from "@/modules/activities/components/QuizForm";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";
import { getQuizService, type EditableQuizActivity } from "@/modules/activities/services/getQuizService";
import { updateQuizService } from "@/modules/activities/services/updateQuizService";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível carregar ou atualizar o Quiz.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readImages(value: unknown): { storageKey: string; altText: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.storageKey !== "string") return [];
    return [{ storageKey: entry.storageKey, altText: typeof entry.altText === "string" ? entry.altText : "" }];
  });
}

function toFormValues(activity: EditableQuizActivity): CreateQuizFormValues {
  const rawQuestions = activity.version.content.questions;
  const questions = Array.isArray(rawQuestions) ? rawQuestions.flatMap((rawQuestion) => {
    if (!isRecord(rawQuestion)) return [];
    const options = Array.isArray(rawQuestion.options) ? rawQuestion.options.flatMap((rawOption) => {
      if (!isRecord(rawOption) || typeof rawOption.id !== "string") return [];
      return [{
        id: rawOption.id,
        text: typeof rawOption.text === "string" ? rawOption.text : "",
        images: readImages(rawOption.images),
      }];
    }) : [];
    if (typeof rawQuestion.id !== "string") return [];
    return [{
      id: rawQuestion.id,
      statement: typeof rawQuestion.statement === "string" ? rawQuestion.statement : "",
      images: readImages(rawQuestion.images),
      options: options.length >= 3 ? options : [
        { id: globalThis.crypto.randomUUID(), text: "", images: [] },
        { id: globalThis.crypto.randomUUID(), text: "", images: [] },
        { id: globalThis.crypto.randomUUID(), text: "", images: [] },
      ],
      correctOptionId: typeof rawQuestion.correctOptionId === "string" ? rawQuestion.correctOptionId : (options[0]?.id ?? ""),
      explanation: typeof rawQuestion.explanation === "string" ? rawQuestion.explanation : "",
    }];
  }) : [];

  return {
    name: activity.version.name,
    description: activity.version.description ?? "",
    difficulty: activity.version.difficulty,
    timeLimitSeconds: activity.version.timeLimitSeconds ?? 900,
    content: {
      questions: questions.length > 0 ? questions : [{
        id: globalThis.crypto.randomUUID(),
        statement: "",
        images: [],
        options: [
          { id: globalThis.crypto.randomUUID(), text: "", images: [] },
          { id: globalThis.crypto.randomUUID(), text: "", images: [] },
          { id: globalThis.crypto.randomUUID(), text: "", images: [] },
        ],
        correctOptionId: "",
        explanation: "",
      }],
    },
  };
}

export default function EditQuizPage() {
  const router = useRouter();
  const [activity, setActivity] = useState<EditableQuizActivity | null>(null);
  const [initialValues, setInitialValues] = useState<CreateQuizFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resubmitMessage, setResubmitMessage] = useState("");
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const slugParam = router.query.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    let cancelled = false;

    async function load(): Promise<void> {
      if (!slug) {
        setLoadError("Não foi possível identificar o Quiz.");
        setLoading(false);
        return;
      }
      try {
        const result = await getQuizService.execute(slug);
        if (cancelled) return;
        if (result.type !== "quiz") {
          setLoadError("Esta página permite editar somente atividades do tipo Quiz.");
          return;
        }
        setActivity(result);
        setInitialValues(toFormValues(result));
      } catch (error: unknown) {
        if (!cancelled) setLoadError(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [router.isReady, router.query.slug]);

  async function handleSubmit(values: CreateQuizFormValues): Promise<void> {
    if (!activity) return;
    setSubmitError("");
    setSuccessMessage("");
    try {
      const result = await updateQuizService.execute(activity.slug, values);
      setActivity((current) => current ? {
        ...current,
        version: {
          ...current.version,
          name: values.name,
          description: values.description?.trim() || null,
          difficulty: values.difficulty,
          timeLimitSeconds: values.timeLimitSeconds ?? null,
          status: result.version.status,
          revision: result.version.revision,
          content: values.content,
          reviewFeedback: null,
        },
      } : current);
      setInitialValues(values);
      setSuccessMessage("Alterações salvas. O Quiz continua como rascunho até ser enviado para aprovação.");
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error));
    }
  }

  async function handleResubmit(): Promise<void> {
    if (!activity || resubmitting) return;
    setResubmitting(true);
    setResubmitMessage("");
    try {
      await submitActivityVersionService.execute(activity.slug);
      setActivity((current) => current ? {
        ...current,
        version: { ...current.version, status: "PENDING_REVIEW", reviewFeedback: null, submittedAt: new Date().toISOString() },
      } : current);
      setResubmitMessage("Quiz enviado para aprovação.");
    } catch (error: unknown) {
      setResubmitMessage(getErrorMessage(error));
    } finally {
      setResubmitting(false);
    }
  }

  const canSubmitForReview = activity !== null && ["DRAFT", "REJECTED", "CHANGES_REQUESTED"].includes(activity.version.status);

  return (
    <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title="Editar Quiz" description="Atualize as questões e as alternativas da atividade.">
      <div className="mb-6">
        <Link href="/teacher/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          <ArrowLeft aria-hidden="true" size={16} /> Voltar às minhas atividades
        </Link>
      </div>
      {loading ? (
        <section role="status" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6">
          <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted">Carregando Quiz...</p>
        </section>
      ) : loadError ? (
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Não foi possível abrir o Quiz</h2>
          <p className="mt-2 text-sm text-red-700">{loadError}</p>
          <Link href="/teacher/activities" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            <ClipboardList aria-hidden="true" size={16} /> Voltar às atividades
          </Link>
        </section>
      ) : activity && initialValues ? (
        <>
          {successMessage && <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 aria-hidden="true" size={18} className="mt-0.5 shrink-0" /><p>{successMessage}</p></div>}
          {activity.version.reviewFeedback && <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-amber-900">Observações da revisão</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-800">{activity.version.reviewFeedback}</p></section>}
          <QuizForm initialValues={initialValues} submitLabel="Salvar alterações" onSubmit={handleSubmit} submitError={submitError} />
          {canSubmitForReview && (
            <section className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-semibold text-dark">Pronto para enviar?</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Salve as alterações antes de enviar esta versão para análise administrativa.</p>
              {resubmitMessage && <p role="status" className="mt-3 text-sm text-dark">{resubmitMessage}</p>}
              <button type="button" onClick={() => void handleResubmit()} disabled={resubmitting} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60">
                {resubmitting ? "Enviando..." : "Enviar para aprovação"}
              </button>
            </section>
          )}
        </>
      ) : null}
    </RoleBasedLayout>
  );
}
