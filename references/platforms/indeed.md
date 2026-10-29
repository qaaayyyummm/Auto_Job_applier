# Indeed

## Cloudflare / sign-in checks

Indeed occasionally shows a Cloudflare "verify you are human" interstitial or asks
for sign-in before letting a job page or search result load, especially on a fresh
browser session. Never attempt the verification yourself (see
`../safety-and-boundaries.md`) - ask the user to sign in and/or clear the challenge
in the same browser tab, then continue once they confirm. Retrying the same
navigation a couple of times after a short wait sometimes resolves a transient
block on its own before you need to involve the user.

Job-search-API results (if your tooling has access to one, e.g. a structured job
search tool rather than browsing Indeed's own pages) can be a faster way to survey
listings, but double-check the live job page before applying - API-sourced company
names and details have been observed to not always match what's shown on the
actual listing (e.g. a staffing/property-management entity name in search metadata
versus the real hiring company's name on the job page itself).

## Smart Apply flow

Indeed's own apply flow ("Smart Apply") is typically multi-step:
resume-selection -> questions -> review -> post-apply confirmation.

- **Resume selection** defaults to a previously-used resume. Scroll to the resume
  section, use "Edit" / "Use a different resume," and upload the freshly built
  PDF via the real file input (see `generic-fallback.md`). After uploading,
  explicitly verify the new file's name or a unique marker from it appears in the
  page content before continuing - don't just assume the swap worked.
- **Questions** step covers the screening fields from
  `../salary-and-screening-questions.md` (expected/current salary, years of
  experience, nationality, notice period, etc.) - these vary a lot by employer.
  Read the actual field labels; don't assume they're in the same order as a
  previous application.
- **Review** step shows a resume preview before the real submit button. Confirm
  the preview shown is the role-specific CV, not a leftover from a previous
  application.
- Completion is usually a distinct confirmation page/title (e.g. "Your application
  has been submitted") - treat that as the signal the application actually went
  through, not just that you clicked a button.

## "Leave site?" / unsaved-changes dialogs

If you need to abandon a partially-filled application (e.g. it demands a document
only the user can provide, like a payslip - see `../safety-and-boundaries.md` on
`needs-user` cases), navigating away mid-form often triggers a "Leave site?"
confirmation, sometimes repeatedly. If it's genuinely stuck, open a fresh tab and
navigate there instead of fighting the dialog, and log that listing as
`needs-user` with a note on what's missing.
