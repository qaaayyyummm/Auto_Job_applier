#!/usr/bin/env node
// Auto Job Applier — unified CLI entry point.
//
// This is what `npx -y github:qaaayyyummm/Auto_Job_applier` runs. No clone,
// no local checkout needed — npx fetches this repo straight from GitHub,
// installs its dependencies, and runs this file.
//
//   npx -y github:qaaayyyummm/Auto_Job_applier            # install everywhere detected
//   npx -y github:qaaayyyummm/Auto_Job_applier --list     # preview only, no writes
//   npx -y github:qaaayyyummm/Auto_Job_applier --dry-run  # preview only, no writes
//   npx -y github:qaaayyyummm/Auto_Job_applier mcp         # run as an MCP server (stdio)
//
// Agent configs the installer writes use this same "mcp" subcommand, so the
// MCP server itself also runs via npx — no separate install step for it.

const args = process.argv.slice(2);

if (args[0] === "mcp") {
  await import("../mcp-server/index.js");
} else {
  const installerArgs = args[0] === "install" ? args.slice(1) : args;
  process.argv = [process.argv[0], process.argv[1], ...installerArgs];
  await import("./install-everywhere.js");
}
