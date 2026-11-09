import { expect, test as it, test } from "@playwright/test";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const HOME_URL = /\/(?:en|ja)?$/u;
const BLOG_URL = /\/blog$/u;
const AI_SDK_URL = /\/blog\/ai-sdk$/u;
const DARK_CLASS = /\bdark\b/u;

test.describe("blog routes found by responsive QA", () => {
  for (const path of [
    "/blog/og/ai-sdk",
    "/en/blog/og/ai-sdk",
    "/og/not-found",
    "/ja/og/not-found",
  ]) {
    it(`cached OG route ${path} serves a PNG`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
      expect([...(await response.body()).subarray(0, 4)]).toStrictEqual(
        PNG_SIGNATURE
      );
    });
  }

  for (const path of [
    "/blog/tiny-ko:wandb",
    "/blog/tiny-ko%3Awandb",
    "/en/blog/google-calendar-agent-1:friendli",
    "/ja/blog/google-calendar-agent-1%3Afriendli",
  ]) {
    it(`external post ${path} renders its redirect shell`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      // The streamed loading fallback shares the test id until React swaps it out.
      await expect(
        page
          .locator('[data-testid="blog-post-shell"]:not([aria-busy="true"])')
          .filter({ visible: true })
      ).toBeVisible();
    });
  }

  for (const path of [
    "/blog/does-not-exist",
    "/en/blog/does-not-exist",
    "/ja/blog/does-not-exist",
    "/blog/%EC%95%84%EB%AC%B4%EA%B1%B0%EB%82%98",
    "/blog/a%2Fb",
    "/blog/ai-sdk/extra",
    "/products/does-not-exist",
    "/en/products/does-not-exist",
  ]) {
    it(`unknown path ${path} responds with HTTP 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle("minpeter | 404");
    });
  }

  for (const path of ["/blog/ai-sdk", "/en/blog/ai-sdk", "/products/maru60"]) {
    it(`known path ${path} still responds with HTTP 200`, async ({
      request,
    }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
    });
  }

  it("content images with reserved URL characters load", async ({ page }) => {
    await page.goto("/blog/jekyll-github-pages");
    const image = page.getByRole("img", {
      name: "RVM zsh and oh-my-zsh compatibility warning",
    });
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth)
      )
      .toBeGreaterThan(0);
  });

  it("soft-navigating out of /products restores light theme tokens, theme-color, main width, and theme toggle", async ({
    page,
  }) => {
    const readThemeColors = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('meta[name="theme-color"]')).map(
          (el) => el.getAttribute("content")
        )
      );
    // Record every theme-color value from the first byte so a pre-hydration flash fails the test.
    await page.addInitScript(() => {
      const seen: string[] = [];
      Object.assign(window, { __themeColorHistory: seen });
      new MutationObserver(() => {
        const color = document
          .querySelector('meta[name="theme-color"]')
          ?.getAttribute("content");
        if (color && seen.at(-1) !== color) {
          seen.push(color);
        }
      }).observe(document, {
        attributeFilter: ["content"],
        attributes: true,
        childList: true,
        subtree: true,
      });
    });
    await page.goto("/products", { waitUntil: "networkidle" });
    const toggle = page.locator("[data-theme-toggle]");
    await expect(toggle).toBeHidden();
    await expect.poll(readThemeColors).toEqual(["#000000"]);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { __themeColorHistory: string[] })
            .__themeColorHistory
      )
    ).toEqual(["#000000"]);
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      )
      .toBe("rgb(0, 0, 0)");

    await page.locator("a.store-header-home").filter({ visible: true }).click();
    await expect(page).toHaveURL(HOME_URL);
    await expect(toggle).toBeVisible();
    await expect.poll(readThemeColors).toEqual(["#ffffff"]);
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      )
      .not.toBe("rgb(0, 0, 0)");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            getComputedStyle(document.querySelector("main") as HTMLElement)
              .maxWidth
        )
      )
      .not.toBe("none");
  });

  it("dark theme keeps a single #0a0a0b theme-color meta across reload and soft navigation", async ({
    page,
  }) => {
    const readThemeMetas = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('meta[name="theme-color"]')).map(
          (el) => el.getAttribute("content")
        )
      );

    await page.goto("/", { waitUntil: "networkidle" });
    await expect.poll(readThemeMetas).toEqual(["#ffffff"]);

    await page.locator("[data-theme-toggle]").click();
    await expect(page.locator("html")).toHaveClass(DARK_CLASS);
    await expect.poll(readThemeMetas).toEqual(["#0a0a0b"]);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(DARK_CLASS);
    await expect.poll(readThemeMetas).toEqual(["#0a0a0b"]);

    await page.locator('footer a[href$="/blog"]').click();
    await expect(page).toHaveURL(BLOG_URL);
    await expect.poll(readThemeMetas).toEqual(["#0a0a0b"]);

    await page.locator('a[href$="/blog/ai-sdk"]').first().click();
    await expect(page).toHaveURL(AI_SDK_URL);
    await expect.poll(readThemeMetas).toEqual(["#0a0a0b"]);
  });
});

test.describe("touch targets", () => {
  it.use({
    hasTouch: true,
    isMobile: true,
    // Pin Korean so the unprefixed paths render the default-locale labels.
    locale: "ko-KR",
    // Entry animations translate the header; measure the settled layout.
    reducedMotion: "reduce",
    viewport: { height: 800, width: 375 },
  });

  for (const [path, name] of [
    ["/blog/ai-sdk", "글 목록으로"],
    ["/products", "minpeter"],
    ["/resume", "홈으로"],
    ["/blog/does-not-exist", "글 목록으로"],
  ] as const) {
    it(`${path} "${name}" link is tappable 20px off its text`, async ({
      page,
    }) => {
      await page.goto(path);
      const link = page.locator(".tap-target", { hasText: name }).first();
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      const hits = await page.evaluate(
        ({ x, y }) =>
          [y - 20, y + 20].map(
            (offsetY) =>
              document.elementFromPoint(x, offsetY)?.closest("a")?.textContent
          ),
        {
          x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
          y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
        }
      );
      for (const text of hits) {
        expect(text).toContain(name);
      }
    });
  }

  for (const [path, notesLabel, sourceLabel] of [
    ["/resume", "글", "소스"],
    ["/en/resume", "notes", "source"],
    ["/ja/resume", "記事", "ソース"],
  ] as const) {
    it(`${path} footer links and theme toggle do not steal taps at 320px`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: 800, width: 320 });
      await page.goto(path);
      const footer = page.locator("footer");
      const notesLink = footer.getByRole("link", { name: notesLabel });
      const sourceLink = footer.getByRole("link", { name: sourceLabel });
      const toggle = footer.locator("[data-theme-toggle]");

      await toggle.scrollIntoViewIfNeeded();
      const notesBox = await notesLink.boundingBox();
      const sourceBox = await sourceLink.boundingBox();
      const toggleBox = await toggle.boundingBox();
      expect(notesBox).not.toBeNull();
      expect(sourceBox).not.toBeNull();
      expect(toggleBox).not.toBeNull();

      const hitTargets = await page.evaluate(
        ({ notes, source, theme }) => ({
          notesRightEdge: document
            .elementFromPoint(
              notes.x + notes.width - 1,
              notes.y + notes.height / 2
            )
            ?.closest("a, button")?.textContent,
          sourceBottomOverhang: document
            .elementFromPoint(
              source.x + source.width / 2,
              source.y + source.height + 4
            )
            ?.closest("a, button")?.textContent,
          sourceLeftEdge: document
            .elementFromPoint(source.x + 1, source.y + source.height / 2)
            ?.closest("a, button")?.textContent,
          sourceRightEdge: document
            .elementFromPoint(
              source.x + source.width - 1,
              source.y + source.height / 2
            )
            ?.closest("a, button")?.textContent,
          toggleLeftOverhang: document
            .elementFromPoint(theme.x - 8, theme.y + theme.height / 2)
            ?.closest("a, button")
            ?.hasAttribute("data-theme-toggle"),
          toggleTopOverhang: document
            .elementFromPoint(theme.x + theme.width / 2, theme.y - 8)
            ?.closest("a, button")
            ?.hasAttribute("data-theme-toggle"),
        }),
        {
          notes: notesBox as NonNullable<typeof notesBox>,
          source: sourceBox as NonNullable<typeof sourceBox>,
          theme: toggleBox as NonNullable<typeof toggleBox>,
        }
      );

      expect(hitTargets).toEqual({
        notesRightEdge: notesLabel,
        sourceBottomOverhang: sourceLabel,
        sourceLeftEdge: sourceLabel,
        sourceRightEdge: sourceLabel,
        toggleLeftOverhang: true,
        toggleTopOverhang: true,
      });
    });
  }

  it("untitled 1-line Shiki copy button exposes an unclipped 44x44px touch target", async ({
    page,
  }) => {
    await page.goto("/blog/ai-sdk");
    const figure = page
      .locator("figure.shiki:not(:has(figcaption))")
      .filter({ visible: true })
      .nth(1);
    await figure.scrollIntoViewIfNeeded();
    const copyButton = figure.locator("button").first();
    await expect(copyButton).toBeVisible();

    const figureBox = await figure.boundingBox();
    const buttonBox = await copyButton.boundingBox();
    expect(figureBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    // Ensure we are testing a compact 1-line block (< 60px tall) where clipping used to happen.
    expect(figureBox?.height ?? 0).toBeLessThan(60);

    const hits = await page.evaluate(
      (box) => {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        // button is 24x24 at top=12, right=8; ::after spans [-12px, +8px] vertically and [-12px, +8px] horizontally.
        const points = [
          [cx, box.y - 11],
          [cx, box.y + box.height + 7],
          [box.x - 11, cy],
          [box.x + box.width + 7, cy],
        ] as const;
        return points.map(
          ([px, py]) =>
            document.elementFromPoint(px, py)?.closest("button") !== null
        );
      },
      buttonBox as NonNullable<typeof buttonBox>
    );

    expect(hits).toEqual([true, true, true, true]);
  });
});
