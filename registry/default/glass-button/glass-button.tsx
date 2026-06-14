"use client";

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
import { type ComponentProps, useCallback, useEffect, useRef } from "react";

const PRESS_SCALE = 0.92;
const PRESS_LIFT = -0.2;

interface GlassButtonProps extends ComponentProps<"button"> {
  size?: number;
  tint?: number;
  tintColor?: string;
  variant?: "icon" | "capsule";
}

function GlassButton({
  size = 44,
  tint = 0.2,
  tintColor,
  variant = "icon",
  className,
  style,
  children,
  type = "button",
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown,
  onKeyUp,
  ...props
}: GlassButtonProps) {
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const surfaceHandle = useRef<GlassSurfaceHandle | null>(null);
  const scale = useRef(new MotionValue(1));
  const lift = useRef(new MotionValue(0));
  const pressed = useRef(false);
  const frame = useRef(0);

  const apply = useCallback(() => {
    frame.current = 0;
    const inner = innerRef.current;
    if (inner) {
      const s = scale.current.get();
      inner.style.transform = s === 1 ? "" : `scale(${s})`;
    }
    surfaceHandle.current?.setTintLift(lift.current.get());
  }, []);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  useEffect(() => {
    const subs = [scale.current.on(schedule), lift.current.on(schedule)];
    return () => {
      for (const off of subs) {
        off();
      }
      cancelAnimationFrame(frame.current);
    };
  }, [schedule]);

  const press = useCallback(() => {
    if (pressed.current) {
      return;
    }
    pressed.current = true;
    const d = prefersReducedMotion() ? 0 : PRESS_DURATION;
    tween(scale.current, PRESS_SCALE, d, glassEase);
    tween(lift.current, PRESS_LIFT, d, glassEase);
  }, []);

  const release = useCallback(() => {
    if (!pressed.current) {
      return;
    }
    pressed.current = false;
    const d = prefersReducedMotion() ? 0 : RELEASE_DURATION;
    tween(scale.current, 1, d, glassEase);
    tween(lift.current, 0, d, glassEase);
  }, []);

  return (
    <button
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center text-[#1d1d1f] outline-none focus-visible:outline-2 focus-visible:outline-[#9896ff] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#f5f5f7]",
        className
      )}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          press();
        }
        onKeyDown?.(e);
      }}
      onKeyUp={(e) => {
        release();
        onKeyUp?.(e);
      }}
      onPointerCancel={(e) => {
        release();
        onPointerCancel?.(e);
      }}
      onPointerDown={(e) => {
        press();
        onPointerDown?.(e);
      }}
      onPointerLeave={(e) => {
        release();
        onPointerLeave?.(e);
      }}
      onPointerUp={(e) => {
        release();
        onPointerUp?.(e);
      }}
      style={{
        height: size,
        width: variant === "icon" ? size : undefined,
        borderRadius: size / 2,
        ...style,
      }}
      type={type}
      {...props}
    >
      <span
        className={cn(
          "relative inline-flex h-full items-center justify-center rounded-[inherit]",
          variant === "icon" && "w-full"
        )}
        ref={innerRef}
        style={{
          paddingInline: variant === "capsule" ? Math.round(size * 0.45) : 0,
          willChange: "transform",
        }}
      >
        <GlassSurface
          aria-hidden="true"
          blur={8}
          className="absolute inset-0"
          handleRef={surfaceHandle}
          radius={size / 2}
          tint={tint}
          tintColor={tintColor}
        />
        <span className="relative inline-flex items-center justify-center gap-2 font-medium text-[15px] leading-none">
          {children}
        </span>
      </span>
    </button>
  );
}

export { GlassButton };
export type { GlassButtonProps };
