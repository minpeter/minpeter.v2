// biome-ignore-all lint/performance/noAwaitInLoops: Each selection and history step verifies the preceding UI state.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import {
  expect,
  type Page,
  type Request,
  type TestInfo,
  test,
} from "@playwright/test";

import en from "../shared/i18n/en.json" with { type: "json" };
import ja from "../shared/i18n/ja.json" with { type: "json" };
import manifests from "../shared/keyboard-customization-manifests.json" with {
  type: "json",
};

const ko: typeof en = JSON.parse(
  readFileSync(new URL("../shared/i18n/ko.json", import.meta.url), "utf8")
);

const combinations = manifests as {
  id: string;
  housingId: string;
  keycapId: string;
  frames: { src: string }[];
}[];
const isValidated = (housing: string, keycaps: string) =>
  combinations.some(
    (combination) =>
      combination.housingId === housing && combination.keycapId === keycaps
  );

const DETAIL = "/products/rule60-hhkb-unibody";
const CUSTOM_FRAME = /\/assets\/products\/rule60-hhkb-unibody\/customization\//;
const HOUSINGS = [
  "bone-white",
  "ash-gray",
  "charcoal",
  "ice-blue",
  "lilac-purple",
  "dark-green",
  "white-marble",
];
const KEYCAPS = [
  "retro-programmer-retail",
  "nicepbt-bow-retail",
  "pbtfans-wob-retail",
  "nicepbt-noel-latin-retail",
  "nicepbt-purple-chonkers-retail",
];

const PENDING = HOUSINGS.flatMap((housing) =>
  KEYCAPS.map((keycaps) => ({ housing, keycaps }))
).filter(({ housing, keycaps }) => !isValidated(housing, keycaps));
const [pendingTrail] = PENDING.flatMap((initial) =>
  PENDING.filter(
    (next) =>
      next.housing !== initial.housing && next.keycaps === initial.keycaps
  ).flatMap((housingChanged) =>
    PENDING.filter(
      (next) =>
        next.housing === housingChanged.housing &&
        next.keycaps !== housingChanged.keycaps
    ).map((keycapsChanged) => ({ housingChanged, initial, keycapsChanged }))
  )
);
// Prefer a keycap change: this remains an always-on regression for the original Back bug.
const readyPairs = combinations.flatMap((first) =>
  combinations
    .filter(
      (second) =>
        first.id !== second.id &&
        (first.housingId === second.housingId ||
          first.keycapId === second.keycapId)
    )
    .map((second) => [first, second] as const)
);
const READY_PAIR =
  readyPairs.find(([first, second]) => first.housingId === second.housingId) ??
  readyPairs[0];
type Combination = (typeof combinations)[number];

const LOCALES = [
  { locale: "ko", messages: ko, prefix: "" },
  { locale: "en", messages: en, prefix: "/en" },
  { locale: "ja", messages: ja, prefix: "/ja" },
];

async function expectSelection(
  page: Page,
  selection: { housing: string; keycaps: string }
) {
  await expect(
    page.locator(`input[name="housing"][value="${selection.housing}"]`)
  ).toBeChecked();
  await expect(
    page.locator(`input[name="keycaps"][value="${selection.keycaps}"]`)
  ).toBeChecked();
}

async function expectHistorySelection(
  page: Page,
  selection: { housing: string; keycaps: string },
  testInfo: TestInfo
) {
  try {
    await expect(page).toHaveURL(
      (url) =>
        (url.searchParams.get("housing") ?? "transparent") ===
          selection.housing &&
        (url.searchParams.get("keycaps") ?? "inventor") === selection.keycaps
    );
    for (const group of ["housing", "keycaps"] as const) {
      await expect(
        page.locator("label.store-custom-option").filter({
          has: page.locator(
            `input[name="${group}"][value="${selection[group]}"]`
          ),
        })
      ).toHaveAttribute("data-selected", "true");
    }
    await expectSelection(page, selection);
  } catch (error) {
    const diagnosticPath = testInfo.outputPath("history-selection-state.json");
    mkdirSync(testInfo.outputDir, { recursive: true });
    writeFileSync(
      diagnosticPath,
      JSON.stringify(
        {
          expected: selection,
          state: await page.evaluate(() => ({
            inputs: Array.from(
              document.querySelectorAll<HTMLInputElement>(
                'input[name="housing"], input[name="keycaps"]'
              )
            ).map((input) => ({
              checked: input.checked,
              defaultChecked: input.defaultChecked,
              name: input.name,
              selected: input.closest("label")?.getAttribute("data-selected"),
              value: input.value,
            })),
            url: location.href,
          })),
        },
        null,
        2
      )
    );
    await testInfo.attach("history-selection-state", {
      contentType: "application/json",
      path: diagnosticPath,
    });
    throw error;
  }
}

async function expectRegistryPreview(
  page: Page,
  housing: string,
  keycaps: string
) {
  if (isValidated(housing, keycaps)) {
    await expect(page.locator(".store-custom-preview")).toHaveAttribute(
      "data-combination",
      `${housing}--${keycaps}`
    );
    await expect(page.getByTestId("customization-pending")).toHaveCount(0);
    await expect(page.getByTestId("product-spin")).toHaveAttribute(
      "data-loaded-count",
      "12",
      { timeout: 15_000 }
    );
  } else {
    await expectPending(page, en.products.customization.pending);
  }
  await expect(page.getByTestId("personal-showcase-notice")).toHaveCount(0);
}

async function selectOption(
  page: Page,
  group: "housing" | "keycaps",
  value: string
) {
  const input = page.locator(`input[name="${group}"][value="${value}"]`);
  await page
    .locator("label.store-custom-option")
    .filter({ has: input })
    .click();
  await expect(input).toBeChecked();
}

async function expectPending(page: Page, text: string) {
  const customizer = page.getByTestId("product-customizer");
  await expect(page.getByTestId("customization-pending")).toBeVisible();
  await expect(
    page.getByTestId("customization-pending").getByRole("status")
  ).toContainText(text);
  await expect(customizer.locator("img, canvas")).toHaveCount(0);
  await expect(customizer.getByTestId("product-spin")).toHaveCount(0);
  await expect(page.getByTestId("personal-showcase-notice")).toHaveCount(0);
}

/** Compare the full-resolution painted pixels with this selection's actual manifest frame.
 * Both paths use the same browser decode/color conversion and copy compositing. Ignore RGB
 * under zero alpha and allow one byte of rounding, not a screenshot/perceptual tolerance.
 */
async function expectReadyHistoryState(
  page: Page,
  combination: Combination,
  messages: typeof en,
  testInfo: TestInfo
) {
  await expectHistorySelection(
    page,
    { housing: combination.housingId, keycaps: combination.keycapId },
    testInfo
  );
  await expect(page.locator(".store-custom-preview")).toHaveCount(1);
  await expect(page.locator(".store-custom-preview")).toHaveAttribute(
    "data-combination",
    combination.id
  );
  await expect(page.getByTestId("customization-pending")).toHaveCount(0);
  await expect(page.getByTestId("personal-showcase-notice")).toHaveCount(0);
  const labels = messages.products.customization;
  const housingName =
    labels.housingNames[
      combination.housingId as keyof typeof labels.housingNames
    ];
  const kitName = await page
    .locator("label.store-custom-option")
    .filter({
      has: page.locator(
        `input[name="keycaps"][value="${combination.keycapId}"]`
      ),
    })
    .locator("span")
    .evaluate((element) => element.firstChild?.textContent?.trim() ?? "");
  expect(kitName).not.toBe("");
  await expect(page.locator(".store-custom-selection")).toHaveText(
    labels.selected
      .replace("{housing}", housingName)
      .replace("{keycaps}", kitName)
  );
  const spin = page.getByTestId("product-spin");
  await spin.scrollIntoViewIfNeeded();
  await expect(spin).toHaveAttribute("data-loaded-count", "12", {
    timeout: 15_000,
  });
  await expect(spin).toHaveAttribute("data-frame", "11");
  await expect(spin).toHaveAttribute("data-displayed-frame", "11");
  await expect(spin).toHaveAttribute("aria-valuetext", "330°");
  await expect(spin).toHaveAttribute("data-resolution", "full");
  await expect(spin.locator("img")).toHaveCount(0);
  await expect(spin.locator("canvas")).toHaveCount(1);
  await expect(
    page.locator(".store-custom-preview").getByRole("status")
  ).toHaveText(labels.ready);
  const source = combination.frames[11]?.src;
  if (!source) {
    throw new Error(`Missing 330 degree manifest frame: ${combination.id}`);
  }
  const comparison = await spin
    .locator("canvas")
    .evaluate(async (element, src) => {
      const painted = element as HTMLCanvasElement;
      const context = painted.getContext("2d");
      if (!context) {
        throw new Error("Painted canvas has no 2D context");
      }
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Reference frame returned ${response.status}`);
      }
      const bitmap = await createImageBitmap(await response.blob());
      try {
        const reference = document.createElement("canvas");
        reference.width = painted.width;
        reference.height = painted.height;
        const expectedContext = reference.getContext("2d");
        if (!expectedContext) {
          throw new Error("Reference canvas has no 2D context");
        }
        expectedContext.globalCompositeOperation = "copy";
        expectedContext.drawImage(
          bitmap,
          0,
          0,
          reference.width,
          reference.height
        );
        const actual = context.getImageData(
          0,
          0,
          painted.width,
          painted.height
        ).data;
        const expected = expectedContext.getImageData(
          0,
          0,
          reference.width,
          reference.height
        ).data;
        let differences = 0;
        let visiblePixels = 0;
        for (let offset = 0; offset < expected.length; offset += 4) {
          if (expected[offset + 3] > 0) {
            visiblePixels += 1;
          }
          for (let channel = 0; channel < 4; channel += 1) {
            if (
              channel < 3 &&
              expected[offset + 3] === 0 &&
              actual[offset + 3] === 0
            ) {
              continue;
            }
            if (
              Math.abs(expected[offset + channel] - actual[offset + channel]) >
              1
            ) {
              differences += 1;
            }
          }
        }
        return {
          differences,
          height: painted.height,
          visiblePixels,
          width: painted.width,
        };
      } finally {
        bitmap.close();
      }
    }, source);
  expect(comparison).toMatchObject({
    differences: 0,
    height: 1536,
    width: 1024,
  });
  expect(comparison.visiblePixels).toBeGreaterThan(0);
}

for (const { locale, prefix, messages } of LOCALES) {
  test.describe(`${locale} customization`, () => {
    test.use({ locale });
    test("legacy URLs canonicalize and explicit personal cross-pairs stay image-free", async ({
      page,
    }) => {
      const labels = messages.products.customization;
      await page.goto(
        `${prefix}${DETAIL}?customize=false&housing=charcoal&keycaps=nicepbt-bow-retail&campaign=launch#render`
      );
      await expect(page).toHaveURL(
        (url) =>
          !url.searchParams.has("customize") &&
          url.searchParams.get("housing") === "transparent" &&
          url.searchParams.get("keycaps") === "inventor" &&
          url.searchParams.get("campaign") === "launch" &&
          url.hash === "#render"
      );
      await expectSelection(page, {
        housing: "transparent",
        keycaps: "inventor",
      });
      await expect(page.getByTestId("personal-showcase-notice")).toHaveText(
        labels.showcaseNote
      );
      await page.reload();
      await expectSelection(page, {
        housing: "transparent",
        keycaps: "inventor",
      });
      const [retail] = combinations;
      if (!retail) {
        throw new Error(
          "Legacy retail compatibility requires a reviewed combination"
        );
      }
      await page.goto(
        `${prefix}${DETAIL}?customize=true&housing=${retail.housingId}&keycaps=${retail.keycapId}`
      );
      await expect(page).toHaveURL(
        (url) =>
          !url.searchParams.has("customize") &&
          url.searchParams.get("housing") === retail.housingId &&
          url.searchParams.get("keycaps") === retail.keycapId
      );
      await expectSelection(page, {
        housing: retail.housingId,
        keycaps: retail.keycapId,
      });
      await page.getByTestId("product-spin").scrollIntoViewIfNeeded();
      await expectRegistryPreview(page, retail.housingId, retail.keycapId);
      for (const selection of [
        { housing: "transparent", keycaps: retail.keycapId },
        { housing: retail.housingId, keycaps: "inventor" },
      ]) {
        await page.goto(
          `${prefix}${DETAIL}?housing=${selection.housing}&keycaps=${selection.keycaps}`
        );
        await expectSelection(page, selection);
        await expect(
          page.getByTestId("customization-unavailable")
        ).toBeVisible();
        await expect(
          page.getByTestId("customization-unavailable").getByRole("status")
        ).toContainText(labels.unsupported);
        await expect(page.getByTestId("product-customizer")).toHaveAttribute(
          "data-configuration",
          "unsupported"
        );
        await expect(page.getByTestId("product-customizer")).toHaveAttribute(
          "data-orderable",
          "false"
        );
        await expect(
          page.getByTestId("product-customizer").locator("img, canvas")
        ).toHaveCount(0);
        await expect(page.getByTestId("personal-showcase-notice")).toHaveCount(
          0
        );
        await page.reload();
        await expectSelection(page, selection);
        await expect(
          page.getByTestId("customization-unavailable")
        ).toBeVisible();
        await expect(
          page.getByTestId("product-customizer").locator("img, canvas")
        ).toHaveCount(0);
      }
    });

    for (const width of [320, 393, 1440]) {
      test(`unified personal and retail selectors preserve history and refresh: ${prefix || "ko"}, ${width}px`, async ({
        page,
      }, testInfo) => {
        const [retail] = combinations;
        if (!retail) {
          throw new Error(
            "Unified selection coverage requires a reviewed retail combination"
          );
        }
        const labels = messages.products.customization;
        await page.setViewportSize({
          height: width === 1440 ? 900 : 852,
          width,
        });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(`${prefix}${DETAIL}`);
        await expectSelection(page, {
          housing: "transparent",
          keycaps: "inventor",
        });
        await expect(page.locator(".store-custom-modes")).toHaveCount(0);
        await expect(page.locator('input[name="housing"]')).toHaveCount(
          HOUSINGS.length + 1
        );
        await expect(page.locator('input[name="keycaps"]')).toHaveCount(
          KEYCAPS.length + 1
        );
        await expect(page.getByTestId("product-customizer")).toHaveAttribute(
          "data-configuration",
          "personal"
        );
        await expect(page.getByTestId("product-customizer")).toHaveAttribute(
          "data-orderable",
          "false"
        );
        await expect(page.getByTestId("personal-showcase-notice")).toHaveText(
          labels.showcaseNote
        );
        await expect(page.getByTestId("product-spin")).toHaveAttribute(
          "aria-valuemax",
          "71"
        );
        await expect(page.locator(".store-custom-selection")).toHaveText(
          labels.selected
            .replace("{housing}", labels.housingNames.transparent)
            .replace("{keycaps}", "Inventor")
        );
        await selectOption(page, "housing", retail.housingId);
        if (retail.keycapId !== "retro-programmer-retail") {
          await selectOption(page, "keycaps", retail.keycapId);
        }
        await expectHistorySelection(
          page,
          { housing: retail.housingId, keycaps: retail.keycapId },
          testInfo
        );
        await page.getByTestId("product-spin").scrollIntoViewIfNeeded();
        await expectRegistryPreview(page, retail.housingId, retail.keycapId);
        await expect(page.getByTestId("product-spin")).toHaveAttribute(
          "aria-valuemax",
          "11"
        );
        await selectOption(page, "keycaps", "inventor");
        await expectHistorySelection(
          page,
          { housing: "transparent", keycaps: "inventor" },
          testInfo
        );
        await expect(page.getByTestId("personal-showcase-notice")).toHaveText(
          labels.showcaseNote
        );
        await expect(page.locator(".store-custom-preview")).toHaveCount(0);
        await expect(
          page.getByTestId("customization-pairing-notice")
        ).toHaveText(labels.pairedPersonal);
        await page.goBack();
        await expectHistorySelection(
          page,
          { housing: retail.housingId, keycaps: retail.keycapId },
          testInfo
        );
        await page.getByTestId("product-spin").scrollIntoViewIfNeeded();
        await expectRegistryPreview(page, retail.housingId, retail.keycapId);
        await page.goForward();
        await expectHistorySelection(
          page,
          { housing: "transparent", keycaps: "inventor" },
          testInfo
        );
        await expect(page.getByTestId("personal-showcase-notice")).toHaveText(
          labels.showcaseNote
        );
        await page.reload();
        await expectHistorySelection(
          page,
          { housing: "transparent", keycaps: "inventor" },
          testInfo
        );
        await expect(page.getByTestId("product-spin")).toHaveAttribute(
          "aria-valuemax",
          "71"
        );
        await expect(page.getByTestId("product-customizer")).toHaveAttribute(
          "data-orderable",
          "false"
        );
        await expect(page.locator(".store-custom-preview")).toHaveCount(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true);
        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath("unified-personal-selection.png"),
        });
      });

      test(`pending retail configuration, controls and history: ${prefix || "ko"}, ${width}px`, async ({
        page,
      }, testInfo) => {
        // biome-ignore lint/suspicious/noSkippedTests: This scenario needs three connected unvalidated configurations; all-ready catalogs have no pending UI.
        test.skip(
          !pendingTrail,
          "Insufficient pending configurations to exercise both controls without activating a reviewed render"
        );
        const { initial, housingChanged, keycapsChanged } = pendingTrail;
        const labels = messages.products.customization;
        const customRequests: string[] = [];
        page.on("request", (request) => {
          if (CUSTOM_FRAME.test(request.url())) {
            customRequests.push(request.url());
          }
        });
        await page.setViewportSize({
          height: width === 1440 ? 900 : 852,
          width,
        });
        await page.goto(
          `${prefix}${DETAIL}?housing=${initial.housing}&keycaps=${initial.keycaps}`
        );
        await expect(page).toHaveURL(
          (url) => url.pathname === `${prefix}${DETAIL}`
        );
        await expectPending(page, labels.pending);
        await expect(page.locator(".store-custom-modes")).toHaveCount(0);
        await expect(page.locator('input[name="housing"]')).toHaveCount(
          HOUSINGS.length + 1
        );
        await expect(page.locator('input[name="keycaps"]')).toHaveCount(
          KEYCAPS.length + 1
        );
        await expectSelection(page, initial);
        await expect(page.getByTestId("product-customizer")).toContainText(
          labels.configurationNote
        );
        await expect(page.getByTestId("product-customizer")).toContainText(
          labels.approximation
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true);

        await selectOption(page, "housing", housingChanged.housing);
        await expect(page).toHaveURL(
          (url) =>
            (url.searchParams.get("housing") ?? "transparent") ===
            housingChanged.housing
        );
        await selectOption(page, "keycaps", keycapsChanged.keycaps);
        await expect(page).toHaveURL(
          (url) =>
            (url.searchParams.get("keycaps") ?? "inventor") ===
            keycapsChanged.keycaps
        );
        // Confirm both URL fields and controlled inputs before traversing history.
        await expectHistorySelection(page, keycapsChanged, testInfo);
        await expectPending(page, labels.pending);
        await page.goBack();
        await expectHistorySelection(page, housingChanged, testInfo);
        await page.goBack();
        await expectHistorySelection(page, initial, testInfo);
        await page.goForward();
        await expectHistorySelection(page, housingChanged, testInfo);
        await expectPending(page, labels.pending);

        await selectOption(page, "housing", "transparent");
        await expectHistorySelection(
          page,
          { housing: "transparent", keycaps: "inventor" },
          testInfo
        );
        await expect(page.getByTestId("personal-showcase-notice")).toHaveText(
          labels.showcaseNote
        );
        await expect(page.getByTestId("product-spin")).toHaveAttribute(
          "aria-valuemax",
          "71"
        );
        await expect(page.getByTestId("product-customizer")).toHaveAttribute(
          "data-orderable",
          "false"
        );
        await selectOption(page, "housing", housingChanged.housing);
        await expectPending(page, labels.pending);
        await expectSelection(page, housingChanged);
        // Cache Components may retain an inaccessible previous route tree.
        // Assert the unique price in the currently accessible product article.
        const price = page.getByRole("article").getByTestId("product-price");
        await expect(price).toHaveCount(1);
        await expect(price).toBeVisible();
        await expect(price).toContainText(messages.products.upcoming);
        expect(customRequests).toEqual([]);
        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath("pending-customization.png"),
        });
      });

      test(`ready retail history preserves selection, pixels and angle: ${prefix || "ko"}, ${width}px`, async ({
        page,
      }, testInfo) => {
        // This must not silently disappear when the pending catalog becomes empty.
        if (!READY_PAIR) {
          throw new Error(
            "Ready history coverage requires two reviewed adjacent combinations"
          );
        }
        const [first, second] = READY_PAIR;
        await page.setViewportSize({
          height: width === 1440 ? 900 : 852,
          width,
        });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(
          `${prefix}${DETAIL}?housing=${first.housingId}&keycaps=${first.keycapId}`
        );
        const spin = page.getByTestId("product-spin");
        await spin.scrollIntoViewIfNeeded();
        await expect(spin).toHaveAttribute("data-loaded-count", "12", {
          timeout: 15_000,
        });
        await spin.press("ArrowLeft");
        await expectReadyHistoryState(page, first, messages, testInfo);
        const firstCanvas = await spin.locator("canvas").elementHandle();
        if (!firstCanvas) {
          throw new Error("First ready canvas is missing");
        }
        if (first.housingId === second.housingId) {
          await selectOption(page, "keycaps", second.keycapId);
        } else {
          await selectOption(page, "housing", second.housingId);
        }
        await expectReadyHistoryState(page, second, messages, testInfo);
        expect(await firstCanvas.evaluate((canvas) => canvas.isConnected)).toBe(
          false
        );
        const secondCanvas = await spin.locator("canvas").elementHandle();
        if (!secondCanvas) {
          throw new Error("Second ready canvas is missing");
        }
        await page.goBack();
        await expectReadyHistoryState(page, first, messages, testInfo);
        expect(
          await secondCanvas.evaluate((canvas) => canvas.isConnected)
        ).toBe(false);
        await page.goForward();
        await expectReadyHistoryState(page, second, messages, testInfo);
        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath("ready-history-forward.png"),
        });
      });

      test(`reviewed retail render layout and all angles: ${prefix || "ko"}, ${width}px`, async ({
        page,
      }, testInfo) => {
        const [combination] = combinations;
        // biome-ignore lint/suspicious/noSkippedTests: A render-layout check requires at least one reviewed manifest.
        test.skip(!combination, "No reviewed render is available");
        const labels = messages.products.customization;
        const height = width === 1440 ? 900 : 852;
        await page.setViewportSize({ height, width });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(
          `${prefix}${DETAIL}?housing=${combination.housingId}&keycaps=${combination.keycapId}`
        );
        await expect(page).toHaveURL(
          (url) => url.pathname === `${prefix}${DETAIL}`
        );
        await expectSelection(page, {
          housing: combination.housingId,
          keycaps: combination.keycapId,
        });
        await expect(page.locator(".store-custom-preview")).toHaveAttribute(
          "data-combination",
          combination.id
        );
        const spin = page.getByTestId("product-spin");
        await expect(spin).toHaveAttribute("aria-valuemax", "11");
        await expect(spin).toHaveAttribute("data-loaded-count", "12", {
          timeout: 15_000,
        });
        await expect(
          page.locator(".store-custom-preview").getByRole("status")
        ).toHaveText(labels.ready);
        await expect(spin.locator("img")).toHaveCount(0);
        await expect(spin.locator("canvas")).toHaveCount(1);
        await expect(spin.locator("canvas")).toHaveCSS("object-fit", "contain");
        const bounds = await spin.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds?.height).toBeLessThanOrEqual(height * 0.72 + 1);
        expect((bounds?.width ?? 0) / (bounds?.height ?? 1)).toBeCloseTo(
          2 / 3,
          2
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true);
        const housingName =
          labels.housingNames[
            combination.housingId as keyof typeof labels.housingNames
          ];
        await expect(page.locator(".store-custom-selection")).toContainText(
          housingName
        );
        const selectedKit = page.locator("label.store-custom-option").filter({
          has: page.locator(
            `input[name="keycaps"][value="${combination.keycapId}"]`
          ),
        });
        const kitName = await selectedKit
          .locator("span")
          .evaluate((element) => element.firstChild?.textContent?.trim() ?? "");
        expect(kitName).not.toBe("");
        await expect(page.locator(".store-custom-selection")).toContainText(
          kitName
        );
        await expect(page.getByTestId("personal-showcase-notice")).toHaveCount(
          0
        );
        for (let index = 1; index <= 12; index += 1) {
          await spin.press("ArrowRight");
          await expect(spin).toHaveAttribute("data-frame", String(index % 12));
          await expect(spin).toHaveAttribute(
            "data-displayed-frame",
            String(index % 12)
          );
          await expect(spin).toHaveAttribute(
            "aria-valuetext",
            `${(index % 12) * 30}°`
          );
        }
        await expect(spin).toHaveAttribute("data-resolution", "full");
        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath("reviewed-customization.png"),
        });
      });
    }
  });
}

test("every unvalidated retail combination stays image-free without custom-frame requests", async ({
  page,
}) => {
  // biome-ignore lint/suspicious/noSkippedTests: Once every catalog combination is reviewed there is no pending state to exercise.
  test.skip(PENDING.length === 0, "All catalog combinations are validated");
  const customRequests: string[] = [];
  page.on("request", (request) => {
    if (CUSTOM_FRAME.test(request.url())) {
      customRequests.push(request.url());
    }
  });
  for (const housing of HOUSINGS) {
    for (const keycaps of KEYCAPS) {
      if (isValidated(housing, keycaps)) {
        continue;
      }
      // Navigate atomically so a previous kit paired with the next housing cannot
      // briefly activate a validated combination between the two radio clicks.
      await page.goto(`/en${DETAIL}?housing=${housing}&keycaps=${keycaps}`);
      await expect(page.locator(`input[value="${housing}"]`)).toBeChecked();
      await expect(page.locator(`input[value="${keycaps}"]`)).toBeChecked();
      await expectPending(page, en.products.customization.pending);
    }
  }
  expect(customRequests).toEqual([]);
});

test("invalid URL options select safe defaults and render only the registry-backed state", async ({
  page,
}) => {
  await page.goto(
    `/en${DETAIL}?customize=true&housing=unknown&keycaps=personal-logo`
  );
  await expectSelection(page, {
    housing: "bone-white",
    keycaps: "retro-programmer-retail",
  });
  await expectRegistryPreview(page, "bone-white", "retro-programmer-retail");
  await page.reload();
  await expectSelection(page, {
    housing: "bone-white",
    keycaps: "retro-programmer-retail",
  });
  await expectRegistryPreview(page, "bone-white", "retro-programmer-retail");
});

function createGate() {
  let release: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release: () => release() };
}

/** Count browser requests, not route handlers held after their requests were canceled. */
function trackCustomRequests(page: Page) {
  const active = new Set<Request>();
  const requests: string[] = [];
  let peakPending = 0;
  page.on("request", (request) => {
    if (!CUSTOM_FRAME.test(request.url())) {
      return;
    }
    requests.push(new URL(request.url()).pathname);
    active.add(request);
    peakPending = Math.max(peakPending, active.size);
  });
  const settle = (request: Request) => {
    active.delete(request);
  };
  page.on("requestfinished", settle);
  page.on("requestfailed", settle);
  return {
    get peakPending() {
      return peakPending;
    },
    get pending() {
      return active.size;
    },
    requests,
  };
}

test("validated retail frames load only the selection, stay bounded and refine a slow angle", async ({
  page,
}, testInfo) => {
  const combination =
    combinations.find((item) => item.id === "ice-blue--nicepbt-bow-retail") ??
    combinations[0];
  // biome-ignore lint/suspicious/noSkippedTests: Render integration is incremental; this scenario needs a reviewed manifest.
  test.skip(!combination, "No validated retail render has been integrated yet");
  const gate = createGate();
  const network = trackCustomRequests(page);
  const { requests } = network;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(CUSTOM_FRAME, async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith("/frame_000.webp")) {
      await gate.promise;
    }
    const source = combination.frames.find(
      (frame) => frame.src === url.pathname
    );
    if (!source) {
      await route.abort();
      return;
    }
    const body = readFileSync(
      new URL(`../public${source.src}`, import.meta.url)
    );
    try {
      await route.fulfill({ body, contentType: "image/webp" });
    } catch (error) {
      // Changing combinations may abort an old request while its route is gated.
      // Only suppress that verified cancellation, never fixture/fulfillment failures.
      if (!route.request().failure()) {
        throw error;
      }
    }
  });
  try {
    await page.goto(
      `/en${DETAIL}?housing=${combination.housingId}&keycaps=${combination.keycapId}`
    );
    const spin = page.getByTestId("product-spin");
    await expect(spin).toHaveAttribute("aria-valuemax", "11");
    await expect(spin).toHaveAttribute("data-loaded-count", "1");
    await expect(spin).toHaveAttribute("data-displayed-frame", "0");
    await expect(spin.locator("img")).toHaveCount(0);
    await expect(spin.locator("canvas")).toHaveCount(1);
    await expect(page.getByTestId("personal-showcase-notice")).toHaveCount(0);
    await expect.poll(() => network.pending).toBe(3);
    await spin.press("ArrowRight");
    await expect(spin).toHaveAttribute("data-frame", "1");
    await expect(spin).toHaveAttribute("data-displayed-frame", "0");
    gate.release();
    await expect(spin).toHaveAttribute("data-loaded-count", "12", {
      timeout: 15_000,
    });
    await expect(spin).toHaveAttribute("data-displayed-frame", "1");
    await expect(
      page.locator(".store-custom-preview").getByRole("status")
    ).toHaveText(en.products.customization.ready);
    await spin.press("ArrowLeft");
    await spin.press("ArrowLeft");
    await expect(spin).toHaveAttribute("data-frame", "11");
    await expect(spin).toHaveAttribute("data-displayed-frame", "11");
    await expect(spin).toHaveAttribute("aria-valuetext", "330°");
    expect(network.peakPending).toBeLessThanOrEqual(3);
    expect(new Set(requests).size).toBe(12);
    expect(requests).toHaveLength(12);
    expect(requests.every((url) => url.includes(`/${combination.id}/`))).toBe(
      true
    );
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("validated-retail-render.png"),
    });
    const pendingTarget =
      PENDING.find((item) => item.keycaps === combination.keycapId) ??
      PENDING.find((item) => item.housing === combination.housingId);
    if (pendingTarget) {
      if (pendingTarget.housing === combination.housingId) {
        await selectOption(page, "keycaps", pendingTarget.keycaps);
      } else {
        await selectOption(page, "housing", pendingTarget.housing);
      }
      await expectPending(page, en.products.customization.pending);
      expect(requests).toHaveLength(12);
    }
  } finally {
    gate.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("switching validated combinations shares the global three-request limit", async ({
  page,
}) => {
  const [pair] = combinations.flatMap((left) =>
    combinations
      .filter(
        (right) =>
          left.id !== right.id &&
          (left.housingId === right.housingId ||
            left.keycapId === right.keycapId)
      )
      .map((right) => [left, right] as const)
  );
  // biome-ignore lint/suspicious/noSkippedTests: This scenario needs two reviewed combinations reachable through one control change.
  test.skip(
    !pair,
    "Requires two validated combinations sharing a housing or kit"
  );
  const [first, second] = pair;
  const gate = createGate();
  const network = trackCustomRequests(page);
  const requested = network.requests;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(CUSTOM_FRAME, async (route) => {
    const url = new URL(route.request().url());
    await gate.promise;
    const body = readFileSync(
      new URL(`../public${url.pathname}`, import.meta.url)
    );
    try {
      await route.fulfill({ body, contentType: "image/webp" });
    } catch (error) {
      // Changing combinations may abort an old request while its route is gated.
      // Only suppress that verified cancellation, never fixture/fulfillment failures.
      if (!route.request().failure()) {
        throw error;
      }
    }
  });
  try {
    await page.goto(
      `/en${DETAIL}?housing=${first.housingId}&keycaps=${first.keycapId}`
    );
    await expect.poll(() => network.pending).toBe(3);
    if (first.housingId === second.housingId) {
      await selectOption(page, "keycaps", second.keycapId);
    } else {
      await selectOption(page, "housing", second.housingId);
    }
    await expect(page.locator(".store-custom-preview")).toHaveAttribute(
      "data-combination",
      second.id
    );
    await expect(page.getByTestId("product-spin")).toHaveAttribute(
      "data-displayed-frame",
      "poster"
    );
    expect(network.pending).toBeLessThanOrEqual(3);
    // Selecting a lower control can scroll the canvas offscreen; paused loading is intentional.
    await page.getByTestId("product-spin").scrollIntoViewIfNeeded();
    gate.release();
    await expect(page.getByTestId("product-spin")).toHaveAttribute(
      "data-loaded-count",
      "12",
      { timeout: 15_000 }
    );
    expect(network.peakPending).toBeLessThanOrEqual(3);
    expect(new Set(requested).size).toBe(requested.length);
    expect(
      requested.every(
        (url) => url.includes(`/${first.id}/`) || url.includes(`/${second.id}/`)
      )
    ).toBe(true);
  } finally {
    gate.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

// Independent deadlines, retries and screenshots scale to the full 35-combination catalog.
for (const combination of combinations) {
  test(`reviewed retail visual reference: ${combination.id}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    const path = `/en${DETAIL}?housing=${combination.housingId}&keycaps=${combination.keycapId}`;
    await page.goto(path);
    await expect(page).toHaveURL(
      (url) => `${url.pathname}${url.search}` === path
    );
    await expectSelection(page, {
      housing: combination.housingId,
      keycaps: combination.keycapId,
    });
    await expect(page.locator(".store-custom-preview")).toHaveAttribute(
      "data-combination",
      combination.id
    );
    const housingName =
      en.products.customization.housingNames[
        combination.housingId as keyof typeof en.products.customization.housingNames
      ];
    const kitName = await page
      .locator("label.store-custom-option")
      .filter({
        has: page.locator(
          `input[name="keycaps"][value="${combination.keycapId}"]`
        ),
      })
      .locator("span")
      .evaluate((element) => element.firstChild?.textContent?.trim() ?? "");
    expect(kitName).not.toBe("");
    await expect(page.locator(".store-custom-selection")).toHaveText(
      en.products.customization.selected
        .replace("{housing}", housingName)
        .replace("{keycaps}", kitName)
    );
    const spin = page.getByTestId("product-spin");
    await spin.scrollIntoViewIfNeeded();
    await expect(spin).toHaveAttribute("data-loaded-count", "12", {
      timeout: 15_000,
    });
    await expect(spin).toHaveAttribute("data-frame", "0");
    await expect(spin).toHaveAttribute("data-displayed-frame", "0");
    await expect(spin).toHaveAttribute("data-resolution", "full");
    await expect(spin.locator("canvas")).toHaveCount(1);
    await expect(spin.locator("img")).toHaveCount(0);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath(`reviewed-${combination.id}.png`),
    });
  });
}
