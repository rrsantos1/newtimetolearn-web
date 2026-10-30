import api from "@/lib/api";

interface DeleteActivityResponse {
  success: true;
  data: {
    id: string;
    slug: string;
    deletedAt: string;
  };
}

export const deleteActivityService = {
  async execute(slug: string): Promise<void> {
    await api.delete<DeleteActivityResponse>(
      `/activities/${encodeURIComponent(slug)}`,
    );
  },
};
