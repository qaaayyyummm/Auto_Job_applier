# Auto Job Applier

A [Claude Code / Claude agent](https://claude.com/claude-code) skill that builds an
honest, tailored CV from your own data and applies to matching jobs across job
boards - LinkedIn, Indeed, NaukriGulf, Bayt, and (adaptively) pretty much any other
job site or company careers page - using browser automation.

It does not contain anyone's personal data. Every run starts from a `profile.json`
you write about yourself; the skill never invents a name, an employer, a metric, or
a claim that isn't in that file.

## Why this exists

Mass-applying to jobs usually fails in one of two ways:

1. **The CV oversells.** A different seniority claim pasted into every version,
   metrics that aren't real, "years of experience" that don't add up - all of which
   reads as templated to a recruiter and as inconsistent to anyone who checks.
2. **The applications don't fit.** Applying to roles that want 5+ years with a
   2-year background wastes everyone's time, no matter how well the CV is written.

This skill fixes both: it builds one consistent, defensible CV per role straight
from real profile data, and it filters job listings against your actual years of
experience before applying to them. See [`references/cv-honesty.md`](references/cv-honesty.md)
for the full story.

## What it does

1. **Reads your profile.** `profile.json` (schema in [`profile.schema.json`](profile.schema.json),
   example in [`profile.example.json`](profile.example.json)) - your real work
   history, skills, education, and contact details.
2. **Builds a CV.** `cvgen/build.js` renders a clean, ATS-safe PDF per role, with
   wording the `years_experience` field in your profile can actually back up. See
   [`cvgen/README.md`](cvgen/README.md).
3. **Searches and filters.** Looks for roles matching your target titles/skills,
   and skips ones whose stated experience requirement is well outside your real
   band, telling you what it skipped and why.
4. **Applies, adapting to whatever each site does.** Follows the per-platform notes
   in [`references/platforms/`](references/platforms) for sites it already knows,
   and a general adaptive strategy ([`references/platforms/generic-fallback.md`](references/platforms/generic-fallback.md))
   for anything new - including writing a new platform note once it's worked a new
   site out, so the next run doesn't start from scratch.
5. **Logs everything.** One row per application in `applications.csv`, so you (or
   the agent, next time) can see exactly what was applied to, skipped, or left for
   you to finish, and why.

## Hard limits it never crosses

This agent never solves a CAPTCHA, never types a password, never creates an
account on your behalf without asking, never invents a salary or years-of-
experience figure, and never pays anything to apply anywhere. Full detail in
[`references/safety-and-boundaries.md`](references/safety-and-boundaries.md) -
read this before your first run.

## Requirements

- An agent harness that can install skills and drive a browser - this was built for
  and tested with Claude Code / Claude Desktop with a Chrome-automation tool
  available (e.g. the "Claude in Chrome" extension or an equivalent in-app
  browser), but the instructions are written generically enough to adapt to any
  harness with comparable browser-automation and file-tool capabilities.
- Node.js, for the CV builder.
- A Chromium-based browser installed (Chrome or Edge) for rendering CV PDFs. See
  [`cvgen/README.md`](cvgen/README.md) if it's not in a location the script
  auto-detects.

## Getting started

1. Clone or copy this skill into wherever your agent harness looks for skills.
2. Copy `profile.example.json` to `profile.json` **in your own project directory,
   not inside this skill folder**, and fill in your real information - or just ask
   your agent to help you build it from an existing CV/resume file. Never commit
   your real `profile.json` anywhere public; `.gitignore` already excludes it.
3. Tell your agent what you want, e.g. "apply to backend engineer roles in Austin
   matching my profile" or "build my CV and apply on LinkedIn and Indeed." The
   skill's `SKILL.md` carries the rest of the workflow from there.
4. Review `applications.csv` after each session to see what happened.

## Extending it to a new job site

Found a site that isn't in `references/platforms/` yet? Run the skill against it
once - it'll follow `generic-fallback.md` and, per the skill's own instructions,
write a new `references/platforms/<site>.md` capturing what it learned (how
sign-in works, single-page vs. multi-step, resume-upload quirks, anything the site
does differently). Open a pull request with that new file. That's the main way
this project is meant to grow: real runs against real sites, captured back for
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

MIT - see [`LICENSE`](LICENSE). Use it, fork it, extend it; just don't commit
anyone's real `profile.json` or `applications.csv` into a public copy of this repo.
