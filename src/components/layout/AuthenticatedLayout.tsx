import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LoadingState } from "@/components/ui/LoadingState";
import { AuthenticatedNavigation } from "@/components/layout/AuthenticatedNavigation";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { useAuth } from "@/modules/auth/contexts/AuthContext";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title: string;
}

export function AuthenticatedLayout({ children, title }: AuthenticatedLayoutProps) {
  const { user, isAuthenticated, isLoading, sessionError, retrySession } = useAuth();

  if (isLoading) {
    return <LoadingState label="Verificando sua sessão..." fullScreen />;
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-dark">Não foi possível verificar sua sessão</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Verifique sua conexão e tente novamente. Sua sessão foi preservada.
          </p>
          <button
            type="button"
            onClick={retrySession}
            className="mt-6 min-h-11 rounded-xl bg-primary px-5 font-semibold text-white transition hover:bg-primary-hover"
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

  const isAdmin = user.roles.includes("ADMIN");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[#315987] bg-[#142b4a]">
        <div className="mx-auto flex min-h-[5.5rem] w-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <BrandLogo href="/dashboard" />
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                aria-label="Acessar administração"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold !text-red-600 transition-colors hover:bg-red-600 hover:!text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm"
              >
                <ShieldCheck size={16} aria-hidden="true" />
                Administração
              </Link>
            )}
            <span className="hidden max-w-48 truncate text-sm font-medium text-white/90 sm:inline">
              {user.name}
            </span>
            <LogoutButton />
          </div>
        </div>
        <div className="border-t border-white/15 bg-white">
          <div className="mx-auto flex min-h-16 w-full items-center px-5 sm:px-8 lg:px-10">
            <AuthenticatedNavigation />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">{title}</h1>
        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}
