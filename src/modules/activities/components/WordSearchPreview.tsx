import { CheckCircle2, Grid3X3 } from "lucide-react";
import type { WordSearchPreview as WordSearchPreviewData } from "@/modules/activities/types/activities.types";

interface WordSearchPreviewProps {
  preview: WordSearchPreviewData;
}

export function WordSearchPreview({
  preview,
}: Readonly<WordSearchPreviewProps>) {
  return (
    <section
      aria-labelledby="word-search-preview-title"
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Grid3X3 size={22} aria-hidden="true" />
        </span>

        <div>
          <h2
            id="word-search-preview-title"
            className="text-lg font-semibold text-dark"
          >
            Prévia do caça-palavras
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted">
            Confira a grade gerada antes de prosseguir.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-background p-3 sm:p-5">
        <div
          role="img"
          aria-label={`Grade do caça-palavras com ${preview.grid.length} linhas`}
          className="mx-auto grid w-fit gap-px"
          style={{
            gridTemplateColumns: `repeat(${preview.grid[0]?.length ?? 0}, minmax(0, 1fr))`,
          }}
        >
          {preview.grid.map((row, rowIndex) =>
            row.map((letter, columnIndex) => (
              <span
                key={`${rowIndex}-${columnIndex}`}
                className="flex size-6 items-center justify-center bg-surface text-xs font-semibold uppercase text-dark sm:size-7 sm:text-sm"
                aria-hidden="true"
              >
                {letter}
              </span>
            )),
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-dark">
          Palavras cadastradas ({preview.words.length})
        </h3>

        <ul className="mt-3 flex flex-wrap gap-2">
          {preview.words.map((word, index) => (
            <li
              key={`${word}-${index}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-dark"
            >
              <CheckCircle2
                size={15}
                className="text-accent"
                aria-hidden="true"
              />
              {word}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}