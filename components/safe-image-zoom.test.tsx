import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SafeImageZoom } from "./safe-image-zoom";

describe("SafeImageZoom", () => {
  it("renders a plain image during server rendering", () => {
    const html = renderToStaticMarkup(
      <SafeImageZoom
        alt="Build-safe image"
        className="rounded-lg"
        height={320}
        src="/assets/example.png"
        width={640}
      />
    );

    expect(html).toContain("<img");
    expect(html).toContain('alt="Build-safe image"');
    expect(html).toContain('class="rounded-lg"');
    expect(html).toContain('src="/assets/example.png"');
    expect(html).toContain('width="640"');
    expect(html).toContain('height="320"');
  });
});
