# PDF Text Annotation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add toggle-able text annotation overlay to PDF viewer with draggable/resizable text boxes, font controls in a right sidebar, and PDF download.

**Architecture:** Annotation state lives in `pdf-viewer.tsx`. Three new components: `TextBox` (draggable text), `PDFAnnotationLayer` (overlay per page), `AnnotationSidebar` (controls). Lexical for rich text, jspdf for download.

**Tech Stack:** React, TypeScript, Lexical, jspdf, Tailwind CSS

---

## Task 1: Install Dependencies

**Step 1: Install lexical and jspdf**

Run:
```bash
npm install lexical @lexical/react jspdf
```

**Step 2: Verify installation**

Run:
```bash
npm ls lexical @lexical/react jspdf
```

Expected: All three packages listed without errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lexical and jspdf dependencies"
```

---

## Task 2: Create Annotation Types

**Files:**
- Create: `src/types/annotation.ts`

**Step 1: Create the types file**

```typescript
export interface Annotation {
  id: string;
  pageNumber: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
}

export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
] as const;

export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 24, 32, 48] as const;

export const DEFAULT_ANNOTATION: Omit<Annotation, "id" | "pageNumber" | "x" | "y"> = {
  width: 20,
  text: "",
  fontFamily: "Arial",
  fontSize: 14,
  fontWeight: "normal",
};
```

**Step 2: Commit**

```bash
git add src/types/annotation.ts
git commit -m "feat: add annotation types"
```

---

## Task 3: Create TextBox Component

**Files:**
- Create: `src/components/text-box.tsx`

**Step 1: Create the TextBox component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { Annotation } from "@/types/annotation";
import { cn } from "@/lib/utils";

interface TextBoxProps {
  annotation: Annotation;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (changes: Partial<Annotation>) => void;
  onDelete: () => void;
  containerWidth: number;
  containerHeight: number;
}

export function TextBox({
  annotation,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  containerWidth,
  containerHeight,
}: TextBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const pixelX = (annotation.x / 100) * containerWidth;
  const pixelY = (annotation.y / 100) * containerHeight;
  const pixelWidth = (annotation.width / 100) * containerWidth;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isSelected && !isEditing && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        onDelete();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, isEditing, onDelete]);

  function handleMouseDown(e: React.MouseEvent) {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pixelX, y: e.clientY - pixelY });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    const newX = ((e.clientX - dragStart.x) / containerWidth) * 100;
    const newY = ((e.clientY - dragStart.y) / containerHeight) * 100;
    onUpdate({
      x: Math.max(0, Math.min(100 - annotation.width, newX)),
      y: Math.max(0, Math.min(95, newY)),
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
    setIsResizing(false);
  }

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: 0 });
  }

  function handleResizeMouseMove(e: React.MouseEvent) {
    if (!isResizing) return;
    const deltaX = e.clientX - dragStart.x;
    const newWidth = annotation.width + (deltaX / containerWidth) * 100;
    onUpdate({ width: Math.max(10, Math.min(100 - annotation.x, newWidth)) });
    setDragStart({ x: e.clientX, y: 0 });
  }

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setIsEditing(true);
  }

  function handleBlur() {
    setIsEditing(false);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onUpdate({ text: e.target.value });
  }

  return (
    <div
      ref={boxRef}
      className={cn(
        "absolute cursor-move",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-80"
      )}
      style={{
        left: pixelX,
        top: pixelY,
        width: pixelWidth,
        minHeight: 24,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : isResizing ? handleResizeMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={annotation.text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          className="w-full min-h-[24px] bg-white/90 border border-primary resize-none outline-none p-1"
          style={{
            fontFamily: annotation.fontFamily,
            fontSize: annotation.fontSize,
            fontWeight: annotation.fontWeight,
          }}
        />
      ) : (
        <div
          className={cn(
            "w-full min-h-[24px] p-1 whitespace-pre-wrap break-words",
            !annotation.text && "bg-white/50 border border-dashed border-gray-400"
          )}
          style={{
            fontFamily: annotation.fontFamily,
            fontSize: annotation.fontSize,
            fontWeight: annotation.fontWeight,
          }}
        >
          {annotation.text || "Double-click to edit"}
        </div>
      )}

      {/* Resize handle */}
      {isSelected && !isEditing && (
        <div
          className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/50 hover:bg-primary"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/text-box.tsx
git commit -m "feat: add TextBox component with drag/resize"
```

---

## Task 4: Create PDFAnnotationLayer Component

**Files:**
- Create: `src/components/pdf-annotation-layer.tsx`

**Step 1: Create the annotation layer**

```tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { TextBox } from "./text-box";
import type { Annotation } from "@/types/annotation";
import { DEFAULT_ANNOTATION } from "@/types/annotation";

interface PDFAnnotationLayerProps {
  pageNumber: number;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onAdd: (pageNumber: number, x: number, y: number) => void;
  onUpdate: (id: string, changes: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
}

export function PDFAnnotationLayer({
  pageNumber,
  annotations,
  selectedAnnotationId,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
}: PDFAnnotationLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  function handleClick(e: React.MouseEvent) {
    if (e.target !== containerRef.current) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onAdd(pageNumber, x, y);
  }

  function handleContainerClick(e: React.MouseEvent) {
    if (e.target === containerRef.current) {
      onSelect(null);
    }
  }

  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNumber);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
      onClick={handleContainerClick}
      onDoubleClick={handleClick}
    >
      {pageAnnotations.map((annotation) => (
        <TextBox
          key={annotation.id}
          annotation={annotation}
          isSelected={annotation.id === selectedAnnotationId}
          onSelect={() => onSelect(annotation.id)}
          onUpdate={(changes) => onUpdate(annotation.id, changes)}
          onDelete={() => onDelete(annotation.id)}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
        />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/pdf-annotation-layer.tsx
git commit -m "feat: add PDFAnnotationLayer component"
```

---

## Task 5: Create AnnotationSidebar Component

**Files:**
- Create: `src/components/annotation-sidebar.tsx`

**Step 1: Create the sidebar**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import type { Annotation } from "@/types/annotation";
import { FONT_FAMILIES, FONT_SIZES } from "@/types/annotation";
import { Plus, Trash2, Download } from "lucide-react";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  currentPage: number;
  onAddAtCenter: () => void;
  onUpdate: (id: string, changes: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onDownload: () => void;
}

const SIDEBAR_WIDTH = 220;

export function AnnotationSidebar({
  annotations,
  selectedAnnotation,
  currentPage,
  onAddAtCenter,
  onUpdate,
  onDelete,
  onDownload,
}: AnnotationSidebarProps) {
  return (
    <div
      className="flex-shrink-0 border-l bg-muted/30 overflow-y-auto p-3 flex flex-col gap-4"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Header */}
      <div>
        <h3 className="font-medium text-sm">Annotations</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Double-click on page to add
        </p>
      </div>

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={onAddAtCenter}
      >
        <Plus className="h-4 w-4" />
        Add Text Box
      </Button>

      {/* Selected annotation controls */}
      {selectedAnnotation && (
        <div className="space-y-3 border-t pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase">
            Selected Text Box
          </h4>

          {/* Font Family */}
          <div>
            <label className="text-xs text-muted-foreground">Font Family</label>
            <select
              value={selectedAnnotation.fontFamily}
              onChange={(e) =>
                onUpdate(selectedAnnotation.id, { fontFamily: e.target.value })
              }
              className="w-full mt-1 h-8 rounded-md border bg-background px-2 text-sm"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs text-muted-foreground">Font Size</label>
            <select
              value={selectedAnnotation.fontSize}
              onChange={(e) =>
                onUpdate(selectedAnnotation.id, {
                  fontSize: Number(e.target.value),
                })
              }
              className="w-full mt-1 h-8 rounded-md border bg-background px-2 text-sm"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}pt
                </option>
              ))}
            </select>
          </div>

          {/* Font Weight */}
          <div>
            <label className="text-xs text-muted-foreground">Font Weight</label>
            <div className="flex gap-1 mt-1">
              <Button
                variant={selectedAnnotation.fontWeight === "normal" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-8"
                onClick={() =>
                  onUpdate(selectedAnnotation.id, { fontWeight: "normal" })
                }
              >
                Normal
              </Button>
              <Button
                variant={selectedAnnotation.fontWeight === "bold" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-8"
                onClick={() =>
                  onUpdate(selectedAnnotation.id, { fontWeight: "bold" })
                }
              >
                Bold
              </Button>
            </div>
          </div>

          {/* Width slider */}
          <div>
            <label className="text-xs text-muted-foreground">
              Box Width: {Math.round(selectedAnnotation.width)}%
            </label>
            <input
              type="range"
              min="10"
              max="90"
              value={selectedAnnotation.width}
              onChange={(e) =>
                onUpdate(selectedAnnotation.id, { width: Number(e.target.value) })
              }
              className="w-full mt-1"
            />
          </div>

          {/* Delete button */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => onDelete(selectedAnnotation.id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      {/* Download button */}
      {annotations.length > 0 && (
        <div className="mt-auto border-t pt-3">
          <Button
            variant="default"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/annotation-sidebar.tsx
git commit -m "feat: add AnnotationSidebar component"
```

---

## Task 6: Update PDFViewer with Annotation State

**Files:**
- Modify: `src/components/pdf-viewer.tsx`

**Step 1: Add imports and props**

At the top of the file, after existing imports, add:

```tsx
import { PDFAnnotationLayer } from "./pdf-annotation-layer";
import { AnnotationSidebar } from "./annotation-sidebar";
import type { Annotation } from "@/types/annotation";
import { DEFAULT_ANNOTATION } from "@/types/annotation";
```

Update the interface:

```tsx
interface PDFViewerProps {
  url: string;
  editingEnabled?: boolean;
}
```

**Step 2: Add annotation state inside the component**

After the existing useState declarations, add:

```tsx
const [annotations, setAnnotations] = useState<Annotation[]>([]);
const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(1);
```

**Step 3: Add annotation handlers**

After the existing functions (zoomIn, zoomOut, scrollToPage), add:

```tsx
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
  // Will implement in Task 7
  console.log("Download not yet implemented");
}

const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId) || null;
```

**Step 4: Update props destructuring**

Change the function signature:

```tsx
export function PDFViewer({ url, editingEnabled = false }: PDFViewerProps) {
```

**Step 5: Wrap each PDF page with annotation layer**

Replace the page rendering section (the `<div key={page_...}>` block inside the Document) with:

```tsx
<div
  key={`page_${index + 1}`}
  ref={(el) => {
    if (el) pageRefs.current.set(index + 1, el);
  }}
  className="relative"
>
  <Page
    pageNumber={index + 1}
    className="mb-4 shadow-lg"
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
    />
  )}
</div>
```

**Step 6: Add the sidebar**

In the return statement, after the main content `</div>` (the `flex-1 flex flex-col min-w-0` div) and before the closing `</div>` of the outer flex container, add:

```tsx
{editingEnabled && (
  <AnnotationSidebar
    annotations={annotations}
    selectedAnnotation={selectedAnnotation}
    currentPage={currentPage}
    onAddAtCenter={handleAddAtCenter}
    onUpdate={handleUpdateAnnotation}
    onDelete={handleDeleteAnnotation}
    onDownload={handleDownload}
  />
)}
```

**Step 7: Commit**

```bash
git add src/components/pdf-viewer.tsx
git commit -m "feat: integrate annotation state and components into PDFViewer"
```

---

## Task 7: Implement PDF Download

**Files:**
- Modify: `src/components/pdf-viewer.tsx`

**Step 1: Add jspdf import**

At the top with other imports:

```tsx
import { jsPDF } from "jspdf";
```

**Step 2: Replace handleDownload function**

```tsx
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
    const scaleY = canvas.height / pageElement.clientHeight;

    for (const annotation of pageAnnotations) {
      const x = (annotation.x / 100) * canvas.width;
      const y = (annotation.y / 100) * canvas.height;
      const width = (annotation.width / 100) * canvas.width;

      ctx.font = `${annotation.fontWeight} ${annotation.fontSize * scaleX}px ${annotation.fontFamily}`;
      ctx.fillStyle = "black";
      ctx.textBaseline = "top";

      // Simple text wrapping
      const words = annotation.text.split(" ");
      let line = "";
      let lineY = y;
      const lineHeight = annotation.fontSize * scaleX * 1.2;

      for (const word of words) {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width && line !== "") {
          ctx.fillText(line, x, lineY);
          line = word + " ";
          lineY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, lineY);
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
```

**Step 3: Commit**

```bash
git add src/components/pdf-viewer.tsx
git commit -m "feat: implement PDF download with annotations"
```

---

## Task 8: Add Editing Toggle to Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add editing state**

After the existing useState declarations, add:

```tsx
const [editingEnabled, setEditingEnabled] = useState(false);
```

**Step 2: Import Edit icon**

Update the lucide-react import:

```tsx
import { X, Edit } from "lucide-react";
```

**Step 3: Add toggle button in the header**

In the form, after the "View PDF" Button, add:

```tsx
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
```

**Step 4: Pass prop to PDFViewer**

Update the PDFViewer usage:

```tsx
<PDFViewer url={pdfUrl} editingEnabled={editingEnabled} />
```

**Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add editing toggle to main page"
```

---

## Task 9: Manual Testing

**Step 1: Start dev server**

Run:
```bash
npm run dev
```

**Step 2: Test checklist**

- [ ] Load a PDF URL
- [ ] Click "Edit" button - sidebar should appear
- [ ] Double-click on PDF page - text box should appear
- [ ] Type in text box
- [ ] Drag text box to new position
- [ ] Resize text box using right handle
- [ ] Change font family in sidebar
- [ ] Change font size in sidebar
- [ ] Toggle bold/normal weight
- [ ] Adjust width slider
- [ ] Press Delete key to remove selected box
- [ ] Click "Download PDF" - file should download with annotations
- [ ] Toggle "Edit" off - sidebar and annotation layer should hide

**Step 3: Fix any issues found, commit fixes**

---

## Task 10: Final Cleanup and Commit

**Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors.

**Step 2: Run build**

```bash
npm run build
```

Ensure no build errors.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete PDF annotation feature"
```
