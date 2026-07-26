import { useMemo } from "react";
import { GameMode, GuessRecord, TileResult } from "../types";
import { Tile } from "./Tile";
import { Keyboard } from "./Keyboard";
import { ChatPanel } from "./ChatPanel";
import { Home } from "lucide-react";

interface GameBoardProps {
  mode: GameMode;
  myPlayerIndex: number;
  guesses: GuessRecord[];
  currentInput: string;
  onKey: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  wordLength: number;
  maxAttempts: number;
  chatMessages: any[];
  onSendMessage: (msg: string) => void;
  turnPlayerIndex: number | null;
  onReturnToMenu: () => void;
  isShaking: boolean;
}

export function GameBoard({
  mode, myPlayerIndex, guesses, currentInput,
  onKey, onEnter, onBackspace,
  wordLength, maxAttempts,
  chatMessages, onSendMessage,
  turnPlayerIndex, onReturnToMenu, isShaking,
}: GameBoardProps) {
  const isMyTurn = mode === "turn_based" ? turnPlayerIndex === myPlayerIndex : true;

  const letterStates = useMemo(() => {
    const states: Record<string, TileResult> = {};
    const rank: Record<TileResult, number> = { correct: 3, present: 2, absent: 1, empty: 0 };
    guesses.forEach((g) => {
      g.tiles.forEach((result, i) => {
        const letter = g.word[i];
        const cur = states[letter] ? rank[states[letter]] : 0;
        if (rank[result] > cur) states[letter] = result;
      });
    });
    return states;
  }, [guesses]);

  // ── Build rows ──────────────────────────────────────────────
  const rows: React.ReactNode[] = [];
  let currentRowAdded = false;
  const FLIP_DELAY = 90; // ms per column

  for (let i = 0; i < maxAttempts; i++) {
    const guess = guesses.find((g) => g.row === i);

    if (guess) {
      rows.push(
        <div key={i} className="flex gap-1.5 md:gap-2.5 justify-center relative w-fit mx-auto">
          {guess.word.split("").map((letter, col) => (
            <Tile
              key={col}
              letter={letter}
              state={guess.tiles[col]}
              isFlipping
              flipDelay={col * FLIP_DELAY}
              playerIndex={col === 0 ? guess.playerIndex : undefined}
            />
          ))}
        </div>
      );
    } else if (!currentRowAdded) {
      currentRowAdded = true;
      const letters = currentInput.split("");
      rows.push(
        <div
          key={i}
          className={`flex gap-1.5 md:gap-2.5 justify-center relative w-fit mx-auto${isShaking ? " row-shake" : ""}`}
        >
          {mode === "turn_based" && turnPlayerIndex !== null && (
            <div className="absolute -left-7 sm:-left-9 md:-left-11 top-1/2 -translate-y-1/2 text-[9px] sm:text-[11px] font-bold">
              {isMyTurn
                ? <span className="text-primary animate-pulse">ВЫ</span>
                : <span className="text-muted-foreground">И{(turnPlayerIndex ?? 0) + 1}</span>
              }
            </div>
          )}
          {Array.from({ length: wordLength }).map((_, col) => (
            <Tile key={col} letter={letters[col] || ""} state="empty" />
          ))}
        </div>
      );
    } else {
      rows.push(
        <div key={i} className="flex gap-1.5 md:gap-2.5 justify-center w-fit mx-auto">
          {Array.from({ length: wordLength }).map((_, col) => (
            <Tile key={col} state="empty" />
          ))}
        </div>
      );
    }
  }

  return (
    <div className="h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="shrink-0 w-full px-4 md:px-8 py-3 flex items-center justify-between border-b border-border/50">
        <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase select-none">
          Wordle <span className="text-primary">Дуэт</span>
        </h1>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden sm:inline px-3 py-1 rounded-full border border-border font-semibold text-xs bg-card text-muted-foreground">
            {mode === "classic_duo" ? "Классический" : "По очереди"}
          </span>
          <button
            onClick={onReturnToMenu}
            title="В главное меню"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-semibold bg-card hover:bg-muted hover:border-primary transition-all duration-200 active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">В меню</span>
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* Board + Keyboard — centered inside available space */}
        <div className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto px-4 py-3">
          <div className="flex flex-col items-center w-full" style={{ gap: "clamp(12px, 2vh, 24px)" }}>

            {/* Turn indicator */}
            {mode === "turn_based" && (
              <div className={`turn-slide shrink-0 px-6 py-2 rounded-2xl font-bold text-sm md:text-base border-2 ${
                isMyTurn
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {isMyTurn ? "✦ Ваш ход" : "Ход соперника…"}
              </div>
            )}

            {/* Tile grid */}
            <div className="flex flex-col shrink-0" style={{ gap: "clamp(6px, 1.1vh, 11px)" }}>
              {rows}
            </div>

            {/* Keyboard */}
            <div className="w-full max-w-[560px] md:max-w-[680px] shrink-0">
              <Keyboard
                onKey={onKey}
                onEnter={onEnter}
                onBackspace={onBackspace}
                letterStates={letterStates}
                disabled={!isMyTurn}
              />
            </div>

          </div>
        </div>

        {/* Chat panel — fixed right column */}
        <div className="shrink-0 w-full h-56 md:h-auto md:w-[300px] lg:w-[340px] xl:w-[380px] border-t md:border-t-0 md:border-l border-border/50 flex flex-col min-h-0">
          <ChatPanel
            messages={chatMessages}
            onSendMessage={onSendMessage}
            myPlayerIndex={myPlayerIndex}
          />
        </div>

      </div>
    </div>
  );
}
