import { expect, test } from "@playwright/test";

const JAPANESE_POST_URL = /\/ja\/blog\/.+/;

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
