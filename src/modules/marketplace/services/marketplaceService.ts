import api from "@/lib/api";
import type { MarketplaceCheckoutResponse, MarketplaceDetailResponse, MarketplaceListResponse, MarketplaceProduct } from "../types/marketplace.types";

export const marketplaceService = {
  async list(params: { q?: string; category?: string; page?: number; limit?: number } = {}) {
    const response = await api.get<MarketplaceListResponse>("/marketplace", { params });
    return response.data.data;
  },
  async detail(slug: string) {
    const response = await api.get<MarketplaceDetailResponse>(`/marketplace/${encodeURIComponent(slug)}`);
    return response.data.data;
  },
  async createProduct(input: { title: string; description: string; category: string; priceCents: number; file?: File; externalUrl?: string; previewFile?: File }, publisher: "teacher" | "admin" = "teacher") {
    const endpoint = publisher === "admin" ? "/marketplace/admin/products" : "/marketplace/products";
    if (input.file) {
      const response = await api.post<{ success: true; data: { id: string; status: string } }>(endpoint, input.file, {
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
    }
    if (input.externalUrl && input.previewFile) {
      const response = await api.post<{ success: true; data: { id: string; status: string } }>(endpoint, input.previewFile, {
        headers: {
          "Content-Type": input.previewFile.type,
          "x-file-name": encodeURIComponent(input.previewFile.name),
          "x-marketplace-title": encodeURIComponent(input.title),
          "x-marketplace-description": encodeURIComponent(input.description),
          "x-marketplace-category": encodeURIComponent(input.category),
          "x-marketplace-price-cents": String(input.priceCents),
          "x-marketplace-external-url": encodeURIComponent(input.externalUrl),
        },
      });
      return response.data.data;
    }
    throw new Error("MARKETPLACE_PREVIEW_PDF_REQUIRED");
  },
  async myProducts() {
    const response = await api.get<{ success: true; data: Array<MarketplaceProduct & { status: "PENDING_REVIEW" | "PUBLISHED" | "REJECTED"; created_at: string }> }>("/marketplace/me/products");
    return response.data.data;
  },
  async archiveProduct(productId: string) {
    await api.delete<{ success: true }>(`/marketplace/products/${encodeURIComponent(productId)}`);
  },
  async sellerConnectionStatus() {
    const response = await api.get<{ success: true; data: { connected: boolean; mpUserId: string | null } }>("/marketplace/seller/status");
    return response.data.data;
  },
  async connectSellerAccount() {
    const response = await api.post<{ success: true; data: { authorizationUrl: string } }>("/marketplace/seller/connect");
    return response.data.data.authorizationUrl;
  },
  async pendingModeration() {
    const response = await api.get<{ success: true; data: Array<{ id: string; title: string; description: string; category: string; price_cents: number; author_name: string; created_at: string; delivery_type: "FILE" | "EXTERNAL_URL"; external_url: string | null }> }>("/marketplace/admin/pending");
    return response.data.data;
  },
  async review(input: { productId: string; approved: boolean; note?: string }) {
    await api.patch("/marketplace/admin/" + encodeURIComponent(input.productId) + "/review", { approved: input.approved, note: input.note ?? "" });
  },
  async purchases() {
    const response = await api.get<{ success: true; data: Array<{ id: string; title: string; original_file_name: string | null; delivery_type: "FILE" | "EXTERNAL_URL"; external_url: string | null; paid_at: string }> }>("/marketplace/me/purchases");
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
  coverUrl(slug: string) {
    const base = api.defaults.baseURL?.replace(/\/$/, "") ?? "";
    return `${base}/marketplace/${encodeURIComponent(slug)}/cover`;
  },
  previewUrl(slug: string, page: number) {
    const base = api.defaults.baseURL?.replace(/\/$/, "") ?? "";
    return `${base}/marketplace/${encodeURIComponent(slug)}/preview/${page}`;
  },
};
