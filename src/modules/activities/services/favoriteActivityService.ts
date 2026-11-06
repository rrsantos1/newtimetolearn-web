import api from "@/lib/api";

export const favoriteActivityService = {
  async set(slug: string, favorite: boolean): Promise<void> {
    await api.put(`/activities/${encodeURIComponent(slug)}/favorite`, { favorite });
  },
};
