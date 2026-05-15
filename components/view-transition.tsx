import type { FC, ReactNode } from "react";
import React from "react";

/**
 * Properly typed ViewTransition wrapper for React 19 View Transitions API.
 *
 * This centralizes access to React's experimental `ViewTransition` component,
 * which is not yet fully typed in @types/react 19.2.x (as of May 2026).
 *
 * - `name` prop enables *named view transitions* (shared-element transitions)
 *   between pages, e.g. blog list <-> detail for titles and dates.
 * - The root wrapper (no `name`) in [locale]/layout.tsx provides the
 *   top-level transition context when combined with `experimental.viewTransition: true`
 *   in next.config.mts.
 *
 * Why the `any` cast?
 *   React 19.2.6 ships the runtime `ViewTransition` (enabled via Next.js flag),
 *   but the TypeScript definitions in "react" / "@types/react" do not export
 *   `ViewTransition` yet (or do not include the `name` prop and other VT-specific
 *   props like `enter`/`exit`/`share`/`update`). The previous hack duplicated
 *   the cast + import alias in 4 files + a global `react-canary.d.ts` module
 *   augmentation.
 *
 *   By using `import * as React from "react"` we avoid any named import that
 *   would require the augmentation, allowing us to fully delete `react-canary.d.ts`.
 *
 * Robustness:
 *   We perform a runtime check for the experimental `ViewTransition` on React.
 *   If not present (e.g. certain SSR scenarios, flag disabled, or future React
 *   versions), we gracefully fall back to a React Fragment. This prevents
 *   potential crashes as noted in automated review feedback.
 *
 * When upstream types are updated (future React 19.x or 20), we can simplify to:
 *   import { ViewTransition } from "react";
 *   export { ViewTransition };
 *   (and remove this file or make it a re-export).
 *
 * Usage remains identical:
 *   <ViewTransition name="blog-title-...">...</ViewTransition>
 *   <ViewTransition>{children}</ViewTransition>
 */
export interface ViewTransitionProps {
  children?: ReactNode;
  name?: string;
  // Additional props supported at runtime by React's ViewTransition
  // (enter, exit, update, share, ...) can be added here when needed.
  // They are currently unused in this codebase.
}

// biome-ignore lint/suspicious/noExplicitAny: React 19.2 ViewTransition not fully typed yet
const RawViewTransition = (React as any).ViewTransition;

/**
 * Safe wrapper around React's experimental ViewTransition.
 *
 * Falls back to a plain fragment if the experimental API is not available
 * (different React channel, SSR without the flag, etc.). This prevents
 * runtime crashes as suggested in review feedback.
 */
export const ViewTransition: FC<ViewTransitionProps> = RawViewTransition
  ? (props) => <RawViewTransition {...props} />
  : ({ children }) => <>{children}</>;
