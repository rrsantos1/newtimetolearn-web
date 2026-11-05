import { useEffect, useState } from "react";
import Image from "next/image";
import { downloadNotebookAttachment } from "../services/notebookService";

interface NotebookAttachmentImageProps {
  relationshipId: string;
  entryId: string;
  fileName: string;
}

export function NotebookAttachmentImage({
  relationshipId,
  entryId,
  fileName,
}: NotebookAttachmentImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

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

  return (
    <div className="relative mx-auto aspect-video max-h-72 w-full overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={fileName}
        fill
        unoptimized
        sizes="(max-width: 768px) 90vw, 40vw"
        className="object-contain"
      />
    </div>
  );
}
