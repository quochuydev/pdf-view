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
