import Link from "next/link";
import { ClipboardCheck, Settings, ShieldCheck, Users } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";

const features = [
  {
    title: "Atividades pendentes",
    description: "Revise as atividades enviadas pelos professores para aprovação.",
    icon: ClipboardCheck,
    href: "/admin/activities",
  },
  {
    title: "Usuários",
    description: "Prepare a gestão das contas da plataforma.",
    icon: Users,
    href: undefined,
  },
  {
    title: "Permissões",
    description: "Prepare a gestão dos papéis e acessos.",
    icon: ShieldCheck,
    href: undefined,
  },
  {
    title: "Configurações",
    description: "Organize as futuras configurações da plataforma.",
    icon: Settings,
    href: undefined,
  },
];

export default function AdminPage() {
  return (
    <RoleBasedLayout
      area="admin"
      allowedRoles={["ADMIN"]}
      title="Área administrativa"
      description="Gerencie os recursos administrativos do TimeToLearn."
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, description, icon: Icon, href }) => (
          <article
            key={title}
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
                Revisar atividades
              </Link>
            ) : (
              <span className="mt-4 inline-block text-xs font-medium text-muted">
                Em preparação
              </span>
            )}
          </article>
        ))}
      </section>
    </RoleBasedLayout>
  );
}