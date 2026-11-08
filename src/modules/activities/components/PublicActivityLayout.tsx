import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";

interface PublicActivityLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  titleActions?: ReactNode;
  immersive?: boolean;
}

export function PublicActivityLayout({ children, title, description, titleActions, immersive = false }: PublicActivityLayoutProps) {
  const { user } = useAuth();
  if (user) {
    return (
      <RoleBasedLayout area="student" allowedRoles={["STUDENT", "TEACHER", "ADMIN"]} title={title} description={description} titleActions={titleActions} immersive={immersive}>
        {children}
      </RoleBasedLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {immersive ? (
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex min-h-14 w-full items-center justify-between gap-3 px-4 sm:px-6">
            <div className="min-w-0"><h1 className="truncate text-base font-bold text-dark sm:text-lg">{title}</h1><p className="hidden truncate text-xs text-muted sm:block">{description}</p></div>
            <div className="flex shrink-0 items-center gap-2">{titleActions}<Link href="/login" className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold text-dark">Entrar</Link></div>
          </div>
        </header>
      ) : (
        <>
          <header className="border-b border-[#315987] bg-[#142b4a]"><div className="mx-auto flex min-h-16 w-full items-center justify-between gap-4 px-5 sm:px-8"><BrandLogo href="/" /><Link href="/login" className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#142b4a] transition hover:bg-slate-100">Entrar</Link></div></header>
        </>
      )}
      <main className={immersive ? "mx-auto w-full px-3 py-4 sm:px-6 sm:py-6" : "mx-auto w-full px-5 py-8 sm:px-8 sm:py-10"}>
        {!immersive && <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 flex-1"><h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">{title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p></div>{titleActions}<p className="mt-3 inline-flex rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">Você está testando como visitante. Seu resultado não será salvo nem entrará no ranking.</p></div>}
        {immersive && <p className="mb-3 inline-flex rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">Modo visitante: resultado não será salvo nem entrará no ranking.</p>}
        {children}
      </main>
    </div>
  );
}
