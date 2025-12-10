"use client";

import { Button } from "@/components/ui/button";
import type { Annotation } from "@/types/annotation";
import { FONT_FAMILIES, FONT_SIZES } from "@/types/annotation";
import { Plus, Trash2, Download } from "lucide-react";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  onAddAtCenter: () => void;
  onUpdate: (id: string, changes: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onDownload: () => void;
}

const SIDEBAR_WIDTH = 220;

export function AnnotationSidebar({
  annotations,
  selectedAnnotation,
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
