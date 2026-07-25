import { GameOverInfo } from "../types";
import { Tile } from "./Tile";
import { Home } from "lucide-react";

interface GameOverProps {
  info: GameOverInfo;
  myPlayerIndex: number;
  rematchState: 'none' | 'requested_by_me' | 'requested_by_opponent';
  onRematch: () => void;
  onReturnToMenu: () => void;
}

export function GameOver({ info, myPlayerIndex, rematchState, onRematch, onReturnToMenu }: GameOverProps) {
  const isWon = info.won;
  const iGuessedIt = info.guesserIndex === myPlayerIndex;
  
  let title = "";
  if (isWon) {
    title = iGuessedIt ? "Вы угадали! 🎉" : "Соперник угадал! 👏";
  } else {
    title = "Игра окончена 💀";
  }

  const answerArr = info.wordAnswer ? info.wordAnswer.split('') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border-2 border-border p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
        <h2 className="text-3xl font-bold">{title}</h2>
        
        {!isWon && info.wordAnswer && (
          <div className="space-y-3">
            <p className="text-muted-foreground">Загаданное слово</p>
            <div className="flex justify-center gap-2">
              {answerArr.map((letter, i) => (
                <Tile key={i} letter={letter} state="correct" />
              ))}
            </div>
          </div>
        )}

        {isWon && info.wordAnswer && (
           <div className="flex justify-center gap-2">
             {answerArr.map((letter, i) => (
               <Tile key={i} letter={letter} state="correct" />
             ))}
           </div>
        )}

        <div className="pt-4 border-t-2 border-border/50 space-y-3">
          {rematchState === 'none' && (
            <button
              onClick={onRematch}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Сыграть снова
            </button>
          )}
          {rematchState === 'requested_by_me' && (
            <p className="text-muted-foreground animate-pulse font-medium py-4">Ожидание соперника...</p>
          )}
          {rematchState === 'requested_by_opponent' && (
            <div className="space-y-3">
              <p className="text-primary font-medium">Соперник хочет реванш!</p>
              <button
                onClick={onRematch}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Принять реванш
              </button>
            </div>
          )}

          <button
            onClick={onReturnToMenu}
            className="w-full py-3 rounded-xl border-2 border-border bg-background text-foreground font-semibold text-base hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            В главное меню
          </button>
        </div>
      </div>
    </div>
  );
}
