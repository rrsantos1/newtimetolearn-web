import { useEffect, useState } from "react";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import axios from "axios";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Play, RefreshCw, XCircle, Globe, Lock } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import type { ActivityDifficulty, ListedActivity } from "@/modules/activities/types/activityList.types";
import api from "@/lib/api";
import { updateActivityVisibilityService } from "@/modules/activities/services/updateActivityVisibilityService";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return responseData?.error?.message ?? responseData?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}

const PAGE_SIZE = 9;

const difficultyLabels: Record<ActivityDifficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Média",
  HARD: "Difícil",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getActivityName(activity: ListedActivity): string {
  return activity.latestVersion?.name ?? activity.publishedVersion?.name ?? "Atividade sem título";
}

function getActivityTypeLabel(type: ListedActivity["type"]): string {
  if (type === "word_search") return "Caça-palavras";
  if (type === "crossword") return "Palavras cruzadas";
  if (type === "memory") return "Jogo da memória";
  if (type === "quiz") return "Quiz";
  if (type === "listening") return "Compreensão auditiva";
  if (type === "word_matching") return "Associação de palavras";
  if (type === "multiple_choice") return "Múltipla escolha";
  if (type === "sentence_completion") return "Preenchimento de lacunas";
  return type;
}

export default function PendingActivitiesPage() {
  const [activities, setActivities] = useState<ListedActivity[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const visibleActivities = activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;

    async function loadActivities(): Promise<void> {
      try {
        const firstPage = await listActivitiesService.execute(1, 100, "all");
        const allActivities = [...firstPage.items];

        for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
          const result = await listActivitiesService.execute(page, 100, "all");
          allActivities.push(...result.items);
        }

        if (!cancelled) {
          setActivities(allActivities.filter((activity) => activity.latestVersion?.status === "PENDING_REVIEW"));
          setPage(1);
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadActivities();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function handleVisibility(activity: ListedActivity): Promise<void> {
    if (busySlug || activity.status !== "PUBLISHED") return;
    setBusySlug(activity.slug);
    setErrorMessage("");
    try {
      const visibility = activity.visibility === "PUBLIC" ? "AUTHENTICATED" : "PUBLIC";
      await updateActivityVisibilityService.execute(activity.slug, visibility);
      setActivities((current) => current.map((item) => item.slug === activity.slug ? { ...item, visibility } : item));
      setSuccessMessage(visibility === "PUBLIC" ? `“${getActivityName(activity)}” agora está disponível na página inicial.` : `“${getActivityName(activity)}” deixou de ser pública.`);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusySlug(null);
    }
  }

  async function handleDecision(
    activity: ListedActivity,
    decision: "approve" | "request-changes" | "reject",
  ): Promise<void> {
    if (busySlug) return;

    let feedback: string | undefined;
    if (decision !== "approve") {
      const promptLabel =
        decision === "request-changes"
          ? "Descreva as alterações necessárias (mínimo de 10 caracteres):"
          : "Informe o motivo da rejeição (mínimo de 10 caracteres):";
      const enteredFeedback = window.prompt(promptLabel);
      if (enteredFeedback === null) return;
      feedback = enteredFeedback.trim();
      if (feedback.length < 10) {
        setErrorMessage("O feedback deve conter pelo menos 10 caracteres.");
        return;
      }
    }

    setBusySlug(activity.slug);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (decision === "approve") {
        await api.patch(`/activities/${encodeURIComponent(activity.slug)}/approve`);
        setSuccessMessage(`"${getActivityName(activity)}" foi aprovada e publicada.`);
      } else {
        await api.patch(`/activities/${encodeURIComponent(activity.slug)}/review`, {
          decision: decision === "reject" ? "REJECT" : "REQUEST_CHANGES",
          feedback,
        });
        setSuccessMessage(
          decision === "reject"
            ? `"${getActivityName(activity)}" foi rejeitada.`
            : `Foram solicitadas alterações em "${getActivityName(activity)}".`,
        );
      }
      setIsLoading(true);
      setReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <RoleBasedLayout
      area="admin"
      allowedRoles={["ADMIN"]}
      title="Atividades pendentes"
      description="Revise as atividades enviadas pelos professores e aprove, solicite alterações ou rejeite cada versão."
    >
      <div className="mb-5 flex justify-end">
        <Link href="/admin/activities/public" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5">
          <Globe size={16} aria-hidden="true" /> Gerenciar atividades públicas
        </Link>
      </div>
      {successMessage && (
        <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted" aria-live="polite">
          Carregando atividades pendentes...
        </div>
      ) : activities.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-green-600" size={30} aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-dark">Nenhuma atividade pendente</h2>
          <p className="mt-2 text-sm text-muted">As novas solicitações de aprovação aparecerão aqui.</p>
          <button type="button" onClick={() => {
              setIsLoading(true);
              setReloadKey((current) => current + 1);
            }} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background">
            <RefreshCw size={15} aria-hidden="true" /> Atualizar
          </button>
        </section>
      ) : (
        <section aria-label="Atividades aguardando aprovação" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleActivities.map((activity) => (
            <article key={activity.slug} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
<div className="mb-4 flex items-start gap-4">
                <ActivityCoverImage type={activity.type} coverImageUrl={activity.coverImageUrl} altText={activity.coverAltText ?? getActivityName(activity)} className="w-[42%] max-w-56 shrink-0" />
                <div className="flex min-w-0 flex-col gap-2 pt-1 text-xs text-muted">
                  {activity.latestVersion && (
                    <span>
                      Dificuldade:{" "}
                      <strong className="font-semibold text-dark">
                        {difficultyLabels[activity.latestVersion.difficulty]}
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
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{getActivityTypeLabel(activity.type)}</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  <Clock3 size={13} aria-hidden="true" /> Aguardando aprovação
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-dark">{getActivityName(activity)}</h2>
              {activity.latestVersion?.description && (
                <p className="mt-2 text-sm leading-6 text-muted">{activity.latestVersion.description}</p>
              )}
              <p className="mt-3 text-xs text-muted">Versão {activity.latestVersion?.versionNumber ?? "—"}</p>
              <Link
                href={activity.type === "quiz"
                  ? `/activities/quiz/${encodeURIComponent(activity.slug)}/play`
                  : activity.type === "crossword"
                    ? `/activities/crossword/${encodeURIComponent(activity.slug)}/play`
                    : activity.type === "memory"
                      ? `/activities/memory/${encodeURIComponent(activity.slug)}/play`
                      : activity.type === "listening"
                        ? `/activities/listening/${encodeURIComponent(activity.slug)}/play`
                        : activity.type === "multiple_choice"
                          ? `/activities/multiple-choice/${encodeURIComponent(activity.slug)}/play`
                          : activity.type === "word_matching"
                          ? `/activities/word-matching/${encodeURIComponent(activity.slug)}/play`
                          : activity.type === "sentence_completion"
                            ? `/activities/sentence-completion/${encodeURIComponent(activity.slug)}/play`
                            : `/activities/word-search/${encodeURIComponent(activity.slug)}/play`}
                className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Play size={16} aria-hidden="true" />
                Testar atividade
              </Link>
              {activity.status === "PUBLISHED" && (
                <div className="mt-4">
                  <button type="button" onClick={() => void handleVisibility(activity)} disabled={Boolean(busySlug)} aria-label={activity.visibility === "PUBLIC" ? `Retirar ${getActivityName(activity)} da página inicial` : `Disponibilizar ${getActivityName(activity)} publicamente`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50">
                    {activity.visibility === "PUBLIC" ? <><Lock size={15} aria-hidden="true" /> Remover da página inicial</> : <><Globe size={15} aria-hidden="true" /> Exibir na página inicial</>}
                  </button>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <button type="button" onClick={() => void handleDecision(activity, "approve")} disabled={Boolean(busySlug)} title="Aprovar e publicar" aria-label={`Aprovar ${getActivityName(activity)}`} className="inline-flex size-9 items-center justify-center rounded-lg bg-green-700 text-white transition hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60">
                  <CheckCircle2 size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => void handleDecision(activity, "request-changes")} disabled={Boolean(busySlug)} title="Solicitar alterações" aria-label={`Solicitar alterações em ${getActivityName(activity)}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-amber-300 text-amber-800 transition hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60">
                  <RefreshCw size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => void handleDecision(activity, "reject")} disabled={Boolean(busySlug)} title="Rejeitar atividade" aria-label={`Rejeitar ${getActivityName(activity)}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60">
                  <XCircle size={16} aria-hidden="true" />
                </button>
              </div>
              {busySlug === activity.slug && <p className="mt-3 text-xs text-muted" aria-live="polite">Processando decisão...</p>}
            </article>
          ))}
        </section>
      )}
      {!isLoading && activities.length > PAGE_SIZE && (
        <nav aria-label="Paginação das atividades pendentes" className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} aria-hidden="true" /> Anterior
          </button>
          <span className="text-sm text-muted">Página {page} de {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium text-dark transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima <ChevronRight size={17} aria-hidden="true" />
          </button>
        </nav>
      )}
    </RoleBasedLayout>
  );
}
