import Image from "next/image";
import { useState } from "react";
import { useFormikContext } from "formik";
import { ImagePlus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { MediaLibraryPicker } from "@/modules/activities/components/MediaLibraryPicker";
import type { MediaLibraryAsset } from "@/modules/activities/services/mediaLibraryService";
import { uploadMediaImageService } from "@/modules/activities/services/uploadMediaImageService";
import { generateActivityCoverService } from "@/modules/activities/services/generateActivityCoverService";

interface SelectedCover {
  id: string;
  publicUrl: string;
  altText: string;
}

interface CoverFormValues {
  coverMediaAssetId?: string | null;
  coverImageUrl?: string | null;
  coverAltText?: string | null;
}

const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ActivityCoverField() {
  const { values, setFieldValue, isSubmitting } = useFormikContext<CoverFormValues>();
  const [cover, setCover] = useState<SelectedCover | null>(null);
  const [pendingGeneratedCover, setPendingGeneratedCover] = useState<SelectedCover | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  function selectCover(asset: SelectedCover): void {
    setCover(asset);
    setError("");
    void setFieldValue("coverMediaAssetId", asset.id);
    void setFieldValue("coverImageUrl", asset.publicUrl);
    void setFieldValue("coverAltText", asset.altText);
  }

  function selectLibraryAsset(asset: MediaLibraryAsset): void {
    selectCover({ id: asset.id, publicUrl: asset.publicUrl, altText: asset.altText });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError("");
    try {
      const uploaded = await uploadMediaImageService.execute(file, "Capa da atividade");
      selectCover({ id: uploaded.id, publicUrl: uploaded.publicUrl, altText: uploaded.altText });
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    }
  }

  async function handleGenerate(): Promise<void> {
    if (prompt.trim().length < 5 || isGenerating) return;

    setIsGenerating(true);
    setError("");
    try {
      const generated = await generateActivityCoverService.execute(prompt);
      setPendingGeneratedCover({ id: generated.id, publicUrl: generated.publicUrl, altText: generated.altText });
      setIsAiModalOpen(false);
      setPrompt("");
    } catch (generationError: unknown) {
      setError(generationError instanceof Error ? generationError.message : "Não foi possível gerar a imagem.");
    } finally {
      setIsGenerating(false);
    }
  }

  function useGeneratedCover(): void {
    if (!pendingGeneratedCover) return;
    selectCover(pendingGeneratedCover);
    setPendingGeneratedCover(null);
  }

  function clearCover(): void {
    setCover(null);
    setError("");
    void setFieldValue("coverMediaAssetId", null);
    void setFieldValue("coverImageUrl", null);
    void setFieldValue("coverAltText", null);
  }

  const visibleCover = cover ?? (values.coverMediaAssetId && values.coverImageUrl
    ? { id: values.coverMediaAssetId, publicUrl: values.coverImageUrl, altText: values.coverAltText ?? "" }
    : null);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-dark">Imagem de capa <span className="text-sm font-normal text-muted">(opcional)</span></h2>
        <p className="mt-1 text-sm leading-6 text-muted">Escolha uma imagem da biblioteca, envie uma imagem ou gere uma capa com IA. Se não escolher, será usada a capa padrão deste tipo de atividade.</p>
      </div>

      {pendingGeneratedCover && (
        <div className="mb-4 max-w-xl rounded-xl border border-accent/30 bg-background p-4">
          <p className="mb-2 text-sm font-semibold text-dark">Sua capa gerada está pronta</p>
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
            <Image src={pendingGeneratedCover.publicUrl} alt={pendingGeneratedCover.altText} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={useGeneratedCover} disabled={isSubmitting} className="inline-flex min-h-10 items-center rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">Usar esta capa</button>
            <button type="button" onClick={() => setPendingGeneratedCover(null)} disabled={isSubmitting} className={buttonClass}>Descartar</button>
          </div>
        </div>
      )}

      {visibleCover && (
        <div className="mb-4 max-w-xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-background">
            <Image src={visibleCover.publicUrl} alt={visibleCover.altText} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
          </div>
          <button type="button" onClick={clearCover} disabled={isSubmitting} className={`${buttonClass} mt-3 text-red-700`}>
            <Trash2 size={16} aria-hidden="true" /> Remover capa
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <label className={`${buttonClass} cursor-pointer`}>
          <Upload size={16} aria-hidden="true" /> Enviar imagem
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void handleUpload(event)} disabled={isSubmitting} className="sr-only" aria-label="Enviar imagem de capa" />
        </label>
        <MediaLibraryPicker disabled={isSubmitting} onSelect={selectLibraryAsset} />
        <button type="button" onClick={() => setIsAiModalOpen(true)} disabled={isSubmitting || isGenerating} className={buttonClass}>
          <Sparkles size={16} aria-hidden="true" /> {isGenerating ? "Gerando em segundo plano..." : "Gerar com IA"}
        </button>
      </div>

      {isGenerating && <p role="status" className="mt-3 text-sm text-muted">A imagem está sendo gerada e validada em segundo plano. Você pode fechar esta janela e continuar preenchendo a atividade.</p>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="activity-cover-ai-title" className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="activity-cover-ai-title" className="text-lg font-semibold text-dark">Gerar capa com IA</h3>
                <p className="mt-1 text-sm leading-6 text-muted">Descreva a ilustração que deseja. A imagem será validada e armazenada na biblioteca de mídia.</p>
              </div>
              <button type="button" onClick={() => setIsAiModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-2 text-muted hover:bg-background focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-50"><X size={18} aria-hidden="true" /></button>
            </div>
            <label htmlFor="activity-cover-prompt" className="mt-5 block text-sm font-medium text-dark">Descrição da imagem</label>
            <textarea id="activity-cover-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1000} rows={4} placeholder="Ex.: uma ilustração alegre sobre o sistema solar, com planetas coloridos e fundo espacial..." className="mt-2 min-h-28 w-full rounded-xl border border-border bg-surface p-3 text-sm text-dark focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" disabled={isGenerating} />
            <p className="mt-1 text-right text-xs text-muted">{prompt.length}/1000</p>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsAiModalOpen(false)} disabled={isGenerating} className={buttonClass}>Cancelar</button>
              <button type="button" onClick={() => void handleGenerate()} disabled={isGenerating || prompt.trim().length < 5} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">
                <ImagePlus size={16} aria-hidden="true" /> {isGenerating ? "Gerando imagem..." : "Gerar imagem"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
