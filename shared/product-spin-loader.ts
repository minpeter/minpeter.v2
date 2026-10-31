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
  /** Exact ordered manifest URLs, including version/hash query strings. */
  frameSources?: readonly string[];
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
  private static readonly residents = new Set<SpinLoader>();
  private static scheduling = false;
  private static nextGrant = 0;

  private static trimResidents() {
    for (const loader of SpinLoader.residents) {
      if (SpinLoader.residents.size <= 2) {
        break;
      }
      if (loader.active.size === 0) {
        loader.clear();
      }
    }
  }

  private static pumpAll() {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: Synchronous subscribers may reenter while the scheduler is running.
    if (SpinLoader.scheduling) {
      return;
    }
    SpinLoader.scheduling = true;
    try {
      const residents = [...SpinLoader.residents];
      let misses = 0;
      while (
        residents.length > 0 &&
        misses < residents.length &&
        SpinLoader.pendingRequests() < FETCH_LIMIT
      ) {
        const position = SpinLoader.nextGrant % residents.length;
        const loader = residents[position];
        SpinLoader.nextGrant = (position + 1) % residents.length;
        misses = loader.pumpNetwork() ? 0 : misses + 1;
      }
      for (const loader of residents) {
        loader.pumpDecode();
      }
    } finally {
      SpinLoader.scheduling = false;
    }
  }

  private static pendingRequests() {
    let count = 0;
    for (const loader of SpinLoader.residents) {
      count += loader.controllers.size;
    }
    return count;
  }

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
  private readonly retryQueue = new Set<number>();
  private cursor = 0;
  private tier = 0;
  private version = 0;
  private clock = 0;
  private generation = 0;
  private decoding = false;
  private decodingIndex: number | undefined;
  private cancelDecode: (() => void) | undefined;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(config: SpinLoaderConfig) {
    if (
      config.frameSources &&
      config.frameSources.length !== config.frameCount
    ) {
      throw new Error("Spin frameSources must match frameCount");
    }
    this.config = {
      ...config,
      frameSources: config.frameSources ? [...config.frameSources] : undefined,
    };
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
  get settledCount() {
    return this.settled.size;
  }
  get hasFailures() {
    return this.settled.size > this.blobs.size || this.decodeFailed.size > 0;
  }
  get loadingComplete() {
    return (
      this.settled.size === this.config.frameCount &&
      !this.decoding &&
      this.decodeQueue.size === 0
    );
  }
  get pendingCount() {
    return this.controllers.size;
  }

  setActive(token: symbol, active: boolean) {
    if (active) {
      this.active.add(token);
      SpinLoader.residents.delete(this);
      SpinLoader.residents.add(this);
      SpinLoader.trimResidents();
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
      this.pump();
    } else {
      this.active.delete(token);
      this.pausePending();
      this.scheduleIdle();
      SpinLoader.trimResidents();
      SpinLoader.pumpAll();
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
    this.pausePending();
    this.scheduleIdle();
    SpinLoader.trimResidents();
    SpinLoader.pumpAll();
  }

  /** One explicit user action restarts failed requests; no automatic retry loops. */
  retry() {
    this.clear();
    if (this.active.size > 0) {
      SpinLoader.residents.add(this);
      SpinLoader.trimResidents();
      this.pump();
    }
  }

  /** Explicit teardown; normal shared consumers should release their own token instead. */
  dispose() {
    this.active.clear();
    this.wanted.clear();
    this.clear();
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
    if (this.active.size || this.idleTimer || !SpinLoader.residents.has(this)) {
      return;
    }
    this.idleTimer = setTimeout(() => this.clear(), IDLE_TIMEOUT);
  }

  /** Switching variants immediately frees global slots while keeping completed cache entries. */
  private pausePending() {
    if (this.active.size || (this.controllers.size === 0 && !this.decoding)) {
      return;
    }
    this.generation += 1;
    for (const [index, controller] of this.controllers) {
      this.retryQueue.add(index);
      controller.abort();
    }
    this.controllers.clear();
    if (this.decodingIndex !== undefined) {
      this.decodeQueue.add(this.decodingIndex);
    }
    this.cancelDecode?.();
    this.cancelDecode = undefined;
    this.decoding = false;
    this.decodingIndex = undefined;
    this.emit();
  }

  private clear() {
    this.generation += 1;
    clearTimeout(this.idleTimer);
    SpinLoader.residents.delete(this);
    this.cancelDecode?.();
    this.cancelDecode = undefined;
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
    this.retryQueue.clear();
    this.cursor = 0;
    this.tier = 0;
    this.decoding = false;
    this.decodingIndex = undefined;
    this.idleTimer = undefined;
    this.emit();
    queueMicrotask(() => SpinLoader.pumpAll());
  }

  private pump() {
    SpinLoader.pumpAll();
  }

  private pumpNetwork(): boolean {
    if (!this.active.size || SpinLoader.pendingRequests() >= FETCH_LIMIT) {
      return false;
    }
    while (
      this.tier < this.tierEnds.length - 1 &&
      this.settled.size >= this.tierEnds[this.tier]
    ) {
      this.tier += 1;
    }
    const retry = this.order.find((candidate) =>
      this.retryQueue.has(candidate)
    );
    if (retry === undefined && this.cursor >= this.tierEnds[this.tier]) {
      return false;
    }
    const index = retry ?? this.order[this.cursor];
    if (retry === undefined) {
      this.cursor += 1;
    } else {
      this.retryQueue.delete(retry);
    }
    const controller = new AbortController();
    this.controllers.set(index, controller);
    this.fetchFrame(index, controller, this.generation);
    return true;
  }

  private async fetchFrame(
    index: number,
    controller: AbortController,
    generation: number
  ) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          "abort",
          () => reject(new Error("Spin request canceled")),
          { once: true }
        );
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Spin frame request timed out"));
        }, REQUEST_TIMEOUT);
      });
      const source =
        this.config.frameSources?.[index] ??
        `${this.config.basePath}/${String(index + 1).padStart(2, "0")}.webp`;
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
    this.decodingIndex = index;
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
        this.cancelDecode = () => {
          expired = true;
          reject(new Error("Spin decode canceled or timed out"));
        };
        timer = setTimeout(this.cancelDecode, DECODE_TIMEOUT);
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
        this.decodingIndex = undefined;
        this.cancelDecode = undefined;
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
  const key = JSON.stringify([
    config.basePath,
    config.frameCount,
    config.width,
    config.height,
    config.frameSources ?? null,
  ]);
  let loader = loaders.get(key);
  if (!loader) {
    loader = new SpinLoader(config);
    loaders.set(key, loader);
  }
  return loader;
}
