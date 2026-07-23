import styles from "./figures.module.css";
import { RUN_LEDGER } from "./training-curves-data";

export const RunLedgerTable = () => (
  <div className={styles.tableWrap}>
    <table className={styles.evidenceTable}>
      <thead>
        <tr>
          <th scope="col">버전</th>
          <th scope="col">시작일</th>
          <th scope="col">최종 스텝</th>
          <th scope="col">최종 지표</th>
          <th scope="col">wall-clock</th>
          <th scope="col">총 토큰</th>
          <th scope="col">런</th>
          <th scope="col">상태</th>
        </tr>
      </thead>
      <tbody>
        {RUN_LEDGER.map((row) => (
          <tr key={row.version}>
            <td data-label="버전">{row.version}</td>
            <td data-label="시작일">{row.date}</td>
            <td data-label="최종 스텝">
              {row.steps.toLocaleString("en-US")}
            </td>
            <td data-label="최종 지표">{row.metric}</td>
            <td data-label="wall-clock">{row.hours}h</td>
            <td data-label="총 토큰">{row.tokens ?? "—"}</td>
            <td data-label="런">{row.runs}</td>
            <td data-label="상태">{row.state}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
