"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import {
  GlassSurface,
  type GlassSurfaceHandle,
} from "@/components/ui/glass-surface";
import {
  glassEase,
  MotionValue,
  PRESS_DURATION,
  prefersReducedMotion,
  RELEASE_DURATION,
  tween,
} from "@/components/ui/glass-motion";
import { cn } from "@/lib/utils";
import { type ReactNode, useCallback, useEffect, useRef } from "react";

const FOCUS_LIFT = 0.1;

interface GlassInputProps extends InputPrimitive.Props {
  height?: number;
  icon?: ReactNode;
  inputClassName?: string;
  tint?: number;
  tintColor?: string;
}

function GlassInput({
  height = 44,
  icon,
  inputClassName,
  tint = 0.5,
  tintColor,
  className,
  style,
  onFocus,
  onBlur,
  ...props
}: GlassInputProps) {
  const surfaceHandle = useRef<GlassSurfaceHandle | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const focusGlow = useRef(new MotionValue(0));
  const frame = useRef(0);

  const apply = useCallback(() => {
    frame.current = 0;
    const v = focusGlow.current.get();
    if (ringRef.current) {
      ringRef.current.style.opacity = String(v);
    }
    surfaceHandle.current?.setTintLift(FOCUS_LIFT * v);
  }, []);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  useEffect(() => {
    const off = focusGlow.current.on(schedule);
    return () => {
      off();
      cancelAnimationFrame(frame.current);
    };
  }, [schedule]);

  return (
    <label
      className={cn("relative inline-flex w-64 items-center", className)}
      style={{ height, borderRadius: height / 2, ...style }}
    >
      <GlassSurface
        aria-hidden="true"
        blur={10}
        className="absolute inset-0"
        handleRef={surfaceHandle}
        radius={height / 2}
        tint={tint}
        tintColor={tintColor}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        ref={ringRef}
        style={{
          opacity: 0,
          boxShadow:
            "0 0 0 2px rgba(152,150,255,0.7), inset 0 1px 0 0 rgba(255,255,255,0.5)",
        }}
      />
      {icon ? (
        <span className="relative z-10 ml-4 inline-flex shrink-0 items-center justify-center text-[#1d1d1f]/55 dark:text-[#f5f5f7]/55 [&_svg]:size-[18px]">
          {icon}
        </span>
      ) : null}
      <InputPrimitive
        className={cn(
          "relative z-10 h-full w-full min-w-0 rounded-[inherit] bg-transparent text-[#1d1d1f] text-[15px] outline-none placeholder:text-[#1d1d1f]/45 dark:text-[#f5f5f7] dark:placeholder:text-[#f5f5f7]/45",
          icon ? "pr-4 pl-2.5" : "px-4",
          inputClassName
        )}
        onBlur={(e) => {
          const d = prefersReducedMotion() ? 0 : RELEASE_DURATION;
          tween(focusGlow.current, 0, d, glassEase);
          onBlur?.(e);
        }}
        onFocus={(e) => {
          const d = prefersReducedMotion() ? 0 : PRESS_DURATION;
          tween(focusGlow.current, 1, d, glassEase);
          onFocus?.(e);
        }}
        {...props}
      />
    </label>
  );
}

export { GlassInput };
export type { GlassInputProps };
