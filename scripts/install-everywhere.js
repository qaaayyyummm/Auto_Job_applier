#!/usr/bin/env node
// Auto Job Applier — install-everywhere
//
// Detects which supported AI agents/editors are actually installed on this
// machine and registers this repo with each one it finds:
//   - As an MCP server (mcpServers/servers entry) for Claude Desktop,
//     Claude Code, Cursor, Windsurf, and VS Code's agent mode.
//   - As a native Agent Skill (a copy of this repo's SKILL.md + resources)
//     for Claude Code, which reads skills straight off disk.
//
// It only touches an agent's config if that agent is actually detected
// (its own config directory exists, or its CLI is on PATH) — nothing is
// created for tools you don't have. Every config file it edits is backed
// up once, next to the original, before the first write.
//
// Safe to re-run: it merges into existing config rather than overwriting,
// and writing the same entry twice is a no-op diff.
//
// Usage:
//   node scripts/install-everywhere.js          # detect + install
//   node scripts/install-everywhere.js --dry-run   # show what would happen, change nothing
//   node scripts/install-everywhere.js --list      # only report what's detected

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, cpSync } from "node:fs";
import { homedir, platform } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MCP_ENTRY_POINT = path.join(REPO_ROOT, "mcp-server", "index.js");
const SERVER_NAME = "auto-job-applier";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const LIST_ONLY = args.includes("--list");

const home = homedir();
const os = platform(); // 'win32' | 'darwin' | 'linux'

function commandExists(cmd) {
  try {
    const finder = os === "win32" ? "where" : "which";
    execFileSync(finder, [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function appDataDir() {
  if (os === "win32") return process.env.APPDATA || path.join(home, "AppData", "Roaming");
  if (os === "darwin") return path.join(home, "Library", "Application Support");
  return path.join(home, ".config");
}

function readJson(filePath) {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    console.warn(`  ! ${filePath} isn't valid JSON — leaving it untouched.`);
    return null;
  }
}

function backupOnce(filePath) {
  const bak = `${filePath}.bak`;
  if (existsSync(filePath) && !existsSync(bak)) {
    copyFileSync(filePath, bak);
    console.log(`  backed up original to ${bak}`);
  }
}

function writeMcpEntry(label, configPath, serversKey, entry) {
  if (LIST_ONLY) {
    console.log(`[detected] ${label} — would write to ${configPath}`);
    return;
  }
  const existing = readJson(configPath);
  if (existing === null) return; // invalid JSON, already warned

  const alreadyPresent =
    JSON.stringify(existing?.[serversKey]?.[SERVER_NAME]) === JSON.stringify(entry);
  if (alreadyPresent) {
    console.log(`[ok] ${label} — already registered.`);
    return;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] ${label} — would update ${configPath}`);
    return;
  }

  mkdirSync(path.dirname(configPath), { recursive: true });
  backupOnce(configPath);
  existing[serversKey] = existing[serversKey] || {};
  existing[serversKey][SERVER_NAME] = entry;
  writeFileSync(configPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
  console.log(`[done] ${label} — registered in ${configPath}`);
}

const mcpEntry = { command: "node", args: [MCP_ENTRY_POINT] };
const vscodeEntry = { type: "stdio", command: "node", args: [MCP_ENTRY_POINT] };

let anyDetected = false;

// ---------------------------------------------------------------------------
// Claude Desktop
// ---------------------------------------------------------------------------
{
  const dir = path.join(appDataDir(), "Claude");
  if (existsSync(dir)) {
    anyDetected = true;
    writeMcpEntry(
      "Claude Desktop",
      path.join(dir, "claude_desktop_config.json"),
      "mcpServers",
      mcpEntry
    );
  } else {
    console.log("[skip] Claude Desktop — not detected on this machine.");
  }
}

// ---------------------------------------------------------------------------
// Claude Code (CLI, if present) + native Agent Skill install
// ---------------------------------------------------------------------------
{
  const claudeHome = path.join(home, ".claude");
  const hasCli = commandExists("claude");
  const hasHome = existsSync(claudeHome);

  if (hasCli) {
    anyDetected = true;
    if (LIST_ONLY) {
      console.log("[detected] Claude Code CLI — would run `claude mcp add`.");
    } else if (DRY_RUN) {
      console.log("[dry-run] Claude Code CLI — would run `claude mcp add auto-job-applier --scope user -- node ...`");
    } else {
      try {
        execFileSync(
          "claude",
          ["mcp", "add", SERVER_NAME, "--scope", "user", "--", "node", MCP_ENTRY_POINT],
          { stdio: "inherit" }
        );
        console.log("[done] Claude Code — registered via `claude mcp add`.");
      } catch (err) {
        console.warn(`  ! \`claude mcp add\` failed (${err.message}); you can add it manually later.`);
      }
    }
  }

  if (hasHome) {
    anyDetected = true;
    const skillsDir = path.join(claudeHome, "skills", SERVER_NAME);
    if (LIST_ONLY) {
      console.log(`[detected] Claude Code skills folder — would copy skill to ${skillsDir}`);
    } else if (DRY_RUN) {
      console.log(`[dry-run] Claude Code — would copy this skill to ${skillsDir}`);
    } else {
      mkdirSync(skillsDir, { recursive: true });
      for (const entry of ["SKILL.md", "profile.schema.json", "profile.example.json", "cvgen", "references"]) {
        const src = path.join(REPO_ROOT, entry);
        if (existsSync(src)) cpSync(src, path.join(skillsDir, entry), { recursive: true });
      }
      console.log(`[done] Claude Code — skill copied to ${skillsDir}`);
    }
  }

  if (!hasCli && !hasHome) {
    console.log("[skip] Claude Code — not detected on this machine.");
  }
}

// ---------------------------------------------------------------------------
// Cursor
// ---------------------------------------------------------------------------
{
  const dir = path.join(home, ".cursor");
  if (existsSync(dir) || commandExists("cursor")) {
    anyDetected = true;
    writeMcpEntry("Cursor", path.join(dir, "mcp.json"), "mcpServers", mcpEntry);
  } else {
    console.log("[skip] Cursor — not detected on this machine.");
  }
}

// ---------------------------------------------------------------------------
// Windsurf
// ---------------------------------------------------------------------------
{
  const dir = path.join(home, ".codeium", "windsurf");
  if (existsSync(dir) || existsSync(path.join(home, ".codeium"))) {
    anyDetected = true;
    writeMcpEntry("Windsurf", path.join(dir, "mcp_config.json"), "mcpServers", mcpEntry);
  } else {
    console.log("[skip] Windsurf — not detected on this machine.");
  }
}

// ---------------------------------------------------------------------------
// VS Code (agent mode / MCP support)
// ---------------------------------------------------------------------------
{
  const dir = path.join(appDataDir(), "Code", "User");
  if (existsSync(path.join(appDataDir(), "Code")) || commandExists("code")) {
    anyDetected = true;
    writeMcpEntry("VS Code", path.join(dir, "mcp.json"), "servers", vscodeEntry);
  } else {
    console.log("[skip] VS Code — not detected on this machine.");
  }
}

console.log("");
if (!anyDetected) {
  console.log(
    "No supported AI agent was detected on this machine. Install Claude Desktop, Claude Code, Cursor, Windsurf, or VS Code first, then re-run this script."
  );
} else if (LIST_ONLY) {
  console.log("Nothing was changed (--list). Re-run without flags to install.");
} else if (DRY_RUN) {
  console.log("Nothing was changed (--dry-run). Re-run without flags to install.");
} else {
  console.log(
    "Done. Restart any agent that was already running so it picks up the new MCP server."
  );
}
