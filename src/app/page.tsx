"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Edit } from "lucide-react";

const PDFViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <div className="text-center text-muted-foreground">Loading viewer...</div>,
  }
);

const STORAGE_KEY = "pdf-viewer-urls";

export default function Home() {
  const [url, setUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
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

  function saveToHistory(newUrl: string) {
    const updated = [newUrl, ...history.filter((u) => u !== newUrl)].slice(0, 10);
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
      saveToHistory(trimmed);
    }
  }

  function handleSelectHistory(selectedUrl: string) {
    setUrl(selectedUrl);
    setPdfUrl(selectedUrl);
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
          {pdfUrl && (
            <Button
              type="button"
              variant={editingEnabled ? "default" : "outline"}
              onClick={() => setEditingEnabled(!editingEnabled)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editingEnabled ? "Editing" : "Edit"}
            </Button>
          )}
        </form>

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
                    className="text-left truncate flex-1 hover:text-primary transition-colors"
                  >
                    {historyUrl}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromHistory(historyUrl)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
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
