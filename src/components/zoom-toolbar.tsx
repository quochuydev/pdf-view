interface ZoomToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZOOM_LEVELS = [
  { value: 0.5, label: "50%" },
  { value: 0.75, label: "75%" },
  { value: 1.0, label: "100%" },
  { value: 1.25, label: "125%" },
  { value: 1.5, label: "150%" },
  { value: 2.0, label: "200%" },
];

export function ZoomToolbar({ zoom, onZoomChange }: ZoomToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background">
      <label htmlFor="zoom-select" className="text-sm font-medium">
        Zoom:
      </label>
      <select
        id="zoom-select"
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="px-3 py-1 border rounded-md text-sm bg-background"
      >
        {ZOOM_LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
    </div>
  );
}
