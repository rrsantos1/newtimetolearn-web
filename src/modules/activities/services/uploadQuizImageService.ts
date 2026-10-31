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

export interface UploadedQuizImage {
  storageKey: string;
  publicUrl: string;
  altText: string;
}

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const maxFileSizeBytes = 5 * 1024 * 1024;

export const uploadQuizImageService = {
  async execute(file: File, altText = ""): Promise<UploadedQuizImage> {
    const extension = extensionByType[file.type];

    if (!extension) {
      throw new Error("Selecione uma imagem JPEG, PNG, WebP ou GIF.");
    }

    if (file.size <= 0 || file.size > maxFileSizeBytes) {
      throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const response = await api.post<CreateUploadUrlResponse>(
      "/activities/quiz/images/upload-url",
      { contentType: file.type, extension },
    );

    const { storageKey, uploadUrl, publicUrl } = response.data.data;

    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      maxBodyLength: maxFileSizeBytes,
      maxContentLength: maxFileSizeBytes,
    });

    return {
      storageKey,
      publicUrl,
      altText: altText.trim(),
    };
  },
};
