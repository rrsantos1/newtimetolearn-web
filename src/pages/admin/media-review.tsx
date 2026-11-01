import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import api from "@/lib/api";

interface PendingMediaAsset {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  altText: string;
  createdAt: string;
  status: "PENDING_REVIEW";
}
interface PendingMediaResponse {
  success: true;
  data: { items: PendingMediaAsset[] };
}
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}
function formatBytes(size: number): string {
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaReviewPage() {
  const [items, setItems] = useState<PendingMediaAsset[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    async function load(): Promise<void> {
      setLoading(true);
      try {
        const response = await api.get<PendingMediaResponse>("/activities/media-library/review", { params: { page: 1, limit: 60 } });
        const pending = response.data.data.items;
        const previewEntries = await Promise.all(pending.map(async (asset) => {
          try {
            const imageResponse = await api.get<Blob>(`/activities/media-library/${encodeURIComponent(asset.id)}/preview`, { responseType: "blob" });
            const objectUrl = URL.createObjectURL(imageResponse.data);
            objectUrls.push(objectUrl);
            return [asset.id, objectUrl] as const;
          } catch {
            return [asset.id, ""] as const;
          }
        }));
        if (!cancelled) {
          setItems(pending);
          setPreviews(Object.fromEntries(previewEntries));
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (!cancelled) setErrorMessage(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [reloadKey]);

  async function decide(asset: PendingMediaAsset, decision: "APPROVE" | "REJECT"): Promise<void> {
    if (busyId) return;
    const confirmed = window.confirm(decision === "APPROVE"
      ? `Aprovar "${asset.fileName}" e movê-la para o bucket público?`
      : `Rejeitar "${asset.fileName}" e excluir a imagem da quarentena?`);
    if (!confirmed) return;
    setBusyId(asset.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.patch(`/activities/media-library/${encodeURIComponent(asset.id)}/review`, { decision });
      setSuccessMessage(decision === "APPROVE"
        ? `"${asset.fileName}" aprovada e publicada.`
        : `"${asset.fileName}" rejeitada e removida da quarentena.`);
      setReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RoleBasedLayout area="admin" allowedRoles={["ADMIN"]} title="Revisão de imagens" description="Revise imagens que não puderam ser classificadas automaticamente pelo Google Vision.">
      {successMessage && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{successMessage}</p>}
      {errorMessage && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</p>}
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted" aria-live="polite">Carregando imagens em quarentena...</div>
      ) : items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-green-600" size={30} aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-dark">Nenhuma imagem pendente</h2>
          <p className="mt-2 text-sm text-muted">Imagens que precisarem de revisão aparecerão aqui.</p>
          <button type="button" onClick={() => setReloadKey((current) => current + 1)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark hover:bg-background"><RefreshCw size={15} aria-hidden="true" /> Atualizar</button>
        </section>
      ) : (
        <section aria-label="Imagens pendentes de revisão" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((asset) => (
            <article key={asset.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="flex aspect-[4/3] items-center justify-center bg-background">
                {previews[asset.id] ? <img src={previews[asset.id]} alt={asset.altText || `Prévia de ${asset.fileName}`} className="h-full w-full object-contain" /> : <div className="p-4 text-center text-sm text-muted"><ShieldAlert className="mx-auto mb-2" aria-hidden="true" />Prévia indisponível</div>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="break-all font-semibold text-dark">{asset.fileName}</h2>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"><Clock3 size={12} aria-hidden="true" /> Pendente</span>
                </div>
                <p className="mt-2 text-xs text-muted">{asset.contentType} · {formatBytes(asset.sizeBytes)}</p>
                {asset.altText && <p className="mt-2 text-sm text-muted">{asset.altText}</p>}
                <p className="mt-1 text-xs text-muted">Enviada em {new Date(asset.createdAt).toLocaleString("pt-BR")}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  <button type="button" onClick={() => void decide(asset, "APPROVE")} disabled={Boolean(busyId)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 size={15} aria-hidden="true" /> Aprovar</button>
                  <button type="button" onClick={() => void decide(asset, "REJECT")} disabled={Boolean(busyId)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"><XCircle size={15} aria-hidden="true" /> Rejeitar</button>
                </div>
                {busyId === asset.id && <p className="mt-2 text-xs text-muted" aria-live="polite">Processando decisão...</p>}
              </div>
            </article>
          ))}
        </section>
      )}
    </RoleBasedLayout>
  );
}
