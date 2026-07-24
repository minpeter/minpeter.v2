// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import Page from "../page";

const messages = {
  home: {
    exploreLabel: "둘러보기",
    homeLabel: "minpeter 홈",
    introduction:
      "글을 쓰고, 디자인하고, 코드를 짭니다. 아이디어를 소프트웨어로 구현합니다.",
    role: "소프트웨어 엔지니어",
    sections: {
      developmentNotes: {
        description: "기술 메모와 튜토리얼, 소프트웨어를 만들며 배운 것들.",
        title: "개발 노트",
      },
      interactiveExperiments: {
        description: "작은 프로토타입과 시각적 놀이, 인터페이스 실험.",
        title: "인터랙티브 실험",
      },
      resume: {
        description: "경력과 활동 이력 — 곧 공개합니다.",
        title: "이력서 (작성 중)",
      },
    },
    socialLabel: "소셜 링크",
    socialTitle: "소셜",
  },
} as const;

function renderHome() {
  return render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <Page />
    </NextIntlClientProvider>
  );
}

describe("app/[locale]/page.tsx home", () => {
  it("extends the logo link tap target beyond the 32px icon", () => {
    renderHome();

    const homeLink = screen.getByRole("link", { name: "minpeter 홈" });
    expect(homeLink.className).toContain("p-2.5");
    expect(homeLink.className).toContain("-m-2.5");
  });

  it("uses type scale tokens instead of arbitrary bracket values", () => {
    renderHome();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("tracking-tight");
    expect(heading.className).not.toContain("tracking-[");

    const intro = screen.getByText(
      "글을 쓰고, 디자인하고, 코드를 짭니다. 아이디어를 소프트웨어로 구현합니다."
    );
    expect(intro.className).toContain("text-sm");
    expect(intro.className).toContain("leading-snug");
    expect(intro.className).not.toContain("text-[15px]");
    expect(intro.className).not.toContain("leading-[");
    expect(intro.className).not.toContain("tracking-[");
  });
});
