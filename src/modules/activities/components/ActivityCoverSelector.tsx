import Image from "next/image";
import { useState } from "react";
import { ImagePlus, LoaderCircle, Sparkles, Trash2, Upload, X } from "lucide-react";
import { MediaLibraryPicker } from "@/modules/activities/components/MediaLibraryPicker";
import type { MediaLibraryAsset } from "@/modules/activities/services/mediaLibraryService";
import { uploadMediaImageService } from "@/modules/activities/services/uploadMediaImageService";
import { generateActivityCoverService } from "@/modules/activities/services/generateActivityCoverService";

export interface ActivityCoverSelection {
  id: string;
  publicUrl: string;
  thumbnailPublicUrl?: string | null;
  altText: string;
}

interface Props {
  value: ActivityCoverSelection | null;
  onChange: (value: ActivityCoverSelection | null) => void;
  disabled?: boolean;
  onGenerationStateChange?: (state: "idle" | "generating" | "awaiting_selection" | "failed") => void;
}

const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ActivityCoverSelector({ value, onChange, disabled = false, onGenerationStateChange }: Readonly<Props>) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"PENDING" | "PROCESSING">("PENDING");
  const [pendingGeneratedCover, setPendingGeneratedCover] = useState<ActivityCoverSelection | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [generationFailed, setGenerationFailed] = useState(false);

  function select(asset: ActivityCoverSelection): void {
    onChange(asset);
    setError("");
  }

  function selectLibraryAsset(asset: MediaLibraryAsset): void {
    select({ id: asset.id, publicUrl: asset.publicUrl, thumbnailPublicUrl: asset.thumbnailPublicUrl, altText: asset.altText });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError("");
    try {
      const uploaded = await uploadMediaImageService.execute(file, "Capa da atividade");
      select({ id: uploaded.id, publicUrl: uploaded.publicUrl, thumbnailPublicUrl: uploaded.thumbnailPublicUrl, altText: uploaded.altText });
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    }
  }

  async function handleGenerate(): Promise<void> {
    if (prompt.trim().length < 5 || isGenerating) return;
    setIsGenerating(true);
    setGenerationStatus("PENDING");
    onGenerationStateChange?.("generating");
    setGenerationFailed(false);
    setError("");
    try {
      const generated = await generateActivityCoverService.execute(prompt, setGenerationStatus);
      setPendingGeneratedCover({ id: generated.id, publicUrl: generated.publicUrl, altText: generated.altText });
      onGenerationStateChange?.("awaiting_selection");
      setIsAiModalOpen(false);
      setPrompt("");
    } catch (generationError: unknown) {
      onGenerationStateChange?.("failed");
      setGenerationFailed(true);
      setError(generationError instanceof Error ? generationError.message : "Não foi possível gerar a imagem.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-dark">Imagem de capa <span className="text-sm font-normal text-muted">(opcional)</span></h2>
        <p className="mt-1 text-sm leading-6 text-muted">Escolha uma imagem da biblioteca, envie uma imagem ou gere uma capa com IA. Se não escolher, será usada a capa padrão deste tipo de atividade.</p>
      </div>
      {pendingGeneratedCover && (
        <div className="mb-4 max-w-xl rounded-xl border border-accent/30 bg-background p-4">
          <p className="mb-2 text-sm font-semibold text-dark">Sua capa gerada está pronta</p>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border">
            <Image src={pendingGeneratedCover.publicUrl} alt={pendingGeneratedCover.altText} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { select(pendingGeneratedCover); setPendingGeneratedCover(null); onGenerationStateChange?.("idle"); setGenerationFailed(false); }} disabled={disabled} className="inline-flex min-h-10 items-center rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">Usar esta capa</button>
            <button type="button" onClick={() => { setPendingGeneratedCover(null); onGenerationStateChange?.("idle"); }} disabled={disabled} className={buttonClass}>Descartar</button>
          </div>
        </div>
      )}
      {value && (
        <div className="mb-4 max-w-xl">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-background">
            <Image src={value.thumbnailPublicUrl ?? value.publicUrl} alt={value.altText} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
          </div>
          <button type="button" onClick={() => onChange(null)} disabled={disabled} className={`${buttonClass} mt-3 text-red-700`}>
            <Trash2 size={16} aria-hidden="true" /> Remover capa
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <label className={`${buttonClass} cursor-pointer`}>
          <Upload size={16} aria-hidden="true" /> Enviar imagem
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void handleUpload(event)} disabled={disabled} className="sr-only" aria-label="Enviar imagem de capa" />
        </label>
        <MediaLibraryPicker disabled={disabled} onSelect={selectLibraryAsset} />
        <button type="button" onClick={() => setIsAiModalOpen(true)} disabled={disabled || isGenerating} className={buttonClass}>
          <Sparkles size={16} aria-hidden="true" /> {isGenerating ? "Gerando em segundo plano..." : "Gerar com IA"}
        </button>
      </div>
      {isGenerating && (
        <div role="status" aria-live="polite" className="mt-4 max-w-xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
          <div className="flex items-center gap-3">
            <LoaderCircle size={22} className="shrink-0 animate-spin text-blue-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">{generationStatus === "PENDING" ? "Preparando sua solicitação..." : "A IA está criando sua capa..."}</p>
              <p className="mt-1 text-sm text-blue-800">{generationStatus === "PENDING" ? "Sua solicitação entrou na fila e será processada em instantes." : "A imagem está sendo gerada e validada. Esse processo pode levar alguns minutos."}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-200">
            <div className="h-full w-2/5 animate-pulse rounded-full bg-blue-700" />
          </div>
          <p className="mt-2 text-xs text-blue-800">Você pode continuar preenchendo a atividade. Avisaremos aqui quando a prévia estiver pronta.</p>
        </div>
      )}
      {generationFailed && <button type="button" onClick={() => { setError(""); setGenerationFailed(false); onGenerationStateChange?.("idle"); }} className={`${buttonClass} mt-3`}>Descartar tentativa de geração</button>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="activity-cover-selector-ai-title" className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="activity-cover-selector-ai-title" className="text-lg font-semibold text-dark">Gerar capa com IA</h3>
                <p className="mt-1 text-sm leading-6 text-muted">Descreva a ilustração. A imagem será validada e armazenada na biblioteca de mídia.</p>
                {isGenerating && <p role="status" className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">A imagem está sendo gerada e validada. Você pode fechar este modal e continuar preenchendo a atividade; o salvamento ficará bloqueado até a imagem estar pronta.</p>}
              </div>
              <button type="button" onClick={() => setIsAiModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-2 text-muted hover:bg-background focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-50"><X size={18} aria-hidden="true" /></button>
            </div>
            <label htmlFor="activity-cover-selector-prompt" className="mt-5 block text-sm font-medium text-dark">Descrição da imagem</label>
            <textarea id="activity-cover-selector-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1000} rows={4} placeholder="Ex.: uma ilustração alegre sobre o sistema solar, com planetas coloridos e fundo espacial..." className="mt-2 min-h-28 w-full rounded-xl border border-border bg-surface p-3 text-sm text-dark focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" disabled={isGenerating} />
            <p className="mt-1 text-right text-xs text-muted">{prompt.length}/1000</p>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsAiModalOpen(false)} className={buttonClass}>Fechar</button>
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
