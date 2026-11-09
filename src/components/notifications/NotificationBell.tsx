import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/modules/notifications/services/notificationService";
import type { NotificationItem } from "@/modules/notifications/types/notification.types";

function formatNotificationDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationBell() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function refreshNotifications(): Promise<void> {
      try {
        const result = await listNotifications();
        if (isMounted) {
          setNotifications(result.items);
          setUnreadCount(result.unreadCount);
        }
      } catch {
        // A navegação principal permanece disponível mesmo se as notificações falharem.
      }
    }

    void refreshNotifications();
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 300_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleNotificationClick(notification: NotificationItem): Promise<void> {
    if (!notification.readAt) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((current) => current.map((item) => (
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item
        )));
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch {
        // O destino ainda pode ser acessado caso a atualização falhe.
      }
    }

    setIsOpen(false);
    if (notification.link) await router.push(notification.link);
  }

  async function handleMarkAllAsRead(): Promise<void> {
    setIsUpdating(true);
    try {
      await markAllNotificationsAsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt })));
      setUnreadCount(0);
    } catch {
      // Mantém o estado atual quando a API não confirma a atualização.
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? t("notifications.ariaUnread").replace("{count}", String(unreadCount)) : t("notifications.ariaLabel")}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex size-11 items-center justify-center rounded-xl border border-border text-dark transition hover:bg-background"
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          id="notification-panel"
          aria-label={t("notifications.panel")}
          className="absolute right-0 top-13 z-70 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="font-semibold text-dark">{t("notifications.ariaLabel")}</h2>
              <p className="text-xs text-muted">{unreadCount} {t("notifications.unread")}</p>
            </div>
            <button
              type="button"
              disabled={unreadCount === 0 || isUpdating}
              onClick={() => void handleMarkAllAsRead()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={15} aria-hidden="true" />
              {t("notifications.markAllRead")}
            </button>
          </header>

          <div className="max-h-[min(65vh,420px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                {t("notifications.empty")}
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className={`block w-full border-b border-border px-4 py-3 text-left transition hover:bg-background ${notification.readAt ? "bg-white" : "bg-primary/5"}`}
                >
                  <span className="flex items-start gap-2">
                    {!notification.readAt && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label={t("notifications.unreadIndicator")} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-dark">{notification.title}</span>
                      <span className="mt-1 block text-sm text-muted">{notification.message}</span>
                      <span className="mt-2 block text-xs text-muted">
                        {formatNotificationDate(notification.createdAt, locale)}
                      </span>
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
