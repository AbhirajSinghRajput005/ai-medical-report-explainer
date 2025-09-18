export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamically import to avoid ESM/CJS interop issues in Next.js
  const mod: any = await import("pdf-parse");
  const pdfParse: any = mod?.default ?? mod;
  const data = await pdfParse(buffer);
  return data?.text || "";
}