import { Skeleton } from "@/components/ui/skeleton";

export interface ProductOutline {
  height: number;
  polygons: string[];
  width: number;
}

/** Offline outer contour, in the unchanged render canvas. No images or runtime tracing. */
export function ProductMediaSkeleton({
  className,
  outline,
}: {
  className: string;
  outline?: ProductOutline | null;
}) {
  return (
    <Skeleton
      className={`${className}${outline ? "relative bg-transparent" : ""}`}
      data-testid="product-media-skeleton"
    >
      {outline ? (
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full fill-primary/10"
          data-testid="product-silhouette"
          focusable="false"
          viewBox={`0 0 ${outline.width} ${outline.height}`}
        >
          {outline.polygons.map((points) => (
            <polygon key={points} points={points} />
          ))}
        </svg>
      ) : null}
    </Skeleton>
  );
}
