import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck } from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

const features = [
  {
    icon: BookOpen,
    title: "Aprendizagem organizada",
    description:
      "Conteúdos e atividades reunidos em um ambiente simples de utilizar.",
  },
  {
    icon: GraduationCap,
    title: "Para professores e alunos",
    description:
      "Uma experiência pensada para apoiar diferentes etapas da aprendizagem.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso seguro",
    description:
      "Uma conta pessoal para acessar os recursos disponíveis para cada perfil.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <PublicHeader />

      <section className="relative">
        <div className="pointer-events-none absolute -right-40 -top-40 size-96 rounded-full bg-yellow-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-900">
              <span className="size-2 rounded-full bg-amber-400" />
              Seu espaço de aprendizagem
            </span>

            <h1 className="mt-7 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-dark sm:text-5xl lg:text-6xl">
              Aprender abre portas.
              <span className="mt-2 block text-amber-500">
                Vamos começar?
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
              Um ambiente para aproximar professores e alunos, organizar
              atividades e tornar a experiência de aprendizagem mais simples.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-dark transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                Criar minha conta
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-6 font-semibold text-dark transition hover:bg-zinc-50"
              >
                Já tenho uma conta
              </Link>
            </div>

            <p className="mt-5 text-sm text-muted">
              Um espaço para aprender, ensinar e evoluir.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-4xl bg-yellow-100/60 blur-2xl" />

            <div className="relative rounded-3xl border border-border bg-white p-6 shadow-xl shadow-zinc-200/50 sm:p-8">
              <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                  <p className="text-sm font-medium text-muted">
                    TimeToLearn
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-dark">
                    Seu próximo passo
                  </h2>
                </div>

                <span className="flex size-12 items-center justify-center rounded-2xl bg-yellow-100 text-dark">
                  <GraduationCap size={26} aria-hidden="true" />
                </span>
              </div>

              <div className="space-y-4 pt-6">
                {features.map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className="flex gap-4 rounded-2xl border border-border p-4"
                  >
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                        index === 0
                          ? "bg-yellow-100"
                          : index === 1
                            ? "bg-zinc-100"
                            : "bg-amber-50"
                      }`}
                    >
                      <Icon size={21} aria-hidden="true" />
                    </span>

                    <div>
                      <h3 className="font-semibold text-dark">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-dark p-5 text-white">
                <p className="text-sm text-zinc-300">
                  Toda jornada começa com um passo.
                </p>
                <p className="mt-1 text-lg font-semibold">
                  O seu pode começar aqui.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}