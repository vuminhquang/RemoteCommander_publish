#!/usr/bin/env node
// Runs the RemoteCommander binary for this OS and CPU. npm installs exactly
// one of the platform packages (optionalDependencies, filtered by os/cpu).
"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const PLATFORMS = {
  "win32-x64": "remote-commander-win32-x64",
  "win32-arm64": "remote-commander-win32-arm64",
  "darwin-x64": "remote-commander-darwin-x64",
  "darwin-arm64": "remote-commander-darwin-arm64",
  "linux-x64": "remote-commander-linux-x64",
  "linux-arm64": "remote-commander-linux-arm64",
};
const BINARY = process.platform === "win32" ? "remote-commander-mcp.exe" : "remote-commander-mcp";
const EXIT_FAILURE = 1;

const key = `${process.platform}-${process.arch}`;
const pkg = PLATFORMS[key];
if (!pkg) {
  console.error(`remote-commander: no build for ${key} yet (have: ${Object.keys(PLATFORMS).join(", ")})`);
  process.exit(EXIT_FAILURE);
}

let binary;
try {
  binary = path.join(path.dirname(require.resolve(`${pkg}/package.json`)), "bin", BINARY);
} catch {
  console.error(`remote-commander: ${pkg} is not installed; reinstall without --no-optional`);
  process.exit(EXIT_FAILURE);
}

// stdio passes through: `remote` prints to the console, stdio mode speaks MCP
const run = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });
if (run.error) {
  console.error(`remote-commander: cannot start ${binary}: ${run.error.message}`);
  process.exit(EXIT_FAILURE);
}
process.exit(run.status ?? EXIT_FAILURE);
