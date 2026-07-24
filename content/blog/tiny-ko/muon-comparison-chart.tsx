import { RunCurvesChart } from "./run-curves-chart";
import { MUON_LOSS_RUNS } from "./training-curves-data";

export const MuonComparisonChart = () => (
  <RunCurvesChart
    defaultLabel="124M · Muon"
    description="같은 124M 모델을 AdamW와 Muon으로 사전학습한 1000 스텝 간격 평가 손실. Muon은 46648 스텝 18.2시간에서 2.7239, AdamW는 93295 스텝 33.4시간에서 2.8772로 끝났다."
    descriptionId="muon-curves-description"
    metric="loss"
    metricLabel="EVAL LOSS"
    runs={MUON_LOSS_RUNS}
    title="124M AdamW와 Muon의 평가 손실 곡선"
    titleId="muon-curves-title"
    xMax={100_000}
    xTicks={[0, 25_000, 50_000, 75_000, 100_000]}
    yDomain={[2.5, 6.75]}
    yTicks={[3, 4, 5, 6]}
  />
);
