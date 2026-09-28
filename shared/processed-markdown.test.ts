import { defaultStringifier } from "fumadocs-core/mdx-plugins/stringifier";
import { describe, expect, it } from "vitest";

// `includeProcessedMarkdown` (source.config.ts) feeds every MDX page through
// fumadocs-core's `defaultStringifier`; `getLLMText(page, true)` serves it.
// fumadocs-core <=16.15.14 + mdast-util-to-markdown 2.1.3 recursed forever on
// bold/italic text (fuma-nama/fumadocs#3604). Keep this test when removing the
// `fumadocs-core>mdast-util-to-markdown` override in pnpm-workspace.yaml.
// The default stringifier only reads `this` optionally (`this?.data(...)`), so
// it can be called without a unified Processor.
const stringify = defaultStringifier() as (
  node: object,
  ctx: undefined
) => string;

describe("processed markdown stringifier", () => {
  it("serializes strong and emphasis (nested too) without recursing", () => {
    const markdown = stringify(
      {
        children: [
          {
            children: [
              { type: "text", value: "plain " },
              {
                children: [{ type: "text", value: "bold" }],
                type: "strong",
              },
              { type: "text", value: " and " },
              {
                children: [
                  { type: "text", value: "italic " },
                  {
                    children: [{ type: "text", value: "both" }],
                    type: "strong",
                  },
                ],
                type: "emphasis",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "root",
      },
      undefined
    );

    // Exact escaping of nested attention differs between
    // mdast-util-to-markdown 2.1.2 and 2.1.3; only assert version-stable output.
    expect(markdown).toContain("plain **bold** and ");
    expect(markdown).toContain("italic **both**");
  });
});
