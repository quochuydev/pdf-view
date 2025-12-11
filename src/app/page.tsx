"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Edit, Upload } from "lucide-react";

const PDFViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="text-center text-muted-foreground">Loading viewer...</div>
    ),
  }
);

const STORAGE_KEY = "pdf-viewer-urls";

function HomeContent() {
  const [url, setUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return [];
  });
  const [editingEnabled, setEditingEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && urlParam.trim()) {
      const trimmedUrl = urlParam.trim();
      setUrl(trimmedUrl);
      setPdfUrl(trimmedUrl);
      setPdfFileName(null);
      saveToHistory(trimmedUrl);
    }
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const objectUrl = URL.createObjectURL(file);
      setPdfUrl(objectUrl);
      setPdfFileName(file.name);
      setUrl("");
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  function saveToHistory(newUrl: string) {
    const updated = [newUrl, ...history.filter((u) => u !== newUrl)].slice(
      0,
      10
    );
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function removeFromHistory(urlToRemove: string) {
    const updated = history.filter((u) => u !== urlToRemove);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) {
      const trimmed = url.trim();
      setPdfUrl(trimmed);
      setPdfFileName(null);
      saveToHistory(trimmed);
    }
  }

  function handleSelectHistory(selectedUrl: string) {
    setUrl(selectedUrl);
    setPdfUrl(selectedUrl);
    setPdfFileName(null);
    saveToHistory(selectedUrl);
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
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          {pdfUrl && (
            <Button
              type="button"
              variant={editingEnabled ? "default" : "outline"}
              onClick={() => setEditingEnabled(!editingEnabled)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </form>
        {pdfFileName && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {pdfFileName}
          </p>
        )}

        {history.length > 0 && !pdfUrl && (
          <div className="max-w-2xl mx-auto mt-4">
            <p className="text-xs text-muted-foreground mb-2">Recent PDFs:</p>
            <div className="flex flex-col gap-1">
              {history.map((historyUrl) => (
                <div
                  key={historyUrl}
                  className="flex items-center gap-2 text-sm group"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectHistory(historyUrl)}
                    className="text-left truncate flex-1 hover:text-primary transition-colors cursor-pointer"
                  >
                    {historyUrl}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromHistory(historyUrl)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pdfUrl && (
        <div className="flex-1 overflow-hidden">
          <PDFViewer url={pdfUrl} editingEnabled={editingEnabled} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center p-4 text-muted-foreground">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
