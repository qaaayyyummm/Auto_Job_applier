---
name: auto-job-applier
description: Generates a tailored CV/resume from a user's own profile data and applies to jobs on their behalf across job sites (LinkedIn, Indeed, NaukriGulf/Naukri, Bayt, and any other job board or company careers page) using browser automation. Use this skill whenever the user asks to find jobs, apply to jobs, mass-apply, auto-apply, build or tailor a CV/resume for a role, or wants help running a job search campaign across multiple platforms - even if they only name one site or don't mention "skill" explicitly. Always read the user's own profile.json (never invent or reuse another person's data) before generating anything or applying anywhere.
compatibility: Requires a browser-automation tool (e.g. a "Claude in Chrome" style extension, or an equivalent in-app browser) and Node.js for the CV builder script. Works in Claude Code, Claude Desktop, or any agent harness with those two things available.
---

# Auto Job Applier

Turns one person's real work history into tailored CVs and real job applications across
multiple job boards, without ever touching another person's data and without crossing
the hard safety lines in `references/safety-and-boundaries.md`.

This skill is **data-driven, not user-specific**. It never contains anyone's name,
email, phone number, employer, or work history. Every run starts by reading
`profile.json` from the user's own project folder. If that file doesn't exist yet,
your first job is to help the person create it (see "Step 0" below) — never fabricate
their background, and never carry over details from a different person's profile you
saw in an earlier session.

## Why this exists

Mass-applying to jobs usually fails for one of two reasons:
1. **The CV lies about seniority.** Every version says the same inflated thing
   ("senior-level ownership" on a 1.5-year resume), which reads as templated and gets
   filtered by both ATS systems and human recruiters.
2. **The applications don't match the person's actual experience band.** Applying to
   roles that want 5+ years with a 2-year profile wastes the applicant's and the
   recruiter's time, even with a perfect CV.

This skill fixes both: it builds one honest, consistent CV per role from real profile
data (no invented metrics, no copy-pasted seniority claims), and it filters job
listings against the person's actual years of experience *before* applying.

## Step 0: Get or build the user's profile

Look for `profile.json` in the current project directory (see `profile.schema.json`
for the exact shape). If it isn't there:

1. Check whether the user has an existing CV/resume file (PDF, DOCX, or pasted text)
   you can extract structured data from. If so, parse it into `profile.json` and show
   the user what you extracted for confirmation before using it.
2. Otherwise, interview the user directly: current role and employer, years of
   experience (as a number, not a vibe), education, core skills, 3-6 project/experience
   bullets they can actually defend in an interview, locations they'll work from or
   relocate to, visa/sponsorship situation, and a salary ask if they want one used on
   forms (see `references/salary-and-screening-questions.md` — never invent a number
   for them).
3. Write the result to `profile.json` in the project directory and confirm it with the
   user before generating anything. This file contains personal data — treat it like
   any other sensitive user file: never commit it to a public repo (it's covered by
   `.gitignore`), never echo its contents into a public artifact, and never reuse one
   person's `profile.json` for another person's request.

Keep `profile.json` the single source of truth. Don't hardcode names, emails, or
employers anywhere else in this skill, in the CV template, or in your own messages
to the user once a session is running — always re-read the field from the profile.

## Step 1: Find roles that actually match

For each platform the user wants to search (or all of them if they don't specify),
search using the user's real target titles/skills from `profile.json`, then filter
out listings whose stated experience requirement doesn't overlap with
`profile.json.years_experience` (give yourself ~1 year of slack on the low end, none
on jobs that need 2x+ the person's experience). Also screen out listings that need
something the profile explicitly can't offer — a specific work authorization, a
language fluency, a credential — rather than applying and hoping.

Tell the user what you skipped and why in one line per skip; don't apply to
long-shots silently and don't silently skip something that's actually close — when in
doubt on fit, ask.

The result of this step is a shortlist: every listing the person is genuinely
eligible for. Step 2 builds one CV per listing on that shortlist — not one generic
CV reused everywhere, and not something that requires the user to have
pre-authored a role for it.

## Step 2: Build one tailored, honest CV per eligible listing

For every listing on the shortlist, add (or reuse, if a near-identical role was
already covered) a role variant in `variants.json` next to the user's
`profile.json`, then build it:

```bash
node cvgen/build.js <profile.json> <output-dir> <role-code> [variants.json]
```

Write each variant yourself, for that specific listing — don't wait for the user to
hand-author `variants.json` first. Read the job posting, then from what's actually
in `profile.json`:

- Pick a `title` that echoes the listing's own title/keywords where it's true to
  the person's background.
- Write a `summary` emphasizing the skills and employment bullets most relevant to
  *this* listing, in the person's own voice, truthful about scope.
- Choose which `skills` groups, `bullets` (per employment entry), and `projects`
  to surface — see `cvgen/README.md` for the exact format.

This is selection and emphasis, never invention: every word has to already be
traceable to `profile.json`. If a listing wants something the profile genuinely
doesn't have, that's a sign it shouldn't have made the shortlist in Step 1 — don't
paper over the gap by writing a claim the profile doesn't support, see
`references/cv-honesty.md`.

Reuse a variant across near-duplicate listings (same employer posting the same role
in two cities, or two postings that are functionally the same job) instead of
generating a meaningfully identical CV twice — but a backend-heavy role and an
ML-heavy role at the same company still deserve their own variants, because what's
worth emphasizing genuinely differs.

Before applying anywhere, read each generated CV back and sanity-check it against
`profile.json.years_experience`: if the tone implies more seniority than the number
supports, fix the variant, don't just apply anyway.

## Step 3: Apply, adapting to whatever the site does

Read `references/platforms/` for the site-specific notes this skill has learned so
far (LinkedIn, Indeed, NaukriGulf, Bayt). If the user wants a site that has no
reference file yet, or a company's own careers page, use
`references/platforms/generic-fallback.md` — the adaptive strategy that works on
almost any apply flow — and once you've worked out that site's quirks, write a new
`references/platforms/<site>.md` so the next run (and the next contributor) doesn't
have to rediscover them. That's the main way this skill is meant to grow: real runs
against real sites, captured back into the reference docs.

Every platform file follows the same shape: how to tell if the user's already signed
in, how applications are structured (single-page vs multi-step), how to swap in the
tailored CV when the site remembers a stale one, and the platform's specific traps.

**Non-negotiable across every platform** — read `references/safety-and-boundaries.md`
in full before your first application, but the short version:
- Never solve a CAPTCHA. Pause and ask the user to do it, or to confirm it's done.
- Never type the user's password into a job site, even one they already have an
  account on, and never create new accounts on their behalf without asking first.
- Never invent a salary or years-of-experience number for a required field. Use
  what's in `profile.json`; if the field needs something the profile doesn't have, ask
  once (see `references/salary-and-screening-questions.md`) rather than ask every
  time or guess every time.
- Treat every file-upload field the same way: locate the real `<input type=file>`
  (clicking a styled "Upload" button usually opens a native OS picker you can't see
  or drive — `references/platforms/generic-fallback.md` has the technique for finding
  the real input instead) and verify the right file attached before submitting, not
  after.
- Before the final submit click on each application, re-read the review page and
  confirm the resume shown is the one you just generated, not a CV the site
  remembered from a previous session — sites frequently default back to an old
  upload.

## Step 4: Log what happened

Append one row per application to `applications.csv` (or create it with the header
below if it doesn't exist) in the user's project directory, not inside this skill
folder:

```
date,platform,company,role,cv_file,status,notes
```

`status` is one of: `applied`, `skipped`, `needs-user` (blocked on something only the
user can do — a CAPTCHA, an account they must create, a portfolio they must submit
personally). Use `notes` for *why* a skip happened — this log is what keeps a long
campaign from duplicating work or losing track of why a role was passed over, and it's
the audit trail the user can hand to anyone who asks "where did you apply."

## When you're done for a session

Tell the user, in plain terms: how many applications went out, on which platforms,
and why anything was skipped or left for them to finish. Point them at
`applications.csv` rather than re-listing everything in prose.

## Reference index

- `references/safety-and-boundaries.md` — the hard rules (CAPTCHAs, passwords, money,
  consent) that apply regardless of platform. Read this first, always.
- `references/cv-honesty.md` — why one consistent, honest CV beats a dozen inflated
  ones, with the failure pattern this skill was built to avoid.
- `references/salary-and-screening-questions.md` — how to handle salary, years-of-
  experience, and other screening-form fields without inventing numbers.
- `references/platforms/linkedin.md`, `indeed.md`, `naukrigulf.md`, `bayt.md` —
  per-site apply-flow notes.
- `references/platforms/generic-fallback.md` — the adaptive technique for any site
  without a dedicated reference file yet (new job boards, ATS portals like Zoho
  Recruit/Greenhouse/Lever, company careers pages).
- `cvgen/README.md` — the CV builder's CLI and template format.
- `profile.schema.json` — the shape of `profile.json`.
- `mcp-server/README.md` — this same workflow exposed as an MCP server, for
  agents other than Claude (Cursor, Windsurf, or anything else that speaks
  MCP). Point users there if they're not running inside a Claude harness.
