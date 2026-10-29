import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { UserProfile } from "@/modules/auth/types/auth.types";

interface UserProfileDetailsProps {
  profile: UserProfile;
}

const roleLabels: Record<UserProfile["roles"][number], string> = {
  ADMIN: "Administrador",
  TEACHER: "Professor",
  STUDENT: "Aluno",
};

const statusLabels: Record<UserProfile["status"], string> = {
  PENDING_VERIFICATION: "Aguardando verificação",
  ACTIVE: "Ativa",
  BLOCKED: "Bloqueada",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function UserProfileDetails({
  profile,
}: UserProfileDetailsProps) {
  const roles = (profile.roles ?? [])
    .map((role) => roleLabels[role])
    .filter(Boolean)
    .join(", ");

  const details = [
    {
      label: "E-mail",
      value: profile.email,
      icon: Mail,
    },
    {
        label: "Perfil de acesso",
        value: roles || "Não definido",
        icon: ShieldCheck,
    },
    {
      label: "Situação da conta",
      value: statusLabels[profile.status],
      icon: UserRound,
    },
    {
      label: "Data de cadastro",
      value: formatDate(profile.createdAt),
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