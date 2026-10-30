import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Gamepad2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import type {
  ActivityListData,
  ListedActivity,
} from "@/modules/activities/types/activityList.types";

const CREATE_ACTIVITY_ROUTE = "/teacher/activities/word-search/new";

const versionStatusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_REVIEW: "Aguardando aprovação",
  PUBLISHED: "Publicada",
  REJECTED: "Rejeitada",
  CHANGES_REQUESTED: "Alterações solicitadas",
};

const activityStatusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  ARCHIVED: "Arquivada",
};

const difficultyLabels: Record<string, string> = {
  EASY: "Fácil",
  MEDIUM: "Média",
  HARD: "Difícil",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      responseData?.error?.message ??
      responseData?.message ??
      "Não foi possível carregar suas atividades. Tente novamente."
    );
  }

  return "Ocorreu um erro inesperado ao carregar as atividades.";
}

function getStatusLabel(activity: ListedActivity): string {
  return activity.latestVersion
    ? versionStatusLabels[activity.latestVersion.status] ??
        activityStatusLabels[activity.status] ??
        activity.status
    : activityStatusLabels[activity.status] ?? activity.status;
}

function getStatusClass(activity: ListedActivity): string {
  const status = activity.latestVersion?.status ?? activity.status;

  if (status === "PUBLISHED") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "PENDING_REVIEW") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "REJECTED" || status === "CHANGES_REQUESTED") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-border bg-background text-muted";
}

function canEditActivity(activity: ListedActivity): boolean {
  if (activity.type !== "word_search" || !activity.latestVersion) {
    return false;
  }

  return ["DRAFT", "REJECTED", "CHANGES_REQUESTED"].includes(
    activity.latestVersion.status,
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function TeacherActivitiesPage() {
  const [result, setResult] = useState<ActivityListData | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listActivitiesService
      .execute(page, 20)
      .then((data) => {
        if (cancelled) return;

        setResult(data);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Minhas atividades"
      description="Consulte suas atividades, acompanhe o status de aprovação e gerencie seus materiais pedagógicos."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/teacher"
          className="inline-flex min-h-10 items-center gap-2 self-start text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Área do professor
        </Link>

        <Link
          href={CREATE_ACTIVITY_ROUTE}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Plus size={18} aria-hidden="true" />
          Criar caça-palavras
        </Link>
      </div>

      {errorMessage && (
        <section
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm leading-6">{errorMessage}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((current) => current + 1);
            }}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-red-300 px-3 text-sm font-semibold transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Tentar novamente
          </button>
        </section>
      )}

      {isLoading && !result ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm"
        >
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-sm text-muted">Carregando atividades...</p>
        </section>
      ) : result && result.items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList size={26} aria-hidden="true" />
          </span>

          <h2 className="mt-5 text-lg font-semibold text-dark">
            Você ainda não tem atividades
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Crie seu primeiro caça-palavras para começar a organizar atividades
            para seus alunos.
          </p>

          <Link
            href={CREATE_ACTIVITY_ROUTE}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            Criar caça-palavras
          </Link>
        </section>
      ) : result ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {result.pagination.total === 1
                ? "1 atividade encontrada"
                : `${result.pagination.total} atividades encontradas`}
            </p>

            {isLoading && (
              <span className="text-xs text-muted">Atualizando...</span>
            )}
          </div>

          <section
            aria-label="Lista de atividades"
            className="grid gap-4 lg:grid-cols-2"
          >
            {result.items.map((activity) => (
              <article
                key={activity.slug}
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {activity.type === "word_search"
                        ? "Caça-palavras"
                        : activity.type.replaceAll("_", " ")}
                    </p>

                    <h2 className="mt-2 wrap-break-word text-lg font-semibold text-dark">
                      {activity.latestVersion?.name ??
                        activity.publishedVersion?.name ??
                        "Atividade sem título"}
                    </h2>

                    {activity.latestVersion?.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                        {activity.latestVersion.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(activity)}`}
                  >
                    {getStatusLabel(activity)}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
                  {activity.latestVersion && (
                    <span>
                      Dificuldade:{" "}
                      <strong className="font-semibold text-dark">
                        {difficultyLabels[activity.latestVersion.difficulty] ??
                          activity.latestVersion.difficulty}
                      </strong>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} aria-hidden="true" />
                    {activity.latestVersion?.timeLimitSeconds == null
                      ? "Sem limite de tempo"
                      : `${Math.floor(activity.latestVersion.timeLimitSeconds / 60)} min`}
                  </span>

                  <span>Criada em {formatDate(activity.createdAt)}</span>
                </div>

                {activity.latestVersion?.status === "REJECTED" &&
                  activity.latestVersion.revision > 0 && (
                    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">
                      Esta versão foi rejeitada. Os detalhes da revisão estarão
                      disponíveis ao abrir a atividade.
                    </p>
                  )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {activity.executionCount}{" "}
                    {activity.executionCount === 1 ? "execução" : "execuções"}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {activity.type === "word_search" && (
                      <Link
                        href={`/activities/word-search/${encodeURIComponent(activity.slug)}/play`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        <Gamepad2 size={16} aria-hidden="true" />
                        Executar
                      </Link>
                    )}

                    {canEditActivity(activity) && (
                      <Link
                        href={`/teacher/activities/word-search/${encodeURIComponent(activity.slug)}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>

          {result.pagination.totalPages > 1 && (
            <nav
              aria-label="Paginação das atividades"
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((currentPage) => Math.max(1, currentPage - 1));
                }}
                disabled={page <= 1 || isLoading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                Anterior
              </button>

              <span className="text-sm text-muted">
                Página {result.pagination.page} de{" "}
                {result.pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((currentPage) =>
                    Math.min(result.pagination.totalPages, currentPage + 1),
                  );
                }}
                disabled={
                  page >= result.pagination.totalPages || isLoading
                }
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : null}
    </RoleBasedLayout>
  );
}