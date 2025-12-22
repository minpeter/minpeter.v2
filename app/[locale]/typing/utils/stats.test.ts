import { describe, expect, it } from "vitest";
import { calculateAccuracy, calculateCPM, calculateWPM } from "./stats";

describe("타자 통계 유틸리티", () => {
  describe("calculateWPM (분당 타수 계산)", () => {
    // ... 기존 테스트
    it("빈 입력이나 경과 시간이 0이면 0을 반환한다", () => {
      expect(calculateWPM("", 10)).toBe(0);
      expect(calculateWPM("test", 0)).toBe(0);
    });

    it("영문 타자 속도를 계산한다 (5타 = 1단어)", () => {
      const input = "helloworld";
      const seconds = 6;
      expect(calculateWPM(input, seconds)).toBe(20);
    });

    it("한글 타자 속도를 자소 단위로 계산한다", () => {
      const input = "가나다";
      const seconds = 6;
      expect(calculateWPM(input, seconds)).toBe(12);
    });

    it("겹받침 한글 타자 속도를 정확히 계산한다", () => {
      const input = "닭";
      const seconds = 6;
      expect(calculateWPM(input, seconds)).toBe(8);
    });
  });

  describe("calculateCPM (분당 타수 변환)", () => {
    it("WPM을 CPM(타수)으로 변환한다 (WPM * 5)", () => {
      expect(calculateCPM(100)).toBe(500);
      expect(calculateCPM(0)).toBe(0);
      expect(calculateCPM(20.5)).toBe(103);
    });
  });

  describe("calculateAccuracy (정확도 계산)", () => {
    it("빈 입력이면 0을 반환한다", () => {
      expect(calculateAccuracy("", "target")).toBe(0);
    });

    it("완벽하게 일치하면 100을 반환한다", () => {
      expect(calculateAccuracy("hello", "hello")).toBe(100);
      expect(calculateAccuracy("안녕하세요", "안녕하세요")).toBe(100);
    });

    it("영문 대소문자를 구분하지 않는다", () => {
      expect(calculateAccuracy("Hello", "hello")).toBe(100);
    });

    it("한글 부분 일치 정확도를 자소 단위로 계산한다", () => {
      expect(calculateAccuracy("닥", "닭")).toBe(67);
    });

    it("입력 길이가 다를 때의 정확도를 계산한다", () => {
      expect(calculateAccuracy("hello", "hell")).toBe(80);
      expect(calculateAccuracy("hell", "hello")).toBe(100);
    });
  });
});
