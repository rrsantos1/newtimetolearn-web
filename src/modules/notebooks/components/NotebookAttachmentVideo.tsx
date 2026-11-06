import { useEffect, useState } from "react";
import { downloadNotebookAttachment } from "../services/notebookService";

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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    void downloadNotebookAttachment(relationshipId, entryId, 360_000)
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
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
        Não foi possível carregar este vídeo. Tente atualizar o caderno.
      </p>
    );
  }

  if (!src) {
    return (
      <div
        className="flex aspect-video w-full animate-pulse items-center justify-center rounded-lg bg-[#eee5d3] text-xs text-[#76694f]"
        role="status"
      >
        Carregando vídeo...
      </div>
    );
  }

  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label={fileName}
      className="max-h-[28rem] w-full rounded-lg bg-black"
    >
      Seu navegador não oferece suporte à reprodução deste vídeo.
    </video>
  );
}
