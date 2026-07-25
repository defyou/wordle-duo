// Production entrypoint for Railway and other hosts.
// Sets NODE_ENV before the server boots (works on Windows and Linux).
process.env.NODE_ENV = process.env.NODE_ENV || "production";

await import("./main.mjs");
