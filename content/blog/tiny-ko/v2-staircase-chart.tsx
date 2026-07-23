import styles from "./figures.module.css";
import { V2_STAIRCASE } from "./training-curves-data";

const PLOT_LEFT = 64;
const PLOT_RIGHT = 608;
const PLOT_TOP = 40;
const PLOT_BOTTOM = 300;

const X_MAX = 29_000;
const Y_MAX = 5.5;

const stairX = (step: number) =>
  PLOT_LEFT + (step / X_MAX) * (PLOT_RIGHT - PLOT_LEFT);

const stairY = (epoch: number) =>
  PLOT_BOTTOM - (epoch / Y_MAX) * (PLOT_BOTTOM - PLOT_TOP);

const STAIRCASE_PATH = V2_STAIRCASE.map(([step, epoch], index) => {
  const command = index === 0 ? "M" : "L";
  return `${command} ${stairX(step).toFixed(2)} ${stairY(epoch).toFixed(2)}`;
}).join(" ");

const JUMPS = [5070, 10_130, 15_190, 20_250, 25_310] as const;

export const V2StaircaseChart = () => (
  <div className={styles.chartShell}>
    <div className={styles.chartSurface}>
      <svg
        aria-labelledby="v2-staircase-title v2-staircase-description"
        className={styles.plot}
        role="img"
        viewBox="0 0 640 360"
      >
        <title id="v2-staircase-title">
          v2 사전학습 런의 epoch 계단
        </title>
        <desc id="v2-staircase-description">
          v2 런의 epoch 지표가 5070, 10130, 15190, 20250, 25310 스텝에서 정확히
          1.0씩 다섯 번 뛰며 5.0에 도달했다. 데이터 이터레이터가 다섯 번
          재시작된 스트리밍 로딩 실패의 흔적이다.
        </desc>
        {[0, 1, 2, 3, 4, 5].map((tick) => {
          const y = stairY(tick);
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
                {tick}
              </text>
            </g>
          );
        })}
        {[0, 10_000, 20_000].map((tick) => {
          const x = stairX(tick);
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
                {tick.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}
        <text className={styles.axisLabel} x="64" y="22">
          ↑ TRAIN/EPOCH
        </text>
        <text className={styles.axisLabel} textAnchor="end" x="608" y="350">
          STEP →
        </text>
        <path
          className={styles.curveAccent}
          d={STAIRCASE_PATH}
          data-series="epoch"
        />
        {JUMPS.map((step, index) => (
          <circle
            className={styles.pointAccent}
            cx={stairX(step)}
            cy={stairY(index + 1)}
            key={step}
            r="4"
          />
        ))}
        <text
          className={styles.axisText}
          textAnchor="end"
          x={PLOT_RIGHT}
          y={stairY(5) - 10}
        >
          epoch 5.0에서 종료 · 계획은 648,000스텝
        </text>
      </svg>
    </div>
  </div>
);
