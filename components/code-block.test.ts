import { highlight } from "sugar-high";
import { describe, expect, it } from "vitest";

describe("highlight() from sugar-high@0.9.5", () => {
  it("should highlight simple variable declaration", () => {
    const code = "const x = 1;";
    const result = highlight(code);
    expect(result).toMatchInlineSnapshot(
      `"<span class="sh__line"><span class="sh__token--keyword" style="color:var(--sh-keyword)">const</span><span class="sh__token--space" style="color:var(--sh-space)"> </span><span class="sh__token--identifier" style="color:var(--sh-identifier)">x</span><span class="sh__token--space" style="color:var(--sh-space)"> </span><span class="sh__token--sign" style="color:var(--sh-sign)">=</span><span class="sh__token--space" style="color:var(--sh-space)"> </span><span class="sh__token--class" style="color:var(--sh-class)">1</span><span class="sh__token--sign" style="color:var(--sh-sign)">;</span></span>"`
    );
  });

  it("should highlight JSX syntax", () => {
    const code = '<div className="test">hello</div>';
    const result = highlight(code);
    expect(result).toMatchInlineSnapshot(
      `"<span class="sh__line"><span class="sh__token--sign" style="color:var(--sh-sign)">&lt;</span><span class="sh__token--entity" style="color:var(--sh-entity)">div</span><span class="sh__token--space" style="color:var(--sh-space)"> </span><span class="sh__token--property" style="color:var(--sh-property)">className</span><span class="sh__token--sign" style="color:var(--sh-sign)">=</span><span class="sh__token--string" style="color:var(--sh-string)">&quot;</span><span class="sh__token--string" style="color:var(--sh-string)">test</span><span class="sh__token--string" style="color:var(--sh-string)">&quot;</span><span class="sh__token--sign" style="color:var(--sh-sign)">&gt;</span><span class="sh__token--jsxliterals" style="color:var(--sh-jsxliterals)">hello</span><span class="sh__token--sign" style="color:var(--sh-sign)">&lt;/</span><span class="sh__token--entity" style="color:var(--sh-entity)">div</span><span class="sh__token--sign" style="color:var(--sh-sign)">&gt;</span></span>"`
    );
  });

  it("should highlight multi-line function", () => {
    const code = "function foo() {\n  return true;\n}";
    const result = highlight(code);
    expect(result).toMatchInlineSnapshot(`
      "<span class="sh__line"><span class="sh__token--keyword" style="color:var(--sh-keyword)">function</span><span class="sh__token--space" style="color:var(--sh-space)"> </span><span class="sh__token--identifier" style="color:var(--sh-identifier)">foo</span><span class="sh__token--sign" style="color:var(--sh-sign)">(</span><span class="sh__token--sign" style="color:var(--sh-sign)">)</span><span class="sh__token--space" style="color:var(--sh-space)"> </span><span class="sh__token--sign" style="color:var(--sh-sign)">{</span></span>
      <span class="sh__line"><span class="sh__token--space" style="color:var(--sh-space)">  </span><span class="sh__token--keyword" style="color:var(--sh-keyword)">return</span><span class="sh__token--space" style="color:var(--sh-space)"> </span><span class="sh__token--keyword" style="color:var(--sh-keyword)">true</span><span class="sh__token--sign" style="color:var(--sh-sign)">;</span></span>
      <span class="sh__line"><span class="sh__token--sign" style="color:var(--sh-sign)">}</span></span>"
    `);
  });

  it("should return HTML string with span tags", () => {
    const code = "const x = 1;";
    const result = highlight(code);
    expect(typeof result).toBe("string");
    expect(result).toContain("<span");
    expect(result).toContain("</span>");
  });

  it("should handle empty string", () => {
    const code = "";
    const result = highlight(code);
    expect(result).toBe("");
  });
});
