import { NextResponse } from "next/server";
import { getPreviewHtml } from "@/lib/preview";

export const runtime = "nodejs";

export async function GET() {
  const html = await getPreviewHtml();

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "frame-ancestors 'self'; object-src 'none'",
    },
  });
}
