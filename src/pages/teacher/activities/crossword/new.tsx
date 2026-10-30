import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { CrosswordForm } from "@/modules/activities/components/CrosswordForm";
import { createCrosswordService } from "@/modules/activities/services/crossword/createCrosswordService";
import type { CreateCrosswordFormValues } from "@/modules/activities/schemas/createCrosswordSchema";

const ACTIVITIES_LIST_ROUTE = "/teacher/activities";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return responseData?.error?.message
      ?? responseData?.message
      ?? "Não foi possível criar a cruzadinha. Revise as respostas e tente novamente.";
  }

  return "Ocorreu um erro inesperado ao criar a cruzadinha.";
}

export default function NewCrosswordPage() {
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(values: CreateCrosswordFormValues): Promise<void> {
    setSubmitError("");

    try {
      await createCrosswordService.execute({
        name: values.name,
        description: values.description,
        difficulty: values.difficulty,
        timeLimitSeconds: values.timeLimitSeconds,
        words: values.words,
      });
      setSuccess(true);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error));
    }
  }

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Criar palavras cruzadas"
      description="Monte uma cruzadinha com respostas e pistas personalizadas para seus alunos."
    >
      {success ? (
        <section
          aria-labelledby="creation-success-title"
          className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-surface p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 aria-hidden="true" className="mb-4 size-14 text-green-600" />
            <h2 id="creation-success-title" className="text-2xl font-semibold text-dark">
              Cruzadinha criada com sucesso!
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              Sua atividade foi salva como rascunho. Para enviá-la à aprovação do administrador, abra Minhas atividades, clique em Editar e selecione Enviar para aprovação.
            </p>
            <div className="mt-5 w-full rounded-xl bg-amber-50 p-4 text-left">
              <p className="font-medium text-amber-900">O que acontece agora?</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Depois do envio, a atividade ficará disponível para você e para os administradores durante a análise. Os demais professores só poderão acessá-la após a aprovação.
              </p>
            </div>
            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={ACTIVITIES_LIST_ROUTE}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <ClipboardList aria-hidden="true" size={18} />
                Ver minhas atividades
              </Link>
              <Link
                href="/teacher"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-medium text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <ArrowLeft aria-hidden="true" size={18} />
                Voltar à área do professor
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="mb-6">
            <Link
              href="/teacher/activities/new"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Escolher outro tipo de atividade
            </Link>
          </div>
          <CrosswordForm onSubmit={handleSubmit} submitError={submitError} />
        </>
      )}
    </RoleBasedLayout>
  );
}
