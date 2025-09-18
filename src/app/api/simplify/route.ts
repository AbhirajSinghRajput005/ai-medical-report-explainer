import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/pdf";

export const runtime = "nodejs"; // ensure Node runtime for pdf-parse

export async function POST(req: NextRequest) {
  try {
    // ✅ Check for API key
    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json(
        { error: "Missing HUGGINGFACE_API_KEY" },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let text = "";

    // ✅ Handle PDF upload or pasted text
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
      // ✅ JSON fallback
      const body = await req.json().catch(() => null as any);
      text = body?.reportText || "";
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "No report content provided." },
        { status: 400 }
      );
    }

    // ✅ Hugging Face API call
    const HF_MODEL = process.env.HF_MODEL || "facebook/bart-large-cnn";

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Explain this medical report in simple, patient-friendly terms:\n\n${text}`,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const result = await response.json();

    // Hugging Face models return different fields depending on type
    const simplified =
      result[0]?.summary_text ||
      result[0]?.generated_text ||
      "No explanation generated.";

    return NextResponse.json({ simplified }, { status: 200 });
  } catch (err: any) {
    console.error("/api/simplify error", err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
