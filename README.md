<div align="center">

# Auto Job Applier

**A Claude agent skill that writes one honest CV and applies to jobs that actually fit — across LinkedIn, Indeed, NaukriGulf, Bayt, and anywhere else you point it.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-required-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![No personal data included](https://img.shields.io/badge/personal%20data-none%20included-brightgreen)](profile.example.json)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)](#extending-it-to-a-new-job-site)
[![MCP compatible](https://img.shields.io/badge/MCP-compatible-5A45FF)](mcp-server/README.md)

[Why this exists](#why-this-exists) ·
[What it does](#what-it-does) ·
[Safety](#hard-limits-it-never-crosses) ·
[Getting started](#getting-started) ·
[Use it from any AI agent (MCP)](#use-it-from-any-ai-agent-mcp) ·
[Supported sites](#supported-sites)

</div>

---

This repo ships **zero personal data**. Every run starts from a `profile.json` you
write about yourself — the skill never invents a name, an employer, a metric, or a
claim that isn't in that file. Clone it, drop in your own profile, and it works for
you; nobody else's history is in here to leak.

## Why this exists

Mass-applying to jobs usually fails in one of two ways, and most "auto apply"
tools only make the first one worse:

| Failure mode | What it looks like | What this skill does instead |
|---|---|---|
| **The CV oversells** | Every version repeats the same inflated seniority line, with metrics that aren't real and a "years of experience" that doesn't add up. Reads as templated to a recruiter and inconsistent to anyone who checks. | Builds one consistent, defensible CV per role, straight from real profile data. No invented scope, no copy-pasted seniority claims — see [`references/cv-honesty.md`](references/cv-honesty.md). |
| **The applications don't fit** | Blasting every listing with "AI Engineer" in the title, including roles that want 5+ years against a 2-year background. No amount of good writing fixes an experience mismatch. | Filters job listings against your real `years_experience` *before* applying, and tells you what it skipped and why. |

## What it does

1. **Reads your profile** — `profile.json` ([schema](profile.schema.json),
   [example](profile.example.json)): your real work history, skills, education,
   and contact details, and nothing it had to guess at.
2. **Builds a CV** — [`cvgen/build.js`](cvgen/build.js) renders a clean, ATS-safe
   PDF per role, in wording your `years_experience` can actually back up. Plain
   bulleted skills, not tables that scramble ATS text extraction. See
   [`cvgen/README.md`](cvgen/README.md).
3. **Searches and filters** — matches your target titles/skills, skips listings
   whose stated experience requirement is well outside your real band, and says
   why instead of silently either applying or skipping.
4. **Applies, adapting to whatever the site does** — follows the per-platform
   notes in [`references/platforms/`](references/platforms) for sites it already
   knows, and a general adaptive strategy
   ([`generic-fallback.md`](references/platforms/generic-fallback.md)) for
   anything new, including writing a new platform note once it figures a site
   out, so the next run doesn't start from scratch.
5. **Logs everything** — one row per application in `applications.csv`, so you
   (or the agent, next session) can see exactly what was applied to, skipped, or
   left for you to finish, and why.

## Supported sites

| Platform | Status |
|---|---|
| LinkedIn | Built in — [`references/platforms/linkedin.md`](references/platforms/linkedin.md) |
| Indeed | Built in — [`references/platforms/indeed.md`](references/platforms/indeed.md) |
| NaukriGulf / Naukri | Built in — [`references/platforms/naukrigulf.md`](references/platforms/naukrigulf.md) |
| Bayt | Built in — [`references/platforms/bayt.md`](references/platforms/bayt.md) |
| Any other job board or ATS (Greenhouse, Lever, Workday, Zoho Recruit, a company's own careers page...) | Handled adaptively via [`generic-fallback.md`](references/platforms/generic-fallback.md) — the skill works out the site's flow live and can write a new reference file for it |

## Hard limits it never crosses

This agent **never**:

- Solves a CAPTCHA — it pauses and asks you to.
- Types a password, or creates an account on your behalf without asking.
- Invents a salary or years-of-experience figure for a required field.
- Pays anything, anywhere, to apply.

Full detail in [`references/safety-and-boundaries.md`](references/safety-and-boundaries.md)
— read it before your first run.

## Requirements

- An agent harness that can install skills and drive a browser. Built for and
  tested with **Claude Code / Claude Desktop** plus a Chrome-automation tool
  (e.g. the "Claude in Chrome" extension or an equivalent in-app browser), but
  written generically enough to adapt to any harness with comparable
  browser-automation and file-tool capabilities.
- **Node.js** for the CV builder (no npm packages needed).
- A **Chromium-based browser** (Chrome or Edge) installed, for rendering CV PDFs.
  See [`cvgen/README.md`](cvgen/README.md) if it's somewhere the script doesn't
  auto-detect.

## Getting started

```bash
# 1. Clone the skill
git clone https://github.com/qaaayyyummm/Auto_Job_applier.git

# 2. Make your own project folder (keep it separate from the skill folder)
mkdir ~/my-job-search
cp Auto_Job_applier/profile.example.json ~/my-job-search/profile.json

# 3. Edit profile.json with your real info (or ask your agent to interview you)

# 4. Start your agent inside that folder
cd ~/my-job-search
claude
```

5. Ask it: *"Build my CV from my profile and apply to backend engineer roles
   on LinkedIn and Indeed."*
6. Check `applications.csv` afterward to see what it did.

> [!IMPORTANT]
> Never commit your real `profile.json` or `applications.csv` anywhere public
> — `.gitignore` already excludes both.

## Use it from any AI agent (MCP)

The steps above are for Claude, loading this as an **Agent Skill**. If
you're on a different agent — Cursor, Windsurf, VS Code's agent mode,
ChatGPT's agent tools, or anything else that speaks
[MCP](https://modelcontextprotocol.io) — this repo also ships as an MCP
server, so the same CV generation, job-fit filtering, and logging work
there too:

```bash
cd mcp-server
npm install
```

Then point your agent's MCP config at it:

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

Full tool list and per-client setup in [`mcp-server/README.md`](mcp-server/README.md).
The MCP server never drives a browser itself — your agent still needs its
own browser tool for the actual apply step; this just gives any agent the
same profile/CV/filtering/logging logic the Claude skill uses.

## Extending it to a new job site

Found a site that isn't in `references/platforms/` yet? Run the skill against it
once — it follows `generic-fallback.md` and, per the skill's own instructions,
writes a new `references/platforms/<site>.md` capturing what it learned (sign-in
behavior, single-page vs. multi-step, resume-upload quirks, anything the site
does differently). Open a pull request with that new file — this is the main way
the project is meant to grow: real runs against real sites, captured back for
everyone else.

## Project layout

```
Auto_Job_applier/
├── SKILL.md                     # the skill itself - read this first
├── profile.schema.json          # shape of profile.json
├── profile.example.json         # fictional example, safe to read/commit
├── cvgen/
│   ├── build.js                 # the CV builder (Node, no dependencies)
│   ├── README.md
│   └── variants.example.json    # example per-role tailoring
├── mcp-server/                  # MCP server - use this skill from any MCP agent
│   ├── index.js
│   ├── package.json
│   └── README.md
└── references/
    ├── safety-and-boundaries.md
    ├── cv-honesty.md
    ├── salary-and-screening-questions.md
    └── platforms/
        ├── linkedin.md
        ├── indeed.md
        ├── naukrigulf.md
        ├── bayt.md
        └── generic-fallback.md
```

## License

MIT — see [`LICENSE`](LICENSE). Use it, fork it, extend it to new sites; just
never commit anyone's real `profile.json` or `applications.csv` into a public
copy of this repo.
