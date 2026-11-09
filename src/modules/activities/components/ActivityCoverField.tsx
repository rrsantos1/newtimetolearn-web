import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { getIn, useFormikContext } from "formik";
import { ImagePlus, LoaderCircle, Sparkles, Trash2, Upload, X } from "lucide-react";
import { MediaLibraryPicker } from "@/modules/activities/components/MediaLibraryPicker";
import type { MediaLibraryAsset } from "@/modules/activities/services/mediaLibraryService";
import { uploadMediaImageService } from "@/modules/activities/services/uploadMediaImageService";
import { generateActivityCoverService } from "@/modules/activities/services/generateActivityCoverService";

interface SelectedCover {
  id: string;
  publicUrl: string;
  thumbnailPublicUrl?: string | null;
  altText: string;
}

interface CoverFormValues {
  coverMediaAssetId?: string | null;
  coverImageUrl?: string | null;
  coverAltText?: string | null;
}

interface ActivityCoverFieldProps { fieldPrefix?: string; title?: string; description?: string; }

const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ActivityCoverField({ fieldPrefix = "", title, description }: Readonly<ActivityCoverFieldProps>) {
  const { t } = useTranslation();
  const coverTitle = title ?? t("activity.cover.title");
  const coverDescription = description ?? t("activity.cover.description");
  const { values, setFieldValue, isSubmitting } = useFormikContext<CoverFormValues>();
  const fieldName = (name: string): string => fieldPrefix ? `${fieldPrefix}.${name}` : name;
  const coverMediaAssetId = fieldPrefix ? getIn(values, fieldName("coverMediaAssetId")) as string | null | undefined : values.coverMediaAssetId;
  const coverImageUrl = fieldPrefix ? getIn(values, fieldName("coverImageUrl")) as string | null | undefined : values.coverImageUrl;
  const coverAltText = fieldPrefix ? getIn(values, fieldName("coverAltText")) as string | null | undefined : values.coverAltText;
  const [cover, setCover] = useState<SelectedCover | null>(null);
  const [pendingGeneratedCover, setPendingGeneratedCover] = useState<SelectedCover | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"PENDING" | "PROCESSING">("PENDING");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [generationFailed, setGenerationFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const generationStateRef = useRef<"idle" | "generating" | "awaiting_selection" | "failed">("idle");

  useEffect(() => {
    const form = sectionRef.current?.closest("form");
    if (!form) return;

    function preventInvalidSubmit(event: SubmitEvent): void {
      const state = generationStateRef.current;
      if (state === "idle") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setError(state === "generating"
        ? t("activity.cover.processingHelp")
        : state === "awaiting_selection"
          ? t("activity.cover.generatedReady")
          : t("activity.cover.generateError"));
    }

    form.addEventListener("submit", preventInvalidSubmit, true);
    return () => form.removeEventListener("submit", preventInvalidSubmit, true);
  }, [t]);

  function updateGenerationState(state: "idle" | "generating" | "awaiting_selection" | "failed"): void {
    generationStateRef.current = state;
    setGenerationFailed(state === "failed");
  }

  function selectCover(asset: SelectedCover): void {
    setCover(asset);
    setError("");
    void setFieldValue(fieldName("coverMediaAssetId"), asset.id);
    void setFieldValue(fieldName("coverImageUrl"), asset.publicUrl);
    void setFieldValue(fieldName("coverAltText"), asset.altText);
  }

  function selectLibraryAsset(asset: MediaLibraryAsset): void {
    selectCover({ id: asset.id, publicUrl: asset.publicUrl, thumbnailPublicUrl: asset.thumbnailPublicUrl, altText: asset.altText });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError("");
    try {
      const uploaded = await uploadMediaImageService.execute(file, "Capa da atividade");
      selectCover({ id: uploaded.id, publicUrl: uploaded.publicUrl, thumbnailPublicUrl: uploaded.thumbnailPublicUrl, altText: uploaded.altText });
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : t("activity.cover.uploadError"));
    }
  }

  async function handleGenerate(): Promise<void> {
    if (prompt.trim().length < 5 || isGenerating) return;

    setIsGenerating(true);
    setGenerationStatus("PENDING");
    updateGenerationState("generating");
    setError("");
    try {
      const generated = await generateActivityCoverService.execute(prompt, setGenerationStatus);
      setPendingGeneratedCover({ id: generated.id, publicUrl: generated.publicUrl, altText: generated.altText });
      updateGenerationState("awaiting_selection");
      setIsAiModalOpen(false);
      setPrompt("");
    } catch (generationError: unknown) {
      updateGenerationState("failed");
      setError(generationError instanceof Error ? generationError.message : t("activity.cover.generateError"));
    } finally {
      setIsGenerating(false);
    }
  }

  function useGeneratedCover(): void {
    if (!pendingGeneratedCover) return;
    selectCover(pendingGeneratedCover);
    setPendingGeneratedCover(null);
    updateGenerationState("idle");
  }

  function discardGeneration(): void {
    setPendingGeneratedCover(null);
    setError("");
    updateGenerationState("idle");
  }

  function clearCover(): void {
    setCover(null);
    setError("");
    void setFieldValue(fieldName("coverMediaAssetId"), null);
    void setFieldValue(fieldName("coverImageUrl"), null);
    void setFieldValue(fieldName("coverAltText"), null);
  }

  const visibleCover = cover ?? (coverMediaAssetId && coverImageUrl
    ? { id: coverMediaAssetId, publicUrl: coverImageUrl, thumbnailPublicUrl: coverImageUrl, altText: coverAltText ?? "" }
    : null);

  return (
    <section ref={sectionRef} className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-dark">{coverTitle} <span className="text-sm font-normal text-muted">(opcional)</span></h2>
        <p className="mt-1 text-sm leading-6 text-muted">{coverDescription}</p>
      </div>

      {pendingGeneratedCover && (
        <div className="mb-4 max-w-xl rounded-xl border border-accent/30 bg-background p-4">
          <p className="mb-2 text-sm font-semibold text-dark">{t("activity.cover.generatedReady")}</p>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border">
            <Image src={pendingGeneratedCover.publicUrl} alt={pendingGeneratedCover.altText} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={useGeneratedCover} disabled={isSubmitting} className="inline-flex min-h-10 items-center rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">Usar esta capa</button>
            <button type="button" onClick={() => setPendingGeneratedCover(null)} disabled={isSubmitting} className={buttonClass}>{t("activity.cover.discard")}</button>
          </div>
        </div>
      )}

      {visibleCover && (
        <div className="mb-4 max-w-xl">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-background">
            <Image src={visibleCover.thumbnailPublicUrl ?? visibleCover.publicUrl} alt={visibleCover.altText} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
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
          <Sparkles size={16} aria-hidden="true" /> {isGenerating ? t("activity.cover.generating") : t("activity.cover.generate")}
        </button>
      </div>

      {isGenerating && (
        <div role="status" aria-live="polite" className="mt-4 max-w-xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
          <div className="flex items-center gap-3">
            <LoaderCircle size={22} className="shrink-0 animate-spin text-blue-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">{generationStatus === "PENDING" ? t("activity.cover.pending") : t("activity.cover.processing")}</p>
              <p className="mt-1 text-sm text-blue-800">{generationStatus === "PENDING" ? t("activity.cover.queued") : t("activity.cover.processingHelp")}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-200">
            <div className="h-full w-2/5 animate-pulse rounded-full bg-blue-700" />
          </div>
          <p className="mt-2 text-xs text-blue-800">{t("activity.cover.continue")}</p>
        </div>
      )}
      {generationFailed && <button type="button" onClick={discardGeneration} className={`${buttonClass} mt-3`}>{t("activity.cover.discardAttempt")}</button>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="activity-cover-ai-title" className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="activity-cover-ai-title" className="text-lg font-semibold text-dark">{t("activity.cover.modalTitle")}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{t("activity.cover.modalDescription")}</p>
                {isGenerating && <p role="status" className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">A imagem está sendo gerada e validada. Você pode fechar este modal e continuar preenchendo a atividade; o salvamento ficará bloqueado até a imagem estar pronta.</p>}
              </div>
              <button type="button" onClick={() => setIsAiModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-2 text-muted hover:bg-background focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-50"><X size={18} aria-hidden="true" /></button>
            </div>
            <label htmlFor="activity-cover-prompt" className="mt-5 block text-sm font-medium text-dark">{t("activity.cover.imageDescription")}</label>
            <textarea id="activity-cover-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1000} rows={4} placeholder={t("activity.cover.promptPlaceholder")} className="mt-2 min-h-28 w-full rounded-xl border border-border bg-surface p-3 text-sm text-dark focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" disabled={isGenerating} />
            <p className="mt-1 text-right text-xs text-muted">{prompt.length}/1000</p>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsAiModalOpen(false)} className={buttonClass}>{t("activity.cover.close")}</button>
              <button type="button" onClick={() => void handleGenerate()} disabled={isGenerating || prompt.trim().length < 5} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">
                <ImagePlus size={16} aria-hidden="true" /> {isGenerating ? t("activity.cover.generatingImage") : t("activity.cover.generateImage")}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
