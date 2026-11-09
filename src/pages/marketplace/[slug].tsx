import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from "formik";
import * as Yup from "yup";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import {
  marketplaceFaq,
  marketplaceFaqEn,
} from "@/modules/faq/data/faqContent";
import { marketplaceService } from "@/modules/marketplace/services/marketplaceService";
import type { MarketplaceProduct } from "@/modules/marketplace/types/marketplace.types";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

const marketplaceCategoryKeys: Record<string, TranslationKey> = {
  Apresentação: "marketplace.presentation",
  "Plano de aula": "marketplace.lessonPlan",
  Atividade: "marketplace.activity",
  "Material complementar": "marketplace.supplementary",
};

function getMarketplaceCategoryLabel(
  category: string,
  t: (key: TranslationKey) => string,
): string {
  const key = marketplaceCategoryKeys[category];
  return key ? t(key) : category;
}

export default function MarketplaceProductPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { t, locale } = useTranslation();
  const checkoutSchema = Yup.object({
    email: Yup.string()
      .email(t("marketplace.emailInvalid"))
      .required(t("marketplace.emailRequired")),
  });
  const [product, setProduct] = useState<
    (MarketplaceProduct & { previews: Array<{ pageNumber: number }> }) | null
  >(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!slug) return;
    let active = true;
    marketplaceService
      .detail(slug)
      .then((value) => {
        if (active) setProduct(value);
      })
      .catch(() => {
        if (active) setError(t("marketplace.notFound"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, t]);
  async function handleCheckout(
    values: { email: string },
    helpers: FormikHelpers<{ email: string }>,
  ) {
    try {
      const result = await marketplaceService.checkout({
        slug,
        email: values.email,
      });
      window.location.assign(result.checkoutUrl);
    } catch {
      helpers.setStatus(t("marketplace.checkoutError"));
      helpers.setSubmitting(false);
    }
  }
  return (
    <main className="min-h-screen bg-background">
      <Head>
        <title>
          {product
            ? product.title + " | Marketplace"
            : t("marketplace.productFallbackTitle")}
        </title>
      </Head>
      <PublicHeader />
      <section className="mx-auto w-full px-5 py-10 sm:px-8 lg:px-10">
        <Link
          href="/marketplace"
          className="text-sm font-semibold text-primary hover:underline"
        >
          {t("marketplace.backToMarketplace")}
        </Link>
        {loading ? (
          <p className="mt-8 text-sm text-muted">
            {t("marketplace.loadingProduct")}
          </p>
        ) : error ? (
          <p role="alert" className="mt-8 text-sm text-red-600">
            {error}
          </p>
        ) : product ? (
          <>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
                  {getMarketplaceCategoryLabel(product.category, t)}
                </p>
                <h1 className="mt-2 text-3xl font-extrabold text-dark">
                  {product.title}
                </h1>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {product.description}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {t("marketplace.materialBy")
                    .replace("{author}", product.author_name)
                    .replace("{pages}", String(product.preview_pages))
                    .replace(
                      "{pageLabel}",
                      t(
                        product.delivery_type === "EXTERNAL_URL"
                          ? "marketplace.previewPageLabel"
                          : "marketplace.pageLabel",
                      ),
                    )}
                </p>
              </div>
              <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-muted">
                  {t("marketplace.materialValue")}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-dark">
                  {(product.price_cents / 100).toLocaleString(
                    locale === "en" ? "en-US" : "pt-BR",
                    { style: "currency", currency: product.currency },
                  )}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted">
                  {product.delivery_type === "FILE"
                    ? t("marketplace.downloadAfterPayment")
                    : t("marketplace.copyAfterPayment")}
                </p>
                <Formik
                  initialValues={{ email: "" }}
                  validationSchema={checkoutSchema}
                  onSubmit={handleCheckout}
                >
                  {({ isSubmitting, status }) => (
                    <Form className="mt-5 space-y-3">
                      <label
                        htmlFor="buyer-email"
                        className="block text-sm font-semibold text-dark"
                      >
                        {t("marketplace.buyerEmail")}
                      </label>
                      <Field
                        id="buyer-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        className="min-h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      />
                      <ErrorMessage
                        name="email"
                        component="p"
                        className="text-xs text-red-600"
                      />
                      {status && (
                        <p role="alert" className="text-xs text-red-600">
                          {status}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        {isSubmitting
                          ? t("marketplace.preparingPayment")
                          : t("marketplace.buyMaterial")}
                      </button>
                    </Form>
                  )}
                </Formik>
              </aside>
            </div>
            {product.preview_pages > 0 ? (
              <section className="mt-10" aria-labelledby="preview-title">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2
                      id="preview-title"
                      className="text-xl font-bold text-dark"
                    >
                      {product.delivery_type === "FILE"
                        ? t("marketplace.fullPreview")
                        : t("marketplace.presentationPreview")}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {t("marketplace.previewWatermark")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={page === 1}
                      className="min-h-10 rounded-lg border border-border bg-white px-3 text-sm font-semibold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      {t("marketplace.previous")}
                    </button>
                    <span className="min-w-20 text-center text-sm font-semibold text-dark">
                      {page} / {product.preview_pages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) =>
                          Math.min(product.preview_pages, current + 1),
                        )
                      }
                      disabled={page === product.preview_pages}
                      className="min-h-10 rounded-lg border border-border bg-white px-3 text-sm font-semibold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      {t("marketplace.next")}
                    </button>
                  </div>
                </div>
                <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <Image
                    src={marketplaceService.previewUrl(product.slug, page)}
                    alt={t("marketplace.previewPageAlt")
                      .replace("{page}", String(page))
                      .replace("{title}", product.title)}
                    fill
                    sizes="(max-width: 1024px) 100vw, 80vw"
                    unoptimized={marketplaceService.shouldBypassImageOptimization()}
                    className="object-contain"
                  />
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                  {product.previews.map((item) => (
                    <button
                      key={item.pageNumber}
                      type="button"
                      onClick={() => setPage(item.pageNumber)}
                      aria-label={t("marketplace.viewPage").replace(
                        "{page}",
                        String(item.pageNumber),
                      )}
                      aria-pressed={page === item.pageNumber}
                      className={`relative aspect-video overflow-hidden rounded-lg border-2 bg-white ${page === item.pageNumber ? "border-accent" : "border-border"}`}
                    >
                      <Image
                        src={marketplaceService.previewUrl(
                          product.slug,
                          item.pageNumber,
                        )}
                        alt=""
                        fill
                        sizes="120px"
                        unoptimized={marketplaceService.shouldBypassImageOptimization()}
                        className="object-contain"
                      />
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="mt-10 rounded-2xl border border-border bg-white p-6">
                <h2 className="text-xl font-bold text-dark">
                  {t("marketplace.googleSlidesTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {t("marketplace.noPreviewYet")}
                </p>
              </section>
            )}
          </>
        ) : null}
      </section>
      <FaqSection
        title={t("marketplace.purchaseFaqTitle")}
        description={t("marketplace.purchaseFaqDescription")}
        items={locale === "en" ? marketplaceFaqEn : marketplaceFaq}
      />
      <PublicFooter />
    </main>
  );
}