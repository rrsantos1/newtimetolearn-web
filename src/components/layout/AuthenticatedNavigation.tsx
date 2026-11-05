import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { BookOpen, LayoutDashboard, UserRound, Menu, X, Users, GraduationCap } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { hasAnyRole } from "@/modules/auth/utils/hasAnyRole";

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

const navigationItems: NavigationItem[] = [
  { label: "Painel inicial", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meus estudos", href: "/studies", icon: BookOpen, disabled: true },
  { label: "Minha conta", href: "/profile", icon: UserRound },
];

export function AuthenticatedNavigation() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return router.pathname === "/dashboard";
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  }

  function closeMenu(): void {
    setIsMenuOpen(false);
  }

  function getLinkClass(href: string, disabled = false): string {
    const baseClass = "flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition";
    if (disabled) return `${baseClass} cursor-not-allowed text-muted/60`;
    if (isActive(href)) return `${baseClass} bg-primary text-white shadow-sm`;
    return `${baseClass} text-[#34445c] hover:bg-[#f1f5fa] hover:text-[#142b4a]`;
  }

  const canAccessTeacherArea = hasAnyRole(user?.roles ?? [], ["TEACHER"]);

  function renderTeacherLink(): ReactNode {
    if (!canAccessTeacherArea) return null;
    const active = isActive("/teacher");
    return (
      <Link
        href="/teacher"
        aria-current={active ? "page" : undefined}
        className={getLinkClass("/teacher")}
        style={active ? { color: "var(--primary-foreground)" } : undefined}
      >
        <BookOpen size={17} aria-hidden="true" />
        Área do professor
      </Link>
    );
  }

  return (
    <nav aria-label="Navegação principal" className="flex w-full items-center gap-2">
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
            style={!disabled && isActive(href) ? { color: "var(--primary-foreground)" } : undefined}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
            {disabled && <span className="ml-1 text-xs font-normal">Em breve</span>}
          </Link>
        ))}
        {renderTeacherLink()}
        {user?.roles.includes("TEACHER") && (
          <Link href="/teacher/students" aria-current={isActive("/teacher/students") ? "page" : undefined} className={getLinkClass("/teacher/students")}>
            <Users size={17} aria-hidden="true" />
            Meus alunos
          </Link>
        )}
        {user?.roles.includes("STUDENT") && (
          <Link href="/student/teachers" aria-current={isActive("/student/teachers") ? "page" : undefined} className={getLinkClass("/student/teachers")}>
            <GraduationCap size={17} aria-hidden="true" />
            Meus professores
          </Link>
        )}
      </div>

      <div className="ml-auto"><NotificationBell /></div>

      <div className="flex items-center justify-end gap-2 md:hidden">
        <button
          type="button"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          aria-controls="authenticated-mobile-menu"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex size-11 items-center justify-center rounded-xl border border-border text-dark transition hover:bg-background"
        >
          {isMenuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>

        {isMenuOpen && (
          <div id="authenticated-mobile-menu" className="absolute inset-x-0 top-full z-50 border-b border-border bg-white p-4 shadow-lg">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navigationItems.map(({ label, href, icon: Icon, disabled }) => (
                <Link
                  key={href}
                  href={disabled ? "/dashboard" : href}
                  aria-current={!disabled && isActive(href) ? "page" : undefined}
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
                  style={!disabled && isActive(href) ? { color: "var(--primary-foreground)" } : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                  {disabled && <span className="ml-auto text-xs font-normal">Em breve</span>}
                </Link>
              ))}
              {canAccessTeacherArea && (
                <Link
                  href="/teacher"
                  aria-current={isActive("/teacher") ? "page" : undefined}
                  className={getLinkClass("/teacher")}
                  style={isActive("/teacher") ? { color: "var(--primary-foreground)" } : undefined}
                  onClick={closeMenu}
                >
                  <BookOpen size={18} aria-hidden="true" />
                  Área do professor
                </Link>
              )}
              {user?.roles.includes("TEACHER") && (
                <Link href="/teacher/students" aria-current={isActive("/teacher/students") ? "page" : undefined} className={getLinkClass("/teacher/students")} onClick={closeMenu}>
                  <Users size={18} aria-hidden="true" />
                  Meus alunos
                </Link>
              )}
              {user?.roles.includes("STUDENT") && (
                <Link href="/student/teachers" aria-current={isActive("/student/teachers") ? "page" : undefined} className={getLinkClass("/student/teachers")} onClick={closeMenu}>
                  <GraduationCap size={18} aria-hidden="true" />
                  Meus professores
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
