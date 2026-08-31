import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, type Page, type Request, test } from "@playwright/test";

const SEARCH_SETTLE_TIMEOUT_MS = 3000;
const MULTI_WORD_QUERY = "cache components";
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

  await page.locator("#blog-search:not([readonly])").fill("traefik");
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

test("preserves spaces during sequential multi-word entry", async ({
  page,
}) => {
  await page.goto("/en/blog");
  await page.route("**/api/search?**", async (route) => {
    await route.fulfill({ json: [] });
  });

  const input = page.locator("#blog-search:not([readonly])");
  const settledSearch = page.waitForResponse((response) => {
    const request = response.request();
    return (
      isSearchRequest(request) &&
      collectSearchRequest(request).query === MULTI_WORD_QUERY
    );
  });

  await input.pressSequentially(MULTI_WORD_QUERY);
  const finalResponse = await settledSearch;
  await expect(input).toHaveValue(MULTI_WORD_QUERY);
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"), {
      timeout: SEARCH_SETTLE_TIMEOUT_MS,
    })
    .toBe(MULTI_WORD_QUERY);

  expect(new URL(page.url()).searchParams.get("q")).toBe(MULTI_WORD_QUERY);
  expect(collectSearchRequest(finalResponse.request()).query).toBe(
    MULTI_WORD_QUERY
  );
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

  const input = page.locator("#blog-search:not([readonly])");
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
