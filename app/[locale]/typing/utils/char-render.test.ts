import { describe, expect, it } from "vitest";
import { buildCharRenderState } from "./char-render";

describe("문자 렌더링 유틸리티", () => {
  const baseParams = {
    char: "가",
    index: 0,
    userInput: "",
    isComposing: false,
    composingText: "",
    currentSentenceIndex: 0,
  };

  it("입력하지 않은 글자는 흐리게 표시된다", () => {
    const state = buildCharRenderState({
      ...baseParams,
      index: 1, // 현재 입력 위치(0)보다 뒤에 있는 글자
    });
    expect(state.display).toBe("가");
    expect(state.className).toContain("opacity-30");
    expect(state.className).not.toContain("text-emerald-400");
    expect(state.className).not.toContain("text-pink-400");
  });

  it("현재 타이핑 중인 위치(커서)는 진하게 표시된다", () => {
    const state = buildCharRenderState({
      ...baseParams,
      userInput: "",
    });
    expect(state.className).toContain("opacity-100");
    expect(state.className).not.toContain("text-emerald-400");
  });

  it("올바르게 입력한 글자는 초록색으로 표시된다", () => {
    const state = buildCharRenderState({
      ...baseParams,
      userInput: "가",
      index: 0,
    });
    expect(state.display).toBe("가");
    expect(state.className).toContain("text-emerald-400");
    expect(state.className).toContain("opacity-100");
  });

  it("틀리게 입력한 글자는 분홍색으로 표시된다", () => {
    const state = buildCharRenderState({
      ...baseParams,
      userInput: "나",
      index: 0,
    });
    expect(state.display).toBe("나");
    expect(state.className).toContain("text-pink-400");
  });

  it("한글 조합 중인 글자는 밑줄이 표시된다", () => {
    const state = buildCharRenderState({
      ...baseParams,
      userInput: "",
      index: 0,
      isComposing: true,
      composingText: "ㄱ",
    });
    expect(state.display).toBe("ㄱ");
    expect(state.className).toContain("border-b-2");
  });

  it("공백을 올바르게 입력하면 공백으로 표시된다", () => {
    const state = buildCharRenderState({
      ...baseParams,
      char: " ",
      userInput: " ",
      index: 0,
    });
    expect(state.display).toBe(" ");
    expect(state.className).toContain("text-emerald-400");
  });

  it("공백이 아닌데 공백을 입력하면 언더바(_)로 표시된다 (Wrong Space)", () => {
    const state = buildCharRenderState({
      ...baseParams,
      char: "가",
      userInput: " ",
      index: 0,
    });
    expect(state.display).toBe("_");
    expect(state.className).toContain("text-pink-400");
  });

  it("공백인데 다른 글자를 입력하면 언더바(_)로 표시된다 (Typed Space)", () => {
    const state = buildCharRenderState({
      ...baseParams,
      char: " ",
      userInput: "가",
      index: 0,
    });
    expect(state.display).toBe("_");
    expect(state.className).toContain("text-pink-400");
  });
});
