export const HANGUL_SYLLABLE_START = 0xac_00;
export const HANGUL_SYLLABLE_END = 0xd7_a3;
export const HANGUL_JAMO_START = 0x31_31;
export const HANGUL_JAMO_END = 0x31_8e;

const JONGSUNG_COST = [
  0, 1, 1, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
  1, 1,
];

const JONGSUNG_CHARS = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const COMPLEX_JONGSUNG_MAP: Record<string, string[]> = {
  ㄳ: ["ㄱ", "ㅅ"],
  ㄵ: ["ㄴ", "ㅈ"],
  ㄶ: ["ㄴ", "ㅎ"],
  ㄺ: ["ㄹ", "ㄱ"],
  ㄻ: ["ㄹ", "ㅁ"],
  ㄼ: ["ㄹ", "ㅂ"],
  ㄽ: ["ㄹ", "ㅅ"],
  ㄾ: ["ㄹ", "ㅌ"],
  ㄿ: ["ㄹ", "ㅍ"],
  ㅀ: ["ㄹ", "ㅎ"],
  ㅄ: ["ㅂ", "ㅅ"],
};

const CHOSUNG_CHARS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const JUNGSUNG_CHARS = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];

export const getCharStrokeCount = (char: string): number => {
  const code = char.charCodeAt(0);

  if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) {
    return 1;
  }

  const offset = code - HANGUL_SYLLABLE_START;
  const jongsungIndex = offset % 28;

  return 1 + 1 + JONGSUNG_COST[jongsungIndex];
};

export const disassembleHangul = (char: string): string[] => {
  const code = char.charCodeAt(0);

  if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) {
    return [char];
  }

  const offset = code - HANGUL_SYLLABLE_START;
  const chosungIndex = Math.floor(offset / 28 / 21);
  const jungsungIndex = Math.floor((offset / 28) % 21);
  const jongsungIndex = offset % 28;

  const result: string[] = [CHOSUNG_CHARS[chosungIndex]];
  result.push(JUNGSUNG_CHARS[jungsungIndex]);

  if (jongsungIndex > 0) {
    const jong = JONGSUNG_CHARS[jongsungIndex];
    if (COMPLEX_JONGSUNG_MAP[jong]) {
      result.push(...COMPLEX_JONGSUNG_MAP[jong]);
    } else {
      result.push(jong);
    }
  }

  return result;
};

export const disassembleString = (str: string): string[] => {
  return str.split("").flatMap(disassembleHangul);
};
