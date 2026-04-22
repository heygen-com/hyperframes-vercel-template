import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { HYPERFRAMES_RUNTIME_URL } from "@/lib/preview";

function loadLocalRuntime(): string | null {
  const candidates = [
    join(process.cwd(), "node_modules/@hyperframes/core/dist/hyperframe.runtime.iife.js"),
    join(process.cwd(), "../../node_modules/@hyperframes/core/dist/hyperframe.runtime.iife.js"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf-8");
    }
  }

  return null;
}

export function GET(req: NextRequest) {
  if (
    HYPERFRAMES_RUNTIME_URL === "/api/runtime.js"
    || HYPERFRAMES_RUNTIME_URL === "/hyperframe.runtime.iife.js"
    || HYPERFRAMES_RUNTIME_URL === "/hyperframe-runtime.js"
  ) {
    const runtime = loadLocalRuntime();
    if (runtime) {
      return new NextResponse(runtime, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  const runtimeUrl = new URL(HYPERFRAMES_RUNTIME_URL, req.url);
  return NextResponse.redirect(runtimeUrl, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
