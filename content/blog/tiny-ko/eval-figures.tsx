import { EvalBenchTable } from "./eval-bench-table";
import { EvalPplTable } from "./eval-ppl-table";
import { EvalVerdictTable } from "./eval-verdict-table";
import { EvidenceFigure } from "./figure-frame";
import { SftPenaltyChart } from "./sft-penalty-chart";

export const EvalPplFigure = () => (
  <EvidenceFigure
    caption="2026년 5~7월 뉴스에서 한국어 300,000바이트, 영어 150,000바이트의 동일 prefix를 모델별로 평가했다. PPL은 tokenizer 내부 비교용이고, BPB는 전체 token NLL을 실제 UTF-8 byte 수로 나눈 값이다. CPU fp32, 독립된 512토큰 창."
    index="12"
    sourceHref="https://huggingface.co/minpeter"
    sourceLabel="Hugging Face · minpeter"
    title="학습이 끝난 뒤의 뉴스로 재본 perplexity"
  >
    <EvalPplTable />
  </EvidenceFigure>
);

export const SftPenaltyFigure = () => (
  <EvidenceFigure
    caption="회색 점이 base, 색 점이 SFT다. 연결선은 채팅 템플릿 없이 측정한 raw-news PPL의 변화다. 포맷 이동과 catastrophic forgetting을 분리하지 못하므로 일반 언어 능력의 인과적 손실로 해석하지 않는다."
    index="13"
    sourceHref="https://huggingface.co/minpeter"
    sourceLabel="Hugging Face · minpeter"
    title="SFT의 가격: 레시피마다 달랐다"
  >
    <SftPenaltyChart />
  </EvidenceFigure>
);

export const EvalBenchFigure = () => (
  <EvidenceFigure
    caption="KLUE validation을 클래스별로 같은 수만큼 뽑아 평가했다(YNAT 40개×7=280, NLI 60개×3=180). 후보 문자열의 토큰 수가 달라도 불리하지 않도록 평균 token log-probability를 사용하고 accuracy와 macro-F1을 함께 표시한다. 2021년 공개 데이터라 학습 크롤 포함 가능성이 있다."
    index="14"
    sourceHref="https://huggingface.co/datasets/klue/klue"
    sourceLabel="Hugging Face · KLUE"
    title="KLUE에서 본 작은 모델의 능력과 한계"
  >
    <EvalBenchTable />
  </EvidenceFigure>
);

export const EvalVerdictFigure = () => (
  <EvidenceFigure
    caption="확인됨은 측정 방법 자체가 직접 지지하는 결론, 일치함은 관찰이 가설과 같은 방향인 경우, 미확정은 ablation 또는 반복 run이 필요한 경우다. 측정은 2026년 7월 CPU fp32 환경에서 수행했다."
    index="15"
    sourceHref="https://huggingface.co/minpeter"
    sourceLabel="Hugging Face · minpeter"
    title="로그의 주장을 가중치로 검증하면"
  >
    <EvalVerdictTable />
  </EvidenceFigure>
);
