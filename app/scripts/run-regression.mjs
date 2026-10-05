import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  ["--test", "scripts/regression-tests.mjs"],
  { stdio: "inherit", cwd: process.cwd() },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
