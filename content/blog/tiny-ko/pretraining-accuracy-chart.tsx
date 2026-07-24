import { RunCurvesChart } from "./run-curves-chart";
import { PRETRAINING_ACCURACY_RUNS } from "./training-curves-data";

export const PretrainingAccuracyChart = () => (
  <RunCurvesChart
    defaultLabel="v4"
    description="공개 W&B 런 로그에 1000 스텝 간격으로 기록된 평가 정확도. v4가 173000 스텝에서 60.02퍼센트로 가장 높고, v5는 114000 스텝에서 49.28퍼센트, v3는 45000 스텝에서 45.34퍼센트, 20M 영한 혼합 런은 200000 스텝에서 36.23퍼센트로 끝났다."
    descriptionId="pretraining-curves-description"
    metric="accuracy"
    metricLabel="EVAL ACCURACY"
    runs={PRETRAINING_ACCURACY_RUNS}
    title="tiny-ko 사전학습 런의 평가 정확도 곡선"
    titleId="pretraining-curves-title"
    xMax={200_000}
    xTicks={[0, 50_000, 100_000, 150_000, 200_000]}
    yDomain={[0.1, 0.65]}
    yTicks={[0.2, 0.3, 0.4, 0.5, 0.6]}
  />
);
