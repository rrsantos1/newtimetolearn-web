import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { WordSearchForm } from "@/modules/activities/components/WordSearchForm";
import type { CreateWordSearchFormValues } from "@/modules/activities/schemas/createWordSearchSchema";
import type { EditableWordSearchActivity } from "@/modules/activities/types/activities.types";
import { getWordSearchActivityService } from "@/modules/activities/services/wordSearch/getWordSearchActivityService";
import { updateWordSearchActivityService } from "@/modules/activities/services/wordSearch/updateWordSearchActivityService";
import { submitActivityVersionService } from "@/modules/activities/services/wordSearch/submitActivityVersionService";

const ACTIVITIES_LIST_ROUTE = "/teacher/activities";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          error?: { message?: string };
          message?: string;
        }
      | undefined;

    return (
      responseData?.error?.message ??
      responseData?.message ??
      "Não foi possível carregar ou atualizar a atividade. Tente novamente."
    );
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

function toFormValues(
  activity: EditableWordSearchActivity,
): CreateWordSearchFormValues {
  const contentWords = activity.version.content.words;

  const words = Array.isArray(contentWords)
    ? contentWords.filter(
        (word): word is string => typeof word === "string",
      )
    : [];

  return {
    name: activity.version.name,
    description: activity.version.description ?? "",
    difficulty: activity.version.difficulty,
    timeLimitSeconds: activity.version.timeLimitSeconds,
    words,
  };
}

export default function EditWordSearchPage() {
  const router = useRouter();
  const [activity, setActivity] = useState<EditableWordSearchActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
        return;
    }

    const slugParam = router.query.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

    let cancelled = false;

    async function loadActivity() {
        if (!slug) {
            setLoadError("Não foi possível identificar a atividade.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError("");

        try {
            const result =
                await getWordSearchActivityService.execute(slug);

            if (cancelled) {
                return;
            }

            if (result.type !== "word_search") {
                setLoadError(
                "Esta página permite editar somente atividades do tipo caça-palavras.",
                );
                return;
            }

            setActivity(result);
        } catch (error: unknown) {
        if (!cancelled) {
            setLoadError(getErrorMessage(error));
        }
        } finally {
        if (!cancelled) {
            setLoading(false);
        }
        }
    }

    void loadActivity();

    return () => {
        cancelled = true;
    };
  }, [router.isReady, router.query.slug]);

  async function handleSubmit(
        values: CreateWordSearchFormValues,
    ): Promise<void> {
        if (!activity) {
        setSubmitError("Não foi possível identificar a atividade.");
        return;
        }

        setSubmitError("");
        setSuccess(false);

        try {
        const result = await updateWordSearchActivityService.execute(
            activity.slug,
            {
            name: values.name,
            description: values.description,
            difficulty: values.difficulty,
            timeLimitSeconds: values.timeLimitSeconds,
            words: values.words,
            },
        );

        setActivity((current) => {
            if (!current) {
            return current;
            }

            return {
                ...current,
                version: {
                    ...current.version,
                    name: values.name,
                    description: values.description || null,
                    difficulty: values.difficulty,
                    timeLimitSeconds: values.timeLimitSeconds ?? null,
                    status: "DRAFT",
                    content: {
                        ...current.version.content,
                        words: values.words,
                    },
                },
            };
        });

        setSuccess(true);

        // O resultado da API é mantido disponível para uso posterior,
        // incluindo a pré-visualização da nova grade.
        void result;
        } catch (error: unknown) {
        setSubmitError(getErrorMessage(error));
        }
    }

    async function handleResubmit(): Promise<void> {
        if (!activity || resubmitting) {return}

        setResubmitError("");
        setResubmitSuccess(false);
        setResubmitting(true);

        try {
            await submitActivityVersionService.execute(activity.slug);

            setActivity((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    version: {
                    ...current.version,
                    status: "PENDING_REVIEW",
                    reviewFeedback: null,
                    submittedAt: new Date().toISOString(),
                    },
                };
            });

            setResubmitSuccess(true);
        } catch (error: unknown) {
        setResubmitError(getErrorMessage(error));
        } finally {
        setResubmitting(false);
        }
    }

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Editar caça-palavras"
      description="Atualize as informações e as palavras da sua atividade."
    >
      <div className="mb-6">
        <Link
          href={ACTIVITIES_LIST_ROUTE}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar às minhas atividades
        </Link>
      </div>

      {loading ? (
        <div
          role="status"
          className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6"
        >
          <LoaderCircle
            aria-hidden="true"
            className="size-8 animate-spin text-primary"
          />

          <p className="text-sm text-muted">
            Carregando atividade...
          </p>
        </div>
      ) : loadError ? (
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <h2 className="font-semibold text-red-800">
            Não foi possível abrir a atividade
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-700">
            {loadError}
          </p>

          <Link
            href={ACTIVITIES_LIST_ROUTE}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ClipboardList aria-hidden="true" className="size-4" />
            Voltar às atividades
          </Link>
        </section>
      ) : success ? (
        <section
          aria-labelledby="edit-success-title"
          className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-surface p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col items-center text-center">
            <CheckCircle2
              aria-hidden="true"
              className="mb-4 size-14 text-green-600"
            />

            <h2
              id="edit-success-title"
              className="text-2xl font-semibold text-dark"
            >
              Alterações salvas!
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              As alterações da atividade foram enviadas com sucesso.
              A disponibilidade da versão atualizada seguirá o fluxo
              de aprovação da plataforma.
            </p>

            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Continuar editando
              </button>

              <Link
                href={ACTIVITIES_LIST_ROUTE}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-dark transition hover:bg-background"
              >
                <ClipboardList
                  aria-hidden="true"
                  className="size-4"
                />
                Ver minhas atividades
              </Link>
            </div>
          </div>
        </section>
      ) : activity ? (
        <div className="space-y-6">
            {(
                activity.version.status === "REJECTED" ||
                activity.version.status === "CHANGES_REQUESTED" ||
                (
                    activity.version.status === "DRAFT" &&
                    Boolean(activity.version.reviewFeedback)
                )
            ) && (
            <section
                aria-labelledby="review-feedback-title"
                className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6"
            >
                <h2
                id="review-feedback-title"
                className="text-lg font-semibold text-amber-900"
                >
                {activity.version.status === "REJECTED"
                    ? "Atividade rejeitada"
                    : "Correções solicitadas"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                Confira as observações do administrador antes de reenviar
                sua atividade.
                </p>

                {activity.version.reviewFeedback ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-dark">
                    {activity.version.reviewFeedback}
                    </p>
                </div>
                ) : (
                <p className="mt-3 text-sm text-amber-800">
                    Nenhuma observação foi registrada pelo administrador.
                </p>
                )}

                <div className="mt-5 space-y-3">
                {resubmitError && (
                    <p role="alert" className="text-sm text-red-700">
                    {resubmitError}
                    </p>
                )}

                {resubmitSuccess && (
                    <p
                    role="status"
                    className="text-sm font-medium text-green-700"
                    >
                    Atividade reenviada com sucesso para análise.
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => void handleResubmit()}
                    disabled={resubmitting || resubmitSuccess}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {resubmitting && (
                    <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                    />
                    )}

                    {resubmitting
                    ? "Enviando para análise..."
                    : resubmitSuccess
                        ? "Enviada para análise"
                        : "Reenviar para aprovação"}
                </button>
                </div>
            </section>
            )}

            {activity.version.status === "PENDING_REVIEW" ? (
                <section
                    role="status"
                    className="rounded-2xl border border-blue-200 bg-blue-50 p-6"
                >
                    <h2 className="text-lg font-semibold text-blue-900">
                    Atividade em análise
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-blue-800">
                    Sua atividade foi enviada para revisão. Você poderá
                    realizar novas alterações quando a análise for concluída.
                    </p>

                    <Link
                    href={ACTIVITIES_LIST_ROUTE}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                    <ClipboardList aria-hidden="true" className="size-4" />
                    Voltar às minhas atividades
                    </Link>
                </section>
                ) : (
                <WordSearchForm
                    key={activity.slug}
                    mode="edit"
                    initialValues={toFormValues(activity)}
                    onSubmit={handleSubmit}
                    submitError={submitError}
                />
            )}
        </div>
        ) : null}
    </RoleBasedLayout>
  );
}