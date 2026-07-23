import type { ZodType } from "zod";
import { describe, expect, it } from "vitest";

import { docs } from "../../source.config";

const schema = docs.schema as ZodType;

const baseFrontmatter = {
  description: "description",
  published: "2025-01-01 00:00:00 +0900",
  title: "title",
};

describe("source.config blog frontmatter schema", () => {
  it("accepts frontmatter without external_url", () => {
    expect(schema.safeParse(baseFrontmatter).success).toBeTruthy();
  });

  it.each(["https://example.com/post", "http://example.com/post"])(
    "accepts http(s) external_url %s",
    (externalUrl) => {
      const result = schema.safeParse({
        ...baseFrontmatter,
        external_url: externalUrl,
      });

      expect(result.success).toBeTruthy();
    }
  );

  it.each([
    // eslint-disable-next-line no-script-url -- fixture: the schema must reject this scheme
    "javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "ftp://example.com/post",
    "file:///etc/passwd",
  ])("rejects non-http(s) external_url %s", (externalUrl) => {
    const result = schema.safeParse({
      ...baseFrontmatter,
      external_url: externalUrl,
    });

    expect(result.success).toBeFalsy();
  });
});
