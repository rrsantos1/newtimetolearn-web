import api from "@/lib/api";
import type {
  NotificationItem,
  NotificationListResponse,
} from "../types/notification.types";

export async function listNotifications(): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  const response = await api.get<NotificationListResponse>("/notifications");
  return response.data.data;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
