# Salary and screening-question fields

Job application forms love required fields that don't map cleanly onto a CV:
expected salary, current salary, total years of experience, years of experience in
one specific technology, notice period, nationality, current residence. Handle all
of them the same way: pull from `profile.json` if it's there, ask once if it isn't,
never invent.

## Salary fields

Check `profile.json.salary_policy`:

- If `volunteer_in_outreach` is `false` or absent, never put a salary figure into an
  email, cover letter, or free-text field voluntarily - only use one when a
  platform's own required form field demands it.
- When a required field does demand a number, use the entry from `by_market` whose
  label best matches the role (remote vs local, which country/region) if the
  profile defines one.
- If `salary_policy` is missing entirely, or no `by_market` entry fits, ask the user
  once what figure to use for that market, then treat their answer as reusable for
  the rest of that session's applications in the same market - don't ask again for
  every listing.

## "Total years of experience" vs. "years of experience in X"

These are genuinely different questions and conflating them is how inconsistent
CVs happen in the first place:

- **Total years of experience**: use `profile.json.years_experience` directly.
- **Years of experience in a specific skill/language**: if the profile has a
  skill-specific number recorded somewhere (e.g. in a skill's `items` text or a
  note the user gave you), use that. If it doesn't, and the honest answer is "I've
  used this since before my first job, informally" - that's a real, common case
  (e.g. someone coding in a language for years before going professional) - ask the
  user directly what number they're comfortable stating, and keep using that same
  answer for the rest of the session rather than re-deriving it each time. Don't
  default to just repeating `years_experience` for every skill; that's its own kind
  of inconsistency.

## Work authorization / visa / nationality / current residence

Pull directly from `profile.json.contact.work_authorization` and `.location`. If a
form asks something more specific than the profile captures (a particular visa
sponsorship question, a nationality field), answer truthfully from what you know
and ask the user to fill in anything you're not certain of rather than guessing -
these are legal-attestation-adjacent fields, not stylistic ones.

## General rule

Once you've asked the user for an answer to a recurring screening-question type in
a session, remember it for the rest of that session instead of asking again on the
next application - but don't carry it across sessions or across different people's
profiles. If in doubt whether a number has changed (a new salary target, a work
authorization that's since resolved), ask again rather than assume.
