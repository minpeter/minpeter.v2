import type { StaticImageData } from "next/image";
import rule60SpinPoster from "./assets/products/rule60-spin-poster.webp";
import {
  personalManifestToSpin,
  validatedPersonalManifest,
} from "./maru60-personal";

/** Message key under `products.items`. */
type ProductKey = "rule60";

/** Message key under `products.items.<key>.details`, in display order. */
type ProductDetail =
  | "joints"
  | "license"
  | "print"
  | "reuse"
  | "size"
  | "status";

/**
 * Reconstructed 3D turntable renders (not photographs): `frameCount` transparent WebP frames served from
 * `public/assets` as `${basePath}/01.webp` … in turn order, all `width`×`height`.
 */
export interface ProductSpin {
  basePath: string;
  /** 0-based frame shown at rest; `poster` is the same frame, optimized for first paint. */
  defaultFrame: number;
  frameCount: number;
  /** Optional manifest-backed sources in angular order; otherwise 01.webp … */
  frameSources?: readonly string[];
  /** Verified manifest geometry; omitted for historical turntables. */
  geometryRevision?: "assembled-draft";
  height: number;
  poster: StaticImageData | string;
  width: number;
}

/**
 * 1200×630 link-preview media served from `public/assets`: a PNG still (`og:image`), the turntable MP4
 * (`og:video`), a looping GIF of it, and a player page for X's player card.
 */
interface ProductPreview {
  image: string;
  video: { animatedImage: string; player: string; url: string };
}

export interface Product {
  details: readonly ProductDetail[];
  /** Where the print files live. */
  downloadHref: string;
  key: ProductKey;
  name: string;
  preview?: ProductPreview;
  slug: string;
  sourceHref: string;
  spin: ProductSpin;
  /** Expected price range in KRW before launch; shown with a "coming soon" label. */
  upcomingPrice?: { max: number; min: number };
}

/** Display order on `/products`; add a product here plus `products.items.<key>` messages. */
export const PRODUCTS: readonly Product[] = [
  {
    details: ["size", "joints", "reuse", "print", "status", "license"],
    // Historical assets stay stable; the former page slug permanently redirects to maru60.
    // PR #1 contains the current top case and the unprinted bottom-case draft.
    downloadHref:
      "https://github.com/minpeter/maru60/tree/hhkb-topcase-wrist-rest/models",
    key: "rule60",
    name: "Maru60",
    preview: {
      image: "/assets/products/rule60-hhkb-unibody/og.png",
      video: {
        animatedImage: "/assets/products/rule60-hhkb-unibody/og.gif",
        player: "/assets/products/rule60-hhkb-unibody/player.html",
        url: "/assets/products/rule60-hhkb-unibody/og.mp4",
      },
    },
    slug: "maru60",
    sourceHref: "https://github.com/minpeter/maru60/pull/1",
    spin: validatedPersonalManifest
      ? personalManifestToSpin(validatedPersonalManifest)
      : {
          basePath: "/assets/products/rule60-hhkb-unibody/spin",
          defaultFrame: 0,
          frameCount: 72,
          height: 1536,
          poster: rule60SpinPoster,
          width: 1024,
        },
    upcomingPrice: { max: 300_000, min: 200_000 },
  },
];

export const getProduct = (slug: string): Product | undefined =>
  PRODUCTS.find((product) => product.slug === slug);
