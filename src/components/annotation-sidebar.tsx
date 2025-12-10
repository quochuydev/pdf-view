"use client";

import { Button } from "@/components/ui/button";
import type { Annotation } from "@/types/annotation";
import { FONT_FAMILIES, FONT_SIZES, PRESET_COLORS } from "@/types/annotation";
import { Plus, Trash2, Download, Pipette } from "lucide-react";
import { useRef } from "react";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  onAddAtCenter: () => void;
  onUpdate: (id: string, changes: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onDownload: () => void;
  onPickColor: () => void;
  isPickingColor: boolean;
}

const SIDEBAR_WIDTH = 220;

export function AnnotationSidebar({
  annotations,
  selectedAnnotation,
  onAddAtCenter,
  onUpdate,
  onDelete,
  onDownload,
  onPickColor,
  isPickingColor,
}: AnnotationSidebarProps) {
  const bgColorInputRef = useRef<HTMLInputElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);
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

          {/* Background Color */}
          <div>
            <label className="text-xs text-muted-foreground">Background Color</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  title={color.label}
                  onClick={() =>
                    onUpdate(selectedAnnotation.id, { backgroundColor: color.value })
                  }
                  className={`w-6 h-6 rounded border-2 ${
                    selectedAnnotation.backgroundColor === color.value
                      ? "border-primary"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: color.value === "transparent" ? undefined : color.value,
                    backgroundImage:
                      color.value === "transparent"
                        ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                        : undefined,
                    backgroundSize: "8px 8px",
                    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                  }}
                />
              ))}
              {/* Custom color picker */}
              <button
                title="Custom color"
                onClick={() => bgColorInputRef.current?.click()}
                className="w-6 h-6 rounded border-2 border-gray-300 bg-gradient-to-br from-red-500 via-green-500 to-blue-500"
              />
              <input
                ref={bgColorInputRef}
                type="color"
                value={selectedAnnotation.backgroundColor === "transparent" ? "#ffffff" : selectedAnnotation.backgroundColor}
                onChange={(e) =>
                  onUpdate(selectedAnnotation.id, { backgroundColor: e.target.value })
                }
                className="sr-only"
              />
            </div>
            {/* Eyedropper / Pick from PDF */}
            <Button
              variant={isPickingColor ? "default" : "outline"}
              size="sm"
              className="w-full mt-2 justify-start gap-2"
              onClick={onPickColor}
            >
              <Pipette className="h-4 w-4" />
              {isPickingColor ? "Click on PDF to pick..." : "Pick from PDF"}
            </Button>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-xs text-muted-foreground">Text Color</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => textColorInputRef.current?.click()}
                className="w-8 h-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: selectedAnnotation.textColor }}
              />
              <input
                ref={textColorInputRef}
                type="color"
                value={selectedAnnotation.textColor}
                onChange={(e) =>
                  onUpdate(selectedAnnotation.id, { textColor: e.target.value })
                }
                className="sr-only"
              />
              <span className="text-xs text-muted-foreground">{selectedAnnotation.textColor}</span>
            </div>
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
