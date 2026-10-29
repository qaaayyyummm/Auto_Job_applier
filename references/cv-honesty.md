# Why the CV has to stay honest

This skill exists because of a specific, observed failure pattern: someone applied
to ~30 jobs with a dozen different "tailored" CVs and got zero interviews. The CVs
weren't badly written - they were competently written, and that was the problem.
Every single variant repeated the same boilerplate seniority claim ("About 2 years
in industry... with senior-level ownership" / "ownership usually given to senior
engineers"), copy-pasted across every version with only the job title swapped. That
reads as templated or AI-generated to anyone who's screened resumes before, and it's
also a real overclaim: the actual experience was well under two years full-time.

Two separate things were going wrong at once, and both matter:

1. **The wording didn't match the number.** Claiming "senior-level ownership" on a
   profile with 1.5 years of full-time experience isn't a style problem, it's a
   credibility problem - it invites exactly the scrutiny it's trying to avoid.
2. **Many of the applications were to roles the person didn't qualify for on paper**
   (4-7+ years required), regardless of how the CV was worded. No amount of good
   writing fixes an experience-years mismatch; it gets filtered by ATS systems or a
   recruiter in seconds either way.

## What this skill does instead

- `cvgen/build.js` only ever *selects and reorders* bullets and skills that already
  exist in `profile.json` - it has no path for writing a claim, a metric, or a
  scope statement that isn't already there. If a role variant's summary wants to
  say something the profile doesn't support, that's a sign to either add it to the
  profile honestly (because it's true and you forgot to include it) or not apply to
  that role.
- The skill filters job listings against `profile.json.years_experience` *before*
  applying (see `SKILL.md` Step 2), so good CVs go to roles they actually have a
  shot at, instead of papering over a mismatch with confident-sounding language.
- Skills sections render as plain bulleted lists, not HTML tables - some ATS
  parsers scramble table content when extracting text, which can silently break
  keyword matching even on an honest, well-written CV.

## When you're drafting `default_summary` or a variant's `summary`

Write it the way the person would defend it in an interview, not the way that
sounds most impressive on a skim. A specific, modest, accurate sentence about what
someone actually built beats a vague, confident one about ownership and scope they
can't back up when asked a follow-up question. If you're ever unsure whether a line
in the profile supports a claim you want to put in a summary, leave the claim out
and ask the user whether it's true and whether they want to add it.
