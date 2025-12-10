# PDF Text Annotation Feature Design

## Overview

Add text annotation capability to the PDF viewer. Users can place text boxes on top of PDF pages with customizable font family, size, weight, and box width. Annotations can be downloaded as a new PDF.

## Architecture

### Component Structure

```
src/components/
├── pdf-viewer.tsx              (existing - add editingEnabled prop)
├── pdf-annotation-layer.tsx    (new - overlay per page)
├── annotation-sidebar.tsx      (new - right sidebar)
└── text-box.tsx                (new - draggable/resizable text)
```

### Toggle API

```tsx
<PDFViewer url={pdfUrl} editingEnabled={editingEnabled} />
```

- `editingEnabled={false}`: PDF viewer works as today, no annotation UI
- `editingEnabled={true}`: Annotation layer + right sidebar appear

## Annotation State

Lives in `pdf-viewer.tsx`, passed down to children:

```ts
interface Annotation {
  id: string;
  pageNumber: number;
  x: number;          // percentage of page width (0-100)
  y: number;          // percentage of page height (0-100)
  width: number;      // percentage of page width
  text: string;       // Lexical editor state (JSON)
  fontFamily: string; // Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana
  fontSize: number;   // 8, 10, 12, 14, 16, 18, 24, 32, 48
  fontWeight: 'normal' | 'bold';
}

// State
annotations: Annotation[]
selectedAnnotationId: string | null

// Callbacks
onAdd(pageNumber: number, x: number, y: number): void
onUpdate(id: string, changes: Partial<Annotation>): void
onDelete(id: string): void
onSelect(id: string | null): void
```

## Text Box Behavior

### Creating
- Click anywhere on PDF page overlay
- New text box appears at click position (default 200px wide, auto height)
- Immediately enters edit mode

### Selecting & Moving
- Click text box to select
- Drag from inside to reposition
- 8 resize handles (corners + edges)
- Click outside to deselect

### Editing
- Double-click to enter edit mode
- Lexical rich text editor
- Text wraps within box width
- Height auto-expands

### Deleting
- Select + Delete/Backspace key
- Or delete button in sidebar

## Right Sidebar UI

Width: 220px, collapsible (hidden when editing disabled)

```
┌─────────────────────────┐
│  Annotations            │
│  [Toggle Switch]        │
├─────────────────────────┤
│  + Add Text Box         │
├─────────────────────────┤
│  Selected Text Box      │  ← Only when selected
│                         │
│  Font Family            │
│  [Dropdown]             │
│                         │
│  Font Size              │
│  [Dropdown]             │
│                         │
│  Font Weight            │
│  [Normal] [Bold]        │
│                         │
│  Box Width              │
│  [Slider]               │
│                         │
│  [Delete]               │
├─────────────────────────┤
│  [Download PDF]         │  ← When annotations exist
└─────────────────────────┘
```

### Font Options
- Families: Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana
- Sizes: 8, 10, 12, 14, 16, 18, 24, 32, 48pt

## Download Implementation

### Approach: Canvas Rendering (Option A)

1. For each PDF page:
   - Render PDF page to canvas
   - Draw all text annotations onto canvas
   - Convert to image
2. Combine page images into new PDF using jspdf
3. Trigger browser download

### Tradeoffs
- Original PDF text becomes rasterized (loses selectability)
- File size may increase
- What you see = what you get

### Future Option B
Keep original PDF intact, add text as overlay layer. Can swap download function later without changing UI code.

## Dependencies

New packages to install:
- `lexical` - text editor framework
- `@lexical/react` - React bindings for Lexical
- `jspdf` - PDF generation for download
