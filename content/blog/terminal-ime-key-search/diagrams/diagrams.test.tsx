import { readFileSync } from "node:fs";

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CsiUAnatomyDiagram } from "./csi-u-anatomy";
import { DirectKeyPathDiagram } from "./direct-key-path";
import { ImeCompositionPathDiagram } from "./ime-composition-path";
import { InputBoundaryMatrix } from "./input-boundary-matrix";

const OPACITY_ATTR_RE = /\sopacity=/u;

const articleSource = readFileSync(
  new URL("../index.mdx", import.meta.url),
  "utf-8"
);

describe("terminal input diagrams", () => {
  it("keeps fenced code inside the article boundary at mobile widths", () => {
    expect(articleSource).toContain("data-responsive-code-boundary");
    expect(articleSource).toContain("[&_pre]:!min-w-0");
    expect(articleSource).toContain("[&_pre]:!w-full");
    expect(articleSource).toContain("[&_pre]:!whitespace-pre-wrap");
    expect(articleSource).toContain("[&_pre]:!break-words");
  });

  it("locates base-layout loss at Crossterm after PTY transport", () => {
    const html = renderToString(<DirectKeyPathDiagram />);

    for (const stage of ["pty", "crossterm"]) {
      expect(html).toContain(`data-stage="${stage}"`);
    }
    expect(html).not.toContain("PTY / Crossterm");
    expect(html).toContain("U+0441");
    expect(html).toContain("U+0063");
    expect(html).toContain("base-layout B=99");
  });

  it("separates IME loss from text transport and parsing", () => {
    const html = renderToString(<ImeCompositionPathDiagram />);

    for (const stage of ["ime", "terminal", "pty", "crossterm", "atuin"]) {
      expect(html).toContain(`data-stage="${stage}"`);
    }
    expect(html).toContain("g·i·t는 이 경계에서 소비");
    expect(html).not.toContain("overflow-x-auto");
  });

  it("renders the CSI-u fields without a fixed-width canvas", () => {
    const html = renderToString(<CsiUAnatomyDiagram />);

    for (const field of [
      "csi",
      "key",
      "modifier-event",
      "text",
      "final-byte",
    ]) {
      expect(html).toContain(`data-field="${field}"`);
    }

    expect(html).toContain("ESC[97;2;65u");
    expect(html).not.toContain("min-w-[42rem]");
  });

  it("covers platform boundaries and input feasibility", () => {
    const html = renderToString(<InputBoundaryMatrix />);

    for (const boundary of [
      "direct-key-event",
      "host-integrated-composition",
      "pre-terminal-grab",
    ]) {
      expect(html).toContain(`data-boundary="${boundary}"`);
    }

    for (const input of ["cyrillic-direct", "dubeolsik", "candidate-ime"]) {
      expect(html).toContain(`data-input="${input}"`);
    }
  });

  it("uses semantic figure captions without opacity attributes", () => {
    const html = [
      <CsiUAnatomyDiagram key="anatomy" />,
      <DirectKeyPathDiagram key="direct" />,
      <ImeCompositionPathDiagram key="ime" />,
      <InputBoundaryMatrix key="matrix" />,
    ]
      .map((diagram) => renderToString(diagram))
      .join("");

    expect(html.match(/<figure/gu)).toHaveLength(4);
    expect(html.match(/<figcaption/gu)).toHaveLength(4);
    expect(html).not.toMatch(OPACITY_ATTR_RE);
  });
});
