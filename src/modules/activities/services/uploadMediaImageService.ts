import api from "@/lib/api";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxFileSizeBytes = 5 * 1024 * 1024;

export interface UploadedMediaImage {
  id: string;
  storageKey: string;
  publicUrl: string;
  thumbnailPublicUrl: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  altText: string;
  status?: "APPROVED" | "PENDING_REVIEW";
}

interface UploadMediaImageResponse {
  success: true;
  data: UploadedMediaImage & { status: "APPROVED" | "PENDING_REVIEW"; message?: string };
}

export const uploadMediaImageService = {
  async execute(file: File, altText = ""): Promise<UploadedMediaImage> {
    if (!allowedTypes.has(file.type)) {
      throw new Error("Selecione uma imagem JPEG, PNG, WebP ou GIF.");
    }
    if (file.size <= 0 || file.size > maxFileSizeBytes) {
      throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const response = await api.post<UploadMediaImageResponse>(
      "/activities/media-library/upload",
      file,
      {
        headers: {
          "Content-Type": file.type,
          "x-file-name": encodeURIComponent(file.name),
          "x-alt-text": encodeURIComponent(altText.trim()),
        },
        maxBodyLength: maxFileSizeBytes,
        maxContentLength: maxFileSizeBytes,
      },
    );

    if (response.data.data.status === "PENDING_REVIEW") {
      throw new Error("A imagem foi armazenada em quarentena privada e aguarda revisão administrativa.");
    }

    return {
      id: response.data.data.id,
      storageKey: response.data.data.storageKey,
      publicUrl: response.data.data.publicUrl,
      thumbnailPublicUrl: response.data.data.thumbnailPublicUrl ?? null,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      altText: altText.trim(),
      status: response.data.data.status,
    };
  },
};
