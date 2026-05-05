import { spawn } from "node:child_process";
import process from "node:process";

const processes = [
  spawn("node", ["server/index.mjs"], { stdio: "inherit" }),
  spawn("vite", ["--host", "127.0.0.1"], { stdio: "inherit", shell: true })
];

const stop = () => {
  for (const child of processes) {
    if (!child.killed) child.kill("SIGTERM");
  }
};

process.on("SIGINT", () => {
  stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stop();
      process.exit(code);
    }
  });
}
