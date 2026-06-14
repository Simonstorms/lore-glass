"use client";

import { Glass, useGlassDark } from "@/components/ui/glass";
import {
  glassEase,
  MotionValue,
  PRESS_DURATION,
  prefersReducedMotion,
  rubberBand,
  SpringDriver,
  TRAVEL_DURATION,
  tween,
} from "@/components/ui/glass-motion";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

const TRACK_W = 240;
const TRACK_H = 6;
const THUMB_H = 22;
const THUMB_W = Math.round(2 * THUMB_H);
const TRAVEL = TRACK_W - THUMB_W;
const LENS_HALF_W = THUMB_W / 2;
const LENS_HALF_H = THUMB_H / 2;
const LENS_R = THUMB_H / 2;
const FAT_H = Math.round(0.75 * THUMB_H);
const RUBBER_OVERSHOOT = TRACK_W * 0.05;
const RUBBER_DAMPENING = 30;
const BLEED =
  Math.ceil(0.5 * Math.max(LENS_HALF_W, LENS_HALF_H) + RUBBER_OVERSHOOT) + 2;
const PRESS_GROW = 1.5;
const TINT_BLUR = 4;
const REST_TINT = 1;
const DEFORM_STIFFNESS = 180;
const DEFORM_DAMPING = 14;
const DEFORM_CAP = 0.35;
const DEFORM_GAIN = 0.012;
const DEFORM_EXP = 0.75;
const HOLD_BOOST = 0.175;

const PRIMARY = "#0a84ff";
const BG4_LIGHT = "#e1dfdf";
const BG4_DARK = "#2a2828";
const SHADOW_STRONG_LIGHT = "rgba(46, 15, 15, 0.12)";
const SHADOW_STRONG_DARK = "rgba(0, 0, 0, 0.5)";

interface GlassSliderProps {
  ariaLabel?: string;
  className?: string;
  defaultValue?: number;
  disabled?: boolean;
  max?: number;
  min?: number;
  onValueChange?: (value: number) => void;
  step?: number;
  value?: number;
}

function GlassSlider({
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled = false,
  ariaLabel = "Value",
  className,
}: GlassSliderProps) {
  const dark = useGlassDark();
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const currentRef = useRef(current);
  currentRef.current = current;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const brightnessRef = useRef<HTMLDivElement | null>(null);
  const tintRef = useRef<HTMLDivElement | null>(null);
  const restShadowRef = useRef<HTMLDivElement | null>(null);
  const pressShadowRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const fatWrapRef = useRef<HTMLDivElement | null>(null);
  const fatFillRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const span = Math.max(max - min, 1e-6);
  const toX = useCallback(
    (v: number) => ((v - min) / span) * TRAVEL,
    [min, span]
  );
  const toValue = useCallback(
    (xv: number) => {
      const clamped = Math.min(Math.max(xv, 0), TRAVEL);
      const raw = min + (clamped / TRAVEL) * span;
      return step > 0 ? Math.round((raw - min) / step) * step + min : raw;
    },
    [min, span, step]
  );

  const x = useRef(new MotionValue(toX(current)));
  const lensHalfW = useRef(new MotionValue(LENS_HALF_W));
  const lensHalfH = useRef(new MotionValue(LENS_HALF_H));
  const lensR = useRef(new MotionValue(LENS_R));
  const tintOpacity = useRef(new MotionValue(REST_TINT));
  const tintBlur = useRef(new MotionValue(TINT_BLUR));
  const fatScaleX = useRef(new MotionValue(0.85));
  const fatScaleY = useRef(new MotionValue(0.525));
  const shadowOpacity = useRef(new MotionValue(0));
  const deform = useRef(new MotionValue(0));
  const heldRef = useRef(false);
  const activePointer = useRef<number | null>(null);
  const grabClientX = useRef(0);
  const grabX = useRef(0);
  const frame = useRef(0);

  const deformDriver = useRef<SpringDriver | null>(null);
  if (!deformDriver.current) {
    deformDriver.current = new SpringDriver(
      deform.current,
      { stiffness: DEFORM_STIFFNESS, damping: DEFORM_DAMPING },
      () => {
        const v = Math.abs(x.current.getVelocity());
        const fromVelocity = DEFORM_GAIN * v ** DEFORM_EXP;
        const boost = heldRef.current ? HOLD_BOOST : 0;
        return Math.min(DEFORM_CAP, Math.max(fromVelocity, boost));
      },
      () => !heldRef.current && Math.abs(x.current.getVelocity()) < 0.005
    );
  }
  const startDeform = useCallback(() => {
    if (!prefersReducedMotion()) {
      deformDriver.current?.start();
    }
  }, []);

  const apply = useCallback(() => {
    frame.current = 0;
    const marker = markerRef.current;
    if (!marker) {
      return;
    }
    const xv = Math.min(
      Math.max(x.current.get(), -RUBBER_OVERSHOOT),
      TRAVEL + RUBBER_OVERSHOOT
    );
    const q = deform.current.get();
    const w = 2 * lensHalfW.current.get() * (1 - 0.2 * q);
    const h = 2 * lensHalfH.current.get() * (1 + 0.4 * q);
    const r = lensR.current.get();
    const centerX = BLEED + THUMB_W / 2 + xv;
    const centerY = BLEED + THUMB_H / 2;
    marker.style.width = `${w}px`;
    marker.style.height = `${h}px`;
    marker.style.borderRadius = `${r}px`;
    marker.style.left = `${centerX - w / 2}px`;
    marker.style.top = `${centerY - h / 2}px`;
    if (tintRef.current) {
      const t = tintOpacity.current.get();
      tintRef.current.style.background = `rgba(255,255,255,${t})`;
      const b = tintBlur.current.get();
      const filter = b > 0.05 ? `blur(${b}px)` : "none";
      tintRef.current.style.backdropFilter = filter;
      tintRef.current.style.setProperty("-webkit-backdrop-filter", filter);
    }
    const so = shadowOpacity.current.get();
    if (restShadowRef.current) {
      restShadowRef.current.style.opacity = String(1 - so);
    }
    if (pressShadowRef.current) {
      pressShadowRef.current.style.opacity = String(so);
    }
    const fillW = Math.min(Math.max(xv + THUMB_W / 2, 0), TRACK_W);
    if (fillRef.current) {
      fillRef.current.style.width = `${fillW}px`;
    }
    const progress = TRAVEL > 0 ? Math.max(0, Math.min(1, xv / TRAVEL)) : 0;
    if (fatFillRef.current) {
      fatFillRef.current.style.transform = `translateX(${(progress - 1) * 100}%)`;
    }
    if (fatWrapRef.current) {
      fatWrapRef.current.style.transform = `scale(${fatScaleX.current.get()}, ${fatScaleY.current.get()})`;
    }
  }, []);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  const syncValue = useCallback(() => {
    const next = toValue(x.current.get());
    if (next !== currentRef.current) {
      if (value === undefined) {
        setInternal(next);
      }
      onValueChange?.(next);
    }
  }, [toValue, value, onValueChange]);

  useEffect(() => {
    const values = [
      x.current,
      lensHalfW.current,
      lensHalfH.current,
      lensR.current,
      tintOpacity.current,
      tintBlur.current,
      fatScaleX.current,
      fatScaleY.current,
      shadowOpacity.current,
      deform.current,
    ];
    const subs = values.map((v) => v.on(schedule));
    apply();
    return () => {
      for (const off of subs) {
        off();
      }
      cancelAnimationFrame(frame.current);
      deformDriver.current?.stop();
    };
  }, [apply, schedule]);

  useEffect(() => {
    if (!heldRef.current) {
      const target = toX(current);
      if (Math.abs(x.current.get() - target) > 0.5) {
        const d = prefersReducedMotion() ? 0 : PRESS_DURATION;
        tween(x.current, target, d, glassEase);
        startDeform();
      }
    }
  }, [current, toX, startDeform]);

  const press = useCallback(() => {
    const d = prefersReducedMotion() ? 0 : TRAVEL_DURATION;
    tween(lensHalfW.current, LENS_HALF_W * PRESS_GROW, d, glassEase);
    tween(lensHalfH.current, LENS_HALF_H * PRESS_GROW, d, glassEase);
    tween(lensR.current, LENS_R * PRESS_GROW, d, glassEase);
    tween(tintOpacity.current, 0, d, glassEase);
    tween(tintBlur.current, 0, d, glassEase);
    tween(fatScaleX.current, 0.95, d, glassEase);
    tween(fatScaleY.current, 0.975, d, glassEase);
    tween(shadowOpacity.current, 1, d, glassEase);
  }, []);

  const release = useCallback(() => {
    const d = prefersReducedMotion() ? 0 : PRESS_DURATION;
    tween(lensHalfW.current, LENS_HALF_W, d, glassEase);
    tween(lensHalfH.current, LENS_HALF_H, d, glassEase);
    tween(lensR.current, LENS_R, d, glassEase);
    tween(tintOpacity.current, REST_TINT, d, glassEase);
    tween(tintBlur.current, TINT_BLUR, d, glassEase);
    tween(fatScaleX.current, 0.85, d, glassEase);
    tween(fatScaleY.current, 0.525, d, glassEase);
    tween(shadowOpacity.current, 0, d, glassEase);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || activePointer.current !== null) {
        return;
      }
      activePointer.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      heldRef.current = true;
      inputRef.current?.focus({ preventScroll: true });
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const rect = root.getBoundingClientRect();
      const localX = e.clientX - rect.left - THUMB_W / 2;
      const clamped = Math.max(0, Math.min(TRAVEL, localX));
      x.current.stop();
      x.current.set(clamped);
      syncValue();
      grabClientX.current = e.clientX;
      grabX.current = clamped;
      press();
      startDeform();
    },
    [disabled, press, startDeform, syncValue]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== activePointer.current) {
        return;
      }
      let next = grabX.current + (e.clientX - grabClientX.current);
      if (next < 0) {
        next = -rubberBand(-next, RUBBER_OVERSHOOT, RUBBER_DAMPENING);
      } else if (next > TRAVEL) {
        next =
          TRAVEL + rubberBand(next - TRAVEL, RUBBER_OVERSHOOT, RUBBER_DAMPENING);
      }
      x.current.set(next);
      syncValue();
    },
    [syncValue]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== activePointer.current) {
        return;
      }
      activePointer.current = null;
      heldRef.current = false;
      const target = Math.max(0, Math.min(TRAVEL, x.current.get()));
      const d = prefersReducedMotion() ? 0 : PRESS_DURATION;
      tween(x.current, target, d, glassEase);
      startDeform();
      release();
    },
    [release, startDeform]
  );

  const config = dark
    ? {
        scaleX: 0.133,
        scaleY: 0.135,
        brightness: 0.12,
        specularAngle: 45,
        glowExponent: 1.5,
        edgeExponent: 1.5,
        specularDark: false,
      }
    : {
        scaleX: 0.1,
        scaleY: 0.1,
        brightness: -0.02,
        specularAngle: 30,
        glowExponent: 2,
        edgeExponent: 1,
        specularDark: true,
      };

  return (
    <div
      className={cn("relative inline-block touch-none", className)}
      style={{ flexShrink: 0, width: TRACK_W, height: THUMB_H, overflow: "visible" }}
    >
      <input
        aria-label={ariaLabel}
        className="sr-only"
        max={max}
        min={min}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (value === undefined) {
            setInternal(next);
          }
          onValueChange?.(next);
        }}
        ref={inputRef}
        step={step}
        type="range"
        value={current}
      />
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: 0,
          top: (THUMB_H - TRACK_H) / 2,
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: TRACK_H / 2,
        }}
      >
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{ background: dark ? BG4_DARK : BG4_LIGHT }}
        />
        <div
          className="absolute rounded-[inherit]"
          ref={fillRef}
          style={{
            left: 0,
            top: 0,
            bottom: 0,
            width: toX(current) + THUMB_W / 2,
            background: PRIMARY,
          }}
        />
      </div>
      <Glass
        chroma={0}
        depth={2}
        domeDepth={5}
        edgeExponent={config.edgeExponent}
        edgeHighlight={0.5}
        edgeWidth={1}
        glow={0.4}
        glowExponent={config.glowExponent}
        glowSpread={0.5}
        lens={
          <div className="absolute" data-glass-lens ref={markerRef}>
            <div
              className="absolute inset-0 rounded-[inherit]"
              ref={brightnessRef}
              style={{
                background: config.brightness >= 0 ? "#fff" : "#000",
                opacity: Math.abs(config.brightness),
              }}
            />
            <div className="absolute inset-0 rounded-[inherit]" ref={tintRef} />
            <div
              className="absolute inset-0 rounded-[inherit]"
              ref={restShadowRef}
              style={{
                boxShadow: `0 1.333px 5.333px ${dark ? SHADOW_STRONG_DARK : SHADOW_STRONG_LIGHT}`,
              }}
            />
            <div
              className="absolute inset-0 rounded-[inherit]"
              ref={pressShadowRef}
              style={{
                opacity: 0,
                boxShadow:
                  "0 2px 6px rgba(0, 0, 0, 0.16), inset 0 -4px 10px rgba(0, 0, 0, 0.12)",
              }}
            />
          </div>
        }
        resolution={2}
        reveal
        scaleX={config.scaleX}
        scaleY={config.scaleY}
        specularAngle={config.specularAngle}
        specularDark={config.specularDark}
        specularStrength={1.5}
        splay={0.5}
        style={{
          position: "absolute",
          left: -BLEED,
          top: -BLEED,
          width: TRACK_W + 2 * BLEED,
          height: THUMB_H + 2 * BLEED,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <div
          className="absolute overflow-hidden"
          ref={fatWrapRef}
          style={{
            left: BLEED,
            top: BLEED + (THUMB_H - FAT_H) / 2,
            width: TRACK_W,
            height: FAT_H,
            borderRadius: FAT_H / 2,
            transform: "scale(0.85, 0.525)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: dark ? BG4_DARK : BG4_LIGHT }}
          />
          <div
            className="absolute inset-0 rounded-[inherit]"
            ref={fatFillRef}
            style={{ background: PRIMARY }}
          />
        </div>
      </Glass>
      <div
        aria-hidden="true"
        className="absolute cursor-pointer"
        onPointerCancel={onPointerUp}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={rootRef}
        style={{ left: 0, top: 0, width: TRACK_W, height: THUMB_H }}
      />
    </div>
  );
}

export { GlassSlider };
