import { createServer } from "node:http";
import { Server } from "socket.io";
import { io } from "socket.io-client";
import { createGameManager } from "./game.mjs";
import { WORDS } from "./words.mjs";
import { evaluateGuess } from "./game.mjs";

const PORT = 5988;
const httpServer = createServer((_req, res) => {
  res.writeHead(200);
  res.end("ok");
});
const ioServer = new Server(httpServer);
const gameManager = createGameManager();
ioServer.on("connection", (socket) => gameManager.handleConnection(socket));

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else console.log("ok:", msg);
}

// ---- Pure logic sanity checks (no network) ----
{
  const answer = "СТОЛБ";
  const tiles1 = evaluateGuess("СТОЛБ", answer);
  assert(tiles1.every((t) => t === "correct"), "exact match => all correct");

  const tiles2 = evaluateGuess("ОКОЛО", "СОСНА");
  const oCount = tiles2.filter((t, i) => "ОКОЛО"[i] === "О" && t !== "absent").length;
  assert(oCount === 1, `only one О should be marked present/correct, got ${oCount}`);
}

httpServer.listen(PORT, async () => {
  console.log(`test harness listening on ${PORT}`);
  await runScenario();
  httpServer.close();
  process.exit(process.exitCode || 0);
});

function connect() {
  return new Promise((resolve) => {
    const events = [];
    const socket = io(`http://127.0.0.1:${PORT}`, {
      autoConnect: true,
      transports: ["websocket"],
    });
    socket.on("connect", () => resolve({ socket, events }));
    socket.onAny((event, payload) => {
      events.push({ type: event, payload });
    });
  });
}

function waitFor(events, type, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const iv = setInterval(() => {
      const found = events.find((e) => e.type === type);
      if (found) {
        clearInterval(iv);
        resolve(found);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        reject(new Error(`timeout waiting for ${type}, got: ${JSON.stringify(events)}`));
      }
    }, 20);
  });
}

function send(socket, type, payload) {
  socket.emit(type, payload);
}

async function runScenario() {
  const p1 = await connect();
  await waitFor(p1.events, "waiting");
  console.log("p1 waiting ok");

  const p2 = await connect();
  const m1 = await waitFor(p1.events, "mode_select");
  const m2 = await waitFor(p2.events, "mode_select");
  assert(new Set([m1.payload.playerIndex, m2.payload.playerIndex]).size === 2, "players get distinct indices");

  send(p1.socket, "select_mode", { mode: "classic_duo" });
  const g1 = await waitFor(p1.events, "game_start");
  const g2 = await waitFor(p2.events, "game_start");
  assert(g1.payload.mode === "classic_duo" && g2.payload.mode === "classic_duo", "both got game_start classic_duo");
  assert(g1.payload.wordLength === 5 && g1.payload.maxAttempts === 6, "wordLength/maxAttempts correct");

  send(p1.socket, "guess", { word: "ЪЪЪЪЪ" });
  const inv = await waitFor(p1.events, "invalid_word");
  assert(!!inv, "invalid word rejected");

  const someWrongWord = WORDS.find((w) => w !== "СТОЛБ");
  send(p1.socket, "guess", { word: someWrongWord.toLowerCase() });
  const r1 = await waitFor(p1.events, "guess_result");
  assert(r1.payload.row === 0, "first guess is row 0");
  assert(r1.payload.tiles.length === 5, "tiles length 5");

  const r2 = await waitFor(p2.events, "guess_result");
  assert(r2.payload.row === 0 && r2.payload.word === someWrongWord.toUpperCase(), "opponent also sees the guess");

  const anotherWord = WORDS.find((w) => w !== someWrongWord);
  send(p2.socket, "guess", { word: anotherWord });
  await waitFor(p2.events, "guess_result");
  await new Promise((res) => setTimeout(res, 100));
  const guessResults = p1.events.filter((e) => e.type === "guess_result");
  assert(guessResults.length === 2, `expected 2 guess_result events on p1, got ${guessResults.length}`);
  assert(guessResults[1].payload.row === 1, "second guess is row 1 (shared counter across players)");

  send(p1.socket, "chat", { message: "Привет!" });
  const chatMsg = await waitFor(p2.events, "chat");
  assert(chatMsg.payload.message === "Привет!" && chatMsg.payload.playerIndex === 0, "chat relayed correctly");

  p2.socket.disconnect();
  const disc = await waitFor(p1.events, "opponent_disconnected");
  assert(!!disc, "disconnect notifies opponent");

  p1.socket.disconnect();

  const t1 = await connect();
  await waitFor(t1.events, "waiting");
  const t2 = await connect();
  await waitFor(t1.events, "mode_select");
  await waitFor(t2.events, "mode_select");
  send(t1.socket, "select_mode", { mode: "turn_based" });
  const tg1 = await waitFor(t1.events, "game_start");
  assert(tg1.payload.mode === "turn_based", "turn_based mode started");

  const idx1 = tg1.payload.playerIndex;
  const otherConn = idx1 === 0 ? t2 : t1;
  const firstConn = idx1 === 0 ? t1 : t2;

  send(otherConn.socket, "guess", { word: WORDS[0] });
  const err = await waitFor(otherConn.events, "error");
  assert(!!err, "guessing out of turn produces error");

  send(firstConn.socket, "guess", { word: WORDS[1] === WORDS[0] ? WORDS[2] : WORDS[1] });
  await waitFor(firstConn.events, "guess_result");
  const turnEvt = await waitFor(otherConn.events, "turn");
  assert(turnEvt.payload.playerIndex !== idx1, "turn switches to the other player after a guess");

  t1.socket.disconnect();
  t2.socket.disconnect();

  console.log("All scenario checks completed.");
}
