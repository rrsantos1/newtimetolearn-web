import { useEffect } from "react";
import { useRouter } from "next/router";
import { BookOpen, GraduationCap, UserRound } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, sessionError } = useAuth();

  useEffect(() => {
    if (!isLoading && !sessionError && !isAuthenticated) {
      void router.replace("/login");
    }
  }, [isLoading, sessionError, isAuthenticated, router]);

  if (isLoading || sessionError || !isAuthenticated || !user) {
    return null;
  }

  return (
    <AuthenticatedLayout title="Painel inicial">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <GraduationCap size={25} aria-hidden="true" />
          </span>

          <div>
            <p className="text-sm font-medium text-muted">
              Bem-vindo ao TimeToLearn
            </p>

            <h2 className="mt-1 text-xl font-bold text-dark sm:text-2xl">
              Olá, {user.name}!
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Este será seu espaço para acompanhar conteúdos, atividades e
              sua jornada de aprendizagem da língua inglesa.
            </p>
          </div>
        </div>
      </section>
      
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-dark">
            Acesso rápido
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/student/activities"
              className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <BookOpen
                size={23}
                className="text-primary"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold text-dark">
                Atividades
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted">
                Encontre atividades publicadas e pratique seus conhecimentos.
              </p>

              <span className="mt-4 inline-block text-xs font-semibold text-accent">
                Explorar atividades
              </span>
            </Link>

            <Link
            href="/profile"
            className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
            <UserRound
                size={23}
                className="text-accent"
                aria-hidden="true"
            />

            <h3 className="mt-4 font-semibold text-dark">
                Minha conta
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted">
                Consulte seus dados e atualize seu perfil.
            </p>

            <span className="mt-4 inline-block text-xs font-semibold text-accent">
                Acessar perfil
            </span>
            </Link>
        </div>
      </section>
    </AuthenticatedLayout>
  );
}