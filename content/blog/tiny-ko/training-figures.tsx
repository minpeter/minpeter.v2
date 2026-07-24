import { ConfigDiffTable } from "./config-diff-table";
import { EvidenceFigure } from "./figure-frame";
import { MuonComparisonChart } from "./muon-comparison-chart";
import { PretrainingAccuracyChart } from "./pretraining-accuracy-chart";
import { RunLedgerTable } from "./run-ledger-table";
import { SftLadderChart } from "./sft-ladder-chart";
import { SftLossChart } from "./sft-loss-chart";
import { V2StaircaseChart } from "./v2-staircase-chart";

export const V2StaircaseFigure = () => (
  <EvidenceFigure
    caption="v2 런의 공개 로그에 남은 train/epoch이다. 이터레이터가 재시작될 때마다 epoch이 정확히 1.0씩 뛰어 다섯 개의 계단을 만들었다. 손실은 11.5에서 1.77까지 낮아졌지만, 같은 데이터를 다섯 번 본 결과였다."
    index="02"
    sourceHref="https://wandb.ai/kasfiekfs-e/axolotl"
    sourceLabel="W&B · axolotl workspace"
    title="v2가 남긴 계단: 데이터 이터레이터는 다섯 번 재시작됐다"
  >
    <V2StaircaseChart />
  </EvidenceFigure>
);

export const ConfigDiffFigure = () => (
  <EvidenceFigure
    caption="각 버전의 공개 W&B 실행 설정(config.yaml)에서 가져온 값이다. v3의 시퀀스 길이는 설정에 없어 공개 보고서의 기술을 따랐다."
    index="03"
    sourceHref="https://wandb.ai/kasfiekfs-e/huggingface"
    sourceLabel="W&B · run configs"
    title="v2에서 v5까지, 공개 설정이 말하는 변화"
  >
    <ConfigDiffTable />
  </EvidenceFigure>
);

export const PretrainingRunsFigure = () => (
  <EvidenceFigure
    caption="공개 W&B 런 로그에 1,000 스텝 간격으로 기록된 eval/accuracy다. 곡선에 올라가면 각 런의 마지막 요약을 볼 수 있다. 모델 크기·데이터·스텝이 달라 통제된 우열 비교가 아니라, 실험이 어디까지 갔는지를 보여주는 지도다."
    index="01"
    sourceHref="https://wandb.ai/kasfiekfs-e/huggingface/reports/tiny-ko-%EB%AA%A8%EB%8D%B8-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EB%8D%B0%EC%9D%B4%ED%84%B0-%ED%8C%8C%EC%9D%B4%ED%94%84%EB%9D%BC%EC%9D%B8-%EC%8B%A4%ED%97%98-%EC%A4%91%EC%8B%AC-%EA%B8%B0%EB%A1%9D--VmlldzoxMzUyMTMyNw"
    sourceLabel="W&B tiny-ko report"
    title="사전학습 런의 평가 정확도 곡선"
  >
    <PretrainingAccuracyChart />
  </EvidenceFigure>
);

export const SftLossFigure = () => (
  <EvidenceFigure
    caption="공개 W&B 런 로그에 기록된 817스텝의 학습 손실 곡선과, 모델 카드의 5개 검증 체크포인트다. 스텝 위에 올라가 해당 지점의 값을 볼 수 있다."
    index="07"
    sourceHref="https://huggingface.co/minpeter/tiny-ko-sft"
    sourceLabel="Hugging Face · tiny-ko-sft model card"
    title="첫 SFT에서 학습·검증 손실이 함께 낮아간 과정"
  >
    <SftLossChart />
  </EvidenceFigure>
);

export const SftLadderFigure = () => (
  <EvidenceFigure
    caption="v4 사전학습의 각 체크포인트 위에서 같은 SFT를 돌린 최종 eval/loss다. 122k까지는 베이스가 깊을수록 좋아졌지만, 173k에서 1.4 epoch으로 돌린 런은 오히려 나빠졌다. 데이터를 재정비한 v4-1 122k가 가장 낮다."
    index="06"
    sourceHref="https://wandb.ai/kasfiekfs-e/axolotl"
    sourceLabel="W&B · axolotl workspace"
    title="베이스 체크포인트가 깊어질수록 SFT는 나아졌나"
  >
    <SftLadderChart />
  </EvidenceFigure>
);

export const MuonCurvesFigure = () => (
  <EvidenceFigure
    caption="같은 124M 설계를 AdamW와 Muon으로 각각 사전학습한 1,000 스텝 간격 eval/loss다. Muon은 46,648스텝·18.2시간에서 2.7239로 끝났고, AdamW는 93,295스텝·33.4시간에서 2.8772였다."
    index="10"
    sourceHref="https://wandb.ai/kasfiekfs-e/huggingface"
    sourceLabel="W&B · huggingface workspace"
    title="같은 124M에서 Muon은 절반 시간에 더 낮은 손실"
  >
    <MuonComparisonChart />
  </EvidenceFigure>
);

export const RunLedgerFigure = () => (
  <EvidenceFigure
    caption="wall-clock은 공개 런 요약의 _runtime을 그대로 옮긴 값이며, 중단·재개된 런은 연쇄를 합산했다. 총 토큰은 완료된 런에 한해 로그의 초당 샘플 수 × 실행 시간 × 시퀀스 길이로 추정했다(packing 기준). 어느 GPU에서 몇 대로 돌렸는지는 기록에 없어 GPU 시간으로 환산하지 않는다."
    index="11"
    sourceHref="https://wandb.ai/kasfiekfs-e/huggingface"
    sourceLabel="W&B · public workspaces"
    title="공개 W&B 런이 남긴 시간과 최종 지표"
  >
    <RunLedgerTable />
  </EvidenceFigure>
);
