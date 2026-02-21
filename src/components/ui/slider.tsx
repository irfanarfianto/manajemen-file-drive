"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> {
  onValueChange?: (value: number[]) => void;
  defaultValue?: number[];
  value?: number[];
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, value, defaultValue, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.([parseFloat(e.target.value)]);
    };

    const val = value?.[0] ?? defaultValue?.[0] ?? 0;
    const percentage = ((val - min) / (max - min)) * 100;

    return (
      <div className={cn("relative flex w-full h-5 touch-none select-none items-center group", className)}>
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-primary/20">
          <div 
            className="absolute h-full bg-primary transition-all duration-150" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={handleChange}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
            "appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full",
            "[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full"
          )}
          {...props}
        />
        <div 
          className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background shadow-xl transition-all duration-150 pointer-events-none group-hover:scale-110 z-20"
          style={{ left: `calc(${percentage}% - 10px)` }}
        >
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-primary text-[10px] font-bold text-primary-foreground opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            {Math.round(val * 100)}%
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary" />
          </div>
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
