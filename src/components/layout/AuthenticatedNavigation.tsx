import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { BookOpen, LayoutDashboard, UserRound, Menu, X } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { hasAnyRole } from "@/modules/auth/utils/hasAnyRole";

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Painel inicial",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Meus estudos",
    href: "/studies",
    icon: BookOpen,
    disabled: true,
  },
  {
    label: "Minha conta",
    href: "/profile",
    icon: UserRound,
  },
];

export function AuthenticatedNavigation() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return router.pathname === "/dashboard";
    }

    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  }

  function closeMenu(): void {
    setIsMenuOpen(false);
  }

  function getLinkClass(href: string, disabled = false): string {
    const baseClass =
      "flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition";

    if (disabled) {
      return `${baseClass} cursor-not-allowed text-muted/60`;
    }

    if (isActive(href)) {
      return `${baseClass} bg-primary text-primary-foreground`;
    }

    return `${baseClass} text-muted hover:bg-background hover:text-dark`;
  }

  const { user } = useAuth();

  const canAccessTeacherArea = hasAnyRole(
    user?.roles ?? [],
    ["TEACHER"],
    );

  return (
    <nav aria-label="Navegação principal">
      <div className="hidden items-center gap-2 md:flex">
        {navigationItems.map(({ label, href, icon: Icon, disabled }) => (
          <Link
            key={href}
            href={disabled ? "/dashboard" : href}
            aria-current={!disabled && isActive(href) ? "page" : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            onClick={disabled ? (event) => event.preventDefault() : undefined}
            className={getLinkClass(href, disabled)}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
            {disabled && (
              <span className="ml-1 text-xs font-normal">
                Em breve
              </span>
            )}
          </Link>
        ))}
        {canAccessTeacherArea && (
            <Link
                href="/teacher"
                aria-current={
                router.pathname === "/teacher" ||
                router.pathname.startsWith("/teacher/")
                    ? "page"
                    : undefined
                }
                className={getLinkClass("/teacher")}
            >
                <BookOpen size={17} aria-hidden="true" />
                Área do professor
            </Link>
        )}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          aria-controls="authenticated-mobile-menu"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex size-11 items-center justify-center rounded-xl border border-border text-dark transition hover:bg-background"
        >
          {isMenuOpen ? (
            <X size={21} aria-hidden="true" />
          ) : (
            <Menu size={21} aria-hidden="true" />
          )}
        </button>

        {isMenuOpen && (
          <div
            id="authenticated-mobile-menu"
            className="absolute inset-x-0 top-full z-50 border-b border-border bg-surface p-4 shadow-lg"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navigationItems.map(
                ({ label, href, icon: Icon, disabled }) => (
                  <Link
                    key={href}
                    href={disabled ? "/dashboard" : href}
                    aria-current={
                      !disabled && isActive(href) ? "page" : undefined
                    }
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : undefined}
                    onClick={(event) => {
                      if (disabled) {
                        event.preventDefault();
                        return;
                      }

                      closeMenu();
                    }}
                    className={getLinkClass(href, disabled)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                    {disabled && (
                      <span className="ml-auto text-xs font-normal">
                        Em breve
                      </span>
                    )}
                  </Link>
                ),
              )}
              {canAccessTeacherArea && (
                <Link
                    href="/teacher"
                    aria-current={
                    router.pathname === "/teacher" ||
                    router.pathname.startsWith("/teacher/")
                        ? "page"
                        : undefined
                    }
                    className={getLinkClass("/teacher")}
                    onClick={closeMenu}
                >
                    <BookOpen size={17} aria-hidden="true" />
                    Área do professor
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}