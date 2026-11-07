import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { marketplaceService } from "@/modules/marketplace/services/marketplaceService";
import type { MarketplaceProduct } from "@/modules/marketplace/types/marketplace.types";

type SellerProduct = MarketplaceProduct & { status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED"; created_at: string };

type ConnectionState = "loading" | "connected" | "disconnected" | "error";

export default function TeacherMarketplacePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [productsError, setProductsError] = useState("");

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
    if (isLoading || !isAuthenticated || !user?.roles.includes("TEACHER")) return;
    let active = true;
    marketplaceService.myProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProductsError("Não foi possível carregar seus materiais."); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, isLoading, user]);

  async function handleArchive(product: SellerProduct): Promise<void> {
    const confirmed = window.confirm(`Deseja remover "${product.title}" do Marketplace? Ele deixará de aparecer publicamente, mas compras anteriores serão preservadas.`);
    if (!confirmed) return;
    setDeletingProductId(product.id);
    setProductsError("");
    try {
      await marketplaceService.archiveProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch {
      setProductsError("Não foi possível remover o material. Tente novamente.");
    } finally {
      setDeletingProductId(null);
    }
  }

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
          {(message || router.query.mp === "connected" || router.query.mp === "error") && (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-dark" role="status">
              {message || (router.query.mp === "connected"
                ? "Sua conta do Mercado Pago foi conectada com sucesso."
                : "Não foi possível conectar a conta. Tente novamente.")}
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-bold text-dark">Publicar material</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Envie PDF, PPT ou PPTX ou cadastre um link do Google Slides para venda como cópia. A publicação depende de assinatura ativa e aprovação administrativa.</p>
            <Link href="/teacher/marketplace/new" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
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

        <section className="mt-8" aria-labelledby="seller-products-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="seller-products-title" className="text-xl font-bold text-dark">Meus materiais</h2>
              <p className="mt-1 text-sm text-muted">Gerencie publicações e remova materiais que não deseja mais oferecer.</p>
            </div>
            <span className="text-sm text-muted">{products.length} {products.length === 1 ? "material" : "materiais"}</span>
          </div>
          {productsError && <p role="alert" className="mt-4 text-sm text-red-600">{productsError}</p>}
          {productsLoading ? <p className="mt-5 text-sm text-muted">Carregando materiais...</p> :
            products.length === 0 ? <p className="mt-5 rounded-xl border border-border bg-white p-5 text-sm text-muted">Você ainda não cadastrou materiais.</p> :
            <div className="mt-5 grid gap-4">
              {products.map((product) => (
                <article key={product.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center">
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36">
                    {product.preview_pages > 0 && <Image src={marketplaceService.coverUrl(product.slug)} alt={`Capa de ${product.title}`} fill sizes="144px" unoptimized={marketplaceService.shouldBypassImageOptimization()} className="object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-dark">{product.title}</h3>
                    <p className="mt-1 text-sm text-muted">{product.category}</p>
                    <p className="mt-2 text-xs font-semibold text-primary">
                      {product.status === "PUBLISHED" ? "Publicado" : product.status === "PENDING_REVIEW" ? "Aguardando aprovação" : product.status === "DRAFT" ? "Rascunho" : "Reprovado"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.status === "PUBLISHED" && <Link href={`/marketplace/${encodeURIComponent(product.slug)}`} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-semibold text-dark hover:bg-background">Visualizar</Link>}
                    <button type="button" onClick={() => void handleArchive(product)} disabled={deletingProductId === product.id} className="inline-flex min-h-10 items-center rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                      {deletingProductId === product.id ? "Removendo..." : "Remover"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          }
        </section>
      </section>
      <PublicFooter />
    </main>
  );
}
