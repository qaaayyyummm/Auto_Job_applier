# Generic fallback: any site without a dedicated reference file

New job boards, applicant-tracking-system portals (Zoho Recruit, Greenhouse, Lever,
Workday, SmartRecruiters, iCIMS...), and individual companies' own careers pages
all vary in markup, but they're built out of the same handful of patterns. This is
the adaptive strategy: read the live page rather than assume a fixed flow, and
write down what you learn once you've worked a site out (see "Capture what you
learn" below).

## 1. Find the real apply action

Look for a button or link whose text is some form of "Apply." It usually does one
of three things:

- Opens an in-page form (single page or multi-step modal/wizard).
- Navigates to the ATS's own apply page (a different domain - Zoho Recruit,
  Greenhouse, Lever, Workday, etc. are common).
- Links out to "Apply with LinkedIn" / "Apply with Indeed" - if the user is already
  signed into that platform, this is often the fastest path and pre-fills from
  their existing profile there.

Read the resulting page before doing anything else. Don't assume field order or
count from a similar site you've seen before; forms genuinely differ even within
the same ATS vendor depending on how the employer configured it.

## 2. Resume upload: find the real file input, not the styled button

A styled "Upload your resume" button almost always wraps a hidden
`<input type="file">` and clicking it opens the browser's native OS file picker,
which an agent can't see or drive. Don't click it expecting to "continue" from
there. Instead:

1. Locate the hidden input (most tools that read the accessibility tree or DOM can
   find `input[type=file]` even when it's visually hidden).
2. If your tooling needs a human-readable handle to target it (e.g. a find-by-label
   tool), you can set a distinctive `aria-label` on the input via a small script
   injection, then search for that label - this is a legitimate way to make an
   invisible-but-real element addressable, as opposed to interacting with something
   that only *looks* like the control.
3. Upload the CV file directly to that input. Most sites then show a parsed-fields
   preview or confirmation - check it rather than assuming the upload worked.

Some forms have an "autofill from resume" step that parses the PDF into form
fields automatically. Let it run, then review the parsed fields against
`profile.json` before moving on - parsers occasionally misread a field (wrong
company boundary, truncated bullet) and it's faster to fix now than after submit.

## 3. Multi-step flows: don't assume one submit click finishes it

Many ATS flows are several screens: contact info -> resume -> screening questions
-> review -> submit. After each "Continue"/"Next," re-read the page before acting -
some flows render the next step without a URL or title change you'd notice from
history alone, and some insert conditional steps (e.g. a visa-sponsorship question
that only appears because the job's location differs from the account's) you won't
see coming from a previous run at the same site.

## 4. Watch for a stale/default resume

If the account has applied elsewhere on the same platform before, the resume
picker often defaults to whatever was used last, not the one you just generated
for this role. Before the final submit, re-read the review page and confirm the
filename or preview shown matches the CV you built for *this* role - swap it if
not, using the same file-input technique as above.

## 5. Screening questions

Map these to `profile.json` and `references/salary-and-screening-questions.md`
rather than typing something plausible. If a question is genuinely novel (not
salary, not years-of-experience, not visa/location) and the profile has nothing
relevant, ask the user rather than guess - a wrong answer to an unusual screening
question (e.g. a compliance attestation, a specific certification claim) can sink
an otherwise-good application or create a real liability for the person.

## 6. CAPTCHAs, logins, payments

All covered in `../safety-and-boundaries.md` - the short version is: don't solve
CAPTCHAs, don't type passwords, don't pay anything, stop and ask the user when you
hit any of these instead of working around them.

## Capture what you learn

Once you've successfully worked out a site's quirks - its apply-button pattern,
whether it's single-page or multi-step, how it handles resume swaps, any unusual
required fields it always asks - write a new file at
`references/platforms/<site-name>.md` using the existing platform files as a
template. That turns one successful run into something the next run (by you, by
the user, or by anyone else using this skill on that site) doesn't have to
rediscover from scratch. This is the main way the skill is meant to grow over
time - contribute the new reference file back if you're working from a shared
copy of this skill (e.g. a GitHub fork).
