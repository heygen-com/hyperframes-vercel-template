import { NextResponse } from "next/server";
import { getPreviewFile, isPreviewNotFoundError } from "@/lib/preview";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  try {
    const file = await getPreviewFile(path.join("/"));
    return new NextResponse(new Uint8Array(file.content), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isPreviewNotFoundError(error)) {
      return new NextResponse("Not found", { status: 404 });
    }
    if (error instanceof Error && /Invalid preview path/i.test(error.message)) {
      return new NextResponse("Invalid path", { status: 400 });
    }
    throw error;
  }
}
