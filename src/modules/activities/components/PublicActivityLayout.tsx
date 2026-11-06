import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";

interface PublicActivityLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function PublicActivityLayout({ children, title, description }: PublicActivityLayoutProps) {
  const { user } = useAuth();
  if (user) {
    return (
      <RoleBasedLayout area="student" allowedRoles={["STUDENT", "TEACHER", "ADMIN"]} title={title} description={description}>
        {children}
      </RoleBasedLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[#315987] bg-[#142b4a]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <BrandLogo href="/" />
          <Link href="/login" className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#142b4a] transition hover:bg-slate-100">Entrar</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
          <p className="mt-3 inline-flex rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">Você está testando como visitante. Seu resultado não será salvo nem entrará no ranking.</p>
        </div>
        {children}
      </main>
    </div>
  );
}
