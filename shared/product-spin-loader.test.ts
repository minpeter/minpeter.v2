// biome-ignore-all lint/performance/noAwaitInLoops: Controlled asynchronous scheduling is deliberately sequential.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getFrameOrder,
  getSpinLoader,
  SpinLoader,
  type SpinLoaderConfig,
} from "./product-spin-loader";

const FRAME_PATH = /\/(\d+)\.webp$/;
const config = {
  basePath: "/assets/test-spin",
  frameCount: 72,
  height: 1536,
  width: 1024,
};
interface Request {
  index: number;
  reject: (reason: Error) => void;
  resolve: (response: Response) => void;
  signal: AbortSignal;
  url: string;
}
const instances = new Set<SpinLoader>();
function createLoader(input: SpinLoaderConfig = config) {
  const loader = new SpinLoader(input);
  instances.add(loader);
  return loader;
}
let requests: Request[];
let bitmaps: {
  close: ReturnType<typeof vi.fn>;
  width: number;
  height: number;
}[];

async function flush() {
  for (let tick = 0; tick < 12; tick += 1) {
    await Promise.resolve();
  }
}
function finish(request: Request, ok = true) {
  request.resolve({
    blob: () => Promise.resolve(new Blob([String(request.index)])),
    ok,
  } as Response);
}
async function finishAll() {
  let cursor = 0;
  while (cursor < requests.length) {
    finish(requests[cursor]);
    cursor += 1;
    await flush();
  }
}

beforeEach(() => {
  requests = [];
  bitmaps = [];
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (url: string, options: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const match = url.match(FRAME_PATH);
          requests.push({
            index: Number(match?.[1]) - 1,
            reject,
            resolve,
            signal: options.signal as AbortSignal,
            url,
          });
        })
    )
  );
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn((_blob: Blob, options: ImageBitmapOptions) => {
      const bitmap = {
        close: vi.fn(),
        height: options.resizeHeight ?? 0,
        width: options.resizeWidth ?? 0,
      };
      bitmaps.push(bitmap);
      return Promise.resolve(bitmap);
    })
  );
});
afterEach(async () => {
  for (const loader of instances) {
    loader.dispose();
  }
  instances.clear();
  await flush();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("progressive spin loading", () => {
  it("orders complete 30 degree coverage, then 15, then all 5 degree gaps exactly once", () => {
    const order = getFrameOrder(72);
    expect(order.slice(0, 12)).toEqual(
      Array.from({ length: 12 }, (_, i) => i * 6)
    );
    expect(order.slice(12, 24)).toEqual(
      Array.from({ length: 12 }, (_, i) => i * 6 + 3)
    );
    expect(order.slice(24)).toEqual(
      Array.from({ length: 72 }, (_, i) => i).filter((i) => i % 3 !== 0)
    );
    expect(new Set(order).size).toBe(72);
  });

  it("does not load before activation and caps network concurrency at three", async () => {
    const loader = createLoader(config);
    const token = Symbol("consumer");
    loader.requestFrame(token, 71);
    expect(requests).toHaveLength(0);
    loader.setActive(token, true);
    expect(requests.map((r) => r.index)).toEqual([0, 6, 12]);
    for (let index = 0; index < 72; index += 1) {
      loader.requestFrame(token, index);
      expect(loader.pendingCount).toBeLessThanOrEqual(3);
    }
    expect(requests).toHaveLength(3);
    await finishAll();
    expect(requests.map((r) => r.index)).toEqual(getFrameOrder(72));
    expect(loader.fetchedCount).toBe(72);
    expect(loader.pendingCount).toBe(0);
  });

  it("holds each next tier until every request in the current tier settles", async () => {
    const loader = createLoader(config);
    loader.setActive(Symbol("consumer"), true);
    for (let i = 1; i < 12; i += 1) {
      finish(requests[i]);
      await flush();
    }
    expect(requests).toHaveLength(12);
    expect(loader.nearestFrame(66)?.index).toBe(66);
    finish(requests[0]);
    await flush();
    expect(requests.slice(12).map((r) => r.index)).toEqual([3, 9, 15]);
  });

  it("failure and timeout cannot block later tiers", async () => {
    const loader = createLoader(config);
    loader.setActive(Symbol("consumer"), true);
    requests[0].reject(new Error("Network offline for one frame"));
    finish(requests[1], false);
    await flush();
    // The third original request never resolves; it times out without holding the tier forever.
    await vi.advanceTimersByTimeAsync(15_000);
    expect(requests[2].signal.aborted).toBe(true);
    let cursor = 3;
    while (cursor < requests.length) {
      finish(requests[cursor]);
      cursor += 1;
      await flush();
    }
    expect(requests).toHaveLength(72);
    expect(loader.pendingCount).toBe(0);
    expect(loader.fetchedCount).toBeLessThan(72);
    expect(loader.hasFailures).toBe(true);
  });

  it("selects nearest decoded coverage circularly and refines when detail arrives", async () => {
    const loader = createLoader(config);
    const token = Symbol("consumer");
    loader.setActive(token, true);
    finish(requests[0]);
    finish(requests[1]);
    await flush();
    expect(loader.nearestFrame(71)?.index).toBe(0);
    expect(loader.nearestFrame(5)?.index).toBe(6);
    expect(loader.nearestFrame(3)?.index).toBe(0);
    loader.requestFrame(token, 5);
    await finishAll();
    expect(loader.nearestFrame(5)?.index).toBe(5);
  });

  it("retains coarse anchors, evicts fine LRU bitmaps, and redecode uses cached bytes", async () => {
    const loader = createLoader(config);
    const token = Symbol("consumer");
    loader.setActive(token, true);
    await finishAll();
    expect(loader.readyCount).toBe(20);
    expect(loader.hasFailures).toBe(false);
    for (let i = 0; i < 72; i += 6) {
      expect(loader.nearestFrame(i)?.index).toBe(i);
    }
    expect(bitmaps.every((b) => b.width === 512 && b.height === 768)).toBe(
      true
    );
    expect(
      bitmaps.filter((b) => b.close.mock.calls.length > 0).length
    ).toBeGreaterThan(0);
    loader.requestFrame(token, 1);
    await flush();
    expect(loader.nearestFrame(1)?.index).toBe(1);
    expect(requests).toHaveLength(72);
    expect(loader.readyCount).toBe(20);
  });

  it("shares in-flight and downloaded frames between consumers without duplicate fetches", async () => {
    const unique = { ...config, basePath: "/assets/shared-spin" };
    const first = getSpinLoader(unique);
    instances.add(first);
    const second = getSpinLoader(unique);
    expect(first).toBe(second);
    const card = Symbol("consumer");
    const detail = Symbol("consumer");
    first.setActive(card, true);
    second.setActive(detail, true);
    expect(requests).toHaveLength(3);
    first.release(card);
    await finishAll();
    second.release(detail);
    await vi.advanceTimersByTimeAsync(10_000);
    second.setActive(detail, true);
    expect(requests).toHaveLength(72);
  });

  it("pauses new requests when inactive and releases decoded memory after idle timeout", async () => {
    const loader = createLoader(config);
    const token = Symbol("consumer");
    loader.setActive(token, true);
    finish(requests[0]);
    await flush();
    expect(loader.readyCount).toBe(1);
    loader.setActive(token, false);
    const count = requests.length;
    for (const request of requests) {
      finish(request);
    }
    await flush();
    expect(requests).toHaveLength(count);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(loader.readyCount).toBe(0);
    expect(loader.fetchedCount).toBe(0);
    expect(bitmaps[0].close).toHaveBeenCalledOnce();
    loader.setActive(token, true);
    expect(requests.slice(count).map((r) => r.index)).toEqual([0, 6, 12]);
  });

  it("closes a late decode after idle disposal instead of reviving stale cache", async () => {
    const deferred = Promise.withResolvers<ImageBitmap>();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => deferred.promise)
    );
    const loader = createLoader(config);
    const token = Symbol("consumer");
    loader.setActive(token, true);
    finish(requests[0]);
    await flush();
    loader.release(token);
    await vi.advanceTimersByTimeAsync(30_000);
    const close = vi.fn();
    deferred.resolve({ close } as unknown as ImageBitmap);
    await flush();
    expect(close).toHaveBeenCalledOnce();
    expect(loader.readyCount).toBe(0);
  });

  it("decode failure preserves other ready frames and continues the queue", async () => {
    const decode = vi
      .fn()
      .mockRejectedValueOnce(new Error("Corrupt frame"))
      .mockResolvedValue({ close: vi.fn(), height: 768, width: 512 });
    vi.stubGlobal("createImageBitmap", decode);
    const loader = createLoader(config);
    loader.setActive(Symbol("consumer"), true);
    finish(requests[0]);
    finish(requests[1]);
    await flush();
    expect(loader.nearestFrame(0)?.index).toBe(6);
    expect(loader.readyCount).toBe(1);
    expect(loader.settledCount).toBe(loader.fetchedCount);
    expect(loader.hasFailures).toBe(true);
  });
  it("serializes decode work and does not emit or download again on repeated pointer requests", async () => {
    const deferred = Promise.withResolvers<ImageBitmap>();
    const decode = vi.fn(() => deferred.promise);
    vi.stubGlobal("createImageBitmap", decode);
    const loader = createLoader(config);
    const token = Symbol("consumer");
    const changed = vi.fn();
    const unsubscribe = loader.subscribe(changed);
    loader.setActive(token, true);
    finish(requests[0]);
    finish(requests[1]);
    finish(requests[2]);
    await flush();
    expect(decode).toHaveBeenCalledOnce();
    const version = loader.getSnapshot();
    const count = requests.length;
    for (let i = 0; i < 100; i += 1) {
      loader.requestFrame(token, i % 72);
      loader.nearestFrame(i % 72);
    }
    expect(loader.getSnapshot()).toBe(version);
    expect(requests).toHaveLength(count);
    expect(decode).toHaveBeenCalledOnce();
    unsubscribe();
    changed.mockClear();
    deferred.resolve({ close: vi.fn() } as unknown as ImageBitmap);
    await flush();
    expect(changed).not.toHaveBeenCalled();
  });
  it("bounds competing fine targets from nine consumers without decode eviction loops", async () => {
    const loader = createLoader(config);
    const bootstrap = Symbol("bootstrap");
    loader.setActive(bootstrap, true);
    await finishAll();
    const targets = [1, 2, 4, 5, 7, 8, 10, 11, 13];
    const consumers = targets.map((index) => ({
      index,
      token: Symbol(String(index)),
    }));
    for (const { token, index } of consumers) {
      loader.setActive(token, true);
      loader.requestFrame(token, index);
    }
    for (let tick = 0; tick < 20; tick += 1) {
      await flush();
    }
    const calls = vi.mocked(createImageBitmap).mock.calls.length;
    expect(calls).toBeLessThanOrEqual(81);
    expect(loader.readyCount).toBe(20);
    for (const index of targets.slice(1)) {
      expect(loader.nearestFrame(index)?.index).toBe(index);
    }
    expect(loader.nearestFrame(targets[0])?.index).not.toBe(targets[0]);
    // Simulate every subscriber redrawing after each completion. Identical requests
    // must not rotate priority and recreate the nine-target thrash cycle.
    for (let tick = 0; tick < 20; tick += 1) {
      for (const { token, index } of consumers) {
        loader.requestFrame(token, index);
      }
      await flush();
    }
    expect(vi.mocked(createImageBitmap).mock.calls).toHaveLength(calls);
    expect(requests).toHaveLength(72);
    expect(loader.pendingCount).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    loader.release(consumers[8].token);
    await flush();
    expect(loader.nearestFrame(targets[0])?.index).toBe(targets[0]);
    expect(requests).toHaveLength(72);
  });
  it("uses explicit twelve-frame manifest URLs verbatim and keys cache by their ordered versions", async () => {
    const sources = Array.from(
      { length: 12 },
      (_, i) =>
        `/assets/variant/frame_${String(i * 30).padStart(3, "0")}.webp?v=one`
    );
    const variant = { ...config, frameCount: 12, frameSources: sources };
    const first = getSpinLoader(variant);
    instances.add(first);
    expect(getSpinLoader({ ...variant, frameSources: [...sources] })).toBe(
      first
    );
    const changed = getSpinLoader({
      ...variant,
      frameSources: sources.map((url) => url.replace("one", "two")),
    });
    instances.add(changed);
    expect(changed).not.toBe(first);
    first.setActive(Symbol("variant"), true);
    await finishAll();
    expect(requests.map((request) => request.url)).toEqual(sources);
    expect(first.readyCount).toBe(12);
    expect(first.settledCount).toBe(12);
    expect(first.loadingComplete).toBe(true);
    expect(changed.fetchedCount).toBe(0);
    expect(() =>
      createLoader({ ...variant, frameSources: [sources[0]] })
    ).toThrow("frameSources");
  });

  it("globally caps requests across active variants without evicting another active consumer", async () => {
    const variants = ["a", "b", "c"].map((name) =>
      createLoader({ ...config, basePath: `/assets/${name}`, frameCount: 12 })
    );
    for (const loader of variants) {
      loader.setActive(Symbol("visible"), true);
    }
    expect(requests).toHaveLength(3);
    finish(requests[0]);
    await flush();
    finish(requests[1]);
    await flush();
    expect(
      requests.some((request) => request.url.startsWith("/assets/b/"))
    ).toBe(true);
    let cursor = 2;
    while (cursor < requests.length) {
      expect(
        variants.reduce((sum, loader) => sum + loader.pendingCount, 0)
      ).toBeLessThanOrEqual(3);
      finish(requests[cursor]);
      cursor += 1;
      await flush();
    }
    expect(requests).toHaveLength(36);
    expect(variants.map((loader) => loader.readyCount)).toEqual([12, 12, 12]);
    expect(requests.every((request) => !request.signal.aborted)).toBe(true);
  });

  it("rapid combo switches abort old requests, retain at most two caches, and never prefetch unused variants", async () => {
    const variants = Array.from({ length: 12 }, (_, i) =>
      createLoader({
        ...config,
        basePath: `/assets/combo-${i}`,
        frameCount: 12,
      })
    );
    const tokens = variants.map((_, i) => Symbol(String(i)));
    variants[0].setActive(tokens[0], true);
    finish(requests[0]);
    await flush();
    const [firstBitmap] = bitmaps;
    variants[0].release(tokens[0]);
    const old = requests.slice(1);
    expect(old.every((request) => request.signal.aborted)).toBe(true);
    variants[1].setActive(tokens[1], true);
    expect(variants[0].fetchedCount).toBe(1);
    expect(variants[1].pendingCount).toBe(3);
    variants[1].release(tokens[1]);
    variants[2].setActive(tokens[2], true);
    expect(variants[0].fetchedCount).toBe(0);
    expect(firstBitmap.close).toHaveBeenCalledOnce();
    for (const request of old) {
      finish(request);
    }
    await flush();
    expect(variants[0].readyCount).toBe(0);
    expect(
      variants
        .slice(3)
        .every(
          (loader) => loader.pendingCount === 0 && loader.fetchedCount === 0
        )
    ).toBe(true);
    expect(requests.every((request) => !request.url.includes("combo-3"))).toBe(
      true
    );
    expect(variants.reduce((sum, loader) => sum + loader.pendingCount, 0)).toBe(
      3
    );
  });

  it("closes a stale variant decode after eviction and waits for pending decode before declaring complete", async () => {
    const deferred = Promise.withResolvers<ImageBitmap>();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => deferred.promise)
    );
    const variants = ["old", "next", "latest"].map((name) =>
      createLoader({ ...config, basePath: `/assets/${name}`, frameCount: 1 })
    );
    const token = Symbol("selected");
    variants[0].setActive(token, true);
    finish(requests[0]);
    await flush();
    expect(variants[0].settledCount).toBe(1);
    expect(variants[0].loadingComplete).toBe(false);
    variants[0].release(token);
    variants[1].setActive(token, true);
    variants[1].release(token);
    variants[2].setActive(token, true);
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
    deferred.resolve(bitmap);
    await flush();
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(variants[0].readyCount).toBe(0);
    expect(variants[0].getSource(0)).toBeUndefined();
  });
  it("explicit retry restarts a failed sequence and ignores late responses from the old generation", async () => {
    const loader = createLoader({ ...config, frameCount: 12 });
    const token = Symbol("retry");
    loader.setActive(token, true);
    let cursor = 0;
    while (cursor < requests.length) {
      finish(requests[cursor], false);
      cursor += 1;
      await flush();
    }
    expect(loader.settledCount).toBe(12);
    expect(loader.loadingComplete).toBe(true);
    expect(loader.readyCount).toBe(0);
    expect(requests).toHaveLength(12);
    expect(loader.hasFailures).toBe(true);
    loader.retry();
    expect(loader.hasFailures).toBe(false);
    expect(loader.loadingComplete).toBe(false);
    expect(requests).toHaveLength(15);
    const stale = requests.slice(12);
    loader.retry();
    expect(stale.every((request) => request.signal.aborted)).toBe(true);
    for (const request of stale) {
      finish(request);
    }
    await flush();
    expect(loader.fetchedCount).toBe(0);
    cursor = 15;
    while (cursor < requests.length) {
      finish(requests[cursor]);
      cursor += 1;
      await flush();
    }
    expect(loader.readyCount).toBe(12);
    expect(loader.loadingComplete).toBe(true);
    expect(loader.fetchedCount).toBe(12);
    expect(loader.hasFailures).toBe(false);
  });
  it("keeps only two resourceful caches through all twelve explicit combo selections", async () => {
    const variants = Array.from({ length: 12 }, (_, i) =>
      createLoader({ ...config, basePath: `/assets/lru-${i}`, frameCount: 12 })
    );
    const token = Symbol("customizer");
    for (let i = 0; i < variants.length; i += 1) {
      if (i > 0) {
        variants[i - 1].release(token);
      }
      const firstRequest = requests.length;
      variants[i].setActive(token, true);
      finish(requests[firstRequest]);
      await flush();
      expect(
        variants.filter(
          (loader) =>
            loader.fetchedCount > 0 ||
            loader.pendingCount > 0 ||
            loader.readyCount > 0
        ).length
      ).toBeLessThanOrEqual(2);
      expect(
        variants.reduce((sum, loader) => sum + loader.pendingCount, 0)
      ).toBeLessThanOrEqual(3);
    }
    expect(variants[0].getSource(0)).toBeUndefined();
    expect(variants[10].getSource(0)).toBeDefined();
    expect(variants[11].getSource(0)).toBeDefined();
    variants[11].release(token);
    const before = requests.length;
    variants[10].setActive(token, true);
    expect(variants[10].getSource(0)).toBeDefined();
    expect(
      requests
        .slice(before)
        .every((request) => !request.url.endsWith("/01.webp"))
    ).toBe(true);
  });
});
