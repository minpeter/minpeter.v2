import { expect, test } from "@playwright/test";

for (const scenario of [
  {
    back: "Back home",
    home: "/en",
    locale: "en",
    reload: "Reload page",
    theme: "Toggle theme",
    title: "This page didn’t load.",
    viewport: { height: 800, width: 1280 },
  },
  {
    back: "홈으로 돌아가기",
    home: "",
    locale: "ko",
    reload: "새로고침",
    theme: "테마 전환",
    title: "페이지를 불러오지 못했어요.",
    viewport: { height: 844, width: 390 },
  },
  {
    back: "ホームに戻る",
    home: "/ja",
    locale: "ja",
    reload: "再読み込み",
    theme: "テーマを切り替え",
    title: "ページを読み込めませんでした。",
    viewport: { height: 844, width: 390 },
  },
]) {
  test.describe(`${scenario.locale} error recovery`, () => {
    test.use({ locale: scenario.locale, viewport: scenario.viewport });

    test("recovers from a missing route chunk without losing the locale", async ({
      page,
    }, testInfo) => {
      // Identify the experiment's client chunk by its alphabet, not a build hash.
      // Failing it on soft navigation exercises the real Next error boundary.
      await page.route("**/_next/static/chunks/*.js", async (route) => {
        const response = await route.fetch();
        if ((await response.text()).includes("ABCDEFGHIJKLMNOPQRSTUVWXYZ")) {
          await route.fulfill({
            body: "Missing route chunk (test)",
            contentType: "text/plain",
            status: 404,
          });
          return;
        }
        await route.fulfill({ response });
      });

      await page.goto(`${scenario.home}/show`);
      await page.getByTestId("showcase-link-dynamicText").click();
      const panel = page.getByTestId("error-panel");
      await expect(panel.getByRole("heading")).toHaveText(scenario.title);
      await expect(panel.getByRole("link")).toHaveAttribute(
        "href",
        scenario.home || "/"
      );
      await expect(page.locator("html")).toHaveClass("light");
      await page.screenshot({ path: testInfo.outputPath("error-light.png") });
      await page.getByRole("button", { name: scenario.theme }).click();
      await expect(page.locator("html")).toHaveClass("dark");
      await page.screenshot({ path: testInfo.outputPath("error-dark.png") });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);

      const recovery = panel.getByRole(
        scenario.locale === "ja" ? "link" : "button",
        { name: scenario.locale === "ja" ? scenario.back : scenario.reload }
      );
      await page.keyboard.press("Tab");
      await recovery.focus();
      await expect(recovery).toBeFocused();
      await expect(recovery).toHaveCSS("outline-style", "solid");

      await page.unrouteAll({ behavior: "wait" });
      const navigation = page.waitForRequest(
        (request) =>
          request.isNavigationRequest() && request.frame() === page.mainFrame()
      );
      await recovery.press("Enter");
      await navigation;
      await expect(panel).toHaveCount(0);
      await expect(page.locator("html")).toHaveClass("dark");
      await expect(page).toHaveURL(
        scenario.locale === "ja"
          ? "/ja"
          : `${scenario.home}/show/dynamic-hacked-text`
      );
      if (scenario.locale === "ja") {
        await expect(page.getByTestId("home-page")).toBeVisible();
      } else {
        await expect(page.getByTestId("showcase-detail-shell")).toBeVisible();
      }
      // Hydration and interaction still work after recovery, not only the HTML.
      await page.getByRole("button", { name: scenario.theme }).click();
      await expect(page.locator("html")).toHaveClass("light");
    });
  });
}
