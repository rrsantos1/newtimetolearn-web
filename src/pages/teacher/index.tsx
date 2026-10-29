import { BookOpen, ClipboardList, Users } from "lucide-react";
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
    description: "Prepare atividades para seus alunos.",
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
              <Link
                key={title}
                href="/teacher/activities/word-search/new"
                className="block rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>

                <h2 className="mt-5 font-semibold text-dark">{title}</h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {description}
                </p>

                <span className="mt-4 inline-block text-xs font-semibold text-accent">
                  Criar caça-palavras
                </span>
              </Link>
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