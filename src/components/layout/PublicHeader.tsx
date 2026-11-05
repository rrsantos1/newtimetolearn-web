import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function PublicHeader() {
  return (
    <header className="relative z-20 border-b border-border bg-white">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <BrandLogo />

        <nav aria-label="Navegação principal" className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/about"
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-dark transition hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Sobre
          </Link>

          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
