"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";
import SimplifiedReportView from "@/components/SimplifiedReport";
import type { SimplifiedReport } from "@/lib/openai";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [result, setResult] = useState<SimplifiedReport | null>(null);

  return (
    <div className="min-h-screen w-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl flex flex-col items-center gap-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">AI Medical Report Simplifier</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a PDF lab report or paste the text and get a plain-language explanation of key values.
            This tool is for educational purposes only and is not a substitute for professional medical advice.
          </p>
        </header>

        <UploadForm onResult={(data) => setResult(data)} />

        {!result && (
          <Card className="w-full max-w-3xl">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No analysis yet. Submit a report to see results here.
            </CardContent>
          </Card>
        )}

        {result && <SimplifiedReportView data={result} />}

        <footer className="pt-8 text-xs text-muted-foreground text-center max-w-3xl">
          Always discuss lab results with your healthcare professional. If you have concerning symptoms,
          seek medical care promptly.
        </footer>
      </div>
    </div>
  );
}