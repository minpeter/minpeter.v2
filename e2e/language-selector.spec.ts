import { expect, test } from "@playwright/test";

const languages = {
  en: { label: "English", prefix: "/en", short: "EN" },
  ja: { label: "日本語", prefix: "/ja", short: "JA" },
  ko: { label: "한국어", prefix: "", short: "KO" },
};

// A non-default browser preference must not override an explicit selection.
test.use({ locale: "en-US" });

for (const [pathname, landmark] of [
  ["/blog", '[data-testid="blog-list-shell"]'],
  ["/blog/blog-redesign", '[data-testid="blog-post-content"]'],
  ["/show", '[data-testid="showcase-link-tempfiles"]'],
  ["/show/yet-another-tempfiles", '[data-testid="showcase-detail-shell"]'],
  ["/resume", "section.resume-page"],
] as const) {
  for (const [from, locale] of [
    ["en", "ko"],
    ["ja", "ko"],
    ["ko", "en"],
    ["ko", "ja"],
    ["en", "ja"],
    ["ja", "en"],
  ] as const) {
    test(`${pathname}: ${from} → ${locale} preserves the page and preference`, async ({
      context,
      isMobile,
      page,
    }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      const pageContent = page.locator(landmark).filter({ visible: true });
      // The explicit prefix establishes the source locale, including Korean.
      await page.goto(`/${from}${pathname}`);
      await expect(page.locator("html")).toHaveAttribute("lang", from);
      await expect(pageContent).toBeVisible();
      // Simulate a saved preference even when it matches Accept-Language.
      await context.addCookies([
        {
          name: "MINPETER-LOCATE",
          sameSite: "Lax",
          secure: true,
          url: new URL("/", page.url()).href,
          value: from,
        },
      ]);

      const language = languages[locale];
      const trigger = page
        .getByTestId("language-selector")
        .filter({ visible: true });
      await expect(trigger).toHaveCount(1);
      if (isMobile) {
        await trigger.tap();
      } else {
        await trigger.hover();
      }
      const item = page.getByRole("menuitem", { name: language.label });
      if (isMobile) {
        await item.tap();
      } else {
        await item.click();
      }

      await expect(page).toHaveURL(`${language.prefix}${pathname}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(trigger).toHaveText(language.short);
      await expect(pageContent).toBeVisible();
      expect(
        (await context.cookies()).find(
          (cookie) => cookie.name === "MINPETER-LOCATE"
        )?.value
      ).toBe(locale);

      if (locale === "ko") {
        await page.reload();
        await expect(page).toHaveURL(pathname);
        await expect(page.locator("html")).toHaveAttribute("lang", "ko");
        await expect(trigger).toHaveText("KO");
        await expect(pageContent).toBeVisible();
      }
      expect(pageErrors).toEqual([]);
    });
  }
}

test("language menu supports pointer opening and keyboard selection", async ({
  isMobile,
  page,
}) => {
  await page.goto("/en/blog");
  const trigger = page
    .getByTestId("language-selector")
    .filter({ visible: true });

  if (isMobile) {
    await trigger.tap();
  } else {
    await trigger.hover();
  }
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: "日本語" }).click();
  await expect(page).toHaveURL("/ja/blog");

  await page.mouse.move(0, 0);
  await trigger.focus();
  await trigger.press("ArrowDown");
  const english = page.getByRole("menuitem", { name: "English" });
  await expect(english).toBeFocused();
  await english.press("ArrowDown");
  const korean = page.getByRole("menuitem", { name: "한국어" });
  await expect(korean).toBeFocused();
  await korean.press("Enter");
  await expect(page).toHaveURL("/blog");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByTestId("blog-search")).toHaveAttribute(
    "placeholder",
    "검색어를 입력하세요..."
  );
});

test.describe("touch trigger", () => {
  test.use({ hasTouch: true });

  test("opens after release and can close and reopen without selecting a language", async ({
    page,
  }) => {
    await page.goto("/ko/blog");
    const trigger = page
      .getByTestId("language-selector")
      .filter({ visible: true });
    // Exercise real taps first so the synthetic event sequence runs hydrated.
    await trigger.tap();
    await expect(page.getByRole("menu")).toBeVisible();
    await trigger.tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).toHaveCount(0);

    await trigger.dispatchEvent("pointerdown", {
      button: 0,
      ctrlKey: false,
      pointerType: "touch",
    });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menuitem")).toHaveCount(0);
    await trigger.dispatchEvent("pointerup", { pointerType: "touch" });
    await trigger.dispatchEvent("click");
    await expect(page.getByRole("menuitem", { name: "English" })).toBeVisible();

    await expect(page).toHaveURL("/blog");
    await expect(trigger).toHaveText("KO");
  });

  test("canceled touches do not leak their toggle into later clicks", async ({
    page,
  }) => {
    await page.goto("/ko/blog");
    const trigger = page
      .getByTestId("language-selector")
      .filter({ visible: true });
    await trigger.tap();
    await expect(page.getByRole("menu")).toBeVisible();
    await trigger.tap();
    await expect(page.getByRole("menu")).toHaveCount(0);

    await trigger.dispatchEvent("pointerdown", { pointerType: "touch" });
    await trigger.dispatchEvent("pointercancel", { pointerType: "touch" });
    // A later non-pointer click must not apply the canceled touch's intent.
    await trigger.dispatchEvent("click");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).toHaveCount(0);

    await trigger.focus();
    await trigger.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await trigger.tap();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page).toHaveURL("/blog");
  });
});
