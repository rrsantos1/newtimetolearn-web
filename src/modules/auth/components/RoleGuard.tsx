import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
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
  const { t } = useTranslation();

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
    return <LoadingState label={t("common.verifyingSession")} fullScreen />;
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p className="text-sm text-muted" role="alert">
          {t("auth.sessionVerificationFailed")}
        </p>
      </main>
    );
  }

  if (!isAuthenticated || !user || !hasPermission) {
    return <LoadingState label={t("auth.verifyingPermissions")} fullScreen />;
  }

  return <>{children}</>;
}