# NaukriGulf / Naukri

## Search

The site's SEO-friendly "pretty URLs" (e.g. `/<keyword>-jobs-in-<location>`) can
return surprisingly broad or stale results that don't match the keyword closely -
use the on-page search box (keyword + location + "work experience in years" field,
if present) instead of guessing a URL, and check the actual result count/listing
titles rather than trusting the URL slug alone. The "work experience" field in
search can tighten results to a usable band when the keyword alone pulls in a very
broad "engineer" match across unrelated disciplines.

An "Experience" filter chip on the results page (e.g. "2 - 5 years") is a solid
quick way to cut out listings well above the profile's real experience band -
prefer clicking it over re-typing a search.

## Easy Apply

Where a listing has an "Easy Apply" badge, it applies using whatever CV is
currently attached to the account's Naukri profile - it does **not** let you pick
a per-job CV at apply time the way LinkedIn or Indeed's flows do. That means:

1. Before running a batch of Easy Apply applications for a given role, update the
   profile's attached CV (profile -> CV/resume section -> replace/update) to the
   CV built for that role.
2. If you're applying to meaningfully different role types in the same session
   (e.g. backend vs. data engineering), update the attached CV again between
   batches rather than applying everything under one CV.
3. Easy Apply itself is then typically a single click with an instant confirmation
   - there's no separate per-application resume-review step to double check, so
   getting the profile CV right beforehand matters more here than on other
   platforms.

## Profile completeness nudges

The account dashboard frequently shows a "profile completion %" with suggested
missing fields (photo, personal details, IT skills, etc.). These aren't required to
apply and don't need to be filled in on the user's behalf unless they ask - don't
spend time chasing 100% completion as part of a job-application task.

## External/non-Easy-Apply listings

Some listings require "proof of work" (e.g. a portfolio, GitHub links, a personal
explanation of projects) as a mandatory part of the application. These can't be
completed honestly on the user's behalf - log them as `needs-user` rather than
fabricating a portfolio or writing in the first person as if you were the user.
