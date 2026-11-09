import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getNotebookAttachmentUrl } from "../services/notebookService";

interface NotebookAttachmentVideoProps {
  relationshipId: string;
  entryId: string;
  fileName: string;
}

export function NotebookAttachmentVideo({
  relationshipId,
  entryId,
  fileName,
}: NotebookAttachmentVideoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function loadVideo(): Promise<void> {
    if (src || isLoading) return;

    setIsLoading(true);
    setHasError(false);
    try {
      const downloadUrl = await getNotebookAttachmentUrl(relationshipId, entryId);
      setSrc(downloadUrl);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      {hasError && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {t("notebook.videoPrepareFailed")}
        </p>
      )}

      {src ? (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          aria-label={fileName}
          className="max-h-[28rem] w-full rounded-lg bg-black"
        >
          {t("notebook.videoUnsupported")}
        </video>
      ) : (
        <button
          type="button"
          onClick={() => void loadVideo()}
          disabled={isLoading}
          aria-label={`${t("notebook.loadVideo")}: ${fileName}`}
          className="flex aspect-video w-full items-center justify-center gap-3 rounded-lg bg-[#eee5d3] text-sm font-semibold text-[#51452f] transition hover:bg-[#e5d9bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e] disabled:cursor-wait disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <LoaderCircle size={22} className="animate-spin" aria-hidden="true" />
              {t("notebook.preparingVideo")}
            </>
          ) : (
            <>
              <Play size={24} aria-hidden="true" />
              {hasError ? t("notebook.retryVideo") : t("notebook.playVideo")}
            </>
          )}
        </button>
      )}
    </div>
  );
}
