"use client";

import { useMemo, useState } from "react";

import styles from "./figures.module.css";
import { SFT_LADDER } from "./training-curves-data";

const PLOT_LEFT = 64;
const PLOT_RIGHT = 608;
const PLOT_TOP = 40;
const PLOT_BOTTOM = 300;

const X_MAX = 180_000;
const Y_DOMAIN: readonly [number, number] = [1.1, 1.7];
const Y_TICKS = [1.2, 1.3, 1.4, 1.5, 1.6] as const;
const X_TICKS = [0, 50_000, 100_000, 150_000] as const;

const ladderX = (step: number) =>
  PLOT_LEFT + (step / X_MAX) * (PLOT_RIGHT - PLOT_LEFT);

const ladderY = (loss: number) =>
  PLOT_BOTTOM -
  ((loss - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) *
    (PLOT_BOTTOM - PLOT_TOP);

const LADDER_PATH = SFT_LADDER.filter(
  (run) => !run.label.startsWith("v4-1")
)
  .map((run, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command} ${ladderX(run.baseStep)} ${ladderY(run.evalLoss)}`;
  })
  .join(" ");

export const SftLadderChart = () => {
  const [selectedLabel, setSelectedLabel] = useState("v4-1 122k");
  const selected = useMemo(
    () =>
      SFT_LADDER.find((run) => run.label === selectedLabel) ?? SFT_LADDER[5],
    [selectedLabel]
  );

  return (
    <div className={styles.chartShell}>
      <div className={styles.chartSurface}>
        <svg
          aria-labelledby="sft-ladder-title sft-ladder-description"
          className={styles.plot}
          role="group"
          viewBox="0 0 640 360"
        >
          <title id="sft-ladder-title">
            v4 체크포인트별 SFT 최종 검증 손실
          </title>
          <desc id="sft-ladder-description">
            v4 사전학습의 9k, 34k, 68k, 122k, 173k 체크포인트에서 같은 SFT를
            돌린 최종 eval/loss는 1.5699, 1.4634, 1.4286, 1.4059, 1.6080이다.
            데이터를 재정비한 v4-1 122k 런은 1.1718로 가장 낮다.
          </desc>
          {Y_TICKS.map((tick) => {
            const y = ladderY(tick);
            return (
              <g key={tick}>
                <line
                  className={styles.gridLine}
                  x1={PLOT_LEFT}
                  x2={PLOT_RIGHT}
                  y1={y}
                  y2={y}
                />
                <text
                  className={styles.axisText}
                  textAnchor="end"
                  x="56"
                  y={y + 4}
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}
          {X_TICKS.map((tick) => {
            const x = ladderX(tick);
            return (
              <g key={tick}>
                <line
                  className={styles.gridLine}
                  x1={x}
                  x2={x}
                  y1={PLOT_TOP}
                  y2={PLOT_BOTTOM}
                />
                <text
                  className={styles.axisText}
                  textAnchor="middle"
                  x={x}
                  y="326"
                >
                  {tick === 0 ? "0" : `${tick / 1000}k`}
                </text>
              </g>
            );
          })}
          <text className={styles.axisLabel} x="64" y="22">
            ↑ SFT EVAL LOSS
          </text>
          <text className={styles.axisLabel} textAnchor="end" x="608" y="350">
            BASE CHECKPOINT →
          </text>
          <path className={styles.ladderLine} d={LADDER_PATH} />
          {SFT_LADDER.map((run) => {
            const x = ladderX(run.baseStep);
            const y = ladderY(run.evalLoss);
            const isSelected = run.label === selected.label;
            const select = () => setSelectedLabel(run.label);
            return (
              <g
                aria-label={`${run.label} base: eval/loss ${run.evalLoss.toFixed(4)}, ${run.sftSteps.toLocaleString("en-US")} SFT steps, ${run.hours}h`}
                aria-pressed={isSelected}
                className={`${styles.chartTarget} ${
                  isSelected ? styles.chartPointActive : styles.chartPointMuted
                }`}
                key={run.label}
                onClick={select}
                onFocus={select}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select();
                  }
                }}
                onMouseEnter={select}
                role="button"
                tabIndex={0}
              >
                <circle className={styles.hitArea} cx={x} cy={y} r="18" />
                {isSelected ? (
                  <text
                    className={styles.pointLabel}
                    textAnchor="middle"
                    x={x}
                    y={y - 16}
                  >
                    {run.label} · {run.evalLoss.toFixed(4)}
                  </text>
                ) : null}
                <circle
                  className={isSelected ? styles.pointAccent : styles.point}
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4}
                />
                <circle className={styles.focusRing} cx={x} cy={y} r="11" />
              </g>
            );
          })}
        </svg>
      </div>
      <output className={styles.selectionReadout}>
        selected SFT run — {selected.label} base · eval/loss{" "}
        {selected.evalLoss.toFixed(4)} ·{" "}
        {selected.sftSteps.toLocaleString("en-US")} SFT steps ·{" "}
        {selected.hours}h
      </output>
    </div>
  );
};
