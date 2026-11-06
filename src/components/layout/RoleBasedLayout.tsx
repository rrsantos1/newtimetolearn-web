import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { RoleGuard } from "@/modules/auth/components/RoleGuard";
import type { UserRole } from "@/modules/auth/types/auth.types";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { TeacherAdSlot } from "@/components/ads/TeacherAdSlot";
import { teacherSubscriptionService } from "@/modules/subscriptions/services/teacherSubscriptionService";
import type { TeacherEntitlements } from "@/modules/subscriptions/types/teacherSubscription.types";

interface RoleBasedLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  allowedRoles: UserRole[];
  area: "teacher" | "admin" | "student";
  backLinkPlacement?: "top" | "title";
}

interface LoadedTeacherEntitlements {
  teacherId: string;
  entitlements: TeacherEntitlements;
}

export function RoleBasedLayout({
  children,
  title,
  description,
  allowedRoles,
  area,
  backLinkPlacement = "top",
}: RoleBasedLayoutProps) {
  const { user } = useAuth();
  const [loadedEntitlements, setLoadedEntitlements] = useState<LoadedTeacherEntitlements | null>(null);
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const homeHref = area === "admin" ? "/admin" : area === "student" ? "/dashboard" : "/teacher";

  useEffect(() => {
    if (area !== "teacher" || !isTeacher || !user?.id) return;

    let active = true;
    teacherSubscriptionService.getEntitlements()
      .then((entitlements) => {
        if (active) setLoadedEntitlements({ teacherId: user.id, entitlements });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [area, isTeacher, user?.id]);

  const shouldShowAds =
    area === "teacher" &&
    isTeacher &&
    loadedEntitlements?.teacherId === user?.id &&
    !loadedEntitlements.entitlements.removesAds;

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-[#315987] bg-[#142b4a]">
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <BrandLogo href={homeHref} />
            <div className="flex items-center gap-2 sm:gap-3">
              {isTeacher && area === "admin" && (
                <Link href="/teacher" className="hidden min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-[#142b4a] transition hover:bg-slate-100 sm:inline-flex">
                  Área do professor
                </Link>
              )}
              {user?.roles.includes("ADMIN") && area === "teacher" && (
                <Link href="/admin" className="hidden min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-[#142b4a] transition hover:bg-slate-100 sm:inline-flex">
                  <ShieldCheck size={16} aria-hidden="true" />
                  Administração
                </Link>
              )}
              <span className="hidden max-w-48 truncate text-sm font-medium text-white/90 sm:inline">
                {user?.name}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          {backLinkPlacement === "top" && (
            <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-accent">
              <ArrowLeft size={16} aria-hidden="true" />
              Área autenticada
            </Link>
          )}

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
            </div>
            {backLinkPlacement === "title" && (
              <Link href="/dashboard" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-dark transition hover:bg-background">
                <ArrowLeft size={16} aria-hidden="true" />
                Área autenticada
              </Link>
            )}
          </div>

          {shouldShowAds && <TeacherAdSlot placement="teacher-top" />}
          {children}
          {shouldShowAds && <TeacherAdSlot placement="teacher-bottom" />}
        </main>
      </div>
    </RoleGuard>
  );
}
