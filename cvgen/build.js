#!/usr/bin/env node
// Auto Job Applier - CV builder.
// Renders one clean, ATS-safe PDF per role from a user's own profile.json,
// optionally tailored per role by variants.json. No data in this file is
// specific to any one person - everything comes from the files you pass in.
//
// Usage:
//   node build.js <profile.json> <output-dir> [role-code | all] [variants.json]
//
// - role-code omitted or "default": builds one CV straight from profile.json's
//   default_title/default_summary/all skills/all bullets.
// - role-code "all": builds one CV per entry in variants.json.
// - role-code "<CODE>": builds just that entry from variants.json.
// - variants.json path defaults to <output-dir's sibling>/variants.json if not given,
//   falling back to none (role-code is then ignored and the profile defaults are used).

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function fail(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

const [, , profilePath, outDir, roleArg, variantsArgPath] = process.argv;
if (!profilePath || !outDir) {
  fail('Usage: node build.js <profile.json> <output-dir> [role-code | all] [variants.json]');
}
if (!fs.existsSync(profilePath)) fail(`profile not found: ${profilePath}`);

const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
for (const req of ['name', 'contact', 'default_title', 'education', 'employment', 'skills']) {
  if (!profile[req]) fail(`profile.json is missing required field "${req}" - see profile.schema.json`);
}

const variantsPath = variantsArgPath || path.join(path.dirname(profilePath), 'variants.json');
const variants = fs.existsSync(variantsPath) ? JSON.parse(fs.readFileSync(variantsPath, 'utf8')) : null;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function skillsById() {
  const map = {};
  for (const s of profile.skills) map[s.id] = s;
  return map;
}
function employmentById() {
  const map = {};
  for (const e of profile.employment) map[e.id] = e;
  return map;
}
function projectsById() {
  const map = {};
  for (const p of profile.projects || []) map[p.id] = p;
  return map;
}

function resolveVariant(code) {
  if (!code || code === 'default' || !variants) {
    return {
      code: 'default',
      title: profile.default_title,
      summary: profile.default_summary || '',
      skills: profile.skills.map((s) => s.id),
      bullets: Object.fromEntries(profile.employment.map((e) => [e.id, e.bullets.map((b) => b.id)])),
      projects: (profile.projects || []).map((p) => p.id),
      extra: '',
    };
  }
  const v = variants[code];
  if (!v) fail(`role code "${code}" not found in ${variantsPath}. Available: ${Object.keys(variants).join(', ')}`);
  return { code, ...v };
}

function renderHtml(v) {
  const sByI = skillsById();
  const eByI = employmentById();
  const pByI = projectsById();

  const skillsHtml = (v.skills || []).map((id) => {
    const s = sByI[id];
    if (!s) return '';
    return `<li><b>${esc(s.label)}:</b> ${esc(s.items)}</li>`;
  }).join('');

  const experienceHtml = profile.employment.map((e) => {
    const picked = (v.bullets && v.bullets[e.id]) || e.bullets.map((b) => b.id);
    const bulletMap = Object.fromEntries(e.bullets.map((b) => [b.id, b.text]));
    const lis = picked.map((bid) => bulletMap[bid] ? `<li>${esc(bulletMap[bid])}</li>` : '').join('');
    if (!lis) return '';
    return `<div class="role"><span>${esc(e.title)} - ${esc(e.employer)}${e.location ? ', ' + esc(e.location) : ''}</span><span>${esc(e.start)} - ${esc(e.end || 'Present')}</span></div><ul>${lis}</ul>`;
  }).join('');

  const projectsHtml = (v.projects || []).map((id) => {
    const p = pByI[id];
    if (!p) return '';
    return `<li><b>${esc(p.name)}:</b> ${esc(p.description)}</li>`;
  }).join('');

  const educationHtml = profile.education.map((ed) =>
    `<p><b>${esc(ed.degree)}${ed.field ? ' ' + esc(ed.field) : ''}</b> - ${esc(ed.institution)}${ed.start_year ? ` (${esc(ed.start_year)} - ${esc(ed.end_year || '')})` : ''}</p>`
  ).join('');

  const contact = profile.contact;
  const contactLine = [
    contact.location,
    contact.phone,
    contact.email,
    contact.work_authorization,
    contact.availability,
  ].filter(Boolean).map(esc).join(' | ');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(profile.name)} - CV</title><style>
@page{size:A4;margin:14mm 15mm}
body{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:10.3pt;color:#111;line-height:1.32}
h1{font-size:22pt;margin:0;letter-spacing:.5px}
.t{font-weight:700;font-size:10.8pt;margin:2px 0}
.c{color:#333;font-size:9.8pt}
h2{font-size:11.5pt;border-bottom:1.2px solid #222;margin:11px 0 5px;padding-bottom:2px;text-transform:uppercase;letter-spacing:.4px}
ul{margin:3px 0 0 16px;padding:0}li{margin:0 0 3px}
.role{display:flex;justify-content:space-between;font-weight:700;margin-top:4px}
p{margin:3px 0}
</style></head><body>
<h1>${esc(profile.name).toUpperCase()}</h1>
<div class="t">${esc(v.title)}</div>
<div class="c">${contactLine}</div>
${v.summary ? `<h2>Professional Summary</h2><p>${esc(v.summary)}</p>` : ''}
${skillsHtml ? `<h2>Core Skills</h2><ul>${skillsHtml}</ul>` : ''}
<h2>Professional Experience</h2>
${experienceHtml}
${projectsHtml ? `<h2>Selected Projects</h2><ul>${projectsHtml}</ul>` : ''}
<h2>Education</h2>
${educationHtml}
${(v.extra || profile.additional) ? `<h2>Additional</h2><p>${[v.extra, profile.additional].filter(Boolean).map(esc).join(' | ')}</p>` : ''}
</body></html>`;
}

function findBrowser() {
  if (process.env.AUTO_JOB_APPLIER_BROWSER && fs.existsSync(process.env.AUTO_JOB_APPLIER_BROWSER)) {
    return process.env.AUTO_JOB_APPLIER_BROWSER;
  }
  const candidates = process.platform === 'win32' ? [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ] : process.platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ] : [
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/microsoft-edge',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  fail(
    'Could not find a Chrome/Edge binary to render PDFs. Set AUTO_JOB_APPLIER_BROWSER to the full path of a ' +
    'Chromium-based browser executable, e.g.:\n  AUTO_JOB_APPLIER_BROWSER=/usr/bin/google-chrome node build.js ...'
  );
}

function htmlToPdf(browser, htmlPath, pdfPath) {
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  const userDataDir = path.join(os.tmpdir(), 'auto-job-applier-pdf-profile');
  execFileSync(browser, [
    '--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--user-data-dir=${userDataDir}`,
    `--print-to-pdf=${pdfPath}`,
    'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
  // Edge/Chrome hand off PDF writing to a child process; wait for the file to
  // stop growing instead of assuming it's done when the command returns.
  let last = -1;
  for (let i = 0; i < 40; i++) {
    const size = fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : -1;
    if (size > 0 && size === last) break;
    last = size;
    const start = Date.now();
    while (Date.now() - start < 500) { /* busy-wait briefly, cross-platform */ }
  }
}

fs.mkdirSync(outDir, { recursive: true });
const htmlDir = path.join(outDir, '_html');
fs.mkdirSync(htmlDir, { recursive: true });
const browser = findBrowser();

const codes = roleArg === 'all' && variants ? Object.keys(variants) : [roleArg || 'default'];
const safeName = profile.name.replace(/[^a-zA-Z0-9]+/g, '_');

for (const code of codes) {
  const v = resolveVariant(code);
  const html = renderHtml(v);
  const htmlPath = path.join(htmlDir, `${v.code}.html`);
  fs.writeFileSync(htmlPath, html);
  const pdfPath = path.join(outDir, `${safeName}_CV_${v.code}.pdf`);
  htmlToPdf(browser, htmlPath, pdfPath);
  console.log(`${v.code}: ${fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size + ' bytes -> ' + pdfPath : 'FAILED'}`);
}
