import { NextResponse } from "next/server";
import {
  getCompositionPreviewHtml,
  isPreviewNotFoundError,
} from "@/lib/preview";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  try {
    const html = await getCompositionPreviewHtml(path.join("/"));
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "frame-ancestors 'self'; object-src 'none'",
      },
    });
  } catch (error) {
    if (isPreviewNotFoundError(error)) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Preview error",
      { status: 400 },
    );
  }
}
