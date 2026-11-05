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
import { PublicHeader } from "@/components/layout/PublicHeader";

const features = [
  {
    icon: BookOpen,
    title: "Atividades para aprender",
    description:
      "Jogos e exercícios que ajudam a praticar vocabulário, estruturas e compreensão do inglês.",
  },
  {
    icon: GraduationCap,
    title: "Um espaço para ensinar",
    description:
      "Professores podem criar, organizar e compartilhar atividades com seus alunos.",
  },
  {
    icon: ShieldCheck,
    title: "Sua aprendizagem organizada",
    description:
      "Um ambiente dedicado para acompanhar atividades e desenvolver conhecimentos.",
  },
];

const activityTypes = [
  { icon: Puzzle, label: "Jogos de palavras" },
  { icon: BookOpen, label: "Quiz e desafios" },
  { icon: Headphones, label: "Listening" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <PublicHeader />

      <section className="relative isolate overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[#244a7c]/[0.045] lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-36 -top-36 size-96 rounded-full bg-[#c6283d]/[0.07] blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:px-10 lg:py-16">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#244a7c]/15 bg-[#244a7c]/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#244a7c] sm:text-sm">
              <Sparkles size={15} aria-hidden="true" />
              Aprender inglês pode ser uma experiência
            </span>

            <h1 className="mt-7 max-w-2xl text-3xl font-extrabold leading-[1.12] tracking-tight text-dark sm:text-[2.65rem] lg:text-[3.1rem]">
              Aprenda, pratique
              <span className="block text-accent">e evolua com o</span>
              TimeToLearn.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-[1.05rem]">
              Um ambiente de aprendizagem de inglês que aproxima professores
              e alunos por meio de atividades interativas, prática constante e
              experiências que tornam o aprendizado mais envolvente.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-semibold text-white shadow-lg shadow-accent/15 transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Começar agora
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/about"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#244a7c]/20 bg-white px-6 font-semibold text-primary transition hover:bg-[#244a7c]/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Conheça a plataforma
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {activityTypes.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-2 text-xs font-semibold text-dark sm:text-sm"
                >
                  <Icon size={15} className="text-accent" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-xl items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[2rem] bg-[#244a7c]/10 blur-2xl"
            />
            <div className="relative overflow-hidden w-full rounded-[1.5rem] border border-[#244a7c]/10 bg-white p-2 shadow-2xl shadow-[#142b4a]/15 sm:p-3">
              <Image
                src="/images/home-hero.webp"
                alt="Imagem de apresentação do TimeToLearn"
                width={1200}
                height={900}
                priority
                sizes="(max-width: 1024px) 100vw, 56vw"
                className="aspect-[1.5/1] h-auto w-full rounded-[1.25rem] object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur sm:bottom-5 sm:left-5 sm:right-5 sm:p-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-accent">
                  Uma jornada de conhecimento
                </p>
                <p className="mt-1 text-sm font-bold text-dark sm:text-base">
                  Pratique no seu ritmo. Aprenda todos os dias.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            O que você encontra
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
            Aprendizagem ativa e significativa
          </h2>
          <p className="mt-4 text-base leading-7 text-muted">
            Recursos para transformar conteúdos em prática e apoiar o trabalho
            de quem ensina.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7"
            >
              <span
                className={
                  index === 1
                    ? "flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"
                    : "flex size-12 items-center justify-center rounded-2xl bg-[#244a7c]/[0.08] text-primary"
                }
              >
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-dark">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#142b4a]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3a6b1]">
              Seu próximo passo começa aqui
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Vamos aprender juntos?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Crie sua conta e explore as possibilidades do TimeToLearn.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-[#142b4a] transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Criar minha conta
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
