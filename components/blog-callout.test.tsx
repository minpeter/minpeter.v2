import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BlogCallout } from "./blog-callout";

describe("blog callout markers", () => {
  it.each([
    { label: "type warn", type: "warn" },
    { label: "the warning alias", type: "warning" },
  ] as const)("renders the warn marker for $label", ({ type }) => {
    const html = renderToString(<BlogCallout type={type}>careful</BlogCallout>);
    expect(html).toContain(`data-callout-type="${type}"`);
    expect(html).toContain("blog-callout-marker");
    expect(html).toContain("!");
  });
});
