import { EVAL_TABLE } from "./eval-data";
import styles from "./figures.module.css";

export const EvalPplTable = () => (
  <div className={styles.tableWrap}>
    <table className={styles.evidenceTable}>
      <thead>
        <tr>
          <th scope="col">모델</th>
          <th scope="col">파라미터</th>
          <th scope="col">KO PPL</th>
          <th scope="col">KO BPB</th>
          <th scope="col">EN PPL</th>
          <th scope="col">EN BPB</th>
        </tr>
      </thead>
      <tbody>
        {EVAL_TABLE.map((row) => (
          <tr key={row.model}>
            <td data-label="모델">{row.model}</td>
            <td data-label="파라미터">{row.params}</td>
            <td data-label="KO PPL">{row.koPpl}</td>
            <td data-label="KO BPB">{row.koBpb}</td>
            <td data-label="EN PPL">{row.enPpl}</td>
            <td data-label="EN BPB">{row.enBpb}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
