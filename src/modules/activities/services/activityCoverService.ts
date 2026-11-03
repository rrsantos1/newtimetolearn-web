import api from "@/lib/api";

interface UpdateActivityCoverResponse {
  success: true;
  data: {
    coverMediaAssetId: string | null;
    coverImageUrl: string | null;
    coverAltText: string | null;
  };
}

export const activityCoverService = {
  async update(slug: string, coverMediaAssetId: string | null): Promise<void> {
    await api.patch<UpdateActivityCoverResponse>(
      `/activities/${encodeURIComponent(slug)}/cover`,
      { coverMediaAssetId },
    );
  },
};
