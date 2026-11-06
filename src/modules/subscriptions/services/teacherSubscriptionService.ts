import api from "@/lib/api";
import type {
  TeacherEntitlements,
  TeacherEntitlementsResponse,
  TeacherSubscriptionCheckoutResponse,
} from "../types/teacherSubscription.types";

export const teacherSubscriptionService = {
  async getEntitlements(): Promise<TeacherEntitlements> {
    const response = await api.get<TeacherEntitlementsResponse>("/subscriptions/me/entitlements");
    return response.data.data;
  },

  async createCheckout(): Promise<TeacherSubscriptionCheckoutResponse["data"]> {
    const response = await api.post<TeacherSubscriptionCheckoutResponse>("/subscriptions/checkout");
    return response.data.data;
  },

  async cancel(): Promise<void> {
    await api.post("/subscriptions/cancel");
  },
};
