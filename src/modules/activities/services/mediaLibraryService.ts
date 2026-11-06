import api from "@/lib/api";

export interface MediaLibraryAsset {
  id: string;
  storageKey: string;
  publicUrl: string;
  thumbnailPublicUrl: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  altText: string;
  status: "APPROVED";
}

export interface MediaStorageUsage {
  usageBytes: number;
  limitBytes: number | null;
  unlimited: boolean;
  usagePercentage: number | null;
}

interface StorageUsageResponse {
  success: true;
  data: MediaStorageUsage;
}

interface ListMediaAssetsResponse {
  success: true;
  data: {
    items: MediaLibraryAsset[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export const mediaLibraryService = {
  async getStorageUsage(): Promise<MediaStorageUsage> {
    const response = await api.get<StorageUsageResponse>("/activities/media-library/storage-usage");
    return response.data.data;
  },

  async list(search = ""): Promise<MediaLibraryAsset[]> {
    const response = await api.get<ListMediaAssetsResponse>("/activities/media-library", {
      params: { page: 1, limit: 24, search: search.trim() || undefined },
    });
    return response.data.data.items;
  },
};
