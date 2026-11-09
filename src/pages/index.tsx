import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Headphones,
  Puzzle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { homeFaq } from "@/modules/faq/data/faqContent";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useEffect, useState } from "react";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import { listPublicActivitiesService } from "@/modules/activities/services/listPublicActivitiesService";
import type { ListedActivity } from "@/modules/activities/types/activityList.types";
import { Gamepad2 } from "lucide-react";
import { marketplaceService } from "@/modules/marketplace/services/marketplaceService";
import { useTranslation } from "@/hooks/useTranslation";
import type { MarketplaceProduct } from "@/modules/marketplace/types/marketplace.types";

const features = [
  {
    icon: BookOpen,
    titleKey: "home.featureActivities",
    descriptionKey: "home.featureActivitiesDescription",
  },
  {
    icon: GraduationCap,
    titleKey: "home.featureTeaching",
    descriptionKey: "home.featureTeachingDescription",
  },
  {
    icon: ShieldCheck,
    titleKey: "home.featureLearning",
    descriptionKey: "home.featureLearningDescription",
  },
];

const activityTypes = [
  { icon: Puzzle, labelKey: "home.activityTypeWords" },
  { icon: BookOpen, labelKey: "home.activityTypeQuiz" },
  { icon: Headphones, labelKey: "home.activityTypeListening" },
] as const;

export default function Home() {
  const { t } = useTranslation();
  const [publicActivities, setPublicActivities] = useState<ListedActivity[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    listPublicActivitiesService.execute({ page: 1, limit: 4 })
      .then((result) => { if (!cancelled) setPublicActivities(result.items); })
      .catch(() => { if (!cancelled) setPublicActivities([]); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    marketplaceService.list({ page: 1, limit: 4 })
      .then((result) => { if (!cancelled) setMarketplaceItems(result.items); })
      .catch(() => { if (!cancelled) setMarketplaceItems([]); });
    return () => { cancelled = true; };
  }, []);

  function getPlayHref(activity: ListedActivity): string {
    const slug = encodeURIComponent(activity.slug);
    if (activity.type === "quiz") return `/activities/quiz/${slug}/play`;
    if (activity.type === "crossword") return `/activities/crossword/${slug}/play`;
    if (activity.type === "memory") return `/activities/memory/${slug}/play`;
    if (activity.type === "listening") return `/activities/listening/${slug}/play`;
    if (activity.type === "multiple_choice") return `/activities/multiple-choice/${slug}/play`;
    if (activity.type === "word_matching") return `/activities/word-matching/${slug}/play`;
    if (activity.type === "sentence_completion") return `/activities/sentence-completion/${slug}/play`;
    if (activity.type === "mole_hit") return `/activities/mole-hit/${slug}/play`;
    if (activity.type === "hangman") return `/activities/hangman/${slug}/play`;
    if (activity.type === "roulette") return `/activities/roulette/${slug}/play`;
    return `/activities/word-search/${slug}/play`;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <PublicHeader />

      <section className="relative isolate overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-36 -top-36 size-96 rounded-full bg-[#c6283d]/[0.07] blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-[1720px] items-center gap-12 px-6 py-12 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14 lg:px-14 lg:py-16 xl:px-16">
          <div className="relative z-10 w-full min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#244a7c]/15 bg-[#244a7c]/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#244a7c] sm:text-sm">
              <Sparkles size={15} aria-hidden="true" />
              {t("home.badge")}
            </span>

            <h1 className="mt-7 w-full max-w-none text-3xl font-extrabold leading-[1.12] tracking-tight text-dark sm:text-[2.8rem] lg:text-[3.6rem] xl:text-[4.1rem]">
              {t("home.title")}
            </h1>

            <p className="mt-5 w-full max-w-3xl text-base leading-7 text-muted sm:text-[1.1rem]">
              {t("home.description")}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-semibold text-white! shadow-lg shadow-accent/15 transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t("home.start")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/about"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#244a7c]/20 bg-white px-6 font-semibold text-primary transition hover:bg-[#244a7c]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t("home.about")}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {activityTypes.map(({ icon: Icon, labelKey }) => (
                <span
                  key={labelKey}
                  className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-2 text-xs font-semibold text-dark sm:text-sm"
                >
                  <Icon size={15} className="text-accent" aria-hidden="true" />
                  {t(labelKey)}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-xl items-center justify-center rounded-[1.75rem] bg-[#f1f5fa] p-4 sm:p-6">
            <div className="w-full overflow-hidden rounded-2xl border border-[#244a7c]/10 bg-white p-2 shadow-lg shadow-[#142b4a]/10 sm:p-3">
              <Image
                src="/images/home-hero.webp"
                alt="Imagem de apresentação do TimeToLearn"
                width={1200}
                height={900}
                priority
                sizes="(max-width: 1024px) 100vw, 56vw"
                className="block h-auto w-full rounded-xl object-contain"
              />
              <div className="mx-1 mb-1 mt-3 rounded-xl border border-[#244a7c]/10 bg-white p-4 sm:p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-accent">
                  {t("home.journey")}
                </p>
                <p className="mt-1 text-sm font-bold text-dark sm:text-base">
                  {t("home.practiceDaily")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {t("home.featuresEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
            {t("home.featuresTitle")}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted">
            {t("home.featuresDescription")}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, titleKey, descriptionKey }, index) => (
            <article
              key={titleKey}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7"
            >
              <span
                className={
                  index === 1
                    ? "flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"
                    : "flex size-12 items-center justify-center rounded-2xl bg-[#244a7c]/8 text-primary"
                }
              >
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-dark">{t(titleKey)}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{t(descriptionKey)}</p>
            </article>
          ))}
        </div>
      </section>


      {publicActivities.length > 0 && (
        <section className="mx-auto w-full px-5 py-16 sm:px-8 lg:px-10 bg-white" aria-labelledby="public-activities-title">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t("home.tryWithoutSignup")}</span>
              <h2 id="public-activities-title" className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">{t("home.activitiesTitle")}</h2>
              <p className="mt-4 text-base leading-7 text-muted">{t("home.activitiesDescription")}</p>
            </div>
            <Link href="/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">
              {t("home.viewAllActivities")} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {publicActivities.map((activity) => (
              <article key={activity.slug} className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
                <ActivityCoverImage type={activity.type} coverImageUrl={activity.coverImageUrl} altText={activity.coverAltText ?? activity.latestVersion?.name} />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{activity.type.replaceAll("_", " ")}</p>
                <h3 className="mt-2 text-lg font-bold text-dark">{activity.latestVersion?.name ?? activity.publishedVersion?.name ?? "Atividade"}</h3>
                {activity.latestVersion?.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{activity.latestVersion.description}</p>}
                <Link href={getPlayHref(activity)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-4 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                  <Gamepad2 size={16} aria-hidden="true" /> Experimentar atividade
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {marketplaceItems.length > 0 && (
        <section className="mx-auto w-full px-5 py-16 sm:px-8 lg:px-10" aria-labelledby="marketplace-featured-title">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t("home.teachingMaterials")}</span>
              <h2 id="marketplace-featured-title" className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">{t("home.marketplaceTitle")}</h2>
              <p className="mt-3 text-base leading-7 text-muted">{t("home.marketplaceDescription")}</p>
            </div>
            <Link href="/marketplace" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">
              {t("home.viewAllMaterials")} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {marketplaceItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <div className="relative flex aspect-16/10 items-center justify-center bg-slate-100">
                  {item.preview_pages > 0 ? (
                    <Image src={marketplaceService.coverUrl(item.slug)} alt={`Capa do material ${item.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized={marketplaceService.shouldBypassImageOptimization()} className="object-contain p-2" />
                  ) : (
                    <span className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-dark">
                      {item.delivery_type === "EXTERNAL_URL" ? "Google Slides • Cópia digital" : "Material didático"}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.category}</p>
                  <h3 className="mt-2 text-lg font-bold text-dark">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.description}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <strong className="text-base text-dark">{(item.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: item.currency })}</strong>
                    <Link href={`/marketplace/${encodeURIComponent(item.slug)}`} className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white! hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                      Ver material
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <FaqSection title="Dúvidas sobre o TimeToLearn" description="Entenda como a plataforma funciona e conheça os recursos disponíveis para professores e alunos." items={homeFaq} />

      <section className="bg-[#142b4a]">
        <div className="mx-auto flex w-full max-w-[1720px] flex-col items-center justify-between gap-6 px-6 py-12 text-center sm:px-10 md:px-14 lg:flex-row lg:px-16 lg:text-center">
          <div className="w-full max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3a6b1]">
              {t("home.finalEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {t("home.finalTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {t("home.finalDescription")}
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-[#142b4a] transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("home.createAccount")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
