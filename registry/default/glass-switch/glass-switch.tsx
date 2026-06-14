"use client";

import { Glass, useGlassDark } from "@/components/ui/glass";
import {
  glassEase,
  MotionValue,
  PRESS_DURATION,
  prefersReducedMotion,
  RELEASE_DURATION,
  rubberBand,
  SpringDriver,
  TRAVEL_DURATION,
  tween,
} from "@/components/ui/glass-motion";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

const TRACK_W = 74;
const TRACK_H = 28;
const THUMB_W = Math.round(0.6 * TRACK_W);
const THUMB_H = TRACK_H - 6;
const INSET = 3;
const TRAVEL = TRACK_W - THUMB_W - 6;
const TRACK_R = TRACK_H / 2;
const LENS_HALF_W = THUMB_W / 2;
const LENS_HALF_H = THUMB_H / 2;
const LENS_R = THUMB_H / 2;
const FILL_H = Math.round(0.75 * TRACK_H);
const RUBBER_OVERSHOOT = TRACK_W * 0.1;
const RUBBER_DAMPENING = 30;
const BLEED =
  Math.ceil(0.5 * Math.max(LENS_HALF_W, LENS_HALF_H) + RUBBER_OVERSHOOT) + 2;
const HOLD_MS = 200;
const DRAG_THRESHOLD = 3;
const TAP_COLLAPSE_MS = 330;
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

interface GlassSwitchProps {
  ariaLabel?: string;
  checked?: boolean;
  className?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
}

function GlassSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  name,
  value,
  ariaLabel,
  className,
}: GlassSwitchProps) {
  const dark = useGlassDark();
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked ?? internal;
  const isOnRef = useRef(isOn);
  isOnRef.current = isOn;

  const markerRef = useRef<HTMLDivElement | null>(null);
  const hitRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const brightnessRef = useRef<HTMLDivElement | null>(null);
  const tintRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const x = useRef(new MotionValue(isOn ? TRAVEL : 0));
  const lensHalfW = useRef(new MotionValue(LENS_HALF_W));
  const lensHalfH = useRef(new MotionValue(LENS_HALF_H));
  const lensR = useRef(new MotionValue(LENS_R));
  const tintOpacity = useRef(new MotionValue(REST_TINT));
  const tintBlur = useRef(new MotionValue(TINT_BLUR));
  const fillScaleX = useRef(new MotionValue(0.85));
  const fillScaleY = useRef(new MotionValue(0.525));
  const shadowOpacity = useRef(new MotionValue(0));
  const deform = useRef(new MotionValue(0));
  const heldRef = useRef(false);
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
    const centerX = BLEED + INSET + THUMB_W / 2 + xv;
    const centerY = BLEED + TRACK_H / 2;
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
    if (shadowRef.current) {
      shadowRef.current.style.opacity = String(shadowOpacity.current.get());
    }
    if (hitRef.current) {
      hitRef.current.style.transform = `translateX(${xv}px)`;
    }
    const progress = TRAVEL > 0 ? Math.max(0, Math.min(1, xv / TRAVEL)) : 0;
    const fillBg = `color-mix(in srgb, ${dark ? BG4_DARK : BG4_LIGHT}, ${PRIMARY} ${progress * 100}%)`;
    if (trackRef.current) {
      trackRef.current.style.background = fillBg;
    }
    if (fillRef.current) {
      fillRef.current.style.background = fillBg;
      fillRef.current.style.transform = `scale(${fillScaleX.current.get()}, ${fillScaleY.current.get()})`;
    }
  }, [dark]);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  useEffect(() => {
    const values = [
      x.current,
      lensHalfW.current,
      lensHalfH.current,
      lensR.current,
      tintOpacity.current,
      tintBlur.current,
      fillScaleX.current,
      fillScaleY.current,
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

  const press = useCallback(() => {
    const d = prefersReducedMotion() ? 0 : PRESS_DURATION;
    tween(lensHalfW.current, LENS_HALF_W * PRESS_GROW, d, glassEase);
    tween(lensHalfH.current, LENS_HALF_H * PRESS_GROW, d, glassEase);
    tween(lensR.current, LENS_R * PRESS_GROW, d, glassEase);
    tween(tintOpacity.current, 0, d, glassEase);
    tween(tintBlur.current, 0, d, glassEase);
    tween(fillScaleX.current, 0.95, d, glassEase);
    tween(fillScaleY.current, 0.975, d, glassEase);
    tween(shadowOpacity.current, 1, d, glassEase);
  }, []);

  const release = useCallback(() => {
    const d = prefersReducedMotion() ? 0 : RELEASE_DURATION;
    tween(lensHalfW.current, LENS_HALF_W, d, glassEase);
    tween(lensHalfH.current, LENS_HALF_H, d, glassEase);
    tween(lensR.current, LENS_R, d, glassEase);
    tween(tintOpacity.current, REST_TINT, d, glassEase);
    tween(tintBlur.current, TINT_BLUR, d, glassEase);
    tween(fillScaleX.current, 0.85, d, glassEase);
    tween(fillScaleY.current, 0.525, d, glassEase);
    tween(shadowOpacity.current, 0, d, glassEase);
  }, []);

  const commit = useCallback(
    (next: boolean) => {
      if (next !== isOnRef.current) {
        if (checked === undefined) {
          setInternal(next);
        }
        onCheckedChange?.(next);
      }
    },
    [checked, onCheckedChange]
  );

  const travelTo = useCallback(
    (on: boolean, onComplete?: () => void) => {
      const d = prefersReducedMotion() ? 0 : TRAVEL_DURATION;
      tween(x.current, on ? TRAVEL : 0, d, glassEase, onComplete);
      startDeform();
    },
    [startDeform]
  );

  const stateRef = useRef<"idle" | "pending" | "hold" | "tap">("idle");
  const holdTimer = useRef(0);
  const tapTimer = useRef(0);
  const activePointer = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const grabX = useRef(0);
  const dragging = useRef(false);
  const suppressClick = useRef(false);
  const alive = useRef(true);

  useEffect(
    () => () => {
      alive.current = false;
      clearTimeout(holdTimer.current);
      clearTimeout(tapTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!heldRef.current && stateRef.current !== "tap") {
      const target = isOn ? TRAVEL : 0;
      if (Math.abs(x.current.get() - target) > 0.5) {
        travelTo(isOn);
      }
    }
  }, [isOn, travelTo]);

  const tap = useCallback(
    (next: boolean) => {
      if (suppressClick.current) {
        return;
      }
      commit(next);
      if (stateRef.current === "idle") {
        stateRef.current = "tap";
        press();
        heldRef.current = true;
        startDeform();
        clearTimeout(tapTimer.current);
        tapTimer.current = window.setTimeout(() => {
          heldRef.current = false;
          release();
        }, TAP_COLLAPSE_MS);
        travelTo(next, () => {
          if (alive.current && stateRef.current === "tap") {
            stateRef.current = "idle";
          }
        });
      }
    },
    [commit, press, release, startDeform, travelTo]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || activePointer.current !== null) {
        return;
      }
      activePointer.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartX.current = e.clientX;
      grabX.current = x.current.get();
      dragging.current = false;
      suppressClick.current = true;
      clearTimeout(holdTimer.current);
      clearTimeout(tapTimer.current);
      stateRef.current = "pending";
      holdTimer.current = window.setTimeout(() => {
        if (stateRef.current === "pending") {
          stateRef.current = "hold";
          x.current.stop();
          press();
          heldRef.current = true;
          startDeform();
        }
      }, HOLD_MS);
    },
    [disabled, press, startDeform]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== activePointer.current) {
        return;
      }
      const delta = e.clientX - dragStartX.current;
      if (!dragging.current) {
        if (Math.abs(delta) < DRAG_THRESHOLD) {
          return;
        }
        dragging.current = true;
        x.current.stop();
        grabX.current = x.current.get();
        dragStartX.current = e.clientX;
        clearTimeout(holdTimer.current);
        heldRef.current = true;
        startDeform();
        if (stateRef.current !== "hold") {
          stateRef.current = "hold";
          press();
        }
      }
      let next = grabX.current + (e.clientX - dragStartX.current);
      if (next < 0) {
        next = -rubberBand(-next, RUBBER_OVERSHOOT, RUBBER_DAMPENING);
      } else if (next > TRAVEL) {
        next =
          TRAVEL + rubberBand(next - TRAVEL, RUBBER_OVERSHOOT, RUBBER_DAMPENING);
      }
      x.current.set(next);
    },
    [press, startDeform]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== activePointer.current) {
        return;
      }
      activePointer.current = null;
      clearTimeout(holdTimer.current);
      if (dragging.current) {
        stateRef.current = "idle";
        heldRef.current = false;
        release();
        const next = Math.max(0, Math.min(TRAVEL, x.current.get())) > TRAVEL / 2;
        travelTo(next);
        commit(next);
        requestAnimationFrame(() => {
          suppressClick.current = false;
        });
      } else if (
        stateRef.current === "pending" ||
        stateRef.current === "tap"
      ) {
        stateRef.current = "tap";
        suppressClick.current = false;
        press();
        heldRef.current = true;
        startDeform();
        clearTimeout(tapTimer.current);
        tapTimer.current = window.setTimeout(() => {
          heldRef.current = false;
          release();
        }, TAP_COLLAPSE_MS);
        const next = !isOnRef.current;
        commit(next);
        suppressClick.current = true;
        travelTo(next, () => {
          if (alive.current && stateRef.current === "tap") {
            stateRef.current = "idle";
          }
        });
        requestAnimationFrame(() => {
          suppressClick.current = false;
        });
      } else if (stateRef.current === "hold") {
        stateRef.current = "idle";
        heldRef.current = false;
        release();
        travelTo(isOnRef.current);
        requestAnimationFrame(() => {
          suppressClick.current = false;
        });
      } else {
        suppressClick.current = false;
      }
    },
    [commit, press, release, startDeform, travelTo]
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== activePointer.current) {
        return;
      }
      activePointer.current = null;
      clearTimeout(holdTimer.current);
      heldRef.current = false;
      stateRef.current = "idle";
      release();
      travelTo(isOnRef.current);
      requestAnimationFrame(() => {
        suppressClick.current = false;
      });
    },
    [release, travelTo]
  );

  const config = dark
    ? {
        brightness: 0.12,
        specularAngle: 45,
        specularStrength: 1,
        glowExponent: 1.5,
        edgeWidth: 2,
        edgeExponent: 1.5,
        specularDark: false,
      }
    : {
        brightness: -0.02,
        specularAngle: 30,
        specularStrength: 1.5,
        glowExponent: 2,
        edgeWidth: 1.5,
        edgeExponent: 1,
        specularDark: true,
      };

  return (
    <label
      className={cn(
        "relative block cursor-pointer rounded-full has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-40 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-[#0a84ff] has-[input:focus-visible]:outline-offset-3",
        className
      )}
      style={{ flexShrink: 0, width: TRACK_W, height: TRACK_H, overflow: "visible" }}
    >
      <input
        aria-label={ariaLabel}
        checked={isOn}
        className="sr-only"
        disabled={disabled}
        name={name}
        onChange={(e) => tap(e.target.checked)}
        onClick={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            tap(!isOn);
          }
        }}
        ref={inputRef}
        role="switch"
        type="checkbox"
        value={value}
      />
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: TRACK_R,
        }}
        ref={trackRef}
      />
      <Glass
        chroma={0}
        depth={2}
        domeDepth={6}
        edgeHighlight={0.5}
        edgeWidth={config.edgeWidth}
        edgeExponent={config.edgeExponent}
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
              ref={shadowRef}
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
        scaleX={0.25}
        scaleY={0.25}
        specularAngle={config.specularAngle}
        specularDark={config.specularDark}
        specularStrength={config.specularStrength}
        splay={0.4}
        style={{
          position: "absolute",
          left: -BLEED,
          top: -BLEED,
          width: TRACK_W + 2 * BLEED,
          height: TRACK_H + 2 * BLEED,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <div
          className="absolute"
          style={{
            left: BLEED,
            top: BLEED + (TRACK_H - FILL_H) / 2,
            width: TRACK_W,
            height: FILL_H,
            borderRadius: FILL_H / 2,
            transform: "scale(0.85, 0.525)",
          }}
          ref={fillRef}
        />
      </Glass>
      <div
        className="absolute touch-none select-none"
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={hitRef}
        style={{
          left: INSET,
          top: INSET,
          width: THUMB_W,
          height: THUMB_H,
          willChange: "transform",
        }}
      />
    </label>
  );
}

export { GlassSwitch };
