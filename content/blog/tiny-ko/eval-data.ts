import raw from "./eval-results.json";

// Numbers come from ulwulw-evidence/tiny-ko-eval/ raw results (2026-07-22 CPU fp32 runs).
// Regenerate from those results; never hand-edit values here.

export interface EvalRow {
  readonly model: string;
  readonly params: string;
  readonly koPpl: number;
  readonly koBpb: number;
  readonly enPpl: number;
  readonly enBpb: number;
  readonly ynat: number;
  readonly ynatF1: number;
  readonly nli: number;
  readonly nliF1: number;
  readonly tokPerS: number;
}

export interface SftPenaltyRow {
  readonly family: string;
  readonly base: number;
  readonly sft: number;
  readonly ratio: number;
}

export interface VerdictRow {
  readonly claim: string;
  readonly evidence: string;
  readonly verdict: string;
}

export const EVAL_TABLE: readonly EvalRow[] = raw.pplTable;

export const SFT_PENALTY: readonly SftPenaltyRow[] = raw.sftPenalty;

export const VERDICTS: readonly VerdictRow[] = raw.verdict;
