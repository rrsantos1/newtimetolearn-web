import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { FaqSection } from "@/modules/faq/components/FaqSection";
import { activitiesFaq } from "@/modules/faq/data/faqContent";
import { ActivityCoverImage } from "@/modules/activities/components/ActivityCoverImage";
import { listPublicActivitiesService } from "@/modules/activities/services/listPublicActivitiesService";
import type { ActivityListData, ListedActivity } from "@/modules/activities/types/activityList.types";

const PAGE_SIZE = 12;

function getActivityName(activity: ListedActivity): string {
  return activity.publishedVersion?.name ?? activity.latestVersion?.name ?? "Atividade";
}

function getPlayHref(activity: ListedActivity): string {
  const slug = encodeURIComponent(activity.slug);
  const routes: Record<string, string> = {
    quiz: "quiz",
    crossword: "crossword",
    memory: "memory",
    listening: "listening",
    multiple_choice: "multiple-choice",
    word_matching: "word-matching",
    sentence_completion: "sentence-completion",
    word_search: "word-search",
    mole_hit: "mole-hit",
    hangman: "hangman",
    roulette: "roulette",
  };
  return `/activities/${routes[activity.type] ?? "word-search"}/${slug}/play`;
}

export default function PublicActivitiesPage() {
  const [result, setResult] = useState<ActivityListData | null>(null);
  const [page, setPage] = useState(1);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [errorState, setErrorState] = useState<{ page: number; message: string } | null>(null);
  const loading = loadedPage !== page;
  const error = errorState?.page === page ? errorState.message : "";

  useEffect(() => {
    let active = true;
    listPublicActivitiesService.execute({ page, limit: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setResult(data);
        setErrorState(null);
        setLoadedPage(page);
      })
      .catch(() => {
        if (!active) return;
        setErrorState({ page, message: "Não foi possível carregar as atividades públicas." });
        setLoadedPage(page);
      });
    return () => { active = false; };
  }, [page]);

  return (
    <main className="min-h-screen bg-background">
      <Head>
        <title>Atividades públicas | TimeToLearn</title>
        <meta name="description" content="Explore atividades públicas e pratique inglês gratuitamente." />
      </Head>
      <PublicHeader />
      <section className="mx-auto w-full px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Experimente sem cadastro</p>
            <h1 className="mt-2 text-3xl font-extrabold text-dark sm:text-4xl">Atividades públicas</h1>
            <p className="mt-3 text-sm leading-6 text-muted">Explore atividades compartilhadas por professores e pratique de forma interativa.</p>
          </div>
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} aria-hidden="true" /> Voltar ao início
          </Link>
        </div>

        {loading ? (
          <p role="status" className="mt-10 text-sm text-muted">Carregando atividades...</p>
        ) : error ? (
          <p role="alert" className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : result?.items.length ? (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {result.items.map((activity) => (
                <article key={activity.slug} className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <ActivityCoverImage type={activity.type} coverImageUrl={activity.coverImageUrl} altText={activity.coverAltText ?? getActivityName(activity)} />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{activity.type.replaceAll("_", " ")}</p>
                  <h2 className="mt-2 text-lg font-bold text-dark">{getActivityName(activity)}</h2>
                  {activity.latestVersion?.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{activity.latestVersion.description}</p>}
                  <Link href={getPlayHref(activity)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-4 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                    <Gamepad2 size={16} aria-hidden="true" /> Experimentar atividade
                  </Link>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Página {result.pagination.page} de {Math.max(1, result.pagination.totalPages)} · {result.pagination.total} atividades</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-40">
                  <ArrowLeft size={16} aria-hidden="true" /> Anterior
                </button>
                <button type="button" onClick={() => setPage((current) => Math.min(result.pagination.totalPages, current + 1))} disabled={page >= result.pagination.totalPages} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-40">
                  Próxima <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-10 rounded-2xl border border-border bg-white p-8 text-sm text-muted">Ainda não há atividades públicas disponíveis.</p>
        )}
      </section>
      <FaqSection title="Dúvidas sobre as atividades" description="Conheça os formatos de atividades e entenda como funcionam a criação, a publicação e a execução." items={activitiesFaq} />
      <PublicFooter />
    </main>
  );
}
