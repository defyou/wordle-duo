import { io, Socket } from "socket.io-client";

type Handler = (data: any) => void;

class GameSocket {
  private socket: Socket;

  constructor() {
    // No URL → connect to the current page origin (works locally and on Railway HTTPS).
    this.socket = io({
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }

  on(type: string, cb: Handler) {
    this.socket.on(type, cb);
  }

  off(type: string) {
    this.socket.off(type);
  }

  emit(type: string, payload?: any) {
    this.socket.emit(type, payload);
  }
}

export const socket = new GameSocket();
