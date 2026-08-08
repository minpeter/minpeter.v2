/**
 * Client instrumentation runs before the app becomes interactive.
 * React Grab must load early so hover/⌘C can resolve component stacks.
 * Only active under `next dev` (NODE_ENV === "development").
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 * @see https://www.react-grab.com
 */
if (process.env.NODE_ENV === "development") {
  import("react-grab")
    .then(() => {
      if (typeof window !== "undefined" && window.__REACT_GRAB__) {
        console.info(
          "[react-grab] ready — hover a UI element, then ⌘C / Ctrl+C to copy context"
        );
      } else {
        console.warn(
          "[react-grab] module loaded but window.__REACT_GRAB__ is missing"
        );
      }
    })
    .catch((error: unknown) => {
      console.error("[react-grab] failed to load", error);
    });
}
