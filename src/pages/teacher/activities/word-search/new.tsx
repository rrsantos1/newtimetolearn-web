import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { WordSearchForm } from "@/modules/activities/components/WordSearchForm";
import { createWordSearchService } from "@/modules/activities/services/wordSearch/createWordSearchService";
import type { CreateWordSearchFormValues } from "@/modules/activities/schemas/createWordSearchSchema";

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
      "Não foi possível criar a atividade. Tente novamente."
    );
  }

  return "Ocorreu um erro inesperado ao criar a atividade.";
}

export default function NewWordSearchPage() {
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(
    values: CreateWordSearchFormValues,
  ): Promise<void> {
    setSubmitError("");

    try {
      await createWordSearchService.execute(values);
      setSuccess(true);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error));
    }
  }

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Criar caça-palavras"
      description="Crie uma atividade personalizada para seus alunos."
    >
      {success ? (
        <section
          aria-labelledby="creation-success-title"
          className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col items-center text-center">
            <CheckCircle2
              aria-hidden="true"
              className="mb-4 size-14 text-green-600"
            />

            <h2
              id="creation-success-title"
              className="text-2xl font-semibold text-gray-900"
            >
              Atividade criada com sucesso!
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-gray-600">
              Seu caça-palavras foi salvo como rascunho. Para enviá-lo à aprovação do administrador, abra Minhas atividades, clique em Editar e selecione Enviar para aprovação.
            </p>

            <div className="mt-5 w-full rounded-xl bg-amber-50 p-4 text-left">
              <p className="font-medium text-amber-900">
                O que acontece agora?
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Depois do envio, a atividade ficará disponível para você e para os administradores durante a análise. Os demais professores só poderão acessá-la após a aprovação.
              </p>
            </div>

            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={ACTIVITIES_LIST_ROUTE}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-gray-900 transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <ClipboardList aria-hidden="true" className="size-5" />
                Ver minhas atividades
              </Link>

              <Link
                href="/teacher"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
                Voltar à área do professor
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="mb-6">
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Voltar à área do professor
            </Link>
          </div>

          <WordSearchForm
            onSubmit={handleSubmit}
            submitError={submitError}
          />
        </>
      )}
    </RoleBasedLayout>
  );
}