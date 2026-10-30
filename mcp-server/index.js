#!/usr/bin/env node
// Auto Job Applier — MCP server
//
// Exposes the non-browser parts of the Auto Job Applier skill (profile
// handling, CV generation, job-fit filtering, platform knowledge, and
// application logging) as MCP tools, so any MCP-compatible agent — not
// just Claude — can drive the workflow. The agent still needs its own
// browser-automation tool to actually open job sites and submit
// applications; this server never touches a browser itself.
//
// This server is stateless and contains no personal data of its own.
// Every tool takes a path or payload the calling agent supplies.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { readFile, appendFile, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function readJsonFile(filePath) {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const server = new McpServer({
  name: "auto-job-applier",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Workflow instructions — the portable equivalent of SKILL.md for agents
// that don't natively support the Agent Skills format.
// ---------------------------------------------------------------------------

server.registerTool(
  "get_workflow_instructions",
  {
    title: "Get the Auto Job Applier workflow",
    description:
      "Returns the full step-by-step workflow this skill follows: build or load a profile, find matching roles, generate a tailored CV per role, apply using your own browser tool, and log results. Call this FIRST, before anything else, so you follow the same steps regardless of which agent or harness you're running in.",
    inputSchema: {},
  },
  async () => {
    const skillMd = await readFile(path.join(SKILL_ROOT, "SKILL.md"), "utf-8");
    return {
      content: [{ type: "text", text: skillMd }],
    };
  }
);

server.registerTool(
  "get_safety_rules",
  {
    title: "Get hard safety rules",
    description:
      "Returns the non-negotiable safety rules for this workflow (never solve a CAPTCHA, never type a password or create an account without asking, never invent a salary/experience number, verify file uploads before submit, pause before irreversible actions). Read this before applying anywhere.",
    inputSchema: {},
  },
  async () => {
    const text = await readFile(
      path.join(SKILL_ROOT, "references", "safety-and-boundaries.md"),
      "utf-8"
    );
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "get_platform_notes",
  {
    title: "Get platform-specific apply notes",
    description:
      "Returns known quirks and apply-flow notes for a specific job platform (linkedin, indeed, naukrigulf, bayt). For any other site, pass 'generic-fallback' to get the adaptive strategy for unknown sites and ATS portals (Greenhouse, Lever, Workday, Zoho Recruit, company careers pages).",
    inputSchema: {
      platform: z
        .enum(["linkedin", "indeed", "naukrigulf", "bayt", "generic-fallback"])
        .describe("Which platform's notes to fetch."),
    },
  },
  async ({ platform }) => {
    const filePath = path.join(
      SKILL_ROOT,
      "references",
      "platforms",
      `${platform}.md`
    );
    const text = await readFile(filePath, "utf-8");
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "get_cv_honesty_guidance",
  {
    title: "Get CV-honesty guidance",
    description:
      "Returns the guidance on why CVs must only select/reorder real profile facts, never invent claims or metrics, and how to keep seniority language consistent with actual years of experience.",
    inputSchema: {},
  },
  async () => {
    const text = await readFile(
      path.join(SKILL_ROOT, "references", "cv-honesty.md"),
      "utf-8"
    );
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "get_salary_and_screening_guidance",
  {
    title: "Get salary/screening-question guidance",
    description:
      "Returns guidance on handling salary expectation fields, years-of-experience fields, and other common screening questions without inventing numbers.",
    inputSchema: {},
  },
  async () => {
    const text = await readFile(
      path.join(SKILL_ROOT, "references", "salary-and-screening-questions.md"),
      "utf-8"
    );
    return { content: [{ type: "text", text }] };
  }
);

// ---------------------------------------------------------------------------
// Profile handling
// ---------------------------------------------------------------------------

server.registerTool(
  "get_profile_schema",
  {
    title: "Get the profile.json schema",
    description:
      "Returns the JSON Schema that a user's profile.json must satisfy (name, contact, years_experience, education, employment, skills, and optional fields like projects and salary_policy). Use this to validate a profile you build or to show the user what fields are needed.",
    inputSchema: {},
  },
  async () => {
    const schema = await readFile(
      path.join(SKILL_ROOT, "profile.schema.json"),
      "utf-8"
    );
    return { content: [{ type: "text", text: schema }] };
  }
);

server.registerTool(
  "load_profile",
  {
    title: "Load a user's profile.json",
    description:
      "Reads and returns the contents of the user's own profile.json from an absolute path. Never call this on anyone else's profile file, and never invent a path — ask the user where theirs lives if you don't already know.",
    inputSchema: {
      profile_path: z
        .string()
        .describe("Absolute path to the user's profile.json."),
    },
  },
  async ({ profile_path }) => {
    if (!(await fileExists(profile_path))) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `No file found at ${profile_path}. Ask the user for the correct path, or help them create one against profile.schema.json (see get_profile_schema).`,
          },
        ],
      };
    }
    const profile = await readJsonFile(profile_path);
    return {
      content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Job-fit filtering
// ---------------------------------------------------------------------------

server.registerTool(
  "check_job_fit",
  {
    title: "Check whether a listing fits the profile",
    description:
      "Decides whether a job listing is a genuine fit for the user's profile, using the same ~1-year-slack-on-the-low-end / no-slack-on-2x+-mismatch rule the skill uses everywhere. Call this on every listing BEFORE generating a CV or applying — don't apply to long shots, and don't silently skip something close.",
    inputSchema: {
      years_experience: z
        .number()
        .describe("The user's real years of experience, from profile.json."),
      listing_min_years: z
        .number()
        .optional()
        .describe("Minimum years of experience the listing asks for, if stated."),
      listing_max_years: z
        .number()
        .optional()
        .describe("Maximum years of experience the listing asks for, if stated."),
      missing_hard_requirements: z
        .array(z.string())
        .optional()
        .describe(
          "Any requirement the listing states that the profile plainly can't meet (a specific work authorization, a language, a credential). Leave empty if none."
        ),
    },
  },
  async ({
    years_experience,
    listing_min_years,
    listing_max_years,
    missing_hard_requirements,
  }) => {
    const reasons = [];
    let eligible = true;

    if (missing_hard_requirements && missing_hard_requirements.length > 0) {
      eligible = false;
      reasons.push(
        `Missing hard requirement(s): ${missing_hard_requirements.join(", ")}`
      );
    }

    if (typeof listing_min_years === "number") {
      const slack = 1;
      if (years_experience + slack < listing_min_years) {
        eligible = false;
        reasons.push(
          `Listing wants ${listing_min_years}+ years; profile has ${years_experience} (outside the 1-year slack).`
        );
      }
    }

    if (typeof listing_max_years === "number") {
      if (listing_min_years && listing_min_years >= years_experience * 2) {
        eligible = false;
        reasons.push(
          `Listing's minimum (${listing_min_years}) is 2x+ the profile's experience (${years_experience}); no slack applies here.`
        );
      }
    }

    const verdict = eligible ? "eligible" : "skip";
    const summary =
      reasons.length > 0
        ? `${verdict}: ${reasons.join(" ")}`
        : `${verdict}: no stated mismatch against the profile.`;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ verdict, eligible, reasons, summary }, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// CV generation (wraps cvgen/build.js)
// ---------------------------------------------------------------------------

server.registerTool(
  "generate_cv",
  {
    title: "Generate a tailored CV PDF",
    description:
      "Runs the CV builder against the user's profile.json (and an optional variants.json with per-role tailoring) to render a PDF. The role_code must already exist in variants.json, or be omitted/'default' to render the profile's default CV. This only selects and reorders real profile facts — it never invents content; write the variant yourself from the real job posting before calling this.",
    inputSchema: {
      profile_path: z.string().describe("Absolute path to the user's profile.json."),
      output_dir: z
        .string()
        .describe("Absolute path to a directory the PDF should be written into."),
      role_code: z
        .string()
        .optional()
        .describe(
          "The variant code to render from variants.json (e.g. 'BACKEND01'). Omit for the profile's default CV."
        ),
      variants_path: z
        .string()
        .optional()
        .describe("Absolute path to variants.json, if using a role_code."),
    },
  },
  async ({ profile_path, output_dir, role_code, variants_path }) => {
    const buildScript = path.join(SKILL_ROOT, "cvgen", "build.js");
    const args = [buildScript, profile_path, output_dir];
    if (role_code) args.push(role_code);
    if (variants_path) args.push(variants_path);

    return new Promise((resolve) => {
      execFile(process.execPath, args, (error, stdout, stderr) => {
        if (error) {
          resolve({
            isError: true,
            content: [
              {
                type: "text",
                text: `CV build failed:\n${stderr || error.message}`,
              },
            ],
          });
          return;
        }
        resolve({
          content: [
            {
              type: "text",
              text: stdout || "CV generated successfully.",
            },
          ],
        });
      });
    });
  }
);

// ---------------------------------------------------------------------------
// Application logging
// ---------------------------------------------------------------------------

const CSV_HEADER = "date,platform,company,role,cv_file,status,notes\n";

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

server.registerTool(
  "log_application",
  {
    title: "Log an application outcome",
    description:
      "Appends one row to the user's applications.csv (creating it with the header if it doesn't exist yet). Call this after every apply attempt — applied, skipped, or needs-user — so the campaign has an audit trail.",
    inputSchema: {
      csv_path: z
        .string()
        .describe("Absolute path to applications.csv in the user's own project directory."),
      date: z.string().describe("ISO date (YYYY-MM-DD) of the attempt."),
      platform: z.string().describe("e.g. linkedin, indeed, naukrigulf, bayt."),
      company: z.string(),
      role: z.string(),
      cv_file: z.string().describe("Filename or path of the CV used, or blank if none."),
      status: z.enum(["applied", "skipped", "needs-user"]),
      notes: z.string().describe("Why it was skipped/needs-user, or any detail worth keeping."),
    },
  },
  async ({ csv_path, date, platform, company, role, cv_file, status, notes }) => {
    const needsHeader = !(await fileExists(csv_path));
    const row =
      [date, platform, company, role, cv_file, status, notes]
        .map(csvEscape)
        .join(",") + "\n";
    await appendFile(csv_path, (needsHeader ? CSV_HEADER : "") + row, "utf-8");
    return {
      content: [
        { type: "text", text: `Logged: ${status} — ${role} at ${company} (${platform}).` },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
