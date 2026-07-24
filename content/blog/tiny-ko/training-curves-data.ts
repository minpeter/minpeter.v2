/**
 * tiny-ko training evidence series. Extracted from the public W&B workspaces
 * (kasfiekfs-e/huggingface, kasfiekfs-e/axolotl) via the anonymous GraphQL
 * API and the runs' public output.log files; raw pulls are archived in
 * ulwulw-evidence/tiny-ko-data/.
 */
import raw from "./training-curves.json";

export type CurvePoint = readonly [step: number, value: number];

export interface CurveRun {
  readonly label: string;
  readonly runId: string;
  readonly points: readonly CurvePoint[];
  readonly finalValue: number;
  readonly evalStep: number;
  readonly finalSteps: number;
  readonly hours: number;
  readonly date: string;
}

export interface SftCheckpoint {
  readonly step: number;
  readonly training: number;
  readonly validation: number;
}

export interface SftLadderRun {
  readonly label: string;
  readonly baseStep: number;
  readonly evalLoss: number;
  readonly sftSteps: number;
  readonly hours: number;
  readonly date: string;
  readonly runId: string;
}

export interface LedgerRow {
  readonly version: string;
  readonly date: string;
  readonly steps: number;
  readonly metric: string;
  readonly hours: number;
  readonly runs: number;
  readonly state: string;
  readonly tokens: string | null;
}

export interface ConfigDiffRow {
  readonly version: string;
  readonly vocab: string;
  readonly vocabNote: string;
  readonly context: string;
  readonly batch: string;
  readonly lr: string;
  readonly warmup: string;
  readonly optimizer: string;
  readonly plan: string;
}

const toPoints = (points: readonly (readonly number[])[]): CurvePoint[] =>
  points.map(([step, value]) => [step ?? 0, value ?? 0]);

const toCurveRuns = (runs: typeof raw.pretrainingAccuracyRuns): CurveRun[] =>
  runs.map((run) => ({ ...run, points: toPoints(run.points) }));

export const PRETRAINING_ACCURACY_RUNS: readonly CurveRun[] = toCurveRuns(
  raw.pretrainingAccuracyRuns
);

export const MUON_LOSS_RUNS: readonly CurveRun[] = toCurveRuns(
  raw.muonLossRuns
);

export const SFT_TRAIN_CURVE: readonly CurvePoint[] = toPoints(
  raw.sftTrainCurve
);

export const SFT_EVAL_POINTS: readonly CurvePoint[] = toPoints(
  raw.sftEvalPoints
);

export const SFT_CHECKPOINTS: readonly SftCheckpoint[] = raw.sftCheckpoints;

export const SFT_LADDER: readonly SftLadderRun[] = raw.sftLadder;

export const RUN_LEDGER: readonly LedgerRow[] = raw.runLedger;

export const V2_STAIRCASE: readonly CurvePoint[] = toPoints(raw.v2Staircase);

export const CONFIG_DIFF: readonly ConfigDiffRow[] = raw.configDiff;

export const SFT_DATASETS: readonly string[] = raw.sftDatasets;
