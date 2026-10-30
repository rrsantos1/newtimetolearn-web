import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CircleHelp,
  CheckCircle2,
  Clock3,
  FileText,
  Gamepad2,
  Lightbulb,
  ListChecks,
  Puzzle,
  Search,
  Shuffle,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { activityCatalog } from "@/modules/activities/types/activityCatalog";
import type { ActivityType } from "@/modules/activities/types/activityList.types";

const activityIcons: Record<ActivityType, LucideIcon> = {
  word_search: Search,
  crossword: Puzzle,
  quiz: CircleHelp,
  memory: Brain,
  cloze: FileText,
  multiple_choice: ListChecks,
  fill_in_the_blank: CheckCircle2,
  drag_drop: Puzzle,
  sentence_order: Shuffle,
  board_game: Gamepad2,
  roulette: Sparkles,
  hangman: Lightbulb,
  fill_in_blanks: BookOpen,
  mole_hit: Clock3,
};

export default function NewActivityPage() {
  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Criar atividade"
      description="Escolha o formato pedagógico mais adequado para o conteúdo que deseja trabalhar."
    >
      <div className="mb-6">
        <Link
          href="/teacher/activities"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-dark"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Voltar às minhas atividades
        </Link>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Puzzle aria-hidden="true" size={22} />
          </span>
          <div>
            <h2 className="font-semibold text-dark">Biblioteca de formatos</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              A plataforma terá vários formatos de atividade. Neste momento, você pode criar caça-palavras e palavras cruzadas; os demais formatos serão habilitados conforme forem implementados.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {activityCatalog.map((activity) => {
          const Icon = activityIcons[activity.type];
          const cardClassName = "flex h-full flex-col rounded-2xl border border-border bg-surface p-5 text-left shadow-sm transition";

          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className={`flex size-12 items-center justify-center rounded-xl ${activity.available ? "bg-primary/10 text-primary" : "bg-background text-muted"}`}>
                  <Icon aria-hidden="true" size={23} />
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${activity.available ? "border-green-200 bg-green-50 text-green-800" : "border-border bg-background text-muted"}`}>
                  {activity.available ? "Disponível" : "Em breve"}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-dark">{activity.label}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{activity.description}</p>
              <span className={`mt-5 inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${activity.available ? "bg-primary text-white" : "border border-border text-muted"}`}>
                {activity.available ? "Criar atividade" : "Ainda indisponível"}
              </span>
            </>
          );

          return activity.available && activity.createHref ? (
            <Link
              key={activity.type}
              href={activity.createHref}
              className={`${cardClassName} hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring`}
            >
              {cardContent}
            </Link>
          ) : (
            <article
              key={activity.type}
              aria-label={`${activity.label}, em breve`}
              className={`${cardClassName} opacity-80`}
            >
              {cardContent}
            </article>
          );
        })}
      </div>
    </RoleBasedLayout>
  );
}
