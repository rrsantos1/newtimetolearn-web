import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Globe, Lock, RefreshCw } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import { listActivitiesService } from "@/modules/activities/services/listActivitiesService";
import { updateActivityVisibilityService } from "@/modules/activities/services/updateActivityVisibilityService";
import type { ListedActivity } from "@/modules/activities/types/activityList.types";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}

function getActivityName(activity: ListedActivity): string {
  return activity.publishedVersion?.name ?? activity.latestVersion?.name ?? "Atividade sem título";
}

export default function PublicActivitiesAdminPage() {
  const [activities, setActivities] = useState<ListedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadActivities(): Promise<void> {
      setIsLoading(true);
      try {
        const firstPage = await listActivitiesService.execute(1, 100, "all");
        const allActivities = [...firstPage.items];
        for (let currentPage = 2; currentPage <= firstPage.pagination.totalPages; currentPage += 1) {
          const nextPage = await listActivitiesService.execute(currentPage, 100, "all");
          allActivities.push(...nextPage.items);
        }
        if (!cancelled) {
          setActivities(allActivities.filter((activity) => activity.status === "PUBLISHED" && activity.latestVersion?.status === "PUBLISHED"));
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (!cancelled) setErrorMessage(getErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadActivities();
    return () => { cancelled = true; };
  }, [reloadKey]);

  async function toggleVisibility(activity: ListedActivity): Promise<void> {
    if (busySlug) return;
    const visibility = activity.visibility === "PUBLIC" ? "AUTHENTICATED" : "PUBLIC";
    setBusySlug(activity.slug);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateActivityVisibilityService.execute(activity.slug, visibility);
      setActivities((current) => current.map((item) => item.slug === activity.slug ? { ...item, visibility } : item));
      setSuccessMessage(visibility === "PUBLIC"
        ? `“${getActivityName(activity)}” agora aparece na página inicial.`
        : `“${getActivityName(activity)}” foi retirada da página inicial.`);
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
      title="Atividades públicas"
      description="Escolha quais atividades aprovadas serão exibidas na página inicial para visitantes sem cadastro."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark">
          <ArrowLeft size={16} aria-hidden="true" /> Atividades pendentes
        </Link>
        <button type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={isLoading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark transition hover:bg-background disabled:opacity-50">
          <RefreshCw size={15} aria-hidden="true" /> Atualizar
        </button>
      </div>

      {successMessage && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{successMessage}</p>}
      {errorMessage && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</p>}

      {isLoading ? (
        <section aria-live="polite" className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">Carregando atividades aprovadas...</section>
      ) : activities.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-10 text-center">
          <Globe size={28} className="mx-auto text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-dark">Nenhuma atividade aprovada</h2>
          <p className="mt-2 text-sm text-muted">As atividades aparecerão aqui após a aprovação administrativa.</p>
        </section>
      ) : (
        <section aria-label="Atividades aprovadas" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activities.map((activity) => (
            <article key={activity.slug} className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <ActivityCoverImage type={activity.type} coverImageUrl={activity.coverImageUrl} altText={activity.coverAltText ?? getActivityName(activity)} />
              <h2 className="mt-4 text-lg font-semibold text-dark">{getActivityName(activity)}</h2>
              {activity.latestVersion?.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{activity.latestVersion.description}</p>}
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className={activity.visibility === "PUBLIC" ? "rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800" : "rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted"}>
                  {activity.visibility === "PUBLIC" ? "Na página inicial" : "Somente autenticados"}
                </span>
                <button type="button" onClick={() => void toggleVisibility(activity)} disabled={Boolean(busySlug)} aria-label={activity.visibility === "PUBLIC" ? `Retirar ${getActivityName(activity)} da página inicial` : `Exibir ${getActivityName(activity)} na página inicial`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50">
                  {activity.visibility === "PUBLIC" ? <><Lock size={15} aria-hidden="true" /> Retirar</> : <><Globe size={15} aria-hidden="true" /> Publicar</>}
                </button>
              </div>
              {busySlug === activity.slug && <p className="mt-2 text-xs text-muted" aria-live="polite">Atualizando visibilidade...</p>}
            </article>
          ))}
        </section>
      )}
    </RoleBasedLayout>
  );
}
