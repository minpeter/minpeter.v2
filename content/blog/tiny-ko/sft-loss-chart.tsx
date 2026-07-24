"use client";

import { useMemo, useState } from "react";

import styles from "./figures.module.css";
import {
  SFT_CHECKPOINTS,
  SFT_EVAL_POINTS,
  SFT_TRAIN_CURVE,
} from "./training-curves-data";

const LOSS_TICKS = [1.5, 1.75, 2, 2.25] as const;

const PLOT_LEFT = 64;
const PLOT_RIGHT = 608;
const PLOT_TOP = 28;
const PLOT_BOTTOM = 272;

const lossX = (step: number) =>
  PLOT_LEFT + (step / 800) * (PLOT_RIGHT - PLOT_LEFT);

const lossY = (loss: number) => 270 - ((loss - 1.4) / 1.05) * 220;

const TRAIN_PATH = SFT_TRAIN_CURVE.map(([step, loss], index) => {
  const command = index === 0 ? "M" : "L";
  return `${command} ${lossX(step).toFixed(2)} ${lossY(loss).toFixed(2)}`;
}).join(" ");

const EVAL_PATH = SFT_EVAL_POINTS.map(([step, loss], index) => {
  const command = index === 0 ? "M" : "L";
  return `${command} ${lossX(step).toFixed(2)} ${lossY(loss).toFixed(2)}`;
}).join(" ");

const FINAL_TRAIN = SFT_TRAIN_CURVE.at(-1);
const FINAL_EVAL = SFT_EVAL_POINTS.at(-1);

const STEP_EDGES = SFT_CHECKPOINTS.map((point, index) => {
  const x = lossX(point.step);
  const previous = index > 0 ? SFT_CHECKPOINTS[index - 1] : undefined;
  const next =
    index < SFT_CHECKPOINTS.length - 1 ? SFT_CHECKPOINTS[index + 1] : undefined;
  return {
    left: previous ? (lossX(previous.step) + x) / 2 : PLOT_LEFT,
    right: next ? (x + lossX(next.step)) / 2 : PLOT_RIGHT,
  };
});

export const SftLossChart = () => {
  const [selectedStep, setSelectedStep] = useState(800);
  const selected = useMemo(
    () =>
      SFT_CHECKPOINTS.find((point) => point.step === selectedStep) ??
      SFT_CHECKPOINTS[4],
    [selectedStep]
  );

  return (
    <div className={styles.chartShell}>
      <div className={styles.chartSurface}>
        <svg
          aria-labelledby="sft-chart-title sft-chart-description"
          className={styles.plot}
          role="group"
          viewBox="0 0 640 320"
        >
          <title id="sft-chart-title">tiny-ko SFT 학습 및 검증 손실</title>
          <desc id="sft-chart-description">
            공개 W&B 런 로그에 기록된 817스텝의 학습 손실 곡선과 1, 200, 400,
            600, 800 스텝의 검증 손실. 검증 손실은 2.3640에서 1.5297로
            감소한다.
          </desc>
          {LOSS_TICKS.map((tick) => {
            const y = lossY(tick);
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
                  {tick.toFixed(2)}
                </text>
              </g>
            );
          })}
          {[0, 200, 400, 600, 800].map((tick) => (
            <g key={tick}>
              <line
                className={styles.gridLine}
                x1={lossX(tick)}
                x2={lossX(tick)}
                y1={PLOT_TOP}
                y2={PLOT_BOTTOM}
              />
              <text
                className={styles.axisText}
                textAnchor="middle"
                x={lossX(tick)}
                y="294"
              >
                {tick}
              </text>
            </g>
          ))}
          <line
            className={styles.scrubLine}
            x1={lossX(selected.step)}
            x2={lossX(selected.step)}
            y1={PLOT_TOP}
            y2={PLOT_BOTTOM}
          />
          <path
            className={styles.trainingLine}
            d={TRAIN_PATH}
            data-series="training"
          />
          <path
            className={styles.validationLine}
            d={EVAL_PATH}
            data-series="validation"
          />
          {SFT_CHECKPOINTS.map((point) => {
            const isSelected = point.step === selected.step;
            return (
              <g
                className={
                  isSelected ? styles.chartPointActive : styles.chartPointMuted
                }
                key={point.step}
              >
                <circle
                  className={styles.trainingPoint}
                  cx={lossX(point.step)}
                  cy={lossY(point.training)}
                  r={isSelected ? 4.5 : 3.5}
                />
                <circle
                  className={styles.validationPoint}
                  cx={lossX(point.step)}
                  cy={lossY(point.validation)}
                  r={isSelected ? 4.5 : 3.5}
                />
              </g>
            );
          })}
          {FINAL_TRAIN ? (
            <text
              className={styles.trainingLabel}
              textAnchor="end"
              x="596"
              y={lossY(FINAL_TRAIN[1]) - 12}
            >
              학습 {FINAL_TRAIN[1].toFixed(4)}
            </text>
          ) : null}
          {FINAL_EVAL ? (
            <text
              className={styles.validationLabel}
              textAnchor="end"
              x="596"
              y={lossY(FINAL_EVAL[1]) + 22}
            >
              검증 {FINAL_EVAL[1].toFixed(4)}
            </text>
          ) : null}
          <text
            className={styles.axisLabel}
            textAnchor="end"
            x={PLOT_RIGHT}
            y="316"
          >
            STEP →
          </text>
          {SFT_CHECKPOINTS.map((point, index) => {
            const edges = STEP_EDGES[index];
            if (!edges) {
              return null;
            }
            const isSelected = point.step === selected.step;
            const select = () => setSelectedStep(point.step);
            return (
              <g
                aria-label={`${point.step} steps: training ${point.training.toFixed(4)}, validation ${point.validation.toFixed(4)}`}
                aria-pressed={isSelected}
                className={styles.chartTarget}
                key={point.step}
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
                <rect
                  className={styles.hitArea}
                  height={PLOT_BOTTOM - PLOT_TOP}
                  width={edges.right - edges.left}
                  x={edges.left}
                  y={PLOT_TOP}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <output className={styles.selectionReadout}>
        selected checkpoint — {selected.step} steps · training{" "}
        {selected.training.toFixed(4)} · validation{" "}
        {selected.validation.toFixed(4)}
      </output>
    </div>
  );
};
