import { useEffect, useState, useCallback, useRef } from "react";
import { socket } from "@/lib/socket";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { WaitingScreen } from "./components/WaitingScreen";
import { ModeSelect } from "./components/ModeSelect";
import { GameBoard } from "./components/GameBoard";
import { GameOver } from "./components/GameOver";
import { GameMode, GuessRecord, ChatMessage, GameOverInfo } from "./types";
import { AlertCircle } from "lucide-react";

type Phase = "connecting" | "waiting" | "mode_select" | "playing" | "game_over";

function App() {
  const { toast } = useToast();
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("connecting");
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  const [guesses, setGuesses] = useState<GuessRecord[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [turnPlayerIndex, setTurnPlayerIndex] = useState<number | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);

  const [rematchState, setRematchState] = useState<"none" | "requested_by_me" | "requested_by_opponent">("none");
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const [wordLength, setWordLength] = useState(5);
  const [maxAttempts, setMaxAttempts] = useState(6);

  useEffect(() => {
    socket.on("connect", () => { setOpponentDisconnected(false); });

    socket.on("waiting", () => {
      setPhase("waiting");
      setOpponentDisconnected(false);
    });

    socket.on("mode_select", (data: { playerIndex: number }) => {
      setPlayerIndex(data.playerIndex);
      setPhase("mode_select");
      setOpponentDisconnected(false);
      setGuesses([]);
      setCurrentInput("");
      setChatMessages([]);
      setGameOverInfo(null);
      setRematchState("none");
      setGameMode(null);
    });

    socket.on("game_start", (data: { mode: GameMode; playerIndex: number; wordLength: number; maxAttempts: number }) => {
      setGameMode(data.mode);
      setPlayerIndex(data.playerIndex);
      setWordLength(data.wordLength || 5);
      setMaxAttempts(data.maxAttempts || 6);
      setGuesses([]);
      setCurrentInput("");
      setChatMessages([]);
      setGameOverInfo(null);
      setRematchState("none");
      setOpponentDisconnected(false);
      setTurnPlayerIndex(data.mode === "turn_based" ? 0 : null);
      setPhase("playing");
    });

    socket.on("guess_result", (data: any) => {
      const newGuess: GuessRecord = {
        word: data.word,
        tiles: data.tiles,
        playerIndex: data.playerIndex,
        row: data.row,
        won: data.won,
      };
      setGuesses((prev) => {
        const filtered = prev.filter((g) => g.row !== newGuess.row);
        return [...filtered, newGuess];
      });
      if (data.playerIndex === playerIndex) setCurrentInput("");
      if (data.gameOver) {
        setTimeout(() => {
          setGameOverInfo({ won: data.won, guesserIndex: data.playerIndex, wordAnswer: data.wordAnswer });
          setPhase("game_over");
        }, 1800);
      }
    });

    socket.on("chat", (data: ChatMessage) => {
      setChatMessages((prev) => [...prev, data]);
    });

    socket.on("turn", (data: { playerIndex: number }) => {
      setTurnPlayerIndex(data.playerIndex);
    });

    socket.on("opponent_disconnected", () => {
      setOpponentDisconnected(true);
      toast({ title: "Соперник отключился", description: "Ваш соперник покинул игру.", variant: "destructive" });
    });

    socket.on("rematch_requested", (data: { playerIndex: number }) => {
      if (data.playerIndex !== playerIndex) setRematchState("requested_by_opponent");
    });

    socket.on("invalid_word", (data: { message: string }) => {
      toast({ description: data.message, duration: 2000 });
      // Trigger row shake
      setIsShaking(true);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setIsShaking(false), 650);
    });

    socket.on("error", (data: { message: string }) => {
      toast({ title: "Ошибка", description: data.message, variant: "destructive" });
    });

    return () => {
      socket.off("connect");
      socket.off("waiting");
      socket.off("mode_select");
      socket.off("game_start");
      socket.off("guess_result");
      socket.off("chat");
      socket.off("turn");
      socket.off("opponent_disconnected");
      socket.off("rematch_requested");
      socket.off("invalid_word");
      socket.off("error");
    };
  }, [playerIndex, toast]);

  const handleSelectMode = (mode: GameMode) => { socket.emit("select_mode", { mode }); };

  const handleKey = useCallback((key: string) => {
    if (phase !== "playing") return;
    if (currentInput.length < wordLength) setCurrentInput((prev) => prev + key);
  }, [phase, currentInput.length, wordLength]);

  const handleBackspace = useCallback(() => {
    if (phase !== "playing") return;
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [phase]);

  const handleEnter = useCallback(() => {
    if (phase !== "playing") return;
    if (currentInput.length === wordLength) {
      socket.emit("guess", { word: currentInput });
    } else {
      toast({ description: "Недостаточно букв", duration: 2000 });
    }
  }, [phase, currentInput, wordLength, toast]);

  const handleSendMessage = (msg: string) => { socket.emit("chat", { message: msg }); };

  const handleRematch = () => {
    socket.emit("rematch");
    setRematchState("requested_by_me");
  };

  const handleReturnToMenu = () => { socket.emit("return_to_menu"); };
  const handleReconnect = () => { window.location.reload(); };

  if (opponentDisconnected) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background text-foreground text-center space-y-6 screen-enter">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold">Соперник отключился</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Соперник покинул игру. Обновите страницу для поиска нового матча.
        </p>
        <button
          onClick={handleReconnect}
          className="mt-4 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all active:scale-95"
        >
          Найти новую игру
        </button>
      </div>
    );
  }

  return (
    <>
      {(phase === "connecting" || phase === "waiting") && <WaitingScreen />}

      {phase === "mode_select" && (
        <ModeSelect onSelect={handleSelectMode} playerIndex={playerIndex} />
      )}

      {(phase === "playing" || phase === "game_over") && gameMode && (
        <GameBoard
          mode={gameMode}
          myPlayerIndex={playerIndex}
          guesses={guesses}
          currentInput={currentInput}
          onKey={handleKey}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          wordLength={wordLength}
          maxAttempts={maxAttempts}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          turnPlayerIndex={turnPlayerIndex}
          onReturnToMenu={handleReturnToMenu}
          isShaking={isShaking}
        />
      )}

      {phase === "game_over" && gameOverInfo && (
        <GameOver
          info={gameOverInfo}
          myPlayerIndex={playerIndex}
          rematchState={rematchState}
          onRematch={handleRematch}
          onReturnToMenu={handleReturnToMenu}
        />
      )}
      <Toaster />
    </>
  );
}

export default App;
