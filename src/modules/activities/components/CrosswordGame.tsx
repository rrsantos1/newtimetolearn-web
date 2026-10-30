import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

export interface CrosswordClue {
  number: number;
  clue: string;
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
}

interface CrosswordGameProps {
  grid: (string | null)[][];
  clues: CrosswordClue[];
}

interface GridBounds {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

function getBounds(grid: (string | null)[][], clues: CrosswordClue[]): GridBounds | null {
  if (grid.length === 0 || clues.length === 0) return null;

  const cells: Array<{ row: number; col: number }> = [];
  clues.forEach((clue) => {
    for (let offset = 0; offset < clue.length; offset += 1) {
      cells.push({
        row: clue.row + (clue.direction === "down" ? offset : 0),
        col: clue.col + (clue.direction === "across" ? offset : 0),
      });
    }
  });

  if (cells.length === 0) return null;

  return {
    minRow: Math.min(...cells.map((cell) => cell.row)),
    maxRow: Math.max(...cells.map((cell) => cell.row)),
    minCol: Math.min(...cells.map((cell) => cell.col)),
    maxCol: Math.max(...cells.map((cell) => cell.col)),
  };
}

function getCellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function CrosswordGame({ grid, clues }: Readonly<CrosswordGameProps>) {
  const bounds = useMemo(() => getBounds(grid, clues), [grid, clues]);
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [activeDirection, setActiveDirection] = useState<"across" | "down">("across");
  const [activeClueNumber, setActiveClueNumber] = useState<number | null>(
    clues.find((clue) => clue.direction === "across")?.number
      ?? clues[0]?.number
      ?? null,
  );

  const activeClue = clues.find(
    (clue) => clue.number === activeClueNumber && clue.direction === activeDirection,
  ) ?? clues[0];

  const clueCells = useMemo(() => {
    const cells = new Set<string>();
    if (!activeClue) return cells;
    for (let offset = 0; offset < activeClue.length; offset += 1) {
      const row = activeClue.row + (activeClue.direction === "down" ? offset : 0);
      const col = activeClue.col + (activeClue.direction === "across" ? offset : 0);
      cells.add(getCellKey(row, col));
    }
    return cells;
  }, [activeClue]);

  if (!bounds) {
    return (
      <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        A grade desta cruzadinha não está disponível.
      </section>
    );
  }

  const visibleRows = bounds.maxRow - bounds.minRow + 1;
  const visibleCols = bounds.maxCol - bounds.minCol + 1;
  const cellSize = `minmax(0, 1fr)`;
  const acrossClues = clues.filter((clue) => clue.direction === "across").sort((a, b) => a.number - b.number);
  const downClues = clues.filter((clue) => clue.direction === "down").sort((a, b) => a.number - b.number);

  function selectCell(row: number, col: number): void {
    const candidates = clues.filter((clue) => {
      if (clue.direction === "across") {
        return row === clue.row && col >= clue.col && col < clue.col + clue.length;
      }
      return col === clue.col && row >= clue.row && row < clue.row + clue.length;
    });
    const matching = candidates.find((clue) => clue.direction === activeDirection) ?? candidates[0];
    if (matching) {
      setActiveDirection(matching.direction);
      setActiveClueNumber(matching.number);
    }
  }

  function updateLetter(row: number, col: number, value: string): void {
    const key = getCellKey(row, col);
    const letter = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setLetters((current) => {
      if (!letter) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: letter };
    });
  }

  function focusNextCell(row: number, col: number, direction: "across" | "down"): void {
    const nextRow = row + (direction === "down" ? 1 : 0);
    const nextCol = col + (direction === "across" ? 1 : 0);
    if (nextRow >= grid.length || nextCol >= (grid[nextRow]?.length ?? 0)) return;
    if (grid[nextRow]?.[nextCol] === null || grid[nextRow]?.[nextCol] === undefined) return;
    const next = document.getElementById(`crossword-cell-${nextRow}-${nextCol}`);
    next?.focus();
    selectCell(nextRow, nextCol);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, row: number, col: number): void {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusNextCell(row, col, "across");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusNextCell(row, col, "down");
    } else if (event.key === "ArrowLeft" || event.key === "Backspace") {
      if (event.key === "Backspace" && letters[getCellKey(row, col)]) return;
      event.preventDefault();
      const previousRow = row - (activeDirection === "down" ? 1 : 0);
      const previousCol = col - (activeDirection === "across" ? 1 : 0);
      const previous = document.getElementById(`crossword-cell-${previousRow}-${previousCol}`);
      previous?.focus();
      selectCell(previousRow, previousCol);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const previous = document.getElementById(`crossword-cell-${row - 1}-${col}`);
      previous?.focus();
      selectCell(row - 1, col);
    }
  }

  function renderClueList(items: CrosswordClue[], direction: "across" | "down") {
    return (
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-dark">
          {direction === "across" ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          {direction === "across" ? "Horizontais" : "Verticais"}
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma pista.</p>
        ) : (
          <ol className="space-y-1">
            {items.map((clue) => {
              const selected = activeClue?.number === clue.number && activeDirection === direction;
              return (
                <li key={`${direction}-${clue.number}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDirection(direction);
                      setActiveClueNumber(clue.number);
                      document.getElementById(`crossword-cell-${clue.row}-${clue.col}`)?.focus();
                    }}
                    aria-pressed={selected}
                    className={`flex min-h-10 w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selected ? "bg-primary/10 text-dark ring-1 ring-primary/30" : "text-muted hover:bg-background hover:text-dark"}`}
                  >
                    <span className="shrink-0 font-bold">{clue.number}.</span>
                    <span>{clue.clue}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
      <div className="min-w-0 rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-dark">Preencha as letras nas casas</p>
          <p className="text-xs text-muted">Setas do teclado para navegar</p>
        </div>
        <div className="mx-auto w-full max-w-[min(100%,760px)]">
          <div
            role="group"
            aria-label="Grade de palavras cruzadas"
            className="grid gap-px overflow-hidden rounded-lg bg-slate-300 p-px"
            style={{
              gridTemplateColumns: `repeat(${visibleCols}, ${cellSize})`,
            }}
          >
            {Array.from({ length: visibleRows }, (_, rowOffset) => {
              const row = bounds.minRow + rowOffset;
              return Array.from({ length: visibleCols }, (_, colOffset) => {
                const col = bounds.minCol + colOffset;
                const cell = grid[row]?.[col];
                const isPlayable = typeof cell === "string";
                const key = getCellKey(row, col);
                const selected = clueCells.has(key);
                const starts = clues.filter((clue) => clue.row === row && clue.col === col);
                if (!isPlayable) {
                  return <span key={key} aria-hidden="true" className="aspect-square bg-slate-800" />;
                }
                return (
                  <div key={key} className={`relative aspect-square min-w-0 ${selected ? "bg-amber-100" : "bg-white"}`}>
                    {starts.length > 0 && (
                      <span className="pointer-events-none absolute left-0.5 top-0 text-[clamp(7px,1vw,10px)] leading-none text-slate-700">
                        {Math.min(...starts.map((clue) => clue.number))}
                      </span>
                    )}
                    <input
                      id={`crossword-cell-${row}-${col}`}
                      aria-label={`Linha ${rowOffset + 1}, coluna ${colOffset + 1}`}
                      autoComplete="off"
                      maxLength={1}
                      value={letters[key] ?? ""}
                      onFocus={() => selectCell(row, col)}
                      onClick={() => selectCell(row, col)}
                      onChange={(event) => {
                        updateLetter(row, col, event.target.value);
                        if (event.target.value) focusNextCell(row, col, activeDirection);
                      }}
                      onKeyDown={(event) => handleKeyDown(event, row, col)}
                      className="size-full min-h-0 min-w-0 bg-transparent p-0 pt-1 text-center text-[clamp(10px,2.2vw,24px)] font-bold uppercase text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    />
                  </div>
                );
              });
            })}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          {Object.keys(letters).length} letras preenchidas
        </p>
      </div>

      <aside className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Check size={18} className="text-primary" aria-hidden="true" />
          <h2 className="text-base font-bold text-dark">Pistas</h2>
        </div>
        {activeClue && (
          <div className="mb-4 rounded-xl bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {activeDirection === "across" ? "Horizontal" : "Vertical"} · {activeClue.number}
            </p>
            <p className="mt-1 text-sm font-medium text-dark">{activeClue.clue}</p>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          {renderClueList(acrossClues, "across")}
          {renderClueList(downClues, "down")}
        </div>
      </aside>
    </section>
  );
}
