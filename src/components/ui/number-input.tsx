"use client";

import * as React from "react";
import { cn } from "cn";

export interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: number | null | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  fallbackValue?: number;
}

const defaultNumberInputClasses =
  "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      min,
      max,
      step = 1,
      fallbackValue,
      className,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    // Keep local string state so user can clear/backspace freely while typing
    const [localValue, setLocalValue] = React.useState<string>(() =>
      value !== undefined && value !== null && !isNaN(value) ? String(value) : ""
    );
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync from parent value ONLY when not actively focused
    React.useEffect(() => {
      if (!isFocused) {
        setLocalValue(
          value !== undefined && value !== null && !isNaN(value)
            ? String(value)
            : ""
        );
      }
    }, [value, isFocused]);

    const isDecimal =
      typeof step === "number"
        ? !Number.isInteger(step)
        : String(step).includes(".");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty string or minus sign so user can backspace to empty and type a new digit
      if (raw === "" || raw === "-") {
        setLocalValue(raw);
        return;
      }

      const parsed = isDecimal ? parseFloat(raw) : parseInt(raw, 10);
      if (!isNaN(parsed)) {
        setLocalValue(raw);
        onChange(parsed);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const raw = localValue.trim();

      let finalVal: number;
      if (raw === "" || raw === "-") {
        finalVal =
          fallbackValue !== undefined
            ? fallbackValue
            : min !== undefined
            ? min
            : 0;
      } else {
        const parsed = isDecimal ? parseFloat(raw) : parseInt(raw, 10);
        if (isNaN(parsed)) {
          finalVal =
            fallbackValue !== undefined
              ? fallbackValue
              : min !== undefined
              ? min
              : 0;
        } else {
          finalVal = parsed;
          if (min !== undefined && finalVal < min) finalVal = min;
          if (max !== undefined && finalVal > max) finalVal = max;
        }
      }

      setLocalValue(String(finalVal));
      onChange(finalVal);
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
      onKeyDown?.(e);
    };

    return (
      <input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(defaultNumberInputClasses, className)}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";
