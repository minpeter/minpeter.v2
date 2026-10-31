/** Network order is independent of pointer movement: whole-turn coverage before detail. */
export function getFrameOrder(frameCount: number): number[] {
  const coarseStep = frameCount % 12 === 0 ? frameCount / 12 : 1;
  const mediumStep = frameCount % 24 === 0 ? frameCount / 24 : 1;
  return Array.from(
    new Set([
      ...Array.from(
        { length: Math.ceil(frameCount / coarseStep) },
        (_, i) => i * coarseStep
      ),
      ...Array.from(
        { length: Math.ceil(frameCount / mediumStep) },
        (_, i) => i * mediumStep
      ),
      ...Array.from({ length: frameCount }, (_, i) => i),
    ])
  );
}

export interface SpinLoaderConfig {
  basePath: string;
  frameCount: number;
  height: number;
  width: number;
}

interface DecodedFrame {
  bitmap: ImageBitmap;
  index: number;
  used: number;
}

const FETCH_LIMIT = 3;
const FINE_LIMIT = 8;
const REQUEST_TIMEOUT = 15_000;
const DECODE_TIMEOUT = 10_000;
const IDLE_TIMEOUT = 30_000;

/** Shared compressed cache + small decoded LRU; no hidden full-resolution image elements. */
export class SpinLoader {
  private readonly config: SpinLoaderConfig;
  private readonly order: number[];
  private readonly coarse: Set<number>;
  private readonly tierEnds: number[];
  private readonly listeners = new Set<() => void>();
  private readonly active = new Set<symbol>();
  private readonly wanted = new Map<symbol, number>();
  private readonly blobs = new Map<number, Blob>();
  private readonly bitmaps = new Map<number, DecodedFrame>();
  private readonly decodeQueue = new Set<number>();
  private readonly decodeFailed = new Set<number>();
  private readonly controllers = new Map<number, AbortController>();
  private readonly settled = new Set<number>();
  private cursor = 0;
  private tier = 0;
  private version = 0;
  private clock = 0;
  private generation = 0;
  private decoding = false;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(config: SpinLoaderConfig) {
    this.config = config;
    this.order = getFrameOrder(config.frameCount);
    const coarseStep =
      config.frameCount % 12 === 0 ? config.frameCount / 12 : 1;
    const mediumStep =
      config.frameCount % 24 === 0 ? config.frameCount / 24 : 1;
    this.coarse = new Set(
      this.order.filter((index) => index % coarseStep === 0)
    );
    this.tierEnds = [
      ...new Set([
        this.coarse.size,
        this.order.filter((index) => index % mediumStep === 0).length,
        config.frameCount,
      ]),
    ];
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.version;

  /** Original compressed source, for a single idle full-resolution repaint without refetching. */
  getSource(index: number): Blob | undefined {
    return this.blobs.get(index);
  }

  get readyCount() {
    return this.bitmaps.size;
  }
  get fetchedCount() {
    return this.blobs.size;
  }
  get pendingCount() {
    return this.controllers.size;
  }

  setActive(token: symbol, active: boolean) {
    if (active) {
      this.active.add(token);
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
      this.pump();
    } else {
      this.active.delete(token);
      this.scheduleIdle();
      this.pumpDecode();
    }
  }

  requestFrame(token: symbol, index: number) {
    const count = this.config.frameCount;
    const normalized = ((index % count) + count) % count;
    if (this.wanted.get(token) !== normalized) {
      // Only actual angle changes affect priority, not subscriber redraws.
      this.wanted.delete(token);
      this.wanted.set(token, normalized);
    }
    this.pumpDecode();
  }

  release(token: symbol) {
    this.active.delete(token);
    this.wanted.delete(token);
    this.scheduleIdle();
    this.pumpDecode();
  }

  /** Call immediately before drawing; the returned bitmap remains owned by this cache. */
  nearestFrame(target: number): { index: number; bitmap: ImageBitmap } | null {
    const count = this.config.frameCount;
    const normalized = ((target % count) + count) % count;
    let nearest: DecodedFrame | undefined;
    let distance = Number.POSITIVE_INFINITY;
    for (const frame of this.bitmaps.values()) {
      const delta = Math.abs(frame.index - normalized);
      const circular = Math.min(delta, count - delta);
      if (
        circular < distance ||
        (circular === distance && frame.index < (nearest?.index ?? count))
      ) {
        distance = circular;
        nearest = frame;
      }
    }
    if (!nearest) {
      return null;
    }
    this.clock += 1;
    nearest.used = this.clock;
    return nearest;
  }

  private emit() {
    this.version += 1;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private scheduleIdle() {
    if (this.active.size || this.idleTimer) {
      return;
    }
    this.idleTimer = setTimeout(() => this.clear(), IDLE_TIMEOUT);
  }

  private clear() {
    this.generation += 1;
    for (const controller of this.controllers.values()) {
      controller.abort();
    }
    for (const frame of this.bitmaps.values()) {
      frame.bitmap.close();
    }
    this.controllers.clear();
    this.bitmaps.clear();
    this.blobs.clear();
    this.decodeQueue.clear();
    this.decodeFailed.clear();
    this.settled.clear();
    this.cursor = 0;
    this.tier = 0;
    this.decoding = false;
    this.idleTimer = undefined;
    this.emit();
  }

  private pump() {
    if (!this.active.size) {
      return;
    }
    while (
      this.tier < this.tierEnds.length - 1 &&
      this.settled.size >= this.tierEnds[this.tier]
    ) {
      this.tier += 1;
    }
    const end = this.tierEnds[this.tier];
    while (this.controllers.size < FETCH_LIMIT && this.cursor < end) {
      const index = this.order[this.cursor];
      this.cursor += 1;
      const controller = new AbortController();
      this.controllers.set(index, controller);
      this.fetchFrame(index, controller, this.generation);
    }
    this.pumpDecode();
  }

  private async fetchFrame(
    index: number,
    controller: AbortController,
    generation: number
  ) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Spin frame request timed out"));
        }, REQUEST_TIMEOUT);
      });
      const source = `${this.config.basePath}/${String(index + 1).padStart(2, "0")}.webp`;
      const request = fetch(source, {
        priority: this.coarse.has(index) ? "high" : "low",
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Spin frame request failed");
        }
        return response.blob();
      });
      const blob = await Promise.race([request, timeout]);
      if (generation !== this.generation) {
        return;
      }
      this.blobs.set(index, blob);
      this.decodeQueue.add(index);
    } catch {
      // A failed angle must not block either the current tier or later refinements.
    } finally {
      clearTimeout(timer);
      if (generation === this.generation) {
        this.controllers.delete(index);
        this.settled.add(index);
        this.emit();
        this.pump();
      }
    }
  }

  private wantedFineBudget(): Set<number> {
    const budget = new Set<number>();
    for (const [token, index] of [...this.wanted].reverse()) {
      if (this.active.has(token) && !this.coarse.has(index)) {
        budget.add(index);
        if (budget.size === FINE_LIMIT) {
          break;
        }
      }
    }
    return budget;
  }

  private nextDecode(): number | undefined {
    const budget = this.wantedFineBudget();
    for (const [token, index] of [...this.wanted].reverse()) {
      if (
        this.active.has(token) &&
        (this.coarse.has(index) || budget.has(index)) &&
        this.blobs.has(index) &&
        !this.bitmaps.has(index) &&
        !this.decodeFailed.has(index)
      ) {
        return index;
      }
    }
    // If all fine slots are reserved, discard background decode work rather than
    // repeatedly decoding an image that cannot fit. Its compressed bytes stay cached.
    for (const index of this.decodeQueue) {
      if (
        budget.size < FINE_LIMIT ||
        this.coarse.has(index) ||
        budget.has(index)
      ) {
        return index;
      }
      this.decodeQueue.delete(index);
    }
    return undefined;
  }

  private pumpDecode() {
    if (!this.active.size || this.decoding) {
      return;
    }
    const index = this.nextDecode();
    if (index === undefined) {
      return;
    }
    this.decodeQueue.delete(index);
    const blob = this.blobs.get(index);
    if (!blob || this.bitmaps.has(index) || this.decodeFailed.has(index)) {
      this.pumpDecode();
      return;
    }
    this.decoding = true;
    this.decodeFrame(index, blob, this.generation);
  }

  private async decodeFrame(index: number, blob: Blob, generation: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let expired = false;
    try {
      const scale = Math.min(
        1,
        512 / this.config.width,
        768 / this.config.height
      );
      const decode = createImageBitmap(blob, {
        resizeHeight: Math.round(this.config.height * scale),
        resizeQuality: "high",
        resizeWidth: Math.round(this.config.width * scale),
      }).then((decoded) => {
        if (expired || generation !== this.generation) {
          decoded.close();
          throw new Error("Discarded stale spin decode");
        }
        return decoded;
      });
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error("Spin decode timed out"));
        }, DECODE_TIMEOUT);
      });
      const bitmap = await Promise.race([decode, timeout]);
      if (generation !== this.generation) {
        bitmap.close();
        return;
      }
      this.clock += 1;
      this.bitmaps.set(index, { bitmap, index, used: this.clock });
      this.prune();
    } catch {
      if (generation === this.generation) {
        this.decodeFailed.add(index);
      }
    } finally {
      clearTimeout(timer);
      if (generation === this.generation) {
        this.decoding = false;
        this.emit();
        this.pumpDecode();
      }
    }
  }

  private prune() {
    const fine = [...this.bitmaps.values()].filter(
      (frame) => !this.coarse.has(frame.index)
    );
    const protectedFrames = this.wantedFineBudget();
    fine.sort(
      (a, b) =>
        Number(protectedFrames.has(a.index)) -
          Number(protectedFrames.has(b.index)) || a.used - b.used
    );
    for (const frame of fine.slice(0, Math.max(0, fine.length - FINE_LIMIT))) {
      frame.bitmap.close();
      this.bitmaps.delete(frame.index);
    }
  }
}

const loaders = new Map<string, SpinLoader>();

/** The tiny registry retains identity; idle loaders release all network/bitmap resources. */
export function getSpinLoader(config: SpinLoaderConfig): SpinLoader {
  const key = `${config.basePath}:${config.frameCount}:${config.width}:${config.height}`;
  let loader = loaders.get(key);
  if (!loader) {
    loader = new SpinLoader(config);
    loaders.set(key, loader);
  }
  return loader;
}
