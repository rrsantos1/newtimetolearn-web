import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function PublicHeader() {
  return (
    <header className="relative z-20 border-b border-[#315987] bg-[#142b4a]">
      <div className="mx-auto flex min-h-[5.5rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <BrandLogo />

        <nav aria-label="Navegação principal" className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/about"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-[#142b4a] transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Sobre
          </Link>

          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-[#142b4a] transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
