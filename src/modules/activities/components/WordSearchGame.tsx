import { useMemo, useState } from "react";
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
}

interface CellPosition {
  row: number;
  col: number;
}

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
}: Readonly<WordSearchGameProps>) {
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);
  const [selection, setSelection] = useState<CellPosition[]>([]);
  const [message, setMessage] = useState("");

  const normalizedWords = useMemo(
    () => words.map((word) => ({ original: word, normalized: normalizeWord(word) })),
    [words],
  );

  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);
  const selectedSet = useMemo(
    () => new Set(selection.map(({ row, col }) => `${row}:${col}`)),
    [selection],
  );

  const foundCells = useMemo(() => {
    const cells = new Set<string>();

    for (const position of wordPositions) {
      if (!foundSet.has(position.word)) continue;

      const line = getLine(
        { row: position.row, col: position.col },
        getLineEnd(position),
      );

      line.forEach(({ row, col }) => cells.add(`${row}:${col}`));
    }

    return cells;
  }, [foundSet, wordPositions]);


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
      setFoundWords((current) =>
        current.includes(match.word) ? current : [...current, match.word],
      );
      const original = normalizedWords.find(
        (word) => word.normalized === match.word,
      )?.original ?? match.word;
      setMessage(`Boa! Você encontrou: ${original}.`);
    } else {
      setMessage("Essa seleção não corresponde a uma palavra da lista.");
    }

    setSelectionStart(null);
    setSelection([]);
  }

  function handleCellPointerDown(row: number, col: number): void {
    if (foundWords.length === words.length) return;

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
    setFoundWords([]);
    setSelectionStart(null);
    setSelection([]);
    setMessage("");
  }

  const completed = words.length > 0 && foundWords.length === words.length;

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
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-dark">
            {foundWords.length} de {words.length}
          </span>
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
                const isFound = foundCells.has(key);
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
                    className={`flex size-7 items-center justify-center rounded-sm text-[11px] font-bold uppercase transition-colors sm:size-8 sm:text-sm md:size-9 ${isFound ? "bg-emerald-200 text-emerald-950" : isSelected ? "bg-yellow-300 text-gray-950" : "bg-white text-gray-800 hover:bg-yellow-50"}`}
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
            Palavras encontradas ficam destacadas em verde.
          </p>
          <button
            type="button"
            onClick={resetGame}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-dark transition hover:bg-background"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reiniciar
          </button>
        </div>

        {message && (
          <p role="status" className="mt-3 rounded-xl bg-background p-3 text-sm text-dark">
            {message}
          </p>
        )}

        {completed && (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-emerald-900">
              <CheckCircle2 size={19} aria-hidden="true" />
              Parabéns! Você encontrou todas as palavras.
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Você pode reiniciar o jogo para jogar novamente.
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
            const found = foundSet.has(normalized);

            return (
              <li
                key={normalized}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm ${found ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-border bg-background text-dark"}`}
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
