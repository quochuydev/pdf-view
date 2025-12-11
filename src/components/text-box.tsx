"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    annotationX: 0,
    annotationY: 0,
    annotationWidth: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (!isSelected || isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDelete();
        return;
      }

      // Ctrl/Cmd + Up/Down for font size
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "ArrowUp" || e.key === "ArrowDown")
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 4 : 1;
        const newSize =
          e.key === "ArrowUp"
            ? Math.min(200, annotation.fontSize + step)
            : Math.max(6, annotation.fontSize - step);
        onUpdate({ fontSize: newSize });
        return;
      }

      // Arrow key movement (like CapCut: normal = slow, shift = fast)
      const moveStep = e.shiftKey ? 1 : 0.1;
      let newX = annotation.x;
      let newY = annotation.y;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newY = Math.max(0, annotation.y - moveStep);
          break;
        case "ArrowDown":
          e.preventDefault();
          newY = Math.min(95, annotation.y + moveStep);
          break;
        case "ArrowLeft":
          e.preventDefault();
          newX = Math.max(0, annotation.x - moveStep);
          break;
        case "ArrowRight":
          e.preventDefault();
          newX = Math.min(100 - annotation.width, annotation.x + moveStep);
          break;
        default:
          return;
      }

      onUpdate({ x: newX, y: newY });
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSelected,
    isEditing,
    onDelete,
    annotation.x,
    annotation.y,
    annotation.width,
    annotation.fontSize,
    onUpdate,
  ]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        const newX =
          dragStartRef.current.annotationX + (deltaX / containerWidth) * 100;
        const newY =
          dragStartRef.current.annotationY + (deltaY / containerHeight) * 100;
        onUpdate({
          x: Math.max(0, Math.min(100 - annotation.width, newX)),
          y: Math.max(0, Math.min(95, newY)),
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const newWidth =
          dragStartRef.current.annotationWidth +
          (deltaX / containerWidth) * 100;
        onUpdate({
          width: Math.max(10, Math.min(100 - annotation.x, newWidth)),
        });
      }
    },
    [
      isDragging,
      isResizing,
      containerWidth,
      containerHeight,
      annotation.width,
      annotation.x,
      onUpdate,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  function handleMouseDown(e: React.MouseEvent) {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      annotationX: annotation.x,
      annotationY: annotation.y,
      annotationWidth: annotation.width,
    };
  }

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setIsResizing(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      annotationX: annotation.x,
      annotationY: annotation.y,
      annotationWidth: annotation.width,
    };
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
      className={cn(
        "absolute cursor-move select-none",
        isSelected && "outline outline-2 outline-dotted outline-primary",
        isDragging && "opacity-80"
      )}
      style={{
        left: pixelX,
        top: pixelY,
        width: pixelWidth,
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={annotation.text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          className="w-full resize-none outline-none border-none"
          style={{
            fontFamily: annotation.fontFamily,
            fontSize: annotation.fontSize,
            fontWeight: annotation.fontWeight,
            backgroundColor:
              annotation.backgroundColor === "transparent"
                ? "rgba(255,255,255,0.9)"
                : annotation.backgroundColor,
            color: annotation.textColor,
            padding: 0,
            margin: 0,
            lineHeight: "normal",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className={cn(
            "w-full whitespace-pre-wrap break-words",
            !annotation.text &&
              annotation.backgroundColor === "transparent" &&
              "border border-dashed border-gray-400"
          )}
          style={{
            fontFamily: annotation.fontFamily,
            fontSize: annotation.fontSize,
            fontWeight: annotation.fontWeight,
            backgroundColor: annotation.backgroundColor,
            color: annotation.textColor,
            padding: 0,
            margin: 0,
            lineHeight: "normal",
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
