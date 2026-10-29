# Bayt

## Sign-in

Bayt frequently requires sign-in even to start an apply flow, and its "Continue
with Google" OAuth button can open a popup window that isn't trackable by browser-
automation tooling scoped to a specific tab group. If sign-in doesn't visibly
complete after clicking a provider button, don't assume it silently worked - ask
the user to sign in manually in the same browser, then re-check (e.g. by
navigating to the job page again and confirming the header shows a signed-in state
like "Dashboard" / "My Profile" instead of "Log In").

## "Apply on company site" / external redirect

Many Bayt listings are "Apply on company site," not a native Bayt apply form. The
flow is typically:

1. Bayt shows an interstitial ("You're about to leave Bayt") with a CV selector
   tied to the Bayt profile and a "Download CV and apply" / "Skip CV download and
   apply" choice. Skip the download - it's not needed if you can upload the
   role-specific CV directly on the destination site.
2. You land on the employer's actual ATS (commonly Zoho Recruit, but any vendor is
   possible). From there, treat it as a fresh platform and follow
   `generic-fallback.md`.
3. These external ATS forms often have an "autofill from resume" step: upload the
   generated CV to the real file input, let it parse, then review the parsed
   fields against `profile.json` before submitting.
4. A CAPTCHA at the final submit step is common on these external ATS forms - per
   `../safety-and-boundaries.md`, stop and ask the user to solve it, then submit
   once they confirm.

## Native Bayt apply (where available)

Some listings do have a native in-Bayt apply flow instead of (or in addition to)
"Apply on company site." Where present, it behaves like most single-page ATS forms
- see `generic-fallback.md`.
