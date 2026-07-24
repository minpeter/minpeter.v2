import { VERDICTS } from "./eval-data";
import styles from "./figures.module.css";

export const EvalVerdictTable = () => (
  <div className={styles.tableWrap}>
    <table className={styles.evidenceTable}>
      <thead>
        <tr>
          <th scope="col">이 글의 주장</th>
          <th scope="col">실측 결과</th>
          <th scope="col">판정</th>
        </tr>
      </thead>
      <tbody>
        {VERDICTS.map((row) => (
          <tr key={row.claim}>
            <td data-label="주장">{row.claim}</td>
            <td data-label="실측">{row.evidence}</td>
            <td data-label="판정">{row.verdict}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
