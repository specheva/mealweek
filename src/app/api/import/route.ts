import { NextRequest, NextResponse } from "next/server";
import { parseImportUrl } from "@/lib/import-parser";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const result = await parseImportUrl(url);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not extract data from this link. You can still add the meal manually.",
        sourceUrl: url,
        confidence: "none",
      },
      { status: 200 } // 200 because the user can still proceed
    );
  }
}
