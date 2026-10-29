import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <BrandLogo />

        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-dark px-5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}