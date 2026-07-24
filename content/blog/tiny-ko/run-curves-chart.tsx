"use client";

import { useMemo, useState } from "react";

import styles from "./figures.module.css";
import type { CurveRun } from "./training-curves-data";

const PLOT_LEFT = 64;
const PLOT_RIGHT = 608;
const PLOT_TOP = 40;
const PLOT_BOTTOM = 300;

interface RunCurvesChartProps {
  readonly runs: readonly CurveRun[];
  readonly defaultLabel: string;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly title: string;
  readonly description: string;
  readonly metric: "accuracy" | "loss";
  readonly metricLabel: string;
  readonly yTicks: readonly number[];
  readonly yDomain: readonly [number, number];
  readonly xTicks: readonly number[];
  readonly xMax: number;
}

const formatStep = (step: number) =>
  step === 0 ? "0" : `${Math.round(step / 1000)}k`;

export const RunCurvesChart = ({
  runs,
  defaultLabel,
  titleId,
  descriptionId,
  title,
  description,
  metric,
  metricLabel,
  yTicks,
  yDomain,
  xTicks,
  xMax,
}: RunCurvesChartProps) => {
  const [selectedLabel, setSelectedLabel] = useState(defaultLabel);
  const selected = useMemo(
    () => runs.find((run) => run.label === selectedLabel) ?? runs[0],
    [runs, selectedLabel]
  );

  const x = (step: number) =>
    PLOT_LEFT + (step / xMax) * (PLOT_RIGHT - PLOT_LEFT);
  const y = (value: number) =>
    PLOT_BOTTOM -
    ((value - yDomain[0]) / (yDomain[1] - yDomain[0])) *
      (PLOT_BOTTOM - PLOT_TOP);

  const formatValue = (value: number) =>
    metric === "accuracy" ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
  const formatTick = (value: number) =>
    metric === "accuracy" ? `${Math.round(value * 100)}%` : value.toFixed(2);

  const pathOf = (run: CurveRun) =>
    run.points
      .map(
        ([step, value], index) =>
          `${index === 0 ? "M" : "L"} ${x(step).toFixed(2)} ${y(value).toFixed(2)}`
      )
      .join(" ");

  return (
    <div className={styles.chartShell}>
      <div className={styles.chartSurface}>
        <svg
          aria-labelledby={`${titleId} ${descriptionId}`}
          className={styles.plot}
          role="group"
          viewBox="0 0 640 360"
        >
          <title id={titleId}>{title}</title>
          <desc id={descriptionId}>{description}</desc>
          {yTicks.map((tick) => {
            const ty = y(tick);
            return (
              <g key={tick}>
                <line
                  className={styles.gridLine}
                  x1={PLOT_LEFT}
                  x2={PLOT_RIGHT}
                  y1={ty}
                  y2={ty}
                />
                <text
                  className={styles.axisText}
                  textAnchor="end"
                  x="56"
                  y={ty + 4}
                >
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}
          {xTicks.map((tick) => {
            const tx = x(tick);
            return (
              <g key={tick}>
                <line
                  className={styles.gridLine}
                  x1={tx}
                  x2={tx}
                  y1={PLOT_TOP}
                  y2={PLOT_BOTTOM}
                />
                <text
                  className={styles.axisText}
                  textAnchor="middle"
                  x={tx}
                  y="326"
                >
                  {formatStep(tick)}
                </text>
              </g>
            );
          })}
          <text className={styles.axisLabel} x="64" y="22">
            ↑ {metricLabel}
          </text>
          <text className={styles.axisLabel} textAnchor="end" x="608" y="350">
            GLOBAL STEP →
          </text>
          {runs.map((run) => {
            const isSelected = run.label === selected?.label;
            const select = () => setSelectedLabel(run.label);
            const d = pathOf(run);
            const last = run.points.at(-1);
            return (
              <g
                className={
                  isSelected ? styles.chartPointActive : styles.chartPointMuted
                }
                key={run.label}
              >
                <path
                  className={isSelected ? styles.curveAccent : styles.curve}
                  d={d}
                  data-curve={run.label}
                />
                <path
                  aria-label={`${run.label} curve: final ${metric} ${formatValue(run.finalValue)} at ${run.evalStep.toLocaleString("en-US")} steps, ${run.hours}h`}
                  aria-pressed={isSelected}
                  className={styles.curveHit}
                  d={d}
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
                />
                {isSelected && last ? (
                  <>
                    <circle
                      className={styles.pointAccent}
                      cx={x(last[0])}
                      cy={y(last[1])}
                      r="5"
                    />
                    <text
                      className={styles.pointLabel}
                      textAnchor={
                        x(last[0]) > PLOT_RIGHT - 80 ? "end" : "middle"
                      }
                      x={x(last[0]) > PLOT_RIGHT - 80 ? PLOT_RIGHT : x(last[0])}
                      y={y(last[1]) - 14}
                    >
                      {run.label} · {formatValue(run.finalValue)}
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <output className={styles.selectionReadout}>
        selected run — {selected?.label} · final {metric}{" "}
        {selected ? formatValue(selected.finalValue) : ""} @{" "}
        {selected?.evalStep.toLocaleString("en-US")} steps · trained{" "}
        {selected?.finalSteps.toLocaleString("en-US")} steps ·{" "}
        {selected?.hours}h
      </output>
    </div>
  );
};
