"use client";

import { Button } from "@/components/ui/button";
import type { Annotation } from "@/types/annotation";
import { FONT_FAMILIES, PRESET_COLORS } from "@/types/annotation";
import { Plus, Trash2, Download, Pipette, Save, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const CUSTOM_FONTS_STORAGE_KEY = "pdf-viewer-custom-fonts";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  onAddAtCenter: () => void;
  onUpdate: (id: string, changes: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onDownload: () => void;
  onSave: () => void;
  onPickColor: () => void;
  isPickingColor: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}

const SIDEBAR_WIDTH = 220;

// Extract font name from Google Fonts URL
function extractFontFromUrl(url: string): string | null {
  // Handle URLs like https://fonts.google.com/specimen/Roboto
  const specimenMatch = url.match(/fonts\.google\.com\/specimen\/([^/?]+)/);
  if (specimenMatch) {
    return decodeURIComponent(specimenMatch[1]).replace(/\+/g, " ");
  }
  // Handle URLs like https://fonts.googleapis.com/css2?family=Roboto:wght@400;700
  const cssMatch = url.match(/fonts\.googleapis\.com\/css2?\?family=([^:&]+)/);
  if (cssMatch) {
    return decodeURIComponent(cssMatch[1]).replace(/\+/g, " ");
  }
  return null;
}

// Load a Google Font by injecting a link tag
function loadGoogleFont(fontName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const encodedFont = encodeURIComponent(fontName);
    const linkId = `google-font-${encodedFont}`;

    // Check if already loaded
    if (document.getElementById(linkId)) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodedFont}:wght@400;700&display=swap`;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${fontName}`));
    document.head.appendChild(link);
  });
}

export function AnnotationSidebar({
  annotations,
  selectedAnnotation,
  onAddAtCenter,
  onUpdate,
  onDelete,
  onDownload,
  onSave,
  onPickColor,
  isPickingColor,
  hasUnsavedChanges,
  isSaving,
}: AnnotationSidebarProps) {
  const bgColorInputRef = useRef<HTMLInputElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const [googleFontUrl, setGoogleFontUrl] = useState("");
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [fontLoading, setFontLoading] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);

  // Load custom fonts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
    if (stored) {
      const fonts: string[] = JSON.parse(stored);
      setCustomFonts(fonts);
      // Reload all fonts
      fonts.forEach((font) => loadGoogleFont(font).catch(() => {}));
    }
  }, []);

  // Save custom fonts to localStorage when they change
  function saveCustomFonts(fonts: string[]) {
    setCustomFonts(fonts);
    localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(fonts));
  }

  async function handleLoadGoogleFont() {
    if (!googleFontUrl.trim()) return;

    setFontLoading(true);
    setFontError(null);

    const fontName = extractFontFromUrl(googleFontUrl.trim());
    if (!fontName) {
      setFontError("Invalid Google Fonts URL");
      setFontLoading(false);
      return;
    }

    try {
      await loadGoogleFont(fontName);
      if (!customFonts.includes(fontName)) {
        saveCustomFonts([...customFonts, fontName]);
      }
      // Apply the font to the selected annotation
      if (selectedAnnotation) {
        onUpdate(selectedAnnotation.id, { fontFamily: fontName });
      }
      setGoogleFontUrl("");
    } catch {
      setFontError("Failed to load font");
    } finally {
      setFontLoading(false);
    }
  }
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

      {/* Save & Download buttons */}
      <div className="flex gap-2">
        <Button
          variant={hasUnsavedChanges ? "default" : "outline"}
          size="sm"
          className="flex-1 justify-center gap-1"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 justify-center gap-1"
          onClick={onDownload}
          disabled={annotations.length === 0}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
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
              {customFonts.length > 0 && (
                <optgroup label="Google Fonts">
                  {customFonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {/* Google Fonts URL input */}
            <div className="mt-2">
              <input
                type="text"
                value={googleFontUrl}
                onChange={(e) => setGoogleFontUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLoadGoogleFont();
                  }
                }}
                placeholder="Paste Google Fonts URL"
                className="w-full h-7 rounded-md border bg-background px-2 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1 h-7 text-xs"
                onClick={handleLoadGoogleFont}
                disabled={fontLoading || !googleFontUrl.trim()}
              >
                {fontLoading ? "Loading..." : "Load Font"}
              </Button>
              {fontError && (
                <p className="text-xs text-destructive mt-1">{fontError}</p>
              )}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs text-muted-foreground">Font Size (px)</label>
            <input
              type="number"
              min="1"
              max="200"
              value={selectedAnnotation.fontSize}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  onUpdate(selectedAnnotation.id, { fontSize: val });
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) {
                  onUpdate(selectedAnnotation.id, { fontSize: 14 });
                } else if (val > 200) {
                  onUpdate(selectedAnnotation.id, { fontSize: 200 });
                }
              }}
              className="w-full mt-1 h-8 rounded-md border bg-background px-2 text-sm"
            />
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
            {/* Hex input for background */}
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                style={{
                  backgroundColor: selectedAnnotation.backgroundColor === "transparent" ? undefined : selectedAnnotation.backgroundColor,
                  backgroundImage:
                    selectedAnnotation.backgroundColor === "transparent"
                      ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                      : undefined,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                }}
              />
              <input
                type="text"
                value={selectedAnnotation.backgroundColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "transparent" || /^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                    onUpdate(selectedAnnotation.id, { backgroundColor: val });
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val !== "transparent" && !/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onUpdate(selectedAnnotation.id, { backgroundColor: "#ffffff" });
                  }
                }}
                className="flex-1 h-7 rounded-md border bg-background px-2 text-xs font-mono"
                placeholder="#ffffff"
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
            <div className="flex flex-wrap gap-1 mt-1">
              {/* Common text colors */}
              {[
                { label: "Black", value: "#000000" },
                { label: "Dark Gray", value: "#333333" },
                { label: "Gray", value: "#666666" },
                { label: "Red", value: "#dc2626" },
                { label: "Blue", value: "#2563eb" },
                { label: "Green", value: "#16a34a" },
                { label: "White", value: "#ffffff" },
              ].map((color) => (
                <button
                  key={color.value}
                  title={color.label}
                  onClick={() =>
                    onUpdate(selectedAnnotation.id, { textColor: color.value })
                  }
                  className={`w-6 h-6 rounded border-2 ${
                    selectedAnnotation.textColor === color.value
                      ? "border-primary"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
              {/* Custom color picker */}
              <button
                title="Custom color"
                onClick={() => textColorInputRef.current?.click()}
                className="w-6 h-6 rounded border-2 border-gray-300 bg-gradient-to-br from-red-500 via-green-500 to-blue-500"
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
            </div>
            {/* Hex input for text color */}
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: selectedAnnotation.textColor }}
              />
              <input
                type="text"
                value={selectedAnnotation.textColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                    onUpdate(selectedAnnotation.id, { textColor: val });
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (!/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onUpdate(selectedAnnotation.id, { textColor: "#000000" });
                  }
                }}
                className="flex-1 h-7 rounded-md border bg-background px-2 text-xs font-mono"
                placeholder="#000000"
              />
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
    </div>
  );
}
