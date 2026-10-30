import { BookOpen, ClipboardList, Plus, Search, Users } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import Link from "next/link";

const features = [
  {
    title: "Conteúdos",
    description: "Organize os materiais de aprendizagem de inglês.",
    icon: BookOpen,
  },
  {
    title: "Atividades",
    description: "Consulte suas atividades, acompanhe o status de aprovação e gerencie seus caça-palavras.",
    icon: ClipboardList,
  },
  {
    title: "Alunos",
    description: "Prepare o acompanhamento da aprendizagem.",
    icon: Users,
  },
];

export default function TeacherPage() {
  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Área do professor"
      description="Organize conteúdos e atividades e acompanhe a aprendizagem dos seus alunos."
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, description, icon: Icon }) => {
          if (title === "Atividades") {
            return (
              <article
                key={title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>

                <h2 className="mt-5 font-semibold text-dark">{title}</h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {description}
                </p>

                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href="/teacher/activities"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <ClipboardList size={16} aria-hidden="true" />
                    Ver minhas atividades
                  </Link>

                  <Link
                    href="/teacher/activities/explore"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <Search size={16} aria-hidden="true" />
                    Explorar atividades
                  </Link>

                  <Link
                    href="/teacher/activities/new"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Criar atividade
                  </Link>
                </div>
              </article>
            );
          }

          return (
            <article
              key={title}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={22} aria-hidden="true" />
              </span>

              <h2 className="mt-5 font-semibold text-dark">{title}</h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                {description}
              </p>

              <span className="mt-4 inline-block text-xs font-medium text-muted">
                Em preparação
              </span>
            </article>
          );
        })}
      </section>
    </RoleBasedLayout>
  );
}
