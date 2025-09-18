import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // Do not throw at import time in Next.js; runtime checks happen in API route
  console.warn("OPENAI_API_KEY is not set. Set it in your environment to enable AI analysis.");
}

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type SimplifiedFinding = {
  name: string;
  value?: string;
  status?: string; // e.g., low/high/normal
  explanation: string;
};

export type SimplifiedReport = {
  summary: string;
  findings: SimplifiedFinding[];
  cautions: string[];
  rawTextSnippet?: string;
};

export async function simplifyMedicalReport(text: string): Promise<SimplifiedReport> {
  const prompt = `You are a clinical explainer that rewrites medical lab reports into plain language for laypeople.
- Extract key lab values (e.g., Hemoglobin, WBC, Platelets, Creatinine, ALT/AST, A1C, LDL, TSH, etc.).
- For each, include value if present, status (low/high/normal) relative to typical adult reference, and a 1-2 sentence lay explanation with possible common causes. Avoid definitive diagnoses.
- Add a short overall summary.
- Add 2-5 safety cautions (e.g., see a doctor if...).
- Keep neutral, non-alarming tone. Avoid providing medical advice beyond general guidance.
Return strict JSON with the following shape:
{
  "summary": string,
  "findings": Array<{"name": string, "value"?: string, "status"?: string, "explanation": string}>,
  "cautions": string[],
  "rawTextSnippet"?: string
}`;

  const user = `Report text to analyze (may be partial or noisy):\n\n${text.slice(0, 4000)}`; // keep token use reasonable

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices?.[0]?.message?.content?.trim() || "";

  // Attempt to parse JSON from the model output
  const jsonString = extractJson(content);
  try {
    const parsed = JSON.parse(jsonString);
    return normalizeSimplifiedReport(parsed);
  } catch {
    // Fallback to wrapping the raw content
    return {
      summary: content.slice(0, 600),
      findings: [],
      cautions: [
        "AI output could not be fully structured. Please review the text carefully.",
      ],
      rawTextSnippet: text.slice(0, 240),
    };
  }
}

function extractJson(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return s.slice(start, end + 1);
  return s;
}

function normalizeSimplifiedReport(obj: any): SimplifiedReport {
  return {
    summary: String(obj?.summary || ""),
    findings: Array.isArray(obj?.findings)
      ? obj.findings.map((f: any) => ({
          name: String(f?.name || ""),
          value: f?.value ? String(f.value) : undefined,
          status: f?.status ? String(f.status) : undefined,
          explanation: String(f?.explanation || ""),
        }))
      : [],
    cautions: Array.isArray(obj?.cautions) ? obj.cautions.map((c: any) => String(c)) : [],
    rawTextSnippet: obj?.rawTextSnippet ? String(obj.rawTextSnippet) : undefined,
  };
}