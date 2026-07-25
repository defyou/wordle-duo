import { useEffect, useCallback } from "react";
import { TileResult } from "../types";
import { cn } from "@/lib/utils";
import { Delete } from "lucide-react";

interface KeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  letterStates: Record<string, TileResult>;
  disabled?: boolean;
}

const ROWS = [
  ["Й","Ц","У","К","Е","Н","Г","Ш","Щ","З","Х","Ъ"],
  ["Ф","Ы","В","А","П","Р","О","Л","Д","Ж","Э"],
  ["Enter","Я","Ч","С","М","И","Т","Ь","Б","Ю","Backspace"],
];

export function Keyboard({ onKey, onEnter, onBackspace, letterStates, disabled }: KeyboardProps) {
 const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (disabled) return;

  const active = document.activeElement;

  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active?.getAttribute("contenteditable") === "true"
  ) {
    return;
  }

  if (e.key === "Enter") {
    onEnter();
    return;
  }

  if (e.key === "Backspace") {
    onBackspace();
    return;
  }

  const key = e.key.toUpperCase();

  if (/^[А-ЯЁ]$/.test(key)) {
    onKey(key === "Ё" ? "Е" : key);
  }
}, [disabled, onEnter, onBackspace, onKey]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const getKeyStyle = (key: string) => {
    const state = letterStates[key];
    if (state === "correct") return {
      base: "bg-correct text-correct-foreground",
      shadow: "shadow-[0_4px_0_0_var(--key-shadow-correct)]",
    };
    if (state === "present") return {
      base: "bg-present text-present-foreground",
      shadow: "shadow-[0_4px_0_0_var(--key-shadow-present)]",
    };
    if (state === "absent") return {
      base: "bg-absent text-absent-foreground opacity-60",
      shadow: "shadow-[0_4px_0_0_var(--key-shadow-absent)]",
    };
    return {
      base: "bg-card text-card-foreground hover:brightness-[1.06]",
      shadow: "shadow-[0_4px_0_0_var(--key-shadow)]",
    };
  };

  return (
    <div className="w-full flex flex-col gap-1.5 md:gap-2">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[5px] md:gap-[6px]">
          {row.map((key) => {
            const isEnter = key === "Enter";
            const isBack  = key === "Backspace";
            const isSpecial = isEnter || isBack;
            const { base, shadow } = getKeyStyle(key);

            return (
              <button
                key={key}
                onPointerDown={(e) => {
                  // prevent focus steal so physical keyboard keeps working
                  e.preventDefault();
                  if (disabled) return;
                  if (isEnter) onEnter();
                  else if (isBack) onBackspace();
                  else onKey(key);
                }}
                disabled={disabled}
                className={cn(
                  // layout & shape
                  "flex items-center justify-center rounded-[10px] select-none",
                  "font-bold uppercase tracking-wide",
                  // height
                  "h-[3.1rem] sm:h-[3.4rem] md:h-[3.75rem]",
                  // width
                  isSpecial
                    ? "px-2.5 sm:px-3.5 md:px-5 text-[9px] sm:text-[10px] md:text-xs font-semibold"
                    : "w-[7.5%] sm:w-9 md:w-[52px] text-base sm:text-lg md:text-xl",
                  // colour
                  isSpecial
                    ? "bg-muted/80 text-foreground shadow-[0_4px_0_0_var(--key-shadow)]"
                    : base,
                  !isSpecial && shadow,
                  // press feedback – translates down and shrinks shadow to match
                  "transition-all duration-[60ms] ease-out",
                  "active:translate-y-[3px] active:shadow-none active:brightness-95",
                  disabled && "opacity-40 cursor-not-allowed pointer-events-none",
                )}
              >
                {isBack
                  ? <Delete className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 pointer-events-none" />
                  : isEnter
                    ? "ВВОД"
                    : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
