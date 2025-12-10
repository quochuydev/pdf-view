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
