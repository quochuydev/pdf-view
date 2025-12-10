"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PDFViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <div className="text-center text-muted-foreground">Loading viewer...</div>,
  }
);

export default function Home() {
  const [url, setUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) {
      setPdfUrl(url.trim());
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <Input
            type="url"
            placeholder="Enter PDF URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">View PDF</Button>
        </form>
      </div>

      {pdfUrl && (
        <div className="flex-1 overflow-auto p-4">
          <PDFViewer url={pdfUrl} />
        </div>
      )}
    </div>
  );
}
