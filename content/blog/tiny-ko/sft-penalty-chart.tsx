import { SFT_PENALTY } from "./eval-data";
import styles from "./figures.module.css";

const PLOT_LEFT = 130;
const PLOT_RIGHT = 590;
const ROW_TOP = 70;
const ROW_GAP = 70;

const LOG_MIN = Math.log10(10);
const LOG_MAX = Math.log10(400);

const penX = (ppl: number) =>
  PLOT_LEFT +
  ((Math.log10(ppl) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (PLOT_RIGHT - PLOT_LEFT);

const TICKS = [20, 50, 100, 200] as const;

export const SftPenaltyChart = () => (
  <div className={styles.chartShell}>
    <div className={styles.chartSurface}>
      <svg
        aria-labelledby="sft-penalty-title sft-penalty-description"
        className={styles.plot}
        role="img"
        viewBox="0 0 640 280"
      >
        <title id="sft-penalty-title">
          SFT 전후 홀드아웃 perplexity 변화
        </title>
        <desc id="sft-penalty-description">
          세 모델 계열(20M, 124M v5, 187M)에서 base와 SFT의 한국어 홀드아웃
          perplexity를 연결한 dumbbell 차트. 20M은 3.83배, 124M v5는 3.62배,
          187M은 1.30배 악화됐다.
        </desc>
        {TICKS.map((tick) => {
          const x = penX(tick);
          return (
            <g key={tick}>
              <line
                className={styles.gridLine}
                x1={x}
                x2={x}
                y1="40"
                y2="240"
              />
              <text
                className={styles.axisText}
                textAnchor="middle"
                x={x}
                y="262"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <text className={styles.axisLabel} textAnchor="end" x="608" y="30">
          KO PPL (log) →
        </text>
        {SFT_PENALTY.map((row, index) => {
          const y = ROW_TOP + index * ROW_GAP;
          const baseX = penX(row.base);
          const sftX = penX(row.sft);
          return (
            <g key={row.family}>
              <text
                className={styles.axisText}
                textAnchor="end"
                x="120"
                y={y + 4}
              >
                {row.family}
              </text>
              <line
                className={styles.ladderLine}
                data-kind="connector"
                x1={baseX}
                x2={sftX}
                y1={y}
                y2={y}
              />
              <circle
                className={styles.pointMuted}
                cx={baseX}
                cy={y}
                data-kind="base"
                r="5"
              />
              <circle
                className={styles.pointAccent}
                cx={sftX}
                cy={y}
                data-kind="sft"
                r="5"
              />
              <text
                className={styles.axisText}
                x={Math.min(sftX + 12, PLOT_RIGHT)}
                y={y + 4}
              >
                ×{row.ratio}
              </text>
              <text
                className={styles.axisText}
                textAnchor="middle"
                x={baseX}
                y={y - 12}
              >
                {row.base}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  </div>
);
