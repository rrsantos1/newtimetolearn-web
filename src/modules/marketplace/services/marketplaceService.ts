import api from "@/lib/api";
import type { MarketplaceCheckoutResponse, MarketplaceDetailResponse, MarketplaceListResponse } from "../types/marketplace.types";

export const marketplaceService = {
  async list(params: { q?: string; category?: string; page?: number; limit?: number } = {}) {
    const response = await api.get<MarketplaceListResponse>("/marketplace", { params });
    return response.data.data;
  },
  async detail(slug: string) {
    const response = await api.get<MarketplaceDetailResponse>(`/marketplace/${encodeURIComponent(slug)}`);
    return response.data.data;
  },
  async createProduct(input: { file: File; title: string; description: string; category: string; priceCents: number }) {
    const response = await api.post<{ success: true; data: { id: string; status: string } }>("/marketplace/products", input.file, {
      headers: {
        "Content-Type": input.file.type,
        "x-file-name": encodeURIComponent(input.file.name),
        "x-marketplace-title": encodeURIComponent(input.title),
        "x-marketplace-description": encodeURIComponent(input.description),
        "x-marketplace-category": encodeURIComponent(input.category),
        "x-marketplace-price-cents": String(input.priceCents),
      },
    });
    return response.data.data;
  },
  async pendingModeration() {
    const response = await api.get<{ success: true; data: Array<{ id: string; title: string; description: string; category: string; price_cents: number; author_name: string; created_at: string }> }>("/marketplace/admin/pending");
    return response.data.data;
  },
  async review(input: { productId: string; approved: boolean; note?: string }) {
    await api.patch("/marketplace/admin/" + encodeURIComponent(input.productId) + "/review", { approved: input.approved, note: input.note ?? "" });
  },
  async purchases() {
    const response = await api.get<{ success: true; data: Array<{ id: string; title: string; original_file_name: string; paid_at: string }> }>("/marketplace/me/purchases");
    return response.data.data;
  },
  async download(orderId: string) {
    const response = await api.get<{ success: true; data: { downloadUrl: string } }>(`/marketplace/me/orders/${encodeURIComponent(orderId)}/download`);
    return response.data.data.downloadUrl;
  },
  async checkout(input: { slug: string; email: string }) {
    const response = await api.post<MarketplaceCheckoutResponse>("/marketplace/checkout", input);
    return response.data.data;
  },
  previewUrl(slug: string, page: number) {
    const base = api.defaults.baseURL?.replace(/\/$/, "") ?? "";
    return `${base}/marketplace/${encodeURIComponent(slug)}/preview/${page}`;
  },
};
