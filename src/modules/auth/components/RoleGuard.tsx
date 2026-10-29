import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import type { UserRole } from "@/modules/auth/types/auth.types";
import { hasAnyRole } from "@/modules/auth/utils/hasAnyRole";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, sessionError } = useAuth();

  const hasPermission =
    user !== null && hasAnyRole(user.roles ?? [], allowedRoles);

  useEffect(() => {
    if (isLoading || sessionError) {
      return;
    }

    if (!isAuthenticated) {
      void router.replace("/login");
      return;
    }

    if (user && !hasPermission) {
      void router.replace("/dashboard");
    }
  }, [
    isLoading,
    sessionError,
    isAuthenticated,
    user,
    hasPermission,
    router,
  ]);

  if (isLoading) {
    return <LoadingState label="Verificando sua sessão..." fullScreen />;
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p className="text-sm text-muted" role="alert">
          Não foi possível verificar sua sessão. Atualize a página e tente novamente.
        </p>
      </main>
    );
  }

  if (!isAuthenticated || !user || !hasPermission) {
    return <LoadingState label="Verificando permissões..." fullScreen />;
  }

  return <>{children}</>;
}