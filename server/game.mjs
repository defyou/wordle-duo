import { WORDS } from "./words.mjs";
import { ALLOWED_WORDS } from "./allowedWords.mjs";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const DICTIONARY = new Set(
  ALLOWED_WORDS.map(word => word.toUpperCase())
);

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

// Классический алгоритм Wordle с корректной обработкой повторяющихся букв.
export function evaluateGuess(guess, answer) {
  const g = Array.from(guess);
  const a = Array.from(answer);
  const result = new Array(g.length).fill("absent");
  const remaining = {};

  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) {
      result[i] = "correct";
    } else {
      remaining[a[i]] = (remaining[a[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;
    const letter = g[i];
    if (remaining[letter] > 0) {
      result[i] = "present";
      remaining[letter] -= 1;
    } else {
      result[i] = "absent";
    }
  }

  return result;
}

class Room {
  constructor(id, players) {
    this.id = id;
    this.players = players; // [conn0, conn1]
    this.mode = null;
    this.answer = null;
    this.row = 0;
    this.guesses = [];
    this.turnPlayerIndex = null;
    this.gameOver = false;
    this.rematchRequests = new Set();
  }

  other(conn) {
    return this.players[0] === conn ? this.players[1] : this.players[0];
  }

  indexOf(conn) {
    return this.players.indexOf(conn);
  }

  broadcast(type, payload) {
    for (const p of this.players) {
      if (p && p.connected) p.emit(type, payload);
    }
  }

  sendTo(conn, type, payload) {
    if (conn && conn.connected) conn.emit(type, payload);
  }
}

export function createGameManager() {
  const waitingQueue = [];
  const roomByConn = new Map();
  let roomCounter = 1;

  function startMatch(connA, connB) {
    const room = new Room(String(roomCounter++), [connA, connB]);
    roomByConn.set(connA, room);
    roomByConn.set(connB, room);
    room.sendTo(connA, "mode_select", { playerIndex: 0 });
    room.sendTo(connB, "mode_select", { playerIndex: 1 });
  }

  function enqueue(conn) {
    // Remove stale entries just in case.
    const idx = waitingQueue.indexOf(conn);
    if (idx !== -1) waitingQueue.splice(idx, 1);

    if (waitingQueue.length > 0) {
      const opponent = waitingQueue.shift();
      startMatch(opponent, conn);
    } else {
      waitingQueue.push(conn);
      conn.emit("waiting");
    }
  }

  function beginGame(room, mode) {
    room.mode = mode;
    room.answer = randomWord();
    room.row = 0;
    room.guesses = [];
    room.gameOver = false;
    room.rematchRequests.clear();
    room.turnPlayerIndex = mode === "turn_based" ? 0 : null;

    room.players.forEach((conn, i) => {
      room.sendTo(conn, "game_start", {
        mode,
        playerIndex: i,
        wordLength: WORD_LENGTH,
        maxAttempts: MAX_ATTEMPTS,
      });
    });
  }

  function handleSelectMode(conn, mode) {
    const room = roomByConn.get(conn);
    if (!room || room.mode) return; // already started, first choice wins
    if (mode !== "classic_duo" && mode !== "turn_based") return;
    beginGame(room, mode);
  }

  function handleGuess(conn, rawWord) {
    const room = roomByConn.get(conn);
    if (!room || !room.mode || room.gameOver) return;

    const playerIndex = room.indexOf(conn);
    const word = String(rawWord || "").toUpperCase().trim();

    if (room.mode === "turn_based" && room.turnPlayerIndex !== playerIndex) {
      room.sendTo(conn, "error", { message: "Сейчас не ваш ход." });
      return;
    }

    if (Array.from(word).length !== WORD_LENGTH) {
      room.sendTo(conn, "invalid_word", { message: "Недостаточно букв" });
      return;
    }

    if (!DICTIONARY.has(word)) {
      room.sendTo(conn, "invalid_word", { message: "Такого слова нет в словаре" });
      return;
    }

    const tiles = evaluateGuess(word, room.answer);
    const won = word === room.answer;
    const row = room.row;
    room.row += 1;
    const gameOver = won || room.row >= MAX_ATTEMPTS;
    room.gameOver = gameOver;

    room.guesses.push({ word, tiles, playerIndex, row, won });

    room.broadcast("guess_result", {
      word,
      tiles,
      playerIndex,
      row,
      won,
      gameOver,
      wordAnswer: gameOver ? room.answer : undefined,
    });

    if (!gameOver && room.mode === "turn_based") {
      room.turnPlayerIndex = playerIndex === 0 ? 1 : 0;
      room.broadcast("turn", { playerIndex: room.turnPlayerIndex });
    }
  }

  function handleChat(conn, message) {
    const room = roomByConn.get(conn);
    if (!room) return;
    const text = String(message || "").slice(0, 500).trim();
    if (!text) return;
    const playerIndex = room.indexOf(conn);
    room.broadcast("chat", { message: text, playerIndex, timestamp: Date.now() });
  }

  function handleRematch(conn) {
    const room = roomByConn.get(conn);
    if (!room) return;
    const playerIndex = room.indexOf(conn);
    room.rematchRequests.add(playerIndex);

    if (room.rematchRequests.size >= 2) {
      beginGame(room, room.mode);
    } else {
      const opponent = room.other(conn);
      room.sendTo(opponent, "rematch_requested", { playerIndex });
    }
  }

  function teardownRoom(room, leavingConn) {
    for (const p of room.players) roomByConn.delete(p);
    if (leavingConn) {
      const opponent = room.other(leavingConn);
      room.sendTo(opponent, "opponent_disconnected", {});
    }
  }

  function handleReturnToMenu(conn) {
    const room = roomByConn.get(conn);
    if (room) teardownRoom(room, conn);
    enqueue(conn);
  }

  function handleDisconnect(conn) {
    const qIdx = waitingQueue.indexOf(conn);
    if (qIdx !== -1) waitingQueue.splice(qIdx, 1);

    const room = roomByConn.get(conn);
    if (room) teardownRoom(room, conn);
  }

  function handleConnection(socket) {
    enqueue(socket);

    socket.on("select_mode", (payload) => {
      handleSelectMode(socket, payload && payload.mode);
    });
    socket.on("guess", (payload) => {
      handleGuess(socket, payload && payload.word);
    });
    socket.on("chat", (payload) => {
      handleChat(socket, payload && payload.message);
    });
    socket.on("rematch", () => handleRematch(socket));
    socket.on("return_to_menu", () => handleReturnToMenu(socket));
    socket.on("disconnect", () => handleDisconnect(socket));
  }

  return { handleConnection };
}
