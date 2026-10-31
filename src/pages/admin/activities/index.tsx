import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import type { ListedActivity } from "@/modules/activities/types/activityList.types";
import api from "@/lib/api";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return responseData?.error?.message ?? responseData?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}

function getActivityName(activity: ListedActivity): string {
  return activity.latestVersion?.name ?? activity.publishedVersion?.name ?? "Atividade sem título";
}

function getActivityTypeLabel(type: ListedActivity["type"]): string {
  if (type === "word_search") return "Caça-palavras";
  if (type === "crossword") return "Palavras cruzadas";
  return type;
}

export default function PendingActivitiesPage() {
  const [activities, setActivities] = useState<ListedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadActivities = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const firstPage = await listActivitiesService.execute(1, 100, "all");
      const allActivities = [...firstPage.items];

      for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
        const result = await listActivitiesService.execute(page, 100, "all");
        allActivities.push(...result.items);
      }

      setActivities(
        allActivities.filter(
          (activity) => activity.latestVersion?.status === "PENDING_REVIEW",
        ),
      );
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities, reloadKey]);

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
          <button type="button" onClick={() => setReloadKey((current) => current + 1)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background">
            <RefreshCw size={15} aria-hidden="true" /> Atualizar
          </button>
        </section>
      ) : (
        <section aria-label="Atividades aguardando aprovação" className="grid gap-4 lg:grid-cols-2">
          {activities.map((activity) => (
            <article key={activity.slug} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
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
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <button type="button" onClick={() => void handleDecision(activity, "approve")} disabled={Boolean(busySlug)} title="Aprovar e publicar" aria-label={`Aprovar ${getActivityName(activity)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60">
                  <CheckCircle2 size={16} aria-hidden="true" /> Aprovar
                </button>
                <button type="button" onClick={() => void handleDecision(activity, "request-changes")} disabled={Boolean(busySlug)} title="Solicitar correções ao professor" aria-label={`Solicitar alterações em ${getActivityName(activity)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60">
                  <RefreshCw size={16} aria-hidden="true" /> Solicitar alterações
                </button>
                <button type="button" onClick={() => void handleDecision(activity, "reject")} disabled={Boolean(busySlug)} title="Rejeitar atividade" aria-label={`Rejeitar ${getActivityName(activity)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                  <XCircle size={16} aria-hidden="true" /> Rejeitar
                </button>
              </div>
              {busySlug === activity.slug && <p className="mt-3 text-xs text-muted" aria-live="polite">Processando decisão...</p>}
            </article>
          ))}
        </section>
      )}
    </RoleBasedLayout>
  );
}
