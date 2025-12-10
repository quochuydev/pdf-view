"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SIDEBAR_WIDTH = 160;
const THUMBNAIL_WIDTH = 120;

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.75);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    setError(err.message);
    setNumPages(null);
  }

  function zoomIn() {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  }

  function zoomOut() {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  }

  function scrollToPage(pageNumber: number) {
    const pageElement = pageRefs.current.get(pageNumber);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const pageWidth = containerWidth * zoom;

  return (
    <div className="flex h-full">
      {/* Sidebar with thumbnails */}
      <div
        className="flex-shrink-0 border-r bg-muted/30 overflow-y-auto p-2"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <Document file={url} loading={null} error={null}>
          {numPages &&
            Array.from({ length: numPages }, (_, index) => (
              <button
                key={`thumb_${index + 1}`}
                onClick={() => scrollToPage(index + 1)}
                className="block w-full mb-2 p-1 rounded hover:bg-muted transition-colors"
              >
                <Page
                  pageNumber={index + 1}
                  width={THUMBNAIL_WIDTH}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-sm mx-auto"
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {index + 1}
                </p>
              </button>
            ))}
        </Document>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-1 p-1.5 border-b bg-background">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={zoomOut}
            disabled={zoom === ZOOM_LEVELS[0]}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={zoomIn}
            disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* PDF pages */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4">
          <div className="flex flex-col items-center gap-4">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-muted-foreground">Loading PDF...</div>
              }
              error={
                <div className="text-destructive">
                  Failed to load PDF: {error || "Unknown error"}
                </div>
              }
            >
              {numPages &&
                Array.from({ length: numPages }, (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    ref={(el) => {
                      if (el) pageRefs.current.set(index + 1, el);
                    }}
                  >
                    <Page
                      pageNumber={index + 1}
                      className="mb-4 shadow-lg"
                      width={pageWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                ))}
            </Document>
            {numPages && (
              <p className="text-sm text-muted-foreground">
                {numPages} page{numPages > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
