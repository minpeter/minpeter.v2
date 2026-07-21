import type { TOCItemType } from "fumadocs-core/toc";
import type { ReactNode } from "react";
import { isValidElement } from "react";

import styles from "@/shared/styles/stagger-fade-in.module.css";

export function PostToc({ toc }: { toc: TOCItemType[] }) {
  return (
    <aside className="fixed top-36 left-8 hidden w-72 2xl:block">
      {toc.length > 0 && (
        <div className="text-sm">
          <nav className={styles.stagger_container}>
            {toc.map((item: TOCItemType) => (
              <a
                className="my-1 block animation:enter w-fit rounded-md hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring box-decoration-clone px-2 py-1"
                href={item.url}
                key={item.url}
                style={{ marginLeft: `${item.depth - 1}rem` }}
              >
                {isValidElement<{ children: ReactNode }>(item.title)
                  ? item.title.props.children
                  : item.title}
              </a>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
