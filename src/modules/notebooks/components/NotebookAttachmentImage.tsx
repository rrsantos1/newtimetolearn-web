import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import Image from "next/image";
import { downloadNotebookAttachment } from "../services/notebookService";

interface NotebookAttachmentImageProps {
  relationshipId: string;
  entryId: string;
  fileName: string;
  initialWidth?: number;
  canResize?: boolean;
  resizeOpen?: boolean;
  onCancelResize?: () => void;
  onSaveWidth?: (width: number) => Promise<void>;
}

export function NotebookAttachmentImage({
  relationshipId,
  entryId,
  fileName,
  initialWidth = 100,
  canResize = false,
  resizeOpen = false,
  onCancelResize,
  onSaveWidth,
}: NotebookAttachmentImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [savedWidth, setSavedWidth] = useState(initialWidth);
  const [draftWidth, setDraftWidth] = useState(initialWidth);
  const [isSavingWidth, setIsSavingWidth] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    void downloadNotebookAttachment(relationshipId, entryId)
      .then((blob) => {
        if (!isMounted) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entryId, relationshipId]);

  if (hasError) {
    return <p className="p-3 text-xs text-red-700">Não foi possível carregar esta imagem.</p>;
  }

  if (!src) {
    return <div className="aspect-video w-full animate-pulse rounded-lg bg-[#eee5d3]" aria-label="Carregando imagem" />;
  }

  const hasWidthChanges = draftWidth !== savedWidth;

  async function saveDisplayWidth(): Promise<void> {
    if (!onSaveWidth || !hasWidthChanges || isSavingWidth) return;
    setIsSavingWidth(true);
    setSaveError("");
    try {
      await onSaveWidth(draftWidth);
      setSavedWidth(draftWidth);
      onCancelResize?.();
    } catch {
      setSaveError("Não foi possível salvar o tamanho da imagem. Tente novamente.");
    } finally {
      setIsSavingWidth(false);
    }
  }

  function cancelWidthChanges(): void {
    setDraftWidth(savedWidth);
    setSaveError("");
    onCancelResize?.();
  }

  return (
    <div className="w-full">
      <div className="mx-auto" style={{ width: `${draftWidth}%` }}>
        <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-lg">
          <Image
            src={src}
            alt={fileName}
            fill
            unoptimized
            sizes="(max-width: 768px) 90vw, 40vw"
            className="object-contain"
          />
        </div>
      </div>

      {canResize && resizeOpen && onSaveWidth && (
        <div className="mt-2 grid w-full min-w-0 grid-cols-1 gap-2 rounded-lg border border-[#d8c9a9] bg-white/90 p-2">
          <label className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs font-medium text-[#66583e]">
            <span className="shrink-0">Tamanho</span>
            <input
              type="range"
              min={25}
              max={100}
              step={5}
              value={draftWidth}
              onChange={(event) => {
                setDraftWidth(Number(event.target.value));
                setSaveError("");
              }}
              aria-label="Largura da imagem"
              className="block h-6 w-full min-w-0 cursor-pointer touch-pan-x accent-[#8b6b2e]"
            />
            <span className="w-10 text-right tabular-nums">{draftWidth}%</span>
          </label>
          <div className="flex w-full items-center justify-end gap-1">
            <button
              type="button"
              onClick={cancelWidthChanges}
              disabled={!hasWidthChanges || isSavingWidth}
              className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#c8b994] bg-white px-2 text-xs font-semibold text-[#51452f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void saveDisplayWidth()}
              disabled={isSavingWidth || !hasWidthChanges}
              className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#c8b994] bg-[#fffdf5] px-2 text-xs font-semibold text-[#51452f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={13} aria-hidden="true" />
              {isSavingWidth ? "Salvando..." : "Salvar"}
            </button>
          </div>
          {saveError && <p role="alert" className="w-full text-xs text-red-700">{saveError}</p>}
        </div>
      )}
    </div>
  );
}
