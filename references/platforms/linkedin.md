# LinkedIn

## Search

LinkedIn's job search URL and filter UI change parameters fairly often; setting a
location via a raw query-string parameter can silently get ignored or snap back to
the account's default location. The reliable way: use the on-page location filter
box (click it, select from its suggestion list - typing and pressing Enter can
submit a different value than clicking the matching suggestion does), rather than
trusting a hand-built URL.

Treat LinkedIn's own "match" indicators (e.g. a line saying a profile matches the
listed qualifications well or poorly) as a useful second opinion, not a
replacement for checking the actual years-of-experience requirement yourself
against `profile.json.years_experience`.

## Easy Apply

Easy Apply is a modal with a progress bar, usually: contact info -> resume ->
(optional) screening questions -> review -> submit. A few things worth knowing:

- Contact info is often pre-filled correctly from the account; still confirm it
  before continuing.
- The resume-selection step defaults to whichever resume was used most recently on
  the account, not the one you just built for this role. Use "Upload a different
  resume" (or equivalent) and upload the freshly generated PDF - see
  `generic-fallback.md` for locating the real file input if the upload button opens
  a native picker.
- **Do not close the modal with Escape or a stray click once you've started
  uploading a file mid-flow.** LinkedIn will offer to "Save this application" - if
  you accidentally trigger that dialog, saving discards any file you were mid-way
  through uploading (the dialog says so explicitly: uploaded files aren't kept on
  save). If that happens, choose Save, then reopen the saved application from the
  job listing ("Continue" button) and redo the upload cleanly from the resume step.
- After the final review screen, confirm the resume preview shown is the correct
  one before clicking Submit - easy to lose track of which file is selected across
  a multi-step modal.

## Non-Easy-Apply listings ("Apply" that leaves LinkedIn)

These redirect to the employer's own site or ATS. Treat them as a fresh platform -
fall back to `generic-fallback.md` once you land on the external page.

## Billing/account banners

LinkedIn sometimes shows an account-level banner (e.g. a payment/subscription
problem) unrelated to job search. Don't act on it - mention it to the user once so
they can handle it themselves, and don't let it block the task at hand.
