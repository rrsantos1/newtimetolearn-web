import Link from "next/link";
import { ClipboardCheck, Settings, ShieldCheck, Users, Images, ShoppingBag } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { useTranslation } from "@/hooks/useTranslation";

export default function AdminPage() {
  const { t } = useTranslation();
  const features = [
    { id: "activities", title: t("adminHome.pendingActivities"), description: t("adminHome.pendingActivitiesDescription"), icon: ClipboardCheck, href: "/admin/activities" },
    { id: "media", title: t("adminHome.mediaReview"), description: t("adminHome.mediaReviewDescription"), icon: Images, href: "/admin/media-review" },
    { id: "marketplace", title: t("adminHome.marketplace"), description: t("adminHome.marketplaceDescription"), icon: ShoppingBag, href: "/admin/marketplace" },
    { id: "users", title: t("adminHome.users"), description: t("adminHome.usersDescription"), icon: Users, href: undefined },
    { id: "permissions", title: t("adminHome.permissions"), description: t("adminHome.permissionsDescription"), icon: ShieldCheck, href: undefined },
    { id: "settings", title: t("adminHome.settings"), description: t("adminHome.settingsDescription"), icon: Settings, href: "/admin/settings" },
  ];

  return (
    <RoleBasedLayout
      area="admin"
      allowedRoles={["ADMIN"]}
      title={t("adminHome.title")}
      description={t("adminHome.description")}
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ id, title, description, icon: Icon, href }) => (
          <article
            key={id}
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon size={22} aria-hidden="true" />
            </span>

            <h2 className="mt-5 font-semibold text-dark">{title}</h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              {description}
            </p>

            {href ? (
              <Link
                href={href}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                style={{ color: "var(--primary-foreground)" }}
              >
                {href === "/admin/media-review"
                  ? t("adminHome.reviewImages")
                  : href === "/admin/settings"
                    ? t("adminHome.openSettings")
                    : href === "/admin/marketplace"
                      ? t("adminHome.manageMarketplace")
                      : t("adminHome.reviewActivities")}
              </Link>
            ) : (
              <span className="mt-4 inline-block text-xs font-medium text-muted">
                {t("adminHome.comingSoon")}
              </span>
            )}
          </article>
        ))}
      </section>
    </RoleBasedLayout>
  );
}
