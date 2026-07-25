import { GameMode } from "../types";
import { MessageSquare, Clock } from "lucide-react";

interface ModeSelectProps {
  onSelect: (mode: GameMode) => void;
  playerIndex: number;
}

export function ModeSelect({ onSelect, playerIndex }: ModeSelectProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-6 md:p-10 screen-enter">
      <div className="w-full max-w-2xl space-y-10">

        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
            Игрок {playerIndex + 1}
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Выберите режим
          </h1>
          <p className="text-muted-foreground text-base">
            Оба игрока видят один выбор — кто успеет первым, тот задаёт режим.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Classic */}
          <button
            onClick={() => onSelect("classic_duo")}
            className="card-hover group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-primary
                         bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200"
            >
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Классический дуэт</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Оба игрока угадывают слово одновременно на одном поле. Общайтесь в чате!
            </p>
            <div className="mt-5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold
                            group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
              Выбрать →
            </div>
          </button>

          {/* Turn-based */}
          <button
            onClick={() => onSelect("turn_based")}
            className="card-hover group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-secondary-foreground
                         bg-secondary group-hover:bg-secondary/70 transition-colors duration-200"
            >
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">По очереди</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Игроки ходят поочерёдно. Следите за ходами соперника и разгадайте слово вместе.
            </p>
            <div className="mt-5 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold
                            group-hover:bg-foreground group-hover:text-background transition-colors duration-200">
              Выбрать →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
