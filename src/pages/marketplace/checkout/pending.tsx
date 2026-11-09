import Link from "next/link";
import Head from "next/head";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useTranslation } from "@/hooks/useTranslation";

export default function MarketplaceCheckoutSuccessPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background">
      <Head><title>{t("marketplace.checkoutSuccessTitle")}</title></Head>
      <PublicHeader />
      <section className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Marketplace</p>
        <h1 className="mt-3 text-3xl font-extrabold text-dark">{t("marketplace.checkoutPendingTitle")}</h1>
        <p className="mt-4 text-sm leading-7 text-muted">{t("marketplace.checkoutPendingDescription")}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/marketplace/purchases" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">{t("marketplace.checkoutViewPurchases")}</Link>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-dark">{t("marketplace.backToMarketplace")}</Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
