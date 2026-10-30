import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleHelp, RotateCcw } from "lucide-react";

export interface WordSearchPosition {
  word: string;
  row: number;
  col: number;
  direction: string;
}

interface WordSearchGameProps {
  grid: string[][];
  words: string[];
  wordPositions: WordSearchPosition[];
  timeLimitSeconds: number | null;
  canSubmitScore: boolean;
  onComplete: (wordsFound: string[], elapsedSeconds: number) => void;
}

interface CellPosition {
  row: number;
  col: number;
}

const FOUND_WORD_COLORS = [
  {
    cell: "bg-emerald-200 text-emerald-950",
    list: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    cell: "bg-sky-200 text-sky-950",
    list: "border-sky-200 bg-sky-50 text-sky-900",
  },
  {
    cell: "bg-violet-200 text-violet-950",
    list: "border-violet-200 bg-violet-50 text-violet-900",
  },
  {
    cell: "bg-orange-200 text-orange-950",
    list: "border-orange-200 bg-orange-50 text-orange-900",
  },
  {
    cell: "bg-pink-200 text-pink-950",
    list: "border-pink-200 bg-pink-50 text-pink-900",
  },
  {
    cell: "bg-cyan-200 text-cyan-950",
    list: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
  {
    cell: "bg-lime-200 text-lime-950",
    list: "border-lime-200 bg-lime-50 text-lime-900",
  },
  {
    cell: "bg-rose-200 text-rose-950",
    list: "border-rose-200 bg-rose-50 text-rose-900",
  },
  {
    cell: "bg-blue-200 text-blue-950",
    list: "border-blue-200 bg-blue-50 text-blue-900",
  },
  {
    cell: "bg-amber-200 text-amber-950",
    list: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    cell: "bg-bronze-200 text-bronze-950",
    list: "border-bronze-200 bg-bronze-50 text-bronze-900",
  },
  {
    cell: "bg-slate-200 text-slate-950",
    list: "border-slate-200 bg-slate-50 text-slate-900",
  },
] as const;

function normalizeWord(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

function getLine(
  start: CellPosition,
  end: CellPosition,
): CellPosition[] {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;

  if (
    rowDelta !== 0 &&
    colDelta !== 0 &&
    Math.abs(rowDelta) !== Math.abs(colDelta)
  ) {
    return [start];
  }

  const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta));
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);

  return Array.from({ length: length + 1 }, (_, index) => ({
    row: start.row + index * rowStep,
    col: start.col + index * colStep,
  }));
}

function sameCells(
  first: CellPosition[],
  second: CellPosition[],
): boolean {
  return (
    first.length === second.length &&
    first.every(
      (cell, index) =>
        cell.row === second[index]?.row &&
        cell.col === second[index]?.col,
    )
  );
}

function getLineEnd(position: WordSearchPosition): CellPosition {
  const directionSteps: Record<string, CellPosition> = {
    right: { row: 0, col: 1 },
    left: { row: 0, col: -1 },
    down: { row: 1, col: 0 },
    up: { row: -1, col: 0 },
    "down-right": { row: 1, col: 1 },
    "down-left": { row: 1, col: -1 },
    "up-right": { row: -1, col: 1 },
    "up-left": { row: -1, col: -1 },
  };
  const step = directionSteps[position.direction];

  if (!step) return { row: position.row, col: position.col };

  return {
    row: position.row + step.row * (position.word.length - 1),
    col: position.col + step.col * (position.word.length - 1),
  };
}

export function WordSearchGame({
  grid,
  words,
  wordPositions,
  timeLimitSeconds,
  canSubmitScore,
  onComplete,
}: Readonly<WordSearchGameProps>) {
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);
  const foundWordsRef = useRef<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);
  const [selection, setSelection] = useState<CellPosition[]>([]);
  const [message, setMessage] = useState("");

  const normalizedWords = useMemo(
    () => words.map((word) => ({ original: word, normalized: normalizeWord(word) })),
    [words],
  );

  const timeLimit = Math.max(1, timeLimitSeconds ?? 900);
  const completed = words.length > 0 && foundWords.length === words.length;
  const timedOut = elapsedSeconds >= timeLimit && !completed;
  useEffect(() => {
    if (completed || timedOut) return;

    if (startedAtRef.current === 0) {
      startedAtRef.current = Date.now();
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [completed, timedOut]);

  useEffect(() => {
    if (!timedOut || finishedRef.current) return;

    finishedRef.current = true;
    onComplete(foundWordsRef.current, timeLimit);
  }, [onComplete, timeLimit, timedOut]);

  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);
  const selectedSet = useMemo(
    () => new Set(selection.map(({ row, col }) => `${row}:${col}`)),
    [selection],
  );

  const foundCellColors = useMemo(() => {
    const cells = new Map<string, number>();

    for (const position of wordPositions) {
      const foundIndex = foundWords.indexOf(position.word);
      if (foundIndex < 0) continue;

      const line = getLine(
        { row: position.row, col: position.col },
        getLineEnd(position),
      );

      line.forEach(({ row, col }) => {
        const key = `${row}:${col}`;
        if (!cells.has(key)) {
          cells.set(key, foundIndex);
        }
      });
    }

    return cells;
  }, [foundWords, wordPositions]);


  function finishSelection(): void {
    if (!selectionStart || selection.length < 2) {
      setSelectionStart(null);
      setSelection([]);
      return;
    }

    const selectedForward = selection
      .map(({ row, col }) => grid[row]?.[col] ?? "")
      .join("");
    const selectedReverse = Array.from(selectedForward).reverse().join("");

    const match = wordPositions.find((position) => {
      if (foundSet.has(position.word)) return false;

      const start = { row: position.row, col: position.col };
      const end = getLineEnd(position);
      const forwardCells = getLine(start, end);
      const reverseCells = [...forwardCells].reverse();

      return (
        (sameCells(selection, forwardCells) &&
          normalizeWord(selectedForward) === position.word) ||
        (sameCells(selection, reverseCells) &&
          normalizeWord(selectedReverse) === position.word)
      );
    });

    if (match) {
      const nextFoundWords = foundWords.includes(match.word)
        ? foundWords
        : [...foundWords, match.word];
      setFoundWords(nextFoundWords);
      foundWordsRef.current = nextFoundWords;
      const original = normalizedWords.find(
        (word) => word.normalized === match.word,
      )?.original ?? match.word;
      setMessage(`Boa! Você encontrou: ${original}.`);

      if (nextFoundWords.length === words.length && !finishedRef.current) {
        finishedRef.current = true;
        onComplete(nextFoundWords, elapsedSeconds);
      }
    } else {
      setMessage("Essa seleção não corresponde a uma palavra da lista.");
    }

    setSelectionStart(null);
    setSelection([]);
  }

  function handleCellPointerDown(row: number, col: number): void {
    if (finishedRef.current || timedOut || completed) return;

    const start = { row, col };
    setSelectionStart(start);
    setSelection([start]);
    setMessage("");
  }

  function handleCellPointerEnter(row: number, col: number): void {
    if (!selectionStart) return;

    setSelection(getLine(selectionStart, { row, col }));
  }

  function resetGame(): void {
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    foundWordsRef.current = [];
    setFoundWords([]);
    setElapsedSeconds(0);
    setSelectionStart(null);
    setSelection([]);
    setMessage("");
  }

  function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-dark">Encontre as palavras</p>
            <p className="mt-1 text-xs text-muted">
              Toque ou clique na primeira letra e arraste até a última.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${timedOut ? "bg-red-100 text-red-800" : "bg-background text-dark"}`}>
              Tempo: {formatTime(Math.min(elapsedSeconds, timeLimit))}
            </span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-dark">
              {foundWords.length} de {words.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-background p-2 sm:p-4">
          <div
            role="group"
            aria-label="Grade interativa do caça-palavras"
            onPointerUp={finishSelection}
            onPointerCancel={finishSelection}
            className="mx-auto grid w-fit select-none gap-0.5 touch-none"
            style={{
              gridTemplateColumns: `repeat(${grid[0]?.length ?? 0}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((letter, colIndex) => {
                const key = `${rowIndex}:${colIndex}`;
                const foundColorIndex = foundCellColors.get(key);
                const isFound = foundColorIndex !== undefined;
                const isSelected = selectedSet.has(key);

                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Linha ${rowIndex + 1}, coluna ${colIndex + 1}, letra ${letter}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      handleCellPointerDown(rowIndex, colIndex);
                    }}
                    onPointerEnter={() => handleCellPointerEnter(rowIndex, colIndex)}
                    className={`flex size-7 items-center justify-center rounded-sm text-[11px] font-bold uppercase transition-colors sm:size-8 sm:text-sm md:size-9 ${isFound ? FOUND_WORD_COLORS[(foundColorIndex ?? 0) % FOUND_WORD_COLORS.length].cell : isSelected ? "bg-yellow-300 text-gray-950" : "bg-white text-gray-800 hover:bg-yellow-50"}`}
                  >
                    {letter}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Cada palavra encontrada recebe uma cor diferente.
          </p>
          {!completed && !timedOut && (
            <button
              type="button"
              onClick={resetGame}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-dark transition hover:bg-background"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reiniciar
            </button>
          )}
        </div>

        {message && (
          <p role="status" className="mt-3 rounded-xl bg-background p-3 text-sm text-dark">
            {message}
          </p>
        )}

        {(completed || timedOut) && (
          <div role="status" className={`mt-4 rounded-xl border p-4 ${completed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={`flex items-center gap-2 font-semibold ${completed ? "text-emerald-900" : "text-amber-900"}`}>
              <CheckCircle2 size={19} aria-hidden="true" />
              {completed ? "Parabéns! Você encontrou todas as palavras." : "O tempo acabou."}
            </p>
            <p className={`mt-1 text-sm ${completed ? "text-emerald-800" : "text-amber-800"}`}>
              {canSubmitScore
                ? completed
                  ? "Sua pontuação está sendo registrada."
                  : "Sua pontuação parcial está sendo registrada."
                : "Atividade concluída."}
            </p>
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CircleHelp size={19} className="text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-dark">Lista de palavras</h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Encontre todas para concluir o desafio.
        </p>
        <ul className="mt-4 space-y-2">
          {normalizedWords.map(({ original, normalized }) => {
            const foundIndex = foundWords.indexOf(normalized);
            const found = foundIndex >= 0;
            const foundColor = found
              ? FOUND_WORD_COLORS[foundIndex % FOUND_WORD_COLORS.length].list
              : "border-border bg-background text-dark";

            return (
              <li
                key={normalized}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm ${foundColor}`}
              >
                <span className={found ? "line-through decoration-2" : ""}>
                  {original}
                </span>
                {found && <CheckCircle2 size={17} aria-label="Encontrada" />}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
