"use client";

import { useRef, useEffect, useState } from "react";
import { TextBox } from "./text-box";
import type { Annotation } from "@/types/annotation";

interface PDFAnnotationLayerProps {
  pageNumber: number;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onAdd: (pageNumber: number, x: number, y: number) => void;
  onUpdate: (id: string, changes: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
  isPickingColor?: boolean;
  onColorPicked?: (color: string) => void;
}

export function PDFAnnotationLayer({
  pageNumber,
  annotations,
  selectedAnnotationId,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
  isPickingColor,
  onColorPicked,
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
    // If picking color, get color from the PDF canvas
    if (isPickingColor && onColorPicked) {
      const parent = containerRef.current?.parentElement;
      const canvas = parent?.querySelector("canvas");
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
          onColorPicked(hex);
          return;
        }
      }
    }

    if (e.target === containerRef.current) {
      onSelect(null);
    }
  }

  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNumber);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-10 ${isPickingColor ? "cursor-crosshair" : "cursor-crosshair"}`}
      onClick={handleContainerClick}
      onDoubleClick={isPickingColor ? undefined : handleClick}
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
