import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { marketplaceService } from "@/modules/marketplace/services/marketplaceService";

type ConnectionState = "loading" | "connected" | "disconnected" | "error";

export default function TeacherMarketplacePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes("TEACHER"))) {
      void router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.roles.includes("TEACHER")) return;
    let active = true;
    marketplaceService.sellerConnectionStatus()
      .then((result) => {
        if (active) setConnection(result.connected ? "connected" : "disconnected");
      })
      .catch(() => {
        if (active) setConnection("error");
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    if (router.query.mp === "connected") {
      setMessage("Sua conta do Mercado Pago foi conectada com sucesso.");
      setConnection("connected");
    } else if (router.query.mp === "error") {
      setMessage("Não foi possível conectar a conta. Tente novamente.");
    }
  }, [router.query.mp]);

  async function handleConnect(): Promise<void> {
    setConnecting(true);
    setMessage("");
    try {
      const authorizationUrl = await marketplaceService.connectSellerAccount();
      window.location.assign(authorizationUrl);
    } catch {
      setMessage("Não foi possível iniciar a conexão com o Mercado Pago. Tente novamente mais tarde.");
      setConnecting(false);
    }
  }

  if (isLoading || !isAuthenticated || !user?.roles.includes("TEACHER")) {
    return (
      <main className="min-h-screen bg-background">
        <PublicHeader />
        <p className="mx-auto max-w-4xl px-5 py-16 text-sm text-muted">Verificando acesso...</p>
        <PublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Link href="/teacher" className="text-sm font-semibold text-primary hover:underline">
          ← Área do professor
        </Link>
        <h1 className="mt-5 text-3xl font-extrabold text-dark">Marketplace do professor</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Publique seus materiais, acompanhe a aprovação e configure o recebimento das vendas.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm" aria-labelledby="seller-account-title">
          <h2 id="seller-account-title" className="text-lg font-bold text-dark">Conta de recebimento</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Para vender materiais, conecte sua própria conta do Mercado Pago. O TimeToLearn retém uma comissão de 20% sobre cada venda de professor; as tarifas de processamento do Mercado Pago são cobradas separadamente.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-dark" role="status" aria-live="polite">
              {connection === "loading" ? "Verificando conexão..." :
                connection === "connected" ? "Conta do Mercado Pago conectada" :
                connection === "error" ? "Não foi possível verificar a conexão" :
                "Nenhuma conta conectada"}
            </p>
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={connecting || connection === "loading"}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {connecting ? "Redirecionando..." : connection === "connected" ? "Reconectar conta" : "Conectar Mercado Pago"}
            </button>
          </div>
          {message && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-dark" role="status">{message}</p>}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-bold text-dark">Publicar material</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Envie arquivos PDF, PPT ou PPTX. A publicação depende de assinatura ativa e aprovação administrativa.</p>
            <Link href="/teacher/marketplace/new" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              Cadastrar material
            </Link>
          </article>
          <article className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-bold text-dark">Explorar Marketplace</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Conheça os materiais disponíveis e acompanhe as publicações da comunidade.</p>
            <Link href="/marketplace" className="mt-5 inline-flex min-h-10 items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              Abrir Marketplace
            </Link>
          </article>
        </section>
      </section>
      <PublicFooter />
    </main>
  );
}
