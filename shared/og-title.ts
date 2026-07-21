const cjkCharacterPattern =
  /[\u3000-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]/u;
const narrowCharacterPattern = /[I1.,:;!'|]/u;
const wideLatinCharacterPattern = /[MW@#%&]/u;

const getCharacterWidth = (character: string) => {
  if (character === " " || narrowCharacterPattern.test(character)) {
    return 0.35;
  }
  if (cjkCharacterPattern.test(character)) {
    return 1;
  }
  if (wideLatinCharacterPattern.test(character)) {
    return 0.85;
  }
  return 0.62;
};

export const getOgTitleVisualWidth = (title: string) =>
  [...title].reduce(
    (total, character) => total + getCharacterWidth(character),
    0
  );

export const getOgTitleSize = (visualWidth: number) => {
  const fittedSize = Math.floor(960 / Math.max(1, visualWidth));
  return Math.min(54, Math.max(28, fittedSize));
};

export const getTitleTokens = (title: string) => {
  const tokens: { isCjk: boolean; text: string }[] = [];

  for (const character of title) {
    const isCjk = cjkCharacterPattern.test(character);
    const currentToken = tokens.at(-1);

    if (isCjk) {
      tokens.push({ isCjk, text: character });
    } else if (character === " " && currentToken) {
      currentToken.text += character;
    } else if (
      currentToken &&
      !currentToken.isCjk &&
      !currentToken.text.endsWith(" ")
    ) {
      currentToken.text += character;
    } else {
      tokens.push({ isCjk, text: character });
    }
  }

  return tokens;
};
