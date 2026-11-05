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

const principles = [
  {
    icon: BrainCircuit,
    title: "Compreensão",
    description:
      "Aprender vai além de memorizar respostas. As atividades estimulam o contato com palavras, estruturas e seus significados.",
  },
  {
    icon: RefreshCw,
    title: "Prática e revisão",
    description:
      "A retomada dos conteúdos em diferentes formatos ajuda a exercitar o conhecimento e perceber o que ainda precisa de atenção.",
  },
  {
    icon: BookOpenCheck,
    title: "Aprendizagem ativa",
    description:
      "Desafios interativos convidam o aluno a participar, testar o que sabe e construir confiança ao longo do processo.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden bg-[#142b4a]">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-28 size-96 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f3a6b1]">
            Sobre o TimeToLearn
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Mais possibilidades para ensinar e aprender inglês.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            O TimeToLearn é um ambiente digital que reúne professores, alunos
            e atividades interativas em uma experiência de aprendizagem
            organizada, prática e envolvente.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-2 shadow-xl shadow-[#142b4a]/10">
          <Image
            src="/images/learning.jpg"
            alt="Imagem que representa o processo de aprendizagem"
            width={1000}
            height={760}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-auto w-full rounded-2xl object-cover"
          />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Aprender fazendo
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
            Conhecimento que ganha vida na prática.
          </h2>
          <p className="mt-5 text-base leading-8 text-muted">
            A plataforma oferece diferentes formatos de atividades para
            estimular a prática do inglês. Jogos de palavras, desafios,
            exercícios de compreensão e atividades de escuta criam
            oportunidades variadas para revisar e aplicar o conteúdo.
          </p>
          <p className="mt-4 text-base leading-8 text-muted">
            Cada atividade é pensada para tornar o estudo mais participativo,
            respeitando o papel do professor na orientação da aprendizagem e
            incentivando o aluno a construir sua própria evolução.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
          <div className="order-2 md:order-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Para quem ensina
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
              Professores no centro da experiência.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted">
              O TimeToLearn também é um espaço de criação e organização
              pedagógica. Professores podem preparar atividades, adaptar
              conteúdos e disponibilizar experiências de aprendizagem para
              seus alunos.
            </p>
            <p className="mt-4 text-base leading-8 text-muted">
              A tecnologia atua como apoio ao trabalho docente: facilita a
              preparação de materiais e amplia as formas de praticar o idioma.
            </p>
          </div>
          <div className="relative order-1 overflow-hidden rounded-3xl border border-border bg-background p-2 shadow-xl shadow-[#142b4a]/10 md:order-2">
            <Image
              src="/images/teacher.jpg"
              alt="Imagem que representa professores e o ensino"
              width={1000}
              height={760}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-auto w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Nossa abordagem
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">
            Princípios que orientam a aprendizagem
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-7"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#244a7c]/[0.08] text-primary">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-dark">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-accent">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
              <UsersRound size={15} aria-hidden="true" />
              Faça parte
            </span>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Sua jornada com o inglês pode começar agora.
            </h2>
          </div>
          <Link
            href="/register"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-accent transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
