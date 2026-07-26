import { useEffect, useState } from "react";
import { TileResult } from "../types";
import { cn } from "@/lib/utils";

interface TileProps {
  letter?: string;
  state?: TileResult;
  isFlipping?: boolean;
  flipDelay?: number;
  playerIndex?: number;
}

export function Tile({ letter, state = "empty", isFlipping, flipDelay = 0, playerIndex }: TileProps) {
  const [pop, setPop] = useState(false);
  const [revealed, setRevealed] = useState(state !== "empty");

  useEffect(() => {
    if (letter && state === "empty") {
      setPop(true);
      const t = setTimeout(() => setPop(false), 130);
      return () => clearTimeout(t);
    }
  }, [letter, state]);

  // Delay colour reveal until the flip is half-way through
  useEffect(() => {
    if (isFlipping && state !== "empty") {
      setRevealed(false);
      const t = setTimeout(() => setRevealed(true), flipDelay + 260);
      return () => clearTimeout(t);
    }
    if (!isFlipping) setRevealed(state !== "empty");
  }, [isFlipping, state, flipDelay]);

  const stateClasses: Record<TileResult, string> = {
    empty:   "border-border/50 bg-background text-foreground",
    correct: "border-correct bg-correct text-correct-foreground shadow-[0_2px_12px_rgba(21,128,61,0.35)]",
    present: "border-present bg-present text-present-foreground shadow-[0_2px_12px_rgba(202,138,4,0.30)]",
    absent:  "border-absent bg-absent text-absent-foreground",
  };

  const isFilled = letter && state === "empty";
  const displayState = revealed ? state : "empty";

  return (
    <div
      className="relative perspective w-full aspect-square max-w-[3.25rem] sm:max-w-[4rem] md:max-w-[5.25rem] lg:max-w-[6rem]"
    >
      {state !== "empty" && playerIndex !== undefined && (
        <div className="absolute -left-5 sm:-left-7 md:-left-9 top-1/2 -translate-y-1/2 text-[9px] sm:text-[11px] font-bold text-muted-foreground z-10">
          И{playerIndex + 1}
        </div>
      )}

      <div
        style={isFlipping ? { animationDelay: `${flipDelay}ms` } : undefined}
        className={cn(
          "w-full h-full border-2 rounded-xl flex items-center justify-center font-black",
          "text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem]",
          "uppercase select-none",
          "transition-colors duration-150",
          stateClasses[displayState],
          isFilled && "border-primary/60 border-[3px]",
          pop && "tile-pop",
          isFlipping && "tile-flip",
        )}
      >
        {letter}
      </div>
    </div>
  );
}
