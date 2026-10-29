# cvgen

A small, dependency-free Node script that renders a clean, ATS-safe CV/resume PDF
from a user's `profile.json`, optionally tailored per role by a `variants.json`.
It never contains anyone's personal data itself - everything comes from the files
you pass in.

## Requirements

- Node.js (any reasonably recent version; no npm packages needed).
- A Chromium-based browser installed (Chrome or Edge) for headless PDF rendering.
  The script auto-detects common install locations on Windows/macOS/Linux. If it
  can't find one, set `AUTO_JOB_APPLIER_BROWSER` to the full executable path.

## Usage

```bash
node build.js <profile.json> <output-dir> [role-code | all] [variants.json]
```

- `profile.json` - required, see `../profile.schema.json` and `../profile.example.json`.
- `output-dir` - where the PDFs (and an `_html` folder with the rendered source, useful
  for debugging) are written.
- `role-code` - optional.
  - Omit it, or pass `default`, to build one CV straight from the profile's
    `default_title` / `default_summary` / all skills / all experience bullets.
  - Pass `all` to build one CV per entry in `variants.json`.
  - Pass a specific code (e.g. `BACKEND01`) to build just that one.
- `variants.json` - optional, defaults to a file named `variants.json` next to your
  `profile.json`. See `variants.example.json` for the format.

### Examples

```bash
# One honest CV straight from your profile, no tailoring
node build.js ./profile.json ./out

# One CV per role variant you've defined
node build.js ./profile.json ./out all ./variants.json

# Just the "BACKEND01" variant
node build.js ./profile.json ./out BACKEND01 ./variants.json
```

## Writing `variants.json`

Each key is a role code you choose (keep it short - it ends up in the output
filename and is what you'll reference later in your application log). Each value can
override:

- `title` - the CV headline for this role.
- `summary` - a 2-4 sentence professional summary tailored to this role. Write it
  from real experience; don't invent scope or metrics the profile doesn't support.
- `skills` - which skill group `id`s (from `profile.json`) to show, in order.
- `bullets` - for each employment entry's `id`, which bullet `id`s to show, in order.
  Entries you don't mention fall back to showing all of that job's bullets.
- `projects` - which project `id`s to show.
- `extra` - one short free-text line (e.g. "Available for contract or permanent
  roles", "Open to relocating to X").

See `variants.example.json` for a complete example.

## Why it's structured this way

Tailoring a CV per role is good practice. Tailoring it by *rewriting facts* - a
different "years of experience," a different seniority claim, invented metrics - is
what gets people auto-rejected once a recruiter notices every version tells a
slightly different story. This builder only ever *selects and reorders* real bullets
and skills already in `profile.json`; it has no mechanism for writing a bullet that
isn't there. If a role genuinely needs something the profile doesn't have, add it to
the profile truthfully (or don't apply to that role) rather than editing the output
HTML by hand.
