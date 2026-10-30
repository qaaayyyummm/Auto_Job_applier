# Auto Job Applier — MCP server

This folder turns the skill into an [MCP](https://modelcontextprotocol.io)
server, so any MCP-compatible agent — Claude Desktop, Claude Code, Cursor,
Windsurf, VS Code's agent mode, ChatGPT/OpenAI's agent tools, or anything
else that speaks MCP — can use it, not just Claude.

It is a thin wrapper, by design. **It never drives a browser itself.** The
calling agent still needs its own browser-automation tool (Claude in Chrome,
a Playwright MCP server, computer use, etc.) to actually open job sites and
submit applications — this server handles the parts that don't need a
browser: reading your profile, deciding if a listing fits, generating a
tailored CV, and logging what happened.

## Tools it exposes

| Tool | What it does |
|---|---|
| `get_workflow_instructions` | Returns the full step-by-step workflow (the MCP-native equivalent of `SKILL.md`). Call this first. |
| `get_safety_rules` | The hard rules: no CAPTCHAs, no passwords/account creation without asking, no invented numbers. |
| `get_platform_notes` | Known quirks per platform (`linkedin`, `indeed`, `naukrigulf`, `bayt`, or `generic-fallback` for anything else). |
| `get_cv_honesty_guidance` | Why a CV may only select/reorder real facts, never invent them. |
| `get_salary_and_screening_guidance` | How to answer salary/experience screening fields without guessing. |
| `get_profile_schema` | The JSON Schema `profile.json` must satisfy. |
| `load_profile` | Reads a user's `profile.json` from an absolute path. |
| `check_job_fit` | Decides if a listing matches the profile's real experience band. |
| `generate_cv` | Runs `cvgen/build.js` to render a tailored CV PDF. |
| `log_application` | Appends one row to the user's `applications.csv`. |

No personal data lives in this server or its code — every tool takes a path
or payload the calling agent supplies, same as the rest of this repo.

## Install everywhere at once (recommended, no clone needed)

```bash
npx -y github:qaaayyyummm/Auto_Job_applier
```

This detects which of Claude Desktop, Claude Code, Cursor, Windsurf, and
VS Code are actually installed on this machine, and registers this server
with each one it finds (plus a native Agent Skill copy for Claude Code).
It only touches an agent it actually detects, and it backs up any config
file (`<file>.bak`) the first time it edits it.

- `--list` — only report what it would detect and change.
- `--dry-run` — preview the exact edits without writing anything.
- `--local` — write config entries that point at a local clone instead of
  `npx ... mcp` (see below). Use this if you've cloned the repo and want
  agents to run your local copy directly.

The config entries this writes run the server as `npx -y
github:qaaayyyummm/Auto_Job_applier mcp` — so the agents you register don't
need a local clone either; npx fetches and caches this repo from GitHub the
first time each agent starts the server.

Everything below is what that script does automatically — read on if you'd
rather wire up one client by hand, or understand what it wrote.

## Connect it to your agent manually

Most MCP clients use a config file with a `mcpServers` (or `servers`) block
pointing at a command to run. The exact file differs per client, but the
entry looks the same everywhere:

```json
{
  "mcpServers": {
    "auto-job-applier": {
      "command": "npx",
      "args": ["-y", "github:qaaayyyummm/Auto_Job_applier", "mcp"]
    }
  }
}
```

If you've cloned the repo and would rather run your local copy:

```json
{
  "mcpServers": {
    "auto-job-applier": {
      "command": "node",
      "args": ["/absolute/path/to/Auto_Job_applier/mcp-server/index.js"]
    }
  }
}
```

- **Claude Desktop**: Settings → Developer → Edit Config, add one of the blocks above.
- **Claude Code**: `claude mcp add auto-job-applier --scope user -- npx -y github:qaaayyyummm/Auto_Job_applier mcp`
- **Cursor**: `~/.cursor/mcp.json`, same block.
- **Windsurf**: `~/.codeium/windsurf/mcp_config.json`, same block.
- **VS Code**: `%APPDATA%/Code/User/mcp.json` (or your platform's
  equivalent), under a top-level `"servers"` key with `"type": "stdio"`
  added to the entry.
- **Any other MCP-compatible agent**: check its docs for where it reads
  `mcpServers` from — the block itself is portable.

## Using it

Once connected, just ask your agent the same thing you'd ask the Claude
skill:

> "Use the auto-job-applier tools to build my CV from
> `~/my-job-search/profile.json` and apply to backend engineer roles on
> LinkedIn."

The agent should call `get_workflow_instructions` first, then follow the
same loop the skill describes — using its own browser tool for the actual
apply step, and this server's tools for everything else.
