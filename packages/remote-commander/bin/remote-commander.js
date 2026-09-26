#!/usr/bin/env node
// Runs the RemoteCommander binary for this OS and CPU; the package carries
// one prebuilt binary per platform under bin/<os>-<cpu>/.
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const EXIT_FAILURE = 1;
const key = `${process.platform}-${process.arch}`;
const binary = path.join(
  __dirname,
  key,
  process.platform === "win32" ? "remote-commander-mcp.exe" : "remote-commander-mcp",
);

if (!fs.existsSync(binary)) {
  const have = fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  console.error(`remote-commander: no build for ${key} yet (have: ${have.join(", ")})`);
  process.exit(EXIT_FAILURE);
}

// stdio passes through: `remote` prints to the console, stdio mode speaks MCP
const run = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });
if (run.error) {
  console.error(`remote-commander: cannot start ${binary}: ${run.error.message}`);
  process.exit(EXIT_FAILURE);
}
process.exit(run.status ?? EXIT_FAILURE);
