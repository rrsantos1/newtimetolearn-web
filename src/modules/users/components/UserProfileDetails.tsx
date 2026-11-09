import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { UserProfile } from "@/modules/auth/types/auth.types";
import { useTranslation } from "@/hooks/useTranslation";

interface UserProfileDetailsProps {
  profile: UserProfile;
}

function getRoleLabel(role: UserProfile["roles"][number], t: ReturnType<typeof useTranslation>["t"]): string {
  const labels = {
    ADMIN: t("profile.role.admin"),
    TEACHER: t("profile.role.teacher"),
    STUDENT: t("profile.role.student"),
  };
  return labels[role];
}

function getStatusLabel(status: UserProfile["status"], t: ReturnType<typeof useTranslation>["t"]): string {
  const labels = {
    PENDING_VERIFICATION: t("profile.status.pending"),
    ACTIVE: t("profile.status.active"),
    BLOCKED: t("profile.status.blocked"),
  };
  return labels[status];
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "pt-BR" ? "Data indisponível" : "Date unavailable";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function UserProfileDetails({
  profile,
}: UserProfileDetailsProps) {
  const { t, locale } = useTranslation();
  const roles = (profile.roles ?? [])
    .map((role) => getRoleLabel(role, t))
    .filter(Boolean)
    .join(", ");

  const details = [
    {
      label: t("auth.email"),
      value: profile.email,
      icon: Mail,
    },
    {
        label: t("profile.role"),
        value: roles || t("profile.notDefined"),
        icon: ShieldCheck,
    },
    {
      label: t("profile.status"),
      value: getStatusLabel(profile.status, t),
      icon: UserRound,
    },
    {
      label: t("profile.createdAt"),
      value: formatDate(profile.createdAt, locale),
      icon: CalendarDays,
    },
  ];

  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      {details.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-background p-4"
        >
          <dt className="flex items-center gap-2 text-sm text-muted">
            <Icon size={17} aria-hidden="true" />
            {label}
          </dt>

          <dd className="mt-2 wrap-break-word text-sm font-semibold text-dark">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}