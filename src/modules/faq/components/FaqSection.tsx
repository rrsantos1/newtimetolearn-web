import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { FaqItem } from "../data/faqContent";

interface FaqSectionProps {
  title: string;
  description: string;
  items: readonly FaqItem[];
}

export function FaqSection({ title, description, items }: FaqSectionProps) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return items;

    return items.filter(({ question, answer }) =>
      `${question} ${answer}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
    );
  }, [items, normalizedSearch]);

  return (
    <section
      aria-labelledby="faq-section-title"
      className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Central de ajuda
        </span>
        <h2 id="faq-section-title" className="mt-3 text-2xl font-extrabold tracking-tight text-dark sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          {description}
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-2xl">
        <label htmlFor="faq-search" className="sr-only">
          Pesquisar perguntas frequentes
        </label>
        <div className="relative">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="faq-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar uma dúvida..."
            className="min-h-12 w-full rounded-xl border border-border bg-white py-2 pl-10 pr-4 text-sm text-dark outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-xl border border-border bg-white px-4 shadow-sm sm:px-5"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-sm font-semibold text-dark marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-accent transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="border-t border-border py-4 text-sm leading-7 text-muted">
                {answer}
              </p>
            </details>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted" role="status">
            Nenhuma pergunta encontrada. Tente utilizar outros termos.
          </p>
        )}
      </div>
    </section>
  );
}
