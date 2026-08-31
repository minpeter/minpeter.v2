import { expect, type Page, test } from "@playwright/test";

const BODY_ONLY_QUERY = "body-only-match";
const NEWER_QUERY = "query-with-no-title-match";

interface DeferredResponse {
  readonly promise: Promise<void>;
  readonly release: () => void;
}

function createDeferredResponse(): DeferredResponse {
  let release = (): void => undefined;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

function isSearchResponse(url: string, query: string): boolean {
  const parsedUrl = new URL(url);
  return (
    parsedUrl.pathname === "/api/search" &&
    parsedUrl.searchParams.get("query") === query
  );
}

async function findBodyOnlyResultUrl(page: Page): Promise<string> {
  const result = page.locator('[data-testid="blog-post-link"]:visible').first();
  await expect(result).toBeVisible();
  const href = await result.getAttribute("href");
  expect(href).not.toBeNull();
  return href ?? "";
}

function bodyOnlySearchResult(url: string): readonly Record<string, string>[] {
  return [
    {
      content: BODY_ONLY_QUERY,
      id: "body-only-result",
      type: "text",
      url: `${url}#body-only-result`,
    },
  ];
}

test.use({ channel: "chrome" });

test("keeps the newer failed search authoritative after an older success arrives", async ({
  page,
}) => {
  await page.goto("/en/blog");
  const resultUrl = await findBodyOnlyResultUrl(page);
  const olderResponseGate = createDeferredResponse();

  await page.route("**/api/search?**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("query");
    if (query === BODY_ONLY_QUERY) {
      await olderResponseGate.promise;
      await route.fulfill({ json: bodyOnlySearchResult(resultUrl) });
      return;
    }
    if (query === NEWER_QUERY) {
      await route.fulfill({
        body: "search unavailable",
        contentType: "text/plain",
        status: 500,
      });
      return;
    }
    await route.fulfill({ json: [] });
  });

  const input = page.locator("#blog-search:not([readonly])");
  const olderRequest = page.waitForRequest((request) =>
    isSearchResponse(request.url(), BODY_ONLY_QUERY)
  );
  const olderResponse = page.waitForResponse(
    (response) =>
      isSearchResponse(response.url(), BODY_ONLY_QUERY) &&
      response.status() === 200
  );
  await input.fill(BODY_ONLY_QUERY);
  await olderRequest;

  const newerResponse = page.waitForResponse(
    (response) =>
      isSearchResponse(response.url(), NEWER_QUERY) && response.status() === 500
  );
  await input.fill(NEWER_QUERY);
  await newerResponse;

  const unavailableStatus = page.getByTestId("blog-search-status");
  const list = page.locator(".fieldnotes-list");
  const clearButton = page.locator('.fieldnotes-search button[type="button"]');
  await expect(unavailableStatus).toHaveAttribute("data-state", "unavailable");
  await expect(list).not.toHaveAttribute("aria-busy", "true");
  await expect(clearButton).toBeVisible();

  olderResponseGate.release();
  await olderResponse;

  await expect(unavailableStatus).toHaveAttribute("data-state", "unavailable");
  await expect(list).not.toHaveAttribute("aria-busy", "true");
  await expect(clearButton).toBeVisible();
});

test("hides prior full-text results while the next query debounces", async ({
  page,
}) => {
  await page.goto("/en/blog");
  const resultUrl = await findBodyOnlyResultUrl(page);
  const secondResponseGate = createDeferredResponse();

  await page.route("**/api/search?**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("query");
    if (query === BODY_ONLY_QUERY) {
      await route.fulfill({ json: bodyOnlySearchResult(resultUrl) });
      return;
    }
    await secondResponseGate.promise;
    await route.fulfill({ json: [] });
  });

  const input = page.locator("#blog-search:not([readonly])");
  const uniqueResult = page.locator(`a[href="${resultUrl}"]:visible`);
  const firstResponse = page.waitForResponse(
    (response) =>
      isSearchResponse(response.url(), BODY_ONLY_QUERY) &&
      response.status() === 200
  );
  await input.fill(BODY_ONLY_QUERY);
  await firstResponse;
  await expect(uniqueResult).toBeVisible();
  await expect(page.getByTestId("blog-post-link")).toHaveCount(1);

  const secondResponse = page.waitForResponse((response) =>
    isSearchResponse(response.url(), NEWER_QUERY)
  );
  await input.fill(NEWER_QUERY);
  const visibleQuery = await input.inputValue();
  const staleResultVisible = await uniqueResult.isVisible();
  const busyState = await page
    .locator(".fieldnotes-list")
    .getAttribute("aria-busy");
  secondResponseGate.release();
  await secondResponse;

  expect.soft(visibleQuery).toBe(NEWER_QUERY);
  expect.soft(staleResultVisible).toBe(false);
  expect.soft(busyState).toBe("true");
});

test("drops a body-only success when the newer search fails", async ({
  page,
}) => {
  await page.goto("/en/blog");
  const resultUrl = await findBodyOnlyResultUrl(page);
  const failedResponseGate = createDeferredResponse();

  await page.route("**/api/search?**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("query");
    if (query === BODY_ONLY_QUERY) {
      await route.fulfill({ json: bodyOnlySearchResult(resultUrl) });
      return;
    }
    await failedResponseGate.promise;
    await route.fulfill({
      body: "search unavailable",
      contentType: "text/plain",
      status: 500,
    });
  });

  const input = page.locator("#blog-search:not([readonly])");
  const uniqueResult = page.locator(`a[href="${resultUrl}"]:visible`);
  const successfulResponse = page.waitForResponse(
    (response) =>
      isSearchResponse(response.url(), BODY_ONLY_QUERY) &&
      response.status() === 200
  );
  await input.fill(BODY_ONLY_QUERY);
  await successfulResponse;
  await expect(uniqueResult).toBeVisible();
  await expect(page.getByTestId("blog-post-link")).toHaveCount(1);

  const failedResponse = page.waitForResponse(
    (response) =>
      isSearchResponse(response.url(), NEWER_QUERY) && response.status() === 500
  );
  await input.fill(NEWER_QUERY);
  const staleResultVisible = await uniqueResult.isVisible();
  failedResponseGate.release();
  await failedResponse;

  expect(staleResultVisible).toBe(false);
  await expect(uniqueResult).toBeHidden();
  await expect(page.getByTestId("blog-search-status")).toHaveAttribute(
    "data-state",
    "unavailable"
  );
});

test("hides a prior error while the next query debounces", async ({ page }) => {
  await page.goto("/en/blog");
  const nextResponseGate = createDeferredResponse();

  await page.route("**/api/search?**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("query");
    if (query === BODY_ONLY_QUERY) {
      await route.fulfill({
        body: "search unavailable",
        contentType: "text/plain",
        status: 500,
      });
      return;
    }
    await nextResponseGate.promise;
    await route.fulfill({ json: [] });
  });

  const input = page.locator("#blog-search:not([readonly])");
  const failedResponse = page.waitForResponse(
    (response) =>
      isSearchResponse(response.url(), BODY_ONLY_QUERY) &&
      response.status() === 500
  );
  await input.fill(BODY_ONLY_QUERY);
  await failedResponse;
  const unavailableStatus = page.getByTestId("blog-search-status");
  await expect(unavailableStatus).toBeVisible();

  const nextResponse = page.waitForResponse((response) =>
    isSearchResponse(response.url(), NEWER_QUERY)
  );
  await input.fill(NEWER_QUERY);
  const staleErrorVisible = await unavailableStatus.isVisible();
  const busyState = await page
    .locator(".fieldnotes-list")
    .getAttribute("aria-busy");
  nextResponseGate.release();
  await nextResponse;

  expect.soft(staleErrorVisible).toBe(false);
  expect.soft(busyState).toBe("true");
});
