"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { jsPDF } from "jspdf";
import { PDFAnnotationLayer } from "./pdf-annotation-layer";
import { AnnotationSidebar } from "./annotation-sidebar";
import type { Annotation } from "@/types/annotation";
import { DEFAULT_ANNOTATION } from "@/types/annotation";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  editingEnabled?: boolean;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SIDEBAR_WIDTH = 160;
const THUMBNAIL_WIDTH = 120;

export function PDFViewer({ url, editingEnabled = false }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.75);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [currentPage] = useState(1);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [savedAnnotations, setSavedAnnotations] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const isUndoing = useRef(false);
  const [clipboard, setClipboard] = useState<Annotation | null>(null);

  // Generate storage key based on URL
  const storageKey = `pdf-annotations-${url}`;

  // Load saved annotations on mount or URL change
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnnotations(parsed);
        setSavedAnnotations(saved);
      } catch {
        // Invalid JSON, ignore
      }
    } else {
      setAnnotations([]);
      setSavedAnnotations("");
    }
    setHasUnsavedChanges(false);
  }, [storageKey]);

  // Track unsaved changes and history for undo
  useEffect(() => {
    const currentJson = JSON.stringify(annotations);
    setHasUnsavedChanges(currentJson !== savedAnnotations);

    // Add to history for undo (skip if we're undoing)
    if (!isUndoing.current) {
      setHistory((prev) => {
        const newHistory = [...prev, annotations];
        // Keep last 50 states
        return newHistory.slice(-50);
      });
    }
    isUndoing.current = false;
  }, [annotations, savedAnnotations]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Small delay to show the saving indicator
    await new Promise((resolve) => setTimeout(resolve, 300));
    const json = JSON.stringify(annotations);
    localStorage.setItem(storageKey, json);
    setSavedAnnotations(json);
    setHasUnsavedChanges(false);
    setIsSaving(false);
  }, [annotations, storageKey]);

  // Auto-save every 5 seconds if there are unsaved changes
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!hasUnsavedChanges || !editingEnabled) return;

    const timer = setTimeout(() => {
      handleSaveRef.current();
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, editingEnabled]);

  // Keyboard shortcuts: Undo (Ctrl/Cmd+Z), Copy (Ctrl/Cmd+C), Paste (Ctrl/Cmd+V)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!editingEnabled) return;

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (history.length > 1) {
          isUndoing.current = true;
          const newHistory = history.slice(0, -1);
          setHistory(newHistory);
          setAnnotations(newHistory[newHistory.length - 1] || []);
        }
        return;
      }

      // Copy selected annotation
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedAnnotationId) {
        const selected = annotations.find((a) => a.id === selectedAnnotationId);
        if (selected) {
          setClipboard({ ...selected });
        }
        return;
      }

      // Paste annotation
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboard) {
        e.preventDefault();
        const newAnnotation: Annotation = {
          ...clipboard,
          id: Math.random().toString(36).substring(2, 9),
          x: Math.min(clipboard.x + 2, 100 - clipboard.width), // Offset slightly
          y: Math.min(clipboard.y + 2, 95),
        };
        setAnnotations((prev) => [...prev, newAnnotation]);
        setSelectedAnnotationId(newAnnotation.id);
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, editingEnabled, selectedAnnotationId, annotations, clipboard]);

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

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  function handleAddAnnotation(pageNumber: number, x: number, y: number) {
    const newAnnotation: Annotation = {
      ...DEFAULT_ANNOTATION,
      id: generateId(),
      pageNumber,
      x,
      y,
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
    setSelectedAnnotationId(newAnnotation.id);
  }

  function handleAddAtCenter() {
    handleAddAnnotation(currentPage, 40, 40);
  }

  function handleUpdateAnnotation(id: string, changes: Partial<Annotation>) {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...changes } : a))
    );
  }

  function handleDeleteAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  }

  function handleSelectAnnotation(id: string | null) {
    setSelectedAnnotationId(id);
  }

  async function handleDownload() {
    if (!numPages || !containerRef.current) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
    });

    const pageElements = containerRef.current.querySelectorAll(".react-pdf__Page");

    for (let i = 0; i < pageElements.length; i++) {
      const pageElement = pageElements[i] as HTMLElement;
      const canvas = pageElement.querySelector("canvas");

      if (!canvas) continue;

      // Create a new canvas to draw both PDF and annotations
      const combinedCanvas = document.createElement("canvas");
      const ctx = combinedCanvas.getContext("2d");
      if (!ctx) continue;

      combinedCanvas.width = canvas.width;
      combinedCanvas.height = canvas.height;

      // Draw the PDF page
      ctx.drawImage(canvas, 0, 0);

      // Draw annotations for this page
      const pageAnnotations = annotations.filter((a) => a.pageNumber === i + 1);
      const scaleX = canvas.width / pageElement.clientWidth;

      for (const annotation of pageAnnotations) {
        const x = (annotation.x / 100) * canvas.width;
        const y = (annotation.y / 100) * canvas.height;
        const width = (annotation.width / 100) * canvas.width;
        const padding = 4 * scaleX;

        // Draw background
        if (annotation.backgroundColor && annotation.backgroundColor !== "transparent") {
          ctx.fillStyle = annotation.backgroundColor;
          // Calculate text height for background
          ctx.font = `${annotation.fontWeight} ${annotation.fontSize * scaleX}px ${annotation.fontFamily}`;
          const words = annotation.text.split(" ");
          let line = "";
          let lines = 0;
          for (const word of words) {
            const testLine = line + word + " ";
            const metrics = ctx.measureText(testLine);
            if (metrics.width > width - padding * 2 && line !== "") {
              lines++;
              line = word + " ";
            } else {
              line = testLine;
            }
          }
          if (line) lines++;
          const textHeight = lines * annotation.fontSize * scaleX * 1.2;
          ctx.fillRect(x, y, width, textHeight + padding * 2);
        }

        ctx.font = `${annotation.fontWeight} ${annotation.fontSize * scaleX}px ${annotation.fontFamily}`;
        ctx.fillStyle = annotation.textColor || "black";
        ctx.textBaseline = "top";

        // Simple text wrapping
        const words = annotation.text.split(" ");
        let line = "";
        let lineY = y + padding;
        const lineHeight = annotation.fontSize * scaleX * 1.2;

        for (const word of words) {
          const testLine = line + word + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > width - padding * 2 && line !== "") {
            ctx.fillText(line, x + padding, lineY);
            line = word + " ";
            lineY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x + padding, lineY);
      }

      // Add page to PDF
      const imgData = combinedCanvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (combinedCanvas.height / combinedCanvas.width) * pdfWidth;

      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save("annotated.pdf");
  }

  function handlePickColor() {
    setIsPickingColor(!isPickingColor);
  }

  function handleColorPicked(color: string) {
    if (selectedAnnotationId) {
      handleUpdateAnnotation(selectedAnnotationId, { backgroundColor: color });
    }
    setIsPickingColor(false);
  }

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId) || null;

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
                className="block w-full mb-2 p-1 rounded hover:bg-muted transition-colors cursor-pointer"
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
                    className="mb-4"
                  >
                    <div className="relative shadow-lg">
                      <Page
                        pageNumber={index + 1}
                        width={pageWidth}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                      {editingEnabled && (
                        <PDFAnnotationLayer
                          pageNumber={index + 1}
                          annotations={annotations}
                          selectedAnnotationId={selectedAnnotationId}
                          onAdd={handleAddAnnotation}
                          onUpdate={handleUpdateAnnotation}
                          onDelete={handleDeleteAnnotation}
                          onSelect={handleSelectAnnotation}
                          isPickingColor={isPickingColor}
                          onColorPicked={handleColorPicked}
                          scale={zoom}
                        />
                      )}
                    </div>
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

      {editingEnabled && (
        <AnnotationSidebar
          annotations={annotations}
          selectedAnnotation={selectedAnnotation}
          onAddAtCenter={handleAddAtCenter}
          onUpdate={handleUpdateAnnotation}
          onDelete={handleDeleteAnnotation}
          onDownload={handleDownload}
          onSave={handleSave}
          onPickColor={handlePickColor}
          isPickingColor={isPickingColor}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
