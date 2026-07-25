export function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground screen-enter">
      <div className="flex flex-col items-center gap-6">
        {/* Animated dots */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight">
            Wordle <span className="text-primary">Дуэт</span>
          </h1>
          <p className="text-muted-foreground text-base font-medium animate-pulse">
            Ожидание соперника…
          </p>
        </div>

        {/* Decorative tiles */}
        <div className="flex gap-2 mt-2">
          {["В","О","Р","Д","Л"].map((letter, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-lg border-2 border-primary/30 bg-primary/5 flex items-center justify-center text-sm font-bold text-primary"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
