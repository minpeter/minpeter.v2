import { EvidenceFigure } from "./figure-frame";

import styles from "./figures.module.css";

interface MetricProps {
  readonly label: string;
  readonly value: string;
}

const Metric = ({ label, value }: MetricProps) => (
  <div className={styles.metric}>
    <dt className={styles.metricLabel}>{label}</dt>
    <dd className={styles.metricValue}>{value}</dd>
  </div>
);

const CORPUS_SOURCES = [
  "HAERAE-HUB/KOREAN-WEBTEXT",
  "HAERAE-HUB/KOREAN-SyntheticText-1.5B",
  "blueapple8259/c4-ko-cleaned-2",
  "devngho/korean-textbooks-edu",
  "heegyu/korean-petitions",
] as const;

const LINEAGE = [
  {
    date: "06.02",
    model: "tiny-ko-base",
    note: "HF 업로드가 시작됐고 W&B는 v2 SFT와 v3 사전학습을 남김",
  },
  {
    date: "06.25",
    model: "20M",
    note: "한국어·영한 혼합 사전학습과 SFT를 같은 날 공개",
  },
  {
    date: "06.26",
    model: "124M",
    note: "1억대 모델 계열로 확장한 사전학습 체크포인트 공개",
  },
  {
    date: "07.13",
    model: "124M Muon",
    note: "124M Muon SFT까지 공개되며 옵티마이저 실험이 분기",
  },
  {
    date: "07.17",
    model: "187M · 250718",
    note: "175M을 거쳐 187M과 새 32k 토크나이저가 공개",
  },
  {
    date: "07.25",
    model: "187M · 250725",
    note: "두 번째 32k 토크나이저와 187M-250725로 계열을 다시 고정",
  },
  {
    date: "07.29",
    model: "MoE randoms",
    note: "2x–8x 187M random 변형과 187M SFT-250725 공개",
  },
  {
    date: "08.03",
    model: "webtext / small / pico",
    note: "webtext·small·pico까지 작은 사전학습 실험을 다시 확장",
  },
] as const;

export const EvalMethodFigure = () => (
  <dl aria-label="2026년 후속 평가 방법" className={styles.metricStrip}>
    <Metric label="WEIGHTS" value="8 published" />
    <Metric label="NEWS" value="564 KO · 51 EN" />
    <Metric label="LIKELIHOOD" value="fixed UTF-8 bytes" />
    <Metric label="KLUE" value="balanced · macro-F1" />
  </dl>
);

export const ModelBlueprintFigure = () => (
  <EvidenceFigure
    caption="정확한 파라미터 수는 W&B 실행 설정의 124,635,456개다. 임베딩과 LM head를 묶고, 3:1 비율의 grouped-query attention을 사용했다."
    index="04"
    sourceHref="https://api.wandb.ai/files/kasfiekfs-e/huggingface/3qngrf8o/config.yaml"
    sourceLabel="W&B · v5 run config"
    title="tiny-ko-base의 124M Llama 계열 설계"
  >
    <dl className={styles.metricStrip}>
      <Metric label="PARAMETERS" value="124,635,456" />
      <Metric label="LAYERS" value="30" />
      <Metric label="CONTEXT" value="4,096" />
      <Metric label="VOCAB" value="32k" />
    </dl>
    <div
      aria-label="tiny-ko-base 모델 구조"
      className={styles.modelStack}
      role="group"
    >
      <div className={styles.stackRow}>
        <span>Tokenizer / tied embeddings</span>
        <code>32,000 × 576</code>
      </div>
      <div className={styles.stackCore}>
        <span>30 × Llama decoder</span>
        <small>9 attention heads · 3 KV heads · MLP 1,536 · SiLU</small>
      </div>
      <div className={styles.stackRow}>
        <span>RMSNorm / tied LM head</span>
        <code>RoPE θ 100,000</code>
      </div>
    </div>
  </EvidenceFigure>
);

export const CorpusFigure = () => (
  <EvidenceFigure
    caption="카드가 공개한 것은 문서 수·바이트·출처 목록이다. 출처별 혼합 비율과 학습에 실제 소비된 토큰 수는 공개 기록에 없어 추정하지 않았다."
    index="05"
    sourceHref="https://huggingface.co/datasets/minpeter/tiny-ko-corpus"
    sourceLabel="Hugging Face · tiny-ko-corpus dataset card"
    title="727만 문서를 섞고, 거르고, 중복 제거한 한국어 코퍼스"
  >
    <dl className={styles.metricStrip}>
      <Metric label="DOCUMENTS" value="7,270,628" />
      <Metric label="UNCOMPRESSED" value="32.43 GB" />
      <Metric label="DOWNLOAD" value="16.81 GB" />
    </dl>
    <ol className={styles.sourceList}>
      {CORPUS_SOURCES.map((source, index) => (
        <li key={source}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <code>{source}</code>
        </li>
      ))}
    </ol>
  </EvidenceFigure>
);

export const BenchmarkFigure = () => (
  <EvidenceFigure
    caption="MMLU만 두 런에 공통으로 기록되어 0.45%p 차이를 확인할 수 있다. KMMLU-direct와 HAERAE는 서로 다른 런에만 있어 직접 비교할 수 없다."
    index="08"
    sourceHref="https://wandb.ai/kasfiekfs-e/huggingface/reports/tiny-ko--VmlldzoxMzA4MDg0MQ"
    sourceLabel="W&B tiny-ko report · benchmark notes"
    title="벤치마크는 승리표보다 다음 질문에 가까웠다"
  >
    <div className={styles.tableWrap}>
      <table className={styles.evidenceTable}>
        <caption className="sr-only">tiny-ko 벤치마크 결과</caption>
        <thead>
          <tr>
            <th scope="col">RUN</th>
            <th scope="col">MMLU</th>
            <th scope="col">KMMLU-DIRECT</th>
            <th scope="col">HAERAE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">12200 instruct</th>
            <td data-label="MMLU">0.2347</td>
            <td data-label="KMMLU-DIRECT">0.0392</td>
            <td data-label="HAERAE">—</td>
          </tr>
          <tr>
            <th scope="row">v4-1 12200</th>
            <td className={styles.emphasis} data-label="MMLU">
              0.2392
            </td>
            <td data-label="KMMLU-DIRECT">—</td>
            <td data-label="HAERAE">0.1897</td>
          </tr>
        </tbody>
      </table>
    </div>
  </EvidenceFigure>
);

export const LineageFigure = () => (
  <EvidenceFigure
    caption="날짜는 공개 Hugging Face 업로드 시점과 두 개의 공개 W&B workspace 런 기록을 맞춘 것이다. 6월 6일 원문 이후의 실험은 당시의 결론이 아니라 후속 기록으로 분리했다."
    index="09"
    sourceHref="https://huggingface.co/minpeter/models?search=tiny-ko"
    sourceLabel="Hugging Face uploads + W&B public run history"
    title="공개 업로드와 W&B 런이 함께 남긴 tiny-ko 타임라인"
  >
    <ol className={styles.timeline}>
      {LINEAGE.map((item) => (
        <li key={item.model}>
          <time dateTime={`2025-${item.date.replace(".", "-")}`}>
            {item.date}
          </time>
          <strong>{item.model}</strong>
          <span>{item.note}</span>
        </li>
      ))}
    </ol>
  </EvidenceFigure>
);
