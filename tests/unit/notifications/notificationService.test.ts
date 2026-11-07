import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/modules/notifications/services/notificationService";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("notificationService", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it("returns notification items and unread count", async () => {
    const result = {
      items: [{
        id: "notification-1",
        type: "ACTIVITY_APPROVED",
        title: "Atividade aprovada",
        message: "Sua atividade foi aprovada.",
        link: "/teacher/activities",
        metadata: {},
        readAt: null,
        createdAt: "2026-11-01T10:00:00.000Z",
      }],
      unreadCount: 1,
    };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: result } } as never);

    await expect(listNotifications()).resolves.toEqual(result);
    expect(api.get).toHaveBeenCalledWith("/notifications");
  });

  it("marks one notification as read", async () => {
    vi.mocked(api.patch).mockResolvedValue({} as never);

    await expect(markNotificationAsRead("notification-1")).resolves.toBeUndefined();
    expect(api.patch).toHaveBeenCalledWith("/notifications/notification-1/read");
  });

  it("marks all notifications as read", async () => {
    vi.mocked(api.patch).mockResolvedValue({} as never);

    await expect(markAllNotificationsAsRead()).resolves.toBeUndefined();
    expect(api.patch).toHaveBeenCalledWith("/notifications/read-all");
  });

  it("propagates API errors when loading notifications", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Unauthorized"));

    await expect(listNotifications()).rejects.toThrow("Unauthorized");
  });
});
