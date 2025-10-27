import { getProviderData } from "@flags-sdk/statsig";
import { type ApiData, verifyAccess, version } from "flags";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get("Authorization"));
  if (!access) {
    return NextResponse.json(null, { status: 401 });
  }

  const statsigData = await getProviderData({
    consoleApiKey: process.env.STATSIG_CONSOLE_API_KEY || "",
    projectId: process.env.STATSIG_PROJECT_ID || "",
  });

  return NextResponse.json<ApiData>(statsigData, {
    headers: { "x-flags-sdk-version": version },
  });
}
