/**
 * Resume content is written in English for every locale; only the page chrome
 * around it (`resume.*` messages) is translated.
 */
export const RESUME_NAME = "Woonggi Min";
/** Shown beside the romanized name on the Korean page only. */
export const RESUME_NATIVE_NAME = "민웅기";
export const RESUME_SUMMARY =
  "Software engineer building AI inference infrastructure and tooling for coding agents.";
export const RESUME_PRESENT = "Present";

/**
 * Calendar months as `YYYY-MM`. Without an `end` only the month is shown (when
 * a project started, or a contribution merged); `"present"` marks a current job.
 */
export interface ResumePeriod {
  end?: string;
  start: string;
}

export interface ResumeEntry {
  /** One line under the name: role, place, or what the work was. */
  detail?: string;
  /** External page the entry links to; omitted when there is nothing public. */
  href?: string;
  name: string;
  /** Page on this site, used instead of `href`. */
  path?: "/products/maru60";
  period: ResumePeriod;
}

interface ResumeSection {
  /** Newest first. */
  entries: readonly ResumeEntry[];
  /** Also the `resume-<key>` test id and heading id. */
  key: string;
  label: string;
}

/** Display order on `/resume`. */
export const RESUME_SECTIONS: readonly ResumeSection[] = [
  {
    entries: [
      {
        detail: "Software Engineer",
        href: "https://emdash.com",
        name: "Emdash",
        period: { end: "present", start: "2026-11" },
      },
      {
        detail: "Software Engineer",
        name: "Stealth Startup",
        period: { end: "2026-09", start: "2026-04" },
      },
      {
        detail: "Software Engineer",
        href: "https://friendli.ai",
        name: "FriendliAI",
        period: { end: "2026-04", start: "2023-09" },
      },
    ],
    key: "work",
    label: "Work",
  },
  {
    entries: [
      {
        detail: "3D-printable HHKB keyboard case with a built-in wrist rest",
        name: "Maru60",
        path: "/products/maru60",
        period: { start: "2026-10" },
      },
      {
        detail:
          "Multi-account gateway with OpenAI- and Anthropic-compatible APIs",
        href: "https://github.com/minpeter/kiro-lb",
        name: "kiro-lb",
        period: { start: "2026-07" },
      },
      {
        detail: "Agent runtime for threads, the model loop, hooks and storage",
        href: "https://github.com/minpeter/pss-runtime",
        name: "pss-runtime",
        period: { start: "2026-05" },
      },
      {
        detail: "Tool calling for models without native function calling",
        href: "https://github.com/minpeter/ai-sdk-tool-call-middleware",
        name: "ai-sdk-tool-call-middleware",
        period: { start: "2025-04" },
      },
    ],
    key: "projects",
    label: "Projects",
  },
  {
    entries: [
      {
        detail: "Hashline edit tool hardening and Senpi integration fixes",
        href: "https://github.com/code-yeongyu/oh-my-openagent/pulls?q=is%3Apr+author%3Aminpeter+is%3Amerged",
        name: "oh-my-openagent",
        period: { end: "2026-09", start: "2026-02" },
      },
      {
        detail: "Hermes tool-call parser for models without special tokens",
        href: "https://github.com/vllm-project/vllm/pull/16890",
        name: "vLLM",
        period: { start: "2025-08" },
      },
      {
        detail: "FriendliAI provider and tool-call middleware docs",
        href: "https://github.com/vercel/ai/pulls?q=is%3Apr+author%3Aminpeter+is%3Amerged",
        name: "Vercel AI SDK",
        period: { end: "2025-04", start: "2024-09" },
      },
    ],
    key: "open-source",
    label: "Open Source",
  },
  {
    entries: [
      {
        detail: "Hacking Security",
        name: "Hansei Cyber Security High School",
        period: { end: "2024-02", start: "2021-03" },
      },
    ],
    key: "education",
    label: "Education",
  },
];
