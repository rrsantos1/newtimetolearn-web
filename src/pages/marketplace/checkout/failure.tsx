import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useTranslation } from "@/hooks/useTranslation";

export default function MarketplaceCheckoutFailurePage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-dark">
          {t("marketplace.checkoutFailureTitle")}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          {t("marketplace.checkoutFailureDescription")}
        </p>
        <Link
          href="/marketplace"
          className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white"
        >
          {t("marketplace.backToMarketplace")}
        </Link>
      </section>
      <PublicFooter />
    </main>
  );
}