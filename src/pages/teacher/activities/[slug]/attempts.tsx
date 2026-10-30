import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import {
  listActivityAttemptsService,
  type ActivityAttemptHistoryData,
} from "@/modules/activities/services/listActivityAttemptsService";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;

    return (
      responseData?.error?.message ??
      responseData?.message ??
      "Não foi possível carregar o histórico de tentativas."
    );
  }

  return "Ocorreu um erro inesperado ao carregar o histórico.";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes} min ${remainingSeconds.toString().padStart(2, "0")} s`
    : `${remainingSeconds} s`;
}

export default function ActivityAttemptsPage() {
  const router = useRouter();
  const slugValue = router.query.slug;
  const slug = Array.isArray(slugValue) ? slugValue[0] : slugValue;
  const [result, setResult] = useState<ActivityAttemptHistoryData | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!router.isReady || !slug) return;

    let cancelled = false;

    listActivityAttemptsService
      .execute(slug, page, 20)
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
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug, page, reloadKey]);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Histórico de tentativas"
      description="Acompanhe as pontuações, o desempenho e o tempo de execução dos alunos."
    >
      <div className="mb-6">
        <Link
          href="/teacher/activities"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Minhas atividades
        </Link>
      </div>

      {errorMessage && (
        <section
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-6">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((current) => current + 1);
            }}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-red-300 px-3 text-sm font-semibold transition hover:bg-red-100 disabled:opacity-60 sm:self-auto"
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
          <p className="text-sm text-muted">Carregando histórico...</p>
        </section>
      ) : result && result.items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Trophy size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-dark">
            Nenhuma tentativa registrada
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Quando os alunos concluírem esta atividade, os resultados aparecerão aqui.
          </p>
        </section>
      ) : result ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {result.pagination.total === 1
                ? "1 tentativa registrada"
                : `${result.pagination.total} tentativas registradas`}
            </p>
            {isLoading && <span className="text-xs text-muted">Atualizando...</span>}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-background text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold">Aluno</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Pontuação</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Palavras</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Tempo</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.items.map((attempt) => (
                    <tr key={attempt.id} className="transition hover:bg-background/60">
                      <td className="px-5 py-4 font-medium text-dark">
                        {attempt.studentName}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                          <Trophy size={14} aria-hidden="true" />
                          {attempt.score}/100
                        </span>
                      </td>
                      <td className="px-5 py-4 text-dark">
                        {attempt.wordsFound.length} de {attempt.totalWords}
                      </td>
                      <td className="px-5 py-4 text-dark">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} className="text-muted" aria-hidden="true" />
                          {formatDuration(attempt.elapsedSeconds)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {formatDate(attempt.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.pagination.totalPages > 1 && (
            <nav
              aria-label="Paginação do histórico"
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) => Math.max(1, current - 1));
                }}
                disabled={page <= 1 || isLoading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                Anterior
              </button>
              <span className="text-sm text-muted">
                Página {result.pagination.page} de {result.pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) =>
                    Math.min(result.pagination.totalPages, current + 1),
                  );
                }}
                disabled={page >= result.pagination.totalPages || isLoading}
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
