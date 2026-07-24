import styles from "./figures.module.css";
import { CONFIG_DIFF } from "./training-curves-data";

export const ConfigDiffTable = () => (
  <div className={styles.tableWrap}>
    <table className={styles.evidenceTable}>
      <thead>
        <tr>
          <th scope="col">버전</th>
          <th scope="col">토크나이저</th>
          <th scope="col">컨텍스트</th>
          <th scope="col">배치 × accum</th>
          <th scope="col">LR</th>
          <th scope="col">warmup</th>
          <th scope="col">optimizer</th>
          <th scope="col">계획</th>
        </tr>
      </thead>
      <tbody>
        {CONFIG_DIFF.map((row) => (
          <tr key={row.version}>
            <td data-label="버전">{row.version}</td>
            <td data-label="토크나이저">
              {row.vocab}
              {row.vocabNote ? ` (${row.vocabNote})` : ""}
            </td>
            <td data-label="컨텍스트">{row.context}</td>
            <td data-label="배치 × accum">{row.batch}</td>
            <td data-label="LR">{row.lr}</td>
            <td data-label="warmup">{row.warmup}</td>
            <td data-label="optimizer">{row.optimizer}</td>
            <td data-label="계획">{row.plan}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
