import api from "@/lib/api";

const ENDPOINT = "/activities/";

export const submitActivityVersionService = {
  async execute(slug: string): Promise<void> {
    await api.patch(
      `${ENDPOINT}${encodeURIComponent(slug)}/submit`,
    );
  },
};