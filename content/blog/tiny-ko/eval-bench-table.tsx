import { EVAL_TABLE } from "./eval-data";
import styles from "./figures.module.css";

const BENCH_ORDER = EVAL_TABLE.toSorted((a, b) => b.ynatF1 - a.ynatF1);

export const EvalBenchTable = () => (
  <div className={styles.tableWrap}>
    <table className={styles.evidenceTable}>
      <thead>
        <tr>
          <th scope="col">모델</th>
          <th scope="col">YNAT acc.</th>
          <th scope="col">YNAT macro-F1</th>
          <th scope="col">NLI acc.</th>
          <th scope="col">NLI macro-F1</th>
        </tr>
      </thead>
      <tbody>
        {BENCH_ORDER.map((row) => (
          <tr key={row.model}>
            <td data-label="모델">{row.model}</td>
            <td data-label="YNAT acc.">{row.ynat}%</td>
            <td data-label="YNAT macro-F1">{row.ynatF1}%</td>
            <td data-label="NLI acc.">{row.nli}%</td>
            <td data-label="NLI macro-F1">{row.nliF1}%</td>
          </tr>
        ))}
        <tr>
          <td data-label="모델">무작위 기준</td>
          <td data-label="YNAT acc.">14.3%</td>
          <td data-label="YNAT macro-F1">14.3%</td>
          <td data-label="NLI acc.">33.3%</td>
          <td data-label="NLI macro-F1">33.3%</td>
        </tr>
      </tbody>
    </table>
  </div>
);
