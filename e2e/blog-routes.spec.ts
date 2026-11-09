import { expect, test as it, test } from "@playwright/test";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const HOME_URL = /\/(?:en|ja)?$/u;

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

  it("soft-navigating out of /products restores light theme tokens, main width, and theme toggle", async ({
    page,
  }) => {
    await page.goto("/products", { waitUntil: "networkidle" });
    const toggle = page.locator("[data-theme-toggle]");
    await expect(toggle).toBeHidden();
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      )
      .toBe("rgb(0, 0, 0)");

    await page.locator("a.store-header-home").filter({ visible: true }).click();
    await expect(page).toHaveURL(HOME_URL);
    await expect(toggle).toBeVisible();
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

  it("global 404 omits language selector while localized 404 keeps clean locale links", async ({
    isMobile,
    page,
  }) => {
    const globalResponse = await page.goto("/en/nonexistent");
    expect(globalResponse?.status()).toBe(404);
    await expect(page.getByTestId("language-selector")).toHaveCount(0);

    const localizedResponse = await page.goto("/en/blog/does-not-exist", {
      waitUntil: "networkidle",
    });
    expect(localizedResponse?.status()).toBe(404);
    const trigger = page
      .getByTestId("language-selector")
      .filter({ visible: true });
    await expect(trigger).toHaveText("EN");
    if (isMobile) {
      await trigger.tap();
    } else {
      await trigger.hover({ scroll: "none" });
    }
    await expect(
      page.getByRole("menuitem", { name: "English" })
    ).toHaveAttribute("href", "/en/blog/does-not-exist");
    await expect(
      page.getByRole("menuitem", { name: "한국어" })
    ).toHaveAttribute("href", "/ko/blog/does-not-exist");
    await expect(
      page.getByRole("menuitem", { name: "日本語" })
    ).toHaveAttribute("href", "/ja/blog/does-not-exist");
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

  it("footer links and theme toggle do not steal taps from adjacent targets at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 800, width: 320 });
    await page.goto("/resume");
    const footer = page.locator("footer");
    const notesLink = footer.getByRole("link", { name: "글" });
    const sourceLink = footer.getByRole("link", { name: "소스" });
    const toggle = footer.locator("[data-theme-toggle]");

    await notesLink.scrollIntoViewIfNeeded();
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
        sourceLeftEdge: document
          .elementFromPoint(source.x + 1, source.y + source.height / 2)
          ?.closest("a, button")?.textContent,
        sourceRightEdge: document
          .elementFromPoint(
            source.x + source.width - 1,
            source.y + source.height / 2
          )
          ?.closest("a, button")?.textContent,
        toggleLeftEdge: document
          .elementFromPoint(theme.x - 8, theme.y + theme.height / 2)
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
      notesRightEdge: "글",
      sourceLeftEdge: "소스",
      sourceRightEdge: "소스",
      toggleLeftEdge: true,
    });
  });
});
