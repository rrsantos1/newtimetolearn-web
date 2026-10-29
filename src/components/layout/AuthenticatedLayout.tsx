import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LoadingState } from "@/components/ui/LoadingState";
import { AuthenticatedNavigation } from "@/components/layout/AuthenticatedNavigation";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { useAuth } from "@/modules/auth/contexts/AuthContext";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title: string;
}

export function AuthenticatedLayout({
  children,
  title,
}: AuthenticatedLayoutProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionError,
    retrySession,
  } = useAuth();

  if (isLoading) {
    return <LoadingState label="Verificando sua sessão..." fullScreen />;
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-dark">
            Não foi possível verificar sua sessão
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Verifique sua conexão e tente novamente. Sua sessão foi preservada.
          </p>

          <button
            type="button"
            onClick={retrySession}
            className="mt-6 min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoadingState label="Redirecionando para o login..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <BrandLogo href="/dashboard" />

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-56 truncate text-sm text-muted lg:inline">
              {user.name}
            </span>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="relative border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <AuthenticatedNavigation />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">
          {title}
        </h1>

        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}