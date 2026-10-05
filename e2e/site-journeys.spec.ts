import { expect, type Locator, test } from "@playwright/test";

const JAPANESE_POST_URL = /\/ja\/blog\/.+/;
const REQUEST_SCREEN_URL = /token-hub-requests\..+\.webp$/;
const DARK_REQUEST_SCREEN_URL = /token-hub-requests-dark\..+\.webp$/;
const SCREEN_ASSETS = [
  ["token-hub-overview", "token-hub-models", "token-hub-requests"],
  ["kiro-lb-overview", "kiro-lb-accounts", "kiro-lb-settings"],
  ["inferx-overview", "inferx-usage", "inferx-analytics"],
];

async function expectScreenshots(projects: Locator, theme: "light" | "dark") {
  await expect(projects.getByRole("img")).toHaveCount(12);
  await Promise.all(
    SCREEN_ASSETS.map(async (assets, index) => {
      const figure = projects.locator("figure").nth(index);
      await expect(figure.getByRole("link")).toHaveCount(3);
      await Promise.all(
        assets.map(async (asset, screenIndex) => {
          const filename = `${asset}${theme === "dark" ? "-dark" : ""}`;
          const link = figure.getByRole("link").nth(screenIndex);
          await expect(link).toHaveAttribute(
            "href",
            new RegExp(`^/_next/static/media/${filename}\\..+\\.webp$`)
          );
          await expect(link).toHaveAttribute("target", "_blank");
          await expect(link).toHaveCSS(
            "--screen-angle",
            ["-11deg", "0deg", "11deg"][screenIndex]
          );
          await expect(link.getByRole("img")).toHaveAttribute(
            "src",
            new RegExp(`${filename}\\..+\\.webp`)
          );
          await expect(link.getByRole("img")).toHaveCSS(
            "object-position",
            "0% 0%"
          );
        })
      );
    })
  );
  await expect
    .poll(() =>
      projects
        .getByRole("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalHeight > 0 &&
              image.naturalWidth > image.naturalHeight
          )
        )
    )
    .toBe(true);
}

for (const {
  locale,
  prefix,
  loadBalancerTitle,
  privateLabel,
  sampleLabel,
  projectsLabel,
  experimentsLabel,
} of [
  {
    experimentsLabel: "실험",
    loadBalancerTitle: "더 로드밸런서",
    locale: "ko",
    prefix: "",
    privateLabel: "프라이빗",
    projectsLabel: "프로젝트",
    sampleLabel: "샘플 데이터",
  },
  {
    experimentsLabel: "Experiments",
    loadBalancerTitle: "The Load Balancer",
    locale: "en",
    prefix: "/en",
    privateLabel: "Private",
    projectsLabel: "Projects",
    sampleLabel: "Sample data",
  },
  {
    experimentsLabel: "実験",
    loadBalancerTitle: "The Load Balancer",
    locale: "ja",
    prefix: "/ja",
    privateLabel: "プライベート",
    projectsLabel: "プロジェクト",
    sampleLabel: "サンプルデータ",
  },
]) {
  test.describe(`${locale} portfolio`, () => {
    test.use({ locale });

    test(`project collections preserve ${locale} navigation and public links`, async ({
      isMobile,
      page,
    }, testInfo) => {
      await page.goto(prefix || "/");
      await page.getByTestId("home-link-show").click();
      await expect(page).toHaveURL(`${prefix}/show`);
      await expect(page.getByRole("heading", { level: 2 })).toHaveText([
        projectsLabel,
        experimentsLabel,
      ]);
      const projectLinks = page
        .getByRole("navigation", { exact: true, name: projectsLabel })
        .getByRole("link");
      const experimentLinks = page
        .getByRole("navigation", { exact: true, name: experimentsLabel })
        .getByRole("link");
      await expect(projectLinks).toHaveCount(2);
      await expect(experimentLinks).toHaveCount(6);
      expect(
        await projectLinks.evaluateAll((links) =>
          links.map((link) => link.getAttribute("href"))
        )
      ).toEqual([
        `${prefix}/show/the-load-balancer`,
        `${prefix}/show/project-wrench`,
      ]);
      expect(
        await experimentLinks.evaluateAll((links) =>
          links.map((link) => link.getAttribute("href"))
        )
      ).toEqual([
        `${prefix}/show/yet-another-tempfiles`,
        `${prefix}/show/tech-stack-ball`,
        `${prefix}/show/dynamic-hacked-text`,
        `${prefix}/show/new-year-clock`,
        `${prefix}/show/model-card-artwork`,
        `${prefix}/show/unstructured`,
      ]);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("showcase.png"),
      });

      await page.getByTestId("showcase-link-loadBalancer").click();
      await expect(page).toHaveURL(`${prefix}/show/the-load-balancer`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        loadBalancerTitle
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://minpeter.com${prefix}/show/the-load-balancer`
      );
      const detail = page
        .getByTestId("showcase-detail-shell")
        .filter({ visible: true });
      const projects = detail.getByRole("list");
      await expect(projects.getByRole("heading")).toHaveCount(3);
      await expect(projects.locator("p")).toHaveCount(3);
      const tokenhub = projects.getByRole("listitem").filter({
        has: page.getByRole("heading", {
          exact: true,
          name: `Tokenhub ${privateLabel}`,
        }),
      });
      const privateBadge = tokenhub.getByText(privateLabel, { exact: true });
      await expect(privateBadge).toHaveCount(1);
      await expect(privateBadge).toBeVisible();
      await expect(privateBadge.locator("svg")).toHaveCount(1);
      await expect(privateBadge).toHaveCSS("cursor", "default");
      expect(
        await privateBadge.evaluate((badge) =>
          badge.closest('a, button, [role="link"], [role="button"], [tabindex]')
        )
      ).toBeNull();
      await privateBadge.click();
      await expect(page).toHaveURL(`${prefix}/show/the-load-balancer`);
      await expect(tokenhub.getByRole("link")).toHaveCount(3);
      await expect(tokenhub.locator('a[href^="https://"]')).toHaveCount(0);
      await expect(projects.getByRole("link")).toHaveCount(11);
      await expect(
        projects.getByRole("link", { exact: true, name: "kiro-lb" })
      ).toHaveAttribute("href", "https://github.com/minpeter/kiro-lb");
      await expect(
        projects.getByRole("link", { exact: true, name: "InferX" })
      ).toHaveAttribute("href", "https://github.com/inferxhq");
      const githubChips = projects.locator("h2 a > span[aria-hidden]");
      await expect(githubChips).toHaveText(["minpeter", "inferxhq"]);
      await expect(githubChips.locator("svg")).toHaveCount(2);
      await expect(projects.locator("details[open]")).toHaveCount(0);
      await expect(projects.getByRole("term")).toHaveCount(0);
      await expect(projects.getByRole("definition")).toHaveCount(0);
      await expect(projects).not.toContainText(sampleLabel);
      await expect(projects.locator("figcaption")).toHaveCount(0);
      expect(
        await detail.evaluate(
          (element) => element.getBoundingClientRect().width
        )
      ).toBeLessThanOrEqual(512);
      expect(
        await projects.evaluate(
          (element) => element.getBoundingClientRect().height
        )
      ).toBeLessThan(640);
      expect(
        await projects.locator("figure").evaluateAll((figures) =>
          figures.every((figure) => {
            const { bottom, width } = figure.getBoundingClientRect();
            const rowBottom =
              figure.closest("li")?.getBoundingClientRect().bottom ?? 0;
            return (
              width >= 170 &&
              width <= 225 &&
              Math.abs(bottom - rowBottom) <= 1 &&
              getComputedStyle(figure).overflowY === "clip" &&
              Array.from(figure.querySelectorAll("a"))
                .filter((card) => card.getClientRects().length > 0)
                .every((card) => {
                  const bounds = card.getBoundingClientRect();
                  const visibleFraction = (bottom - bounds.top) / bounds.height;
                  return (
                    Number.parseFloat(getComputedStyle(card).width) >= 128 &&
                    visibleFraction >= 0.5 &&
                    visibleFraction <= 0.7
                  );
                })
            );
          })
        )
      ).toBe(true);
      await projects.locator("figure").last().scrollIntoViewIfNeeded();
      await expectScreenshots(projects, "light");
      expect(
        await projects
          .getByRole("heading")
          .getByRole("img")
          .evaluateAll((images) =>
            images.map((image) => ({
              fit: getComputedStyle(image).objectFit,
              height: image.getBoundingClientRect().height,
              width: image.getBoundingClientRect().width,
            }))
          )
      ).toEqual([
        { fit: "contain", height: 32, width: 144 },
        { fit: "contain", height: 32, width: 144 },
        { fit: "contain", height: 32, width: 144 },
      ]);
      await page.mouse.move(0, 0);
      // Scrolling can briefly hover a card; measure its settled resting position.
      await tokenhub.locator("figure").evaluate(async (figure) => {
        await Promise.all(
          figure
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished)
        );
      });
      const cards = tokenhub.locator("figure").getByRole("link");
      const rotations = await cards.evaluateAll((elements) =>
        elements.map(
          (element) => new DOMMatrix(getComputedStyle(element).transform).b
        )
      );
      expect(rotations[0]).toBeLessThan(0);
      expect(rotations[1]).toBe(0);
      expect(rotations[2]).toBeGreaterThan(0);
      if (!isMobile) {
        const restTops = await cards.evaluateAll((elements) =>
          elements.map(
            (element) => element.getBoundingClientRect().top + window.scrollY
          )
        );
        await tokenhub.locator("figure").hover({ position: { x: 4, y: 4 } });
        await expect
          .poll(() =>
            cards
              .last()
              .evaluate(
                (element) =>
                  element.getBoundingClientRect().top + window.scrollY
              )
          )
          .toBeLessThan(restTops[2] - 14);
        await cards.first().hover({ position: { x: 70, y: 30 } });
        await expect(cards.first()).toHaveCSS("z-index", "4");
        await expect
          .poll(() =>
            cards
              .first()
              .evaluate(
                (element) =>
                  new DOMMatrix(getComputedStyle(element).transform).a
              )
          )
          .toBeGreaterThan(1.01);
        await page.screenshot({
          animations: "disabled",
          path: testInfo.outputPath("load-balancer-fan-hover.png"),
        });
        await page.mouse.move(0, 0);
        await expect
          .poll(() =>
            cards
              .first()
              .evaluate(
                (element) =>
                  element.getBoundingClientRect().top + window.scrollY
              )
          )
          .toBeCloseTo(restTops[0], 0);
      }
      const fullSizePagePromise = page.waitForEvent("popup");
      // The center is submerged; click inside the exposed upper half.
      await cards.first().click({ position: { x: 70, y: 30 } });
      const fullSizePage = await fullSizePagePromise;
      await fullSizePage.waitForLoadState();
      await expect(fullSizePage.locator("img")).toHaveJSProperty(
        "naturalWidth",
        720
      );
      await expect(fullSizePage.locator("img")).toHaveJSProperty(
        "naturalHeight",
        480
      );
      await fullSizePage.close();
      await page.mouse.move(0, 0);
      await cards.first().focus();
      await page.keyboard.press("Tab");
      await expect(cards.nth(1)).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(cards.last()).toBeFocused();
      await expect(cards.last()).toHaveCSS("z-index", "4");
      await expect(tokenhub.locator("figure")).toHaveJSProperty("scrollTop", 0);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("load-balancer-fan-focus.png"),
      });
      const backScreenPromise = page.waitForEvent("popup");
      await page.keyboard.press("Enter");
      const backScreen = await backScreenPromise;
      await expect(backScreen).toHaveURL(REQUEST_SCREEN_URL);
      await backScreen.close();
      await page.getByRole("heading", { level: 1 }).click();
      await page.mouse.move(0, 0);
      await expect(cards.last()).toHaveCSS("z-index", "1");
      await expect
        .poll(() =>
          cards
            .last()
            .evaluate(
              (element) => new DOMMatrix(getComputedStyle(element).transform).b
            )
        )
        .toBeCloseTo(rotations[2], 4);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("load-balancer.png"),
      });

      await tokenhub.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(tokenhub.getByRole("term")).toHaveCount(2);
      await expect(tokenhub.getByRole("definition")).toHaveCount(2);
      await expect(projects.locator("details[open]")).toHaveCount(1);
      expect(
        await tokenhub
          .locator("figure")
          .evaluate((figure) =>
            Math.abs(
              figure.getBoundingClientRect().bottom -
                (figure.closest("li")?.getBoundingClientRect().bottom ?? 0)
            )
          )
      ).toBeLessThanOrEqual(1);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("load-balancer-expanded.png"),
      });
      await page.keyboard.press("Enter");
      await expect(projects.locator("details[open]")).toHaveCount(0);

      if (locale === "ko") {
        await page.emulateMedia({
          colorScheme: "dark",
          reducedMotion: "reduce",
        });
        await expect(cards.first()).toHaveCSS("transition-duration", "0s");
        const themeToggle = page.getByRole("button", { name: "테마 전환" });
        await themeToggle.click();
        await expect(page.locator("html")).toHaveClass("dark");
        await expectScreenshots(projects, "dark");
        // Manual light overrides the OS preference; saved dark survives reload.
        await themeToggle.click();
        await expect(page.locator("html")).toHaveClass("light");
        await expectScreenshots(projects, "light");
        await themeToggle.click();
        await expect(page.locator("html")).toHaveClass("dark");
        await page.reload();
        await expect(page.locator("html")).toHaveClass("dark");
        await expectScreenshots(projects, "dark");
        await cards.first().focus();
        await page.keyboard.press("Tab");
        await expect(cards.nth(1)).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(cards.last()).toBeFocused();
        const darkScreenPromise = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const darkScreen = await darkScreenPromise;
        await expect(darkScreen).toHaveURL(DARK_REQUEST_SCREEN_URL);
        await darkScreen.close();
        await page.getByRole("heading", { level: 1 }).click();
        await page.mouse.move(0, 0);
        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath("load-balancer-dark.png"),
        });
      }

      await detail.locator(".showcase-header .fieldnotes-logo-link").click();
      await expect(page).toHaveURL(`${prefix}/show`);
      await page.getByTestId("showcase-link-wrench").click();
      await expect(page).toHaveURL(`${prefix}/show/project-wrench`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Project Wrench"
      );
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(projects.getByRole("link")).toHaveCount(5);
      await expect(projects.locator("p")).toHaveCount(10);
      await expect(githubChips).toHaveText([
        "minpeter",
        "minpeter",
        "minpeter",
        "minpeter",
        "minpeter",
      ]);
      await expect(githubChips.locator("svg")).toHaveCount(5);
      await Promise.all(
        [
          "Wrench",
          "hermes-llama-parse",
          "ai-sdk-tool-call-middleware",
          "plugsuits",
          "pss-runtime",
        ].map((repository) =>
          expect(
            projects.getByRole("link", { exact: true, name: repository })
          ).toHaveAttribute("href", `https://github.com/minpeter/${repository}`)
        )
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("wrench.png"),
      });

      await detail.getByTestId("language-selector").click();
      await page.getByRole("menuitem", { name: "日本語" }).click();
      await expect(page).toHaveURL("/ja/show/project-wrench");
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Project Wrench"
      );
    });
  });
}

for (const destination of ["show", "resume"]) {
  test(`home link reaches ${destination}`, async ({ page }) => {
    await page.goto("/en");
    await page.getByTestId(`home-link-${destination}`).click();
    await expect(page).toHaveURL(`/en/${destination}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
}

test("blog navigation and language menu preserve the current page", async ({
  page,
}) => {
  await page.goto("/en");
  await page.getByTestId("home-link-blog").click();
  await expect(page.getByTestId("blog-list-shell")).toBeVisible();
  await page.getByTestId("language-selector").click();
  await page.getByRole("menuitem", { name: "日本語" }).click();
  await expect(page).toHaveURL("/ja/blog");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.getByTestId("blog-post-link").first().click();
  await expect(page.getByTestId("blog-post-shell")).toBeVisible();
  await expect(page).toHaveURL(JAPANESE_POST_URL);
});

test("tempfiles reports a failed download and can retry", async ({
  page,
}, testInfo) => {
  const releaseDownload = Promise.withResolvers<void>();
  // Never send test files to the real public upload service.
  await page.route("https://api.tmpf.me/**", async (route) => {
    if (route.request().url().endsWith("/upload")) {
      await route.fulfill({
        json: { files: [{ fileName: "example.txt" }], folderId: "test-folder" },
      });
    } else {
      await releaseDownload.promise;
      await route.fulfill({ body: "Unavailable", status: 503 });
    }
  });
  await page.goto("/en");
  await page.getByTestId("home-link-show").click();
  await page.locator('a[href="/en/show/yet-another-tempfiles"]').click();
  await expect(page.getByLabel("Upload files")).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("empty.png"),
  });
  await page.getByLabel("Upload files").setInputFiles({
    buffer: Buffer.from("example"),
    mimeType: "text/plain",
    name: "example.txt",
  });
  await page.getByRole("button", { exact: true, name: "Upload" }).click();
  const download = page.getByRole("button", { name: "Download all files" });
  await expect(download).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("uploaded.png"),
  });
  await download.click();
  await expect(download).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("Downloading files…");
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("downloading.png"),
  });
  releaseDownload.resolve();
  const error = page.getByRole("main").getByRole("alert");
  await expect(error).toContainText("Some files could not be downloaded");
  await expect(download).toBeEnabled();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("download-error.png"),
  });

  await page.route("https://api.tmpf.me/dl/**", (route) =>
    route.fulfill({ body: "example", contentType: "text/plain" })
  );
  const downloaded = page.waitForEvent("download");
  await download.click();
  expect((await downloaded).suggestedFilename()).toBe("example.txt");
  await expect(error).toHaveCount(0);
  await expect(download).toBeEnabled();
});
