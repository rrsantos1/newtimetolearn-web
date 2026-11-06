import api from "@/lib/api";

export interface PublicActivityResponse<T> {
  success: true;
  data: T;
}

export const getPublicActivityExecutionService = {
  async execute<T>(slug: string): Promise<T> {
    const response = await api.get<PublicActivityResponse<T>>(
      `/activities/public/${encodeURIComponent(slug)}`,
    );
    return response.data.data;
  },
};
