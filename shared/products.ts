import type { StaticImageData } from "next/image";

import rule60Assembled from "./assets/products/rule60-render-assembled.webp";
import rule60Exploded from "./assets/products/rule60-render-exploded.webp";
import rule60Top from "./assets/products/rule60-render-top.webp";
import rule60Underside from "./assets/products/rule60-render-underside.webp";
import rule60SpinPoster from "./assets/products/rule60-spin-poster.webp";

/** Message key under `products.items`. */
type ProductKey = "rule60";

/** Message key under `products.renderAlts`. */
type ProductRenderAlt =
  | "rule60Assembled"
  | "rule60Exploded"
  | "rule60Top"
  | "rule60Underside";

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
  height: number;
  poster: StaticImageData | string;
  width: number;
}

/**
 * 1200×630 link-preview media served from `public/assets`: a PNG still (`og:image`), the turntable MP4
 * (`og:video`), a looping GIF of it, and a player page for X's player card.
 */
export interface ProductPreview {
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
  /** Extra gallery images after the turntable. */
  renders: readonly { alt: ProductRenderAlt; image: StaticImageData }[];
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
    // The top case lives on this branch; `main` has only the wrist rest.
    downloadHref:
      "https://github.com/minpeter/rule60-wrist-rest/tree/hhkb-topcase-wrist-rest#hhkb-top-case-with-integrated-wrist-rest-experimental",
    key: "rule60",
    name: "Rule 60 HHKB Unibody",
    preview: {
      image: "/assets/products/rule60-hhkb-unibody/og.png",
      video: {
        animatedImage: "/assets/products/rule60-hhkb-unibody/og.gif",
        player: "/assets/products/rule60-hhkb-unibody/player.html",
        url: "/assets/products/rule60-hhkb-unibody/og.mp4",
      },
    },
    renders: [
      { alt: "rule60Assembled", image: rule60Assembled },
      { alt: "rule60Top", image: rule60Top },
      { alt: "rule60Exploded", image: rule60Exploded },
      { alt: "rule60Underside", image: rule60Underside },
    ],
    slug: "rule60-hhkb-unibody",
    sourceHref:
      "https://github.com/minpeter/rule60-wrist-rest/tree/hhkb-topcase-wrist-rest",
    spin: {
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
