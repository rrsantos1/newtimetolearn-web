import api from "@/lib/api";

interface UpdateImageResponse {
  success: true;
  data: {
    wordId: string;
    coverMediaAssetId: string | null;
    publicUrl?: string;
    altText?: string;
  };
}

export const updateHangmanWordImageService = {
  async execute(slug: string, wordId: string, coverMediaAssetId: string | null): Promise<void> {
    await api.patch<UpdateImageResponse>(
      `/activities/${encodeURIComponent(slug)}/hangman/words/${encodeURIComponent(wordId)}/image`,
      { coverMediaAssetId },
    );
  },
};
