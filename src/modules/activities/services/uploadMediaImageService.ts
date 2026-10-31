import axios from "axios";
import api from "@/lib/api";

interface CreateUploadUrlResponse {
  success: true;
  data: {
    storageKey: string;
    uploadUrl: string;
    publicUrl: string;
    contentType: string;
    expiresInSeconds: number;
  };
}

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const maxFileSizeBytes = 5 * 1024 * 1024;

export interface UploadedMediaImage {
  storageKey: string;
  publicUrl: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  altText: string;
}

export const uploadMediaImageService = {
  async execute(file: File, altText = ""): Promise<UploadedMediaImage> {
    const extension = extensionByType[file.type];

    if (!extension) {
      throw new Error("Selecione uma imagem JPEG, PNG, WebP ou GIF.");
    }

    if (file.size <= 0 || file.size > maxFileSizeBytes) {
      throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const response = await api.post<CreateUploadUrlResponse>(
      "/activities/media-library/upload-url",
      { contentType: file.type, extension },
    );

    const { storageKey, uploadUrl, publicUrl } = response.data.data;

    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      maxBodyLength: maxFileSizeBytes,
      maxContentLength: maxFileSizeBytes,
    });

    const registration = await api.post<{
      success: true;
      data: { storageKey: string; publicUrl: string; altText: string; status: "APPROVED" | "PENDING_REVIEW" | "REJECTED" };
    }>("/activities/media-library", {
      storageKey,
      publicUrl,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      altText: altText.trim(),
    });

    if (registration.data.data.status !== "APPROVED") {
      throw new Error(
        registration.data.data.status === "REJECTED"
          ? "A imagem foi recusada pela validação automática de conteúdo."
          : "A imagem foi enviada, mas ficará indisponível até a configuração da moderação.",
      );
    }

    return {
      storageKey,
      publicUrl: registration.data.data.publicUrl,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      altText: altText.trim(),
    };
  },
};