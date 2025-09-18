import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/pdf";
import { simplifyMedicalReport } from "@/lib/openai";

export const runtime = "nodejs"; // ensure Node runtime for pdf-parse

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "";
    let text = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("report");
      const reportText = (formData.get("reportText") as string) || "";

      if (file && file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extracted = await extractTextFromPdf(buffer);
        text = [extracted, reportText].filter(Boolean).join("\n\n");
      } else if (reportText) {
        text = reportText;
      }
    } else {
      // JSON fallback
      const body = await req.json().catch(() => null as any);
      text = body?.reportText || "";
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No report content provided." }, { status: 400 });
    }

    const result = await simplifyMedicalReport(text);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("/api/simplify error", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}