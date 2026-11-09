import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { marketplaceFaq, marketplaceFaqEn } from "@/modules/faq/data/faqContent";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { marketplaceService } from "@/modules/marketplace/services/marketplaceService";
import type { MarketplaceProduct } from "@/modules/marketplace/types/marketplace.types";

type SellerProduct = MarketplaceProduct & { status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED"; created_at: string };

type ConnectionState = "loading" | "connected" | "disconnected" | "error";
const marketplaceCategoryKeys: Record<string, TranslationKey> = {
  "Apresentação": "marketplace.presentation",
  "Plano de aula": "marketplace.lessonPlan",
  "Atividade": "marketplace.activity",
  "Material complementar": "marketplace.supplementary",
};

function getMarketplaceCategoryLabel(
  category: string,
  t: (key: TranslationKey) => string,
): string {
  const key = marketplaceCategoryKeys[category];
  return key ? t(key) : category;
}


export default function TeacherMarketplacePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  const { t, locale } = useTranslation();
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
  }, [isAuthenticated, isLoading, user, t]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.roles.includes("TEACHER")) return;
    let active = true;
    marketplaceService.myProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProductsError(t("marketplace.resourcesLoadError")); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, isLoading, user, t]);

  async function handleArchive(product: SellerProduct): Promise<void> {
    const confirmed = window.confirm(t("marketplace.archiveConfirm").replace("{title}",product.title));
    if (!confirmed) return;
    setDeletingProductId(product.id);
    setProductsError("");
    try {
      await marketplaceService.archiveProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch {
      setProductsError(t("marketplace.archiveError"));
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
      setMessage(t("marketplace.connectStartError"));
      setConnecting(false);
    }
  }

  if (isLoading || !isAuthenticated || !user?.roles.includes("TEACHER")) {
    return (
      <main className="min-h-screen bg-background">
        <PublicHeader />
        <p className="mx-auto max-w-4xl px-5 py-16 text-sm text-muted">{t("marketplace.checkingAccess")}</p>
        <PublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Link href="/teacher" className="text-sm font-semibold text-primary hover:underline">
          {t("marketplace.backToTeacherArea")}
        </Link>
        <h1 className="mt-5 text-3xl font-extrabold text-dark">{t("marketplace.teacherMarketplaceTitle")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t("marketplace.teacherMarketplaceDescription")}
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm" aria-labelledby="seller-account-title">
          <h2 id="seller-account-title" className="text-lg font-bold text-dark">{t("marketplace.payoutAccount")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t("marketplace.payoutAccountDescription")}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-dark" role="status" aria-live="polite">
              {connection === "loading" ? t("marketplace.checkingConnection") :
                connection === "connected" ? t("marketplace.mercadoPagoConnected") :
                connection === "error" ? t("marketplace.connectionCheckError") :
                t("marketplace.noConnectedAccount")}
            </p>
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={connecting || connection === "loading"}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {connecting ? t("marketplace.redirecting") : connection === "connected" ? t("marketplace.reconnectAccount") : t("marketplace.connectMercadoPago")}
            </button>
          </div>
          {(message || router.query.mp === "connected" || router.query.mp === "error") && (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-dark" role="status">
              {message || (router.query.mp === "connected"
                ? t("marketplace.connectionSuccess")
                : t("marketplace.connectionError"))}
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-bold text-dark">{t("marketplace.publishResource")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{isAdmin ? t("marketplace.adminPublishDescription") : t("marketplace.teacherPublishDescription")}</p>
            <Link href="/teacher/marketplace/new" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
              {t("marketplace.registerResource")}
            </Link>
          </article>
          <article className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-bold text-dark">{t("marketplace.exploreMarketplace")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t("marketplace.exploreDescription")}</p>
            <Link href="/marketplace" className="mt-5 inline-flex min-h-10 items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              {t("marketplace.openMarketplace")}
            </Link>
          </article>
        </section>

        <section className="mt-8" aria-labelledby="seller-products-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="seller-products-title" className="text-xl font-bold text-dark">{t("marketplace.myResources")}</h2>
              <p className="mt-1 text-sm text-muted">{t("marketplace.myResourcesDescription")}</p>
            </div>
            <span className="text-sm text-muted">{(products.length === 1 ? t("marketplace.resourceCountOne") : t("marketplace.resourceCount")).replace("{count}",String(products.length))}</span>
          </div>
          {productsError && <p role="alert" className="mt-4 text-sm text-red-600">{productsError}</p>}
          {productsLoading ? <p className="mt-5 text-sm text-muted">{t("marketplace.loadingResources")}</p> :
            products.length === 0 ? <p className="mt-5 rounded-xl border border-border bg-white p-5 text-sm text-muted">{t("marketplace.noResources")}</p> :
            <div className="mt-5 grid gap-4">
              {products.map((product) => (
                <article key={product.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center">
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36">
                    {product.preview_pages > 0 && <Image src={marketplaceService.coverUrl(product.slug)} alt={t("marketplace.previewCoverAlt").replace("{title}",product.title)} fill sizes="144px" unoptimized={marketplaceService.shouldBypassImageOptimization()} className="object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-dark">{product.title}</h3>
                    <p className="mt-1 text-sm text-muted">{getMarketplaceCategoryLabel(product.category, t)}</p>
                    <p className="mt-2 text-xs font-semibold text-primary">
                      {product.status === "PUBLISHED" ? t("marketplace.resourceStatusPublished") : product.status === "PENDING_REVIEW" ? t("marketplace.resourceStatusPending") : product.status === "DRAFT" ? t("marketplace.resourceStatusDraft") : t("marketplace.resourceStatusRejected")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.status === "PUBLISHED" && <Link href={`/marketplace/${encodeURIComponent(product.slug)}`} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-semibold text-dark hover:bg-background">{t("marketplace.viewResource")}</Link>}
                    <button type="button" onClick={() => void handleArchive(product)} disabled={deletingProductId === product.id} className="inline-flex min-h-10 items-center rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                      {deletingProductId === product.id ? t("marketplace.archiving") : t("marketplace.removeResource")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          }
        </section>
      </section>
      <FaqSection title={t("marketplace.faqSellerTitle")} description={t("marketplace.faqSellerDescription")} items={locale==="en"?marketplaceFaqEn:marketplaceFaq} />
      <PublicFooter />
    </main>
  );
}
