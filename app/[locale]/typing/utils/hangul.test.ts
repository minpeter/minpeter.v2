import { describe, expect, it } from "vitest";
import {
  disassembleHangul,
  disassembleString,
  getCharStrokeCount,
} from "./hangul";

describe("한글 유틸리티", () => {
  describe("getCharStrokeCount (타수 계산)", () => {
    it("영문 및 특수문자는 1타로 계산한다", () => {
      expect(getCharStrokeCount("a")).toBe(1);
      expect(getCharStrokeCount("A")).toBe(1);
      expect(getCharStrokeCount(" ")).toBe(1);
      expect(getCharStrokeCount(".")).toBe(1);
    });

    it("받침 없는 한글은 2타로 계산한다 (초성+중성)", () => {
      expect(getCharStrokeCount("가")).toBe(2);
      expect(getCharStrokeCount("나")).toBe(2);
      expect(getCharStrokeCount("크")).toBe(2);
    });

    it("홑받침 있는 한글은 3타로 계산한다 (초성+중성+종성)", () => {
      expect(getCharStrokeCount("각")).toBe(3);
      expect(getCharStrokeCount("난")).toBe(3);
      expect(getCharStrokeCount("달")).toBe(3);
    });

    it("겹받침 있는 한글은 4타로 계산한다 (초성+중성+종성1+종성2)", () => {
      expect(getCharStrokeCount("닭")).toBe(4);
      expect(getCharStrokeCount("삶")).toBe(4);
      expect(getCharStrokeCount("없")).toBe(4);
    });

    it("쌍자음 받침은 3타로 계산한다 (초성+중성+쌍자음1)", () => {
      expect(getCharStrokeCount("갔")).toBe(3);
      expect(getCharStrokeCount("밖")).toBe(3);
    });
  });

  describe("disassembleHangul (한글 자소 분해)", () => {
    it("받침 없는 글자를 분해한다", () => {
      expect(disassembleHangul("가")).toEqual(["ㄱ", "ㅏ"]);
      expect(disassembleHangul("너")).toEqual(["ㄴ", "ㅓ"]);
    });

    it("홑받침 있는 글자를 분해한다", () => {
      expect(disassembleHangul("각")).toEqual(["ㄱ", "ㅏ", "ㄱ"]);
      expect(disassembleHangul("녕")).toEqual(["ㄴ", "ㅕ", "ㅇ"]);
    });

    it("겹받침 있는 글자를 완전 분해한다", () => {
      expect(disassembleHangul("닭")).toEqual(["ㄷ", "ㅏ", "ㄹ", "ㄱ"]);
      expect(disassembleHangul("삶")).toEqual(["ㅅ", "ㅏ", "ㄹ", "ㅁ"]);
      expect(disassembleHangul("없")).toEqual(["ㅇ", "ㅓ", "ㅂ", "ㅅ"]);
    });

    it("한글이 아닌 문자는 그대로 반환한다", () => {
      expect(disassembleHangul("a")).toEqual(["a"]);
      expect(disassembleHangul(".")).toEqual(["."]);
    });
  });

  describe("disassembleString (문자열 자소 분해)", () => {
    it("문장 전체를 자소 단위로 분해한다", () => {
      const input = "닭이 울었다.";
      const expected = [
        "ㄷ",
        "ㅏ",
        "ㄹ",
        "ㄱ",
        "ㅇ",
        "ㅣ",
        " ",
        "ㅇ",
        "ㅜ",
        "ㄹ",
        "ㅇ",
        "ㅓ",
        "ㅆ",
        "ㄷ",
        "ㅏ",
        ".",
      ];
      expect(disassembleString(input)).toEqual(expected);
    });
  });
});
