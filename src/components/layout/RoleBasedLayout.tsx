import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthenticatedNavigation } from "@/components/layout/AuthenticatedNavigation";
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
  titleActions?: ReactNode;
  immersive?: boolean;
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
  titleActions,
  immersive = false,
}: RoleBasedLayoutProps) {
  const { user } = useAuth();
  const [loadedEntitlements, setLoadedEntitlements] = useState<LoadedTeacherEntitlements | null>(null);
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const isAdmin = user?.roles.includes("ADMIN") ?? false;

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
    !isAdmin &&
    loadedEntitlements?.teacherId === user?.id &&
    loadedEntitlements?.entitlements.removesAds === false;

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        {immersive ? (
          <header className="border-b border-[#315987] bg-[#142b4a] shadow-sm">
            <div className="mx-auto flex min-h-14 w-full items-center justify-between gap-3 px-4 sm:px-6">
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-white sm:text-lg">{title}</h1>
                <p className="hidden truncate text-xs text-white/75 sm:block">{description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 [&_a]:!border-white/30 [&_a]:!bg-white/10 [&_a]:!text-white [&_a:hover]:!bg-white/20 [&_button]:!border-white/30 [&_button]:!bg-white/10 [&_button]:!text-white [&_button:hover]:!bg-white/20">{titleActions}</div>
            </div>
          </header>
        ) : (
          <header className="border-b border-[#315987] bg-[#142b4a]">
            <div className="mx-auto flex min-h-[5.5rem] w-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
              <BrandLogo href="/dashboard" />
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSwitcher />
                {isTeacher && area === "admin" && (
                  <Link href="/teacher" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold !text-red-600 transition-colors hover:bg-red-600 hover:!text-white sm:text-sm">Área do professor</Link>
                )}
                {isAdmin && area !== "admin" && (
                  <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold !text-red-600 transition-colors hover:bg-red-600 hover:!text-white sm:text-sm"><ShieldCheck size={16} aria-hidden="true" />Administração</Link>
                )}
                <span className="hidden max-w-48 truncate text-sm font-medium text-white/90 sm:inline">{user?.name}</span>
                <LogoutButton />
              </div>
            </div>
            <div className="border-t border-white/15 bg-white">
              <div className="mx-auto flex min-h-16 w-full items-center px-5 sm:px-8 lg:px-10"><AuthenticatedNavigation /></div>
            </div>
          </header>
        )}

        <main className={immersive ? "mx-auto w-full px-3 py-4 sm:px-6 sm:py-6" : "mx-auto w-full px-5 py-8 sm:px-8 sm:py-10"}>
          {!immersive && <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">{title}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p>
            </div>
            {titleActions}
            {backLinkPlacement === "title" && (
              <Link href="/dashboard" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-dark transition hover:bg-background"><ArrowLeft size={16} aria-hidden="true" />Área autenticada</Link>
            )}
          </div>}

          {shouldShowAds && <TeacherAdSlot placement="teacher-top" />}
          {children}
          {shouldShowAds && <TeacherAdSlot placement="teacher-bottom" />}
        </main>
      </div>
    </RoleGuard>
  );
}
