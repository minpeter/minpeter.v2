export function register() {
  console.info("[instrumentation] Server initialized");
}

export function onRequestError(
  err: Error,
  _request: Request,
  context: { routerKind: string; routePath: string; routeType: string }
) {
  console.error("[instrumentation] Request error:", {
    message: err.message,
    path: context.routePath,
    routeType: context.routeType,
  });
}
