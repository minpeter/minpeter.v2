const cjkCharacterPattern =
  /[\u3000-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]/u;
const narrowCharacterPattern = /[I.,:;!'|]/u;
const mediumCharacterPattern = /[JL0-9/\u2013_ ]/u;
const wideLatinCharacterPattern = /[MW%&]/u;

/** CJK glyphs are drawn at this fraction of the title size (see og-image). */
export const OG_CJK_SCALE = 0.78;

/** Width of the title column in the OG image, in pixels. */
const OG_TITLE_WIDTH = 942;
// Slack for per-glyph rounding of the scaled CJK font size.
const OG_TITLE_FIT_WIDTH = OG_TITLE_WIDTH - 12;

// Advances (in em of the title size) measured from the Fusion Pixel ko/ja
// fonts, which share Latin metrics.
const getCharacterWidth = (character: string) => {
  if (cjkCharacterPattern.test(character)) {
    return OG_CJK_SCALE;
  }
  if (narrowCharacterPattern.test(character)) {
    return 0.4;
  }
  if (mediumCharacterPattern.test(character)) {
    return 0.5;
  }
  if (wideLatinCharacterPattern.test(character)) {
    return 0.8;
  }
  if (character === "\u2014") {
    return 1;
  }
  return 0.6;
};

export const getOgTitleVisualWidth = (title: string) =>
  [...title].reduce(
    (total, character) => total + getCharacterWidth(character),
    0
  );

export const getOgTitleSize = (visualWidth: number) => {
  const fittedSize = Math.floor(OG_TITLE_FIT_WIDTH / Math.max(1, visualWidth));
  return Math.min(54, Math.max(28, fittedSize));
};

export const getTitleTokens = (title: string) => {
  const tokens: { isCjk: boolean; offset: number; text: string }[] = [];
  let offset = 0;

  for (const character of title) {
    const isCjk = cjkCharacterPattern.test(character);
    const currentToken = tokens.at(-1);

    if (isCjk) {
      tokens.push({ isCjk, offset, text: character });
    } else if (character === " " && currentToken) {
      currentToken.text += character;
    } else if (
      currentToken &&
      !currentToken.isCjk &&
      !currentToken.text.endsWith(" ")
    ) {
      currentToken.text += character;
    } else {
      tokens.push({ isCjk, offset, text: character });
    }
    offset += character.length;
  }

  return tokens;
};
