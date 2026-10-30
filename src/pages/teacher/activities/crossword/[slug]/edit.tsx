import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList, LoaderCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { CrosswordForm } from "@/modules/activities/components/CrosswordForm";
import { getCrosswordService } from "@/modules/activities/services/crossword/getCrosswordService";
import { updateCrosswordService } from "@/modules/activities/services/crossword/updateCrosswordService";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";
import type { CreateCrosswordFormValues } from "@/modules/activities/schemas/createCrosswordSchema";
import type { EditableCrosswordActivity } from "@/modules/activities/types/crossword.types";

const ACTIVITIES_LIST_ROUTE = "/teacher/activities";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return responseData?.error?.message
      ?? responseData?.message
      ?? "Não foi possível carregar ou atualizar a cruzadinha.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

function toFormValues(activity: EditableCrosswordActivity): CreateCrosswordFormValues {
  const rawWords = activity.version.content.words;
  const words = Array.isArray(rawWords)
    ? rawWords.flatMap((entry): { word: string; clue: string }[] => {
        if (
          typeof entry !== "object" ||
          entry === null ||
          !("word" in entry) ||
          !("clue" in entry) ||
          typeof entry.word !== "string" ||
          typeof entry.clue !== "string"
        ) {
          return [];
        }
        return [{ word: entry.word, clue: entry.clue }];
      })
    : [];

  return {
    name: activity.version.name,
    description: activity.version.description ?? "",
    difficulty: activity.version.difficulty,
    timeLimitSeconds: activity.version.timeLimitSeconds,
    words: words.length >= 3 ? words : [
      { word: "", clue: "" },
      { word: "", clue: "" },
      { word: "", clue: "" },
    ],
  };
}

export default function EditCrosswordPage() {
  const router = useRouter();
  const [activity, setActivity] = useState<EditableCrosswordActivity | null>(null);
  const [initialValues, setInitialValues] = useState<CreateCrosswordFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitMessage, setResubmitMessage] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const slugParam = router.query.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    let cancelled = false;

    async function loadActivity(): Promise<void> {
      if (!slug) {
        setLoadError("Não foi possível identificar a atividade.");
        setLoading(false);
        return;
      }

      try {
        const result = await getCrosswordService.execute(slug);
        if (cancelled) return;

        if (result.type !== "crossword") {
          setLoadError("Esta página permite editar somente atividades de palavras cruzadas.");
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

    void loadActivity();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.slug]);

  async function handleSubmit(values: CreateCrosswordFormValues): Promise<void> {
    if (!activity) {
      setSubmitError("Não foi possível identificar a atividade.");
      return;
    }

    setSubmitError("");
    setSuccessMessage("");

    try {
      const result = await updateCrosswordService.execute(activity.slug, {
        name: values.name,
        description: values.description,
        difficulty: values.difficulty,
        timeLimitSeconds: values.timeLimitSeconds,
        words: values.words,
      });

      setActivity((current) => current ? {
        ...current,
        version: {
          ...current.version,
          name: values.name,
          description: values.description?.trim() ?? null,
          difficulty: values.difficulty,
          timeLimitSeconds: values.timeLimitSeconds ?? null,
          status: result.version.status,
          content: { ...current.version.content, words: values.words },
        },
      } : current);
      setInitialValues(values);
      setSuccessMessage("Alterações salvas. A atividade continua como rascunho até ser enviada para aprovação.");
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
        version: {
          ...current.version,
          status: "PENDING_REVIEW",
          reviewFeedback: null,
          submittedAt: new Date().toISOString(),
        },
      } : current);
      setResubmitMessage("Atividade enviada para aprovação.");
    } catch (error: unknown) {
      setResubmitMessage(getErrorMessage(error));
    } finally {
      setResubmitting(false);
    }
  }

  const canSubmitForReview = activity !== null && [
    "DRAFT",
    "REJECTED",
    "CHANGES_REQUESTED",
  ].includes(activity.version.status);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Editar palavras cruzadas"
      description="Atualize as informações, respostas e pistas da sua atividade."
    >
      <div className="mb-6">
        <Link
          href={ACTIVITIES_LIST_ROUTE}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Voltar às minhas atividades
        </Link>
      </div>

      {loading ? (
        <section role="status" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6">
          <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted">Carregando cruzadinha...</p>
        </section>
      ) : loadError ? (
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Não foi possível abrir a atividade</h2>
          <p className="mt-2 text-sm leading-6 text-red-700">{loadError}</p>
          <Link href={ACTIVITIES_LIST_ROUTE} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            <ClipboardList aria-hidden="true" size={16} />
            Voltar às atividades
          </Link>
        </section>
      ) : activity && initialValues ? (
        <>
          {successMessage && (
            <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}
          {activity.version.reviewFeedback && (
            <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="font-semibold text-amber-900">Observações da revisão</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-800">{activity.version.reviewFeedback}</p>
            </section>
          )}
          <CrosswordForm
            mode="edit"
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitError={submitError}
          />
          {canSubmitForReview && (
            <section className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-semibold text-dark">Pronto para enviar?</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Depois de salvar suas alterações, envie a versão para análise do administrador.
              </p>
              {resubmitMessage && (
                <p role="status" className="mt-3 text-sm text-dark">{resubmitMessage}</p>
              )}
              <button
                type="button"
                onClick={() => void handleResubmit()}
                disabled={resubmitting}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resubmitting ? "Enviando..." : "Enviar para aprovação"}
              </button>
            </section>
          )}
        </>
      ) : null}
    </RoleBasedLayout>
  );
}
