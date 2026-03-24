export async function register() {
  console.info("[instrumentation] Server initialized");
}

export async function onRequestError(
  err: Error,
  request: Request,
  context: { routerKind: string; routePath: string; routeType: string }
) {
  console.error("[instrumentation] Request error:", {
    message: err.message,
    path: context.routePath,
    routeType: context.routeType,
  });
}
