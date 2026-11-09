import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { AuthenticatedNavigation } from "@/components/layout/AuthenticatedNavigation";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/modules/auth/contexts/AuthContext";

export function PublicHeader() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;

  return (
    <header className="relative z-20 border-b border-[#315987] bg-[#142b4a]">
      <div className="mx-auto flex min-h-22 w-full items-center justify-between gap-3 px-5 sm:px-8 lg:px-10">
        <BrandLogo href={user ? "/dashboard" : "/"} />
        <nav aria-label={t("navigation.main")} className="flex items-center gap-2 sm:gap-4">
          {!user && !isLoading && <Link href="/about" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-red-500! transition-colors hover:bg-red-500 hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4 sm:text-sm">{t("navigation.about")}</Link>}
          {user ? (
            <>
              {isAdmin && <Link href="/admin" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-red-500! transition-colors hover:bg-red-500 hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-4 sm:text-sm"><ShieldCheck size={16} aria-hidden="true" />{t("navigation.admin")}</Link>}
              <span className="hidden max-w-48 truncate text-sm font-medium text-white/90 sm:inline">{user.name}</span>
              <LogoutButton />
            </>
          ) : isLoading ? <span className="text-xs font-medium text-white/80" role="status">{t("navigation.checkingSession")}</span> : <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-xs font-bold text-red-500! transition-colors hover:bg-red-500 hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 sm:text-sm">{t("navigation.login")}</Link>}
          <LanguageSwitcher />
        </nav>
      </div>
      {user && <div className="border-t border-white/15 bg-white"><div className="mx-auto flex min-h-16 w-full items-center px-5 sm:px-8 lg:px-10"><AuthenticatedNavigation /></div></div>}
    </header>
  );
}
