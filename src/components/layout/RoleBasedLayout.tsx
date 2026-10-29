import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { RoleGuard } from "@/modules/auth/components/RoleGuard";
import type { UserRole } from "@/modules/auth/types/auth.types";
import { useAuth } from "@/modules/auth/contexts/AuthContext";

interface RoleBasedLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  allowedRoles: UserRole[];
  area: "teacher" | "admin";
}

export function RoleBasedLayout({
  children,
  title,
  description,
  allowedRoles,
  area,
}: RoleBasedLayoutProps) {
  const { user } = useAuth();

  const homeHref = area === "admin" ? "/admin" : "/teacher";

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <BrandLogo href={homeHref} />

            <div className="flex items-center gap-3">
              {user?.roles.includes("TEACHER") && area === "admin" && (
                <Link
                  href="/teacher"
                  className="hidden min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-dark transition hover:bg-background sm:inline-flex"
                >
                  Área do professor
                </Link>
              )}

              {user?.roles.includes("ADMIN") && area === "teacher" && (
                <Link
                  href="/admin"
                  className="hidden min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-dark transition hover:bg-background sm:inline-flex"
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  Administração
                </Link>
              )}

              <span className="hidden max-w-48 truncate text-sm text-muted sm:inline">
                {user?.name}
              </span>

              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Área autenticada
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">
              {title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {description}
            </p>
          </div>

          {children}
        </main>
      </div>
    </RoleGuard>
  );
}