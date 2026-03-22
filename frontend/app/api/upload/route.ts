import { processUpload } from "@/backend/api/upload";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionDate = formData.get("date") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await processUpload(file, sessionDate, formData.get("segment") as string | null);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "EMPTY_SPREADSHEET") {
      return NextResponse.json({ error: "Empty spreadsheet" }, { status: 400 });
    }

    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
