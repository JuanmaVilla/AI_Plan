"use client";

import { Slider } from "@/components/ui/slider";

export function ProgressSlider({
  value,
  onChange,
  onCommit,
}: {
  value: number;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  function read(v: number | readonly number[]): number {
    return Array.isArray(v) ? v[0] : (v as number);
  }

  return (
    <Slider
      value={[value]}
      min={0}
      max={100}
      step={5}
      onValueChange={(v) => onChange(read(v))}
      onValueCommitted={(v) => onCommit(read(v))}
      aria-label="Avance"
    />
  );
}
