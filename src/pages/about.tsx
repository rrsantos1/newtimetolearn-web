import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useTranslation } from "@/hooks/useTranslation";

export default function AboutPage() {
  const { t } = useTranslation();
  const principles = [
    { icon: BrainCircuit, title: t("about.principleUnderstanding"), description: t("about.principleUnderstandingDescription") },
    { icon: RefreshCw, title: t("about.principlePractice"), description: t("about.principlePracticeDescription") },
    { icon: BookOpenCheck, title: t("about.principleActive"), description: t("about.principleActiveDescription") },
  ];

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden bg-[#142b4a]">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-28 size-96 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative mx-auto w-full px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f3a6b1]">
            {t("about.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            {t("about.heroTitle")}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            {t("about.heroDescription")}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-2 shadow-xl shadow-[#142b4a]/10">
          <Image
            src="/images/learning.jpg"
            alt={t("about.learningImageAlt")}
            loading="eager"
            width={1000}
            height={760}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-auto w-full rounded-2xl object-cover"
          />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {t("about.learningEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
            {t("about.learningTitle")}
          </h2>
          <p className="mt-5 text-base leading-8 text-[#475569]">
            {t("about.learningDescription")}
          </p>
          <p className="mt-4 text-base leading-8 text-muted">
            {t("about.learningDescriptionSecondary")}
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
          <div className="order-2 md:order-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {t("about.teacherEyebrow")}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
              {t("about.teacherTitle")}
            </h2>
            <p className="mt-5 text-base leading-8 text-muted">
              {t("about.teacherDescription")}
            </p>
            <p className="mt-4 text-base leading-8 text-muted">
              {t("about.teacherDescriptionSecondary")}
            </p>
          </div>
          <div className="relative order-1 mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-white p-2 shadow-lg shadow-[#142b4a]/10 md:order-2">
            <Image
              src="/images/teacher.jpg"
              alt={t("about.teacherImageAlt")}
              width={700}
              height={1000}
              sizes="(max-width: 768px) 85vw, 380px"
              className="mx-auto h-auto max-h-125 w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {t("about.approachEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
            {t("about.approachTitle")}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-7"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#244a7c]/8 text-primary">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-dark">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-accent">
        <div className="mx-auto flex w-full flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
              <UsersRound size={15} aria-hidden="true" />
              {t("about.joinEyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {t("about.joinTitle")}
            </h2>
          </div>
          <Link
            href="/register"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-accent transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("about.createAccount")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
