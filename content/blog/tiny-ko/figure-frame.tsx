import type { ReactNode } from "react";

import styles from "./figures.module.css";

interface EvidenceFigureProps {
  readonly caption: ReactNode;
  readonly children: ReactNode;
  readonly index: string;
  readonly interactive?: boolean;
  readonly sourceHref: string;
  readonly sourceLabel: string;
  readonly title: string;
}

export const EvidenceFigure = ({
  caption,
  children,
  index,
  interactive = false,
  sourceHref,
  sourceLabel,
  title,
}: EvidenceFigureProps) => (
  <figure className={interactive ? styles.interactiveFigure : styles.figure}>
    <header className={styles.figureHeader}>
      <span className={styles.eyebrow}>FIGURE {index}</span>
      <p className={styles.figureTitle}>{title}</p>
    </header>
    <div className={styles.figureBody}>{children}</div>
    <figcaption className={styles.caption}>{caption}</figcaption>
    <a
      className={styles.source}
      href={sourceHref}
      rel="noreferrer noopener"
      target="_blank"
    >
      SOURCE ↗ {sourceLabel}
    </a>
  </figure>
);
