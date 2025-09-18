"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SimplifiedReport, SimplifiedFinding } from "@/lib/openai";

export default function SimplifiedReportView({ data }: { data: SimplifiedReport }) {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{data.summary || "No summary provided."}</p>
        </CardContent>
      </Card>

      {data.findings?.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.findings.map((f: SimplifiedFinding, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{f.name || "Finding"}</CardTitle>
                  {f.status && (
                    <Badge variant={statusToVariant(f.status)} className="capitalize">{f.status}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {f.value && (
                  <div className="text-sm text-muted-foreground">Value: {f.value}</div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{f.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data.cautions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>General cautions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {data.cautions.map((c, i) => (
                <li key={i} className="text-sm leading-relaxed">{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function statusToVariant(status?: string): any {
  const s = (status || "").toLowerCase();
  if (s.includes("high")) return "default";
  if (s.includes("low")) return "secondary";
  if (s.includes("normal") || s.includes("within")) return "outline";
  return "secondary";
}