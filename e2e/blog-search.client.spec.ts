import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, type Page, type Request, test } from "@playwright/test";

const SEARCH_SETTLE_TIMEOUT_MS = 3000;
const OVER_LIMIT_QUERY = "😀".repeat(201);
const TRAEFIK_QUERY_URL_RE = /\?q=traefik$/;

test.use({ channel: "chrome" });

interface SearchRequestRecord {
  readonly query: string;
  readonly url: string;
}

function isRscRequest(request: Request): boolean {
  const url = new URL(request.url());
  return request.headers().rsc === "1" || url.searchParams.has("_rsc");
}

function isSearchRequest(request: Request): boolean {
  return new URL(request.url()).pathname === "/api/search";
}

function collectSearchRequest(request: Request): SearchRequestRecord {
  const url = new URL(request.url());
  return {
    query: url.searchParams.get("query") ?? "",
    url: request.url(),
  };
}

async function saveEvidence(
  page: Page,
  name: string,
  evidence: Readonly<Record<string, unknown>>
): Promise<void> {
  const evidenceDirectory = process.env.BLOG_SEARCH_EVIDENCE_DIR;
  if (!evidenceDirectory) {
    return;
  }

  await mkdir(evidenceDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(evidenceDirectory, `${name}.json`),
      `${JSON.stringify(evidence, null, 2)}\n`
    ),
    page.screenshot({
      fullPage: true,
      path: path.join(evidenceDirectory, `${name}.png`),
    }),
  ]);
}

test("updates q without requesting a new RSC payload", async ({ page }) => {
  const rscRequests: string[] = [];
  const searchRequests: SearchRequestRecord[] = [];

  await page.goto("/en/blog");
  page.on("request", (request) => {
    if (isRscRequest(request)) {
      rscRequests.push(request.url());
    }
    if (isSearchRequest(request)) {
      searchRequests.push(collectSearchRequest(request));
    }
  });

  await page.locator("#blog-search").fill("traefik");
  await expect(page).toHaveURL(TRAEFIK_QUERY_URL_RE);
  await expect
    .poll(() => searchRequests.length, { timeout: SEARCH_SETTLE_TIMEOUT_MS })
    .toBe(1);
  await expect(page.getByTestId("blog-post-link").first()).toBeVisible();

  const queryRscRequests = rscRequests.filter(
    (url) => new URL(url).searchParams.get("q") === "traefik"
  );
  await saveEvidence(page, "network", {
    finalUrl: page.url(),
    queryRscRequests,
    rscRequests,
    searchRequests,
  });

  expect(searchRequests).toHaveLength(1);
  expect(queryRscRequests).toHaveLength(0);
});

test("does not reuse successful results after a newer search fails", async ({
  page,
}) => {
  const searchRequests: SearchRequestRecord[] = [];

  await page.route("**/api/search?**", async (route) => {
    const request = route.request();
    const query = new URL(request.url()).searchParams.get("query") ?? "";
    searchRequests.push(collectSearchRequest(request));

    if (query === "traefik") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      body: "search unavailable",
      contentType: "text/plain",
      status: 500,
    });
  });

  await page.goto("/en/blog");
  const input = page.locator("#blog-search");

  await input.fill("traefik");
  await expect(page).toHaveURL(TRAEFIK_QUERY_URL_RE);
  await expect
    .poll(() => searchRequests.some(({ query }) => query === "traefik"))
    .toBe(true);
  await expect(page.getByTestId("blog-post-link").first()).toBeVisible();
  const successfulResultHref = await page
    .getByTestId("blog-post-link")
    .first()
    .getAttribute("href");
  expect(successfulResultHref).not.toBeNull();

  const failedResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/search" &&
      response.status() === 500
  );
  await input.fill("query-with-no-title-match");
  await failedResponse;
  await expect(
    page.getByRole("button", { name: "Clear search" })
  ).toBeVisible();

  const staleResultVisible = successfulResultHref
    ? await page.locator(`a[href="${successfulResultHref}"]`).isVisible()
    : false;
  const status = page.getByTestId("blog-search-status");
  const statusVisible = await status.isVisible();
  const statusState = statusVisible
    ? await status.getAttribute("data-state")
    : null;

  await saveEvidence(page, "edge", {
    searchRequests,
    staleResultVisible,
    statusState,
    statusVisible,
  });

  expect.soft(staleResultVisible).toBe(false);
  expect.soft(statusVisible).toBe(true);
  expect.soft(statusState).toBe("unavailable");
});

test("normalizes direct and whitespace-only queries before searching", async ({
  page,
}) => {
  const searchRequests: SearchRequestRecord[] = [];
  page.on("request", (request) => {
    if (isSearchRequest(request)) {
      searchRequests.push(collectSearchRequest(request));
    }
  });

  await page.goto(`/en/blog?q=${encodeURIComponent(OVER_LIMIT_QUERY)}`);
  await expect
    .poll(() => searchRequests.length, { timeout: SEARCH_SETTLE_TIMEOUT_MS })
    .toBeGreaterThan(0);
  await expect
    .poll(
      () => Array.from(new URL(page.url()).searchParams.get("q") ?? "").length,
      { timeout: SEARCH_SETTLE_TIMEOUT_MS }
    )
    .toBe(200);

  const input = page.locator("#blog-search");
  const directQuery = new URL(page.url()).searchParams.get("q") ?? "";
  const inputQuery = await input.inputValue();
  const requestedQuery = searchRequests.at(-1)?.query ?? "";

  searchRequests.length = 0;
  await input.fill("   ");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"), {
      timeout: SEARCH_SETTLE_TIMEOUT_MS,
    })
    .toBeNull();

  const whitespaceQuery = new URL(page.url()).searchParams.get("q");
  await saveEvidence(page, "boundary", {
    directQueryCodePoints: Array.from(directQuery).length,
    inputQueryCodePoints: Array.from(inputQuery).length,
    requestedQueryCodePoints: Array.from(requestedQuery).length,
    whitespaceQuery,
    whitespaceSearchRequests: searchRequests,
  });

  expect.soft(Array.from(directQuery)).toHaveLength(200);
  expect.soft(Array.from(inputQuery)).toHaveLength(200);
  expect.soft(Array.from(requestedQuery)).toHaveLength(200);
  expect.soft(whitespaceQuery).toBeNull();
  expect.soft(searchRequests).toHaveLength(0);
});
