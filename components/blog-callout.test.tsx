import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BlogCallout } from "./blog-callout";

describe("blog callout markers", () => {
  it("renders the warn marker for type warn", () => {
    const html = renderToString(<BlogCallout type="warn">careful</BlogCallout>);
    expect(html).toContain('data-callout-type="warn"');
    expect(html).toContain("blog-callout-marker");
    expect(html).toContain("!");
  });

  it("renders the warn marker for the warning alias", () => {
    const html = renderToString(
      <BlogCallout type="warning">careful</BlogCallout>
    );
    expect(html).toContain('data-callout-type="warning"');
    expect(html).toContain("blog-callout-marker");
    expect(html).toContain("!");
  });
});
