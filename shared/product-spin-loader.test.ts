// biome-ignore-all lint/performance/noAwaitInLoops: Controlled asynchronous scheduling is deliberately sequential.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getFrameOrder,
  getSpinLoader,
  SpinLoader,
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
afterEach(() => {
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
    const loader = new SpinLoader(config);
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
    const loader = new SpinLoader(config);
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
    const loader = new SpinLoader(config);
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
  });

  it("selects nearest decoded coverage circularly and refines when detail arrives", async () => {
    const loader = new SpinLoader(config);
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
    const loader = new SpinLoader(config);
    const token = Symbol("consumer");
    loader.setActive(token, true);
    await finishAll();
    expect(loader.readyCount).toBe(20);
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
    const loader = new SpinLoader(config);
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
    const loader = new SpinLoader(config);
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
    const loader = new SpinLoader(config);
    loader.setActive(Symbol("consumer"), true);
    finish(requests[0]);
    finish(requests[1]);
    await flush();
    expect(loader.nearestFrame(0)?.index).toBe(6);
    expect(loader.readyCount).toBe(1);
  });
  it("serializes decode work and does not emit or download again on repeated pointer requests", async () => {
    const deferred = Promise.withResolvers<ImageBitmap>();
    const decode = vi.fn(() => deferred.promise);
    vi.stubGlobal("createImageBitmap", decode);
    const loader = new SpinLoader(config);
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
    const loader = new SpinLoader(config);
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
});
