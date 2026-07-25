import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createGameManager } from "./game.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist", "public");

const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 5000;

const app = express();
app.set("trust proxy", 1);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  transports: ["websocket", "polling"],
  allowUpgrades: true,
});
const gameManager = createGameManager();

io.on("connection", (socket) => {
  gameManager.handleConnection(socket);
});

async function main() {
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  if (isProd) {
    if (!fs.existsSync(distDir)) {
      console.error(
        `[server] Не найдена сборка клиента в ${distDir}. Сначала выполните "npm run build".`
      );
    }
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    process.env.PORT = String(PORT);
    process.env.BASE_PATH = process.env.BASE_PATH || "/";

    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      root,
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let html = fs.readFileSync(path.join(root, "index.html"), "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[server] Wordle Duo listening on http://0.0.0.0:${PORT} (mode: ${isProd ? "production" : "development"})`
    );
  });
}

main();
