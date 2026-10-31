import api from "@/lib/api";

export interface MediaLibraryAsset {
  id: string;
  storageKey: string;
  publicUrl: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  altText: string;
  status: "APPROVED";
}

interface ListMediaAssetsResponse {
  success: true;
  data: {
    items: MediaLibraryAsset[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export const mediaLibraryService = {
  async list(search = ""): Promise<MediaLibraryAsset[]> {
    const response = await api.get<ListMediaAssetsResponse>("/activities/media-library", {
      params: { page: 1, limit: 24, search: search.trim() || undefined },
    });
    return response.data.data.items;
  },
};
