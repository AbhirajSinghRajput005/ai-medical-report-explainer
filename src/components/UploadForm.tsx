"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  reportFile: z.instanceof(File).optional(),
  reportText: z.string().optional(),
}).refine((data) => {
  const hasFile = data.reportFile && data.reportFile.size > 0;
  const hasText = data.reportText && data.reportText.trim().length > 0;
  return hasFile || hasText;
}, { message: "Provide a PDF or paste report text." });

export type UploadFormValues = z.infer<typeof schema>;

export type UploadFormProps = {
  onResult: (data: any) => void;
};

export default function UploadForm({ onResult }: UploadFormProps) {
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reportText: "" },
    mode: "onChange",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: UploadFormValues) {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      if (values.reportFile) formData.append("report", values.reportFile);
      if (values.reportText && values.reportText.trim()) formData.append("reportText", values.reportText.trim());

      const res = await fetch("/api/simplify", { method: "POST", body: formData });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      onResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const selectedFile = form.watch("reportFile");

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Medical Report</CardTitle>
        <CardDescription>Upload a PDF or paste text to get a plain-language explanation.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reportFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF file (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        field.onChange(file);
                      }}
                    />
                  </FormControl>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reportText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Or paste report text</FormLabel>
                  <FormControl>
                    <Textarea rows={8} placeholder="Paste lab report text here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Analyzing..." : "Simplify report"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => form.reset()} disabled={loading}>
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}