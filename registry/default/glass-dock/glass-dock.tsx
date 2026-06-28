"use client";

import { Glass, isSafariBrowser } from "@/components/ui/glass";
import {
  cubicBezier,
  glassEase,
  MotionValue,
  prefersReducedMotion,
  SpringDriver,
  tween,
} from "@/components/ui/glass-motion";
import { cn } from "@/lib/utils";
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type GlassMode = "individual" | "combined";
type GlassSpecular = "inside" | "outside" | "none";
type ShadowTone = "neutral" | "warm" | "cool";

interface LiquidGlassConfig {
  blur: { enabled: boolean; value: number };
  mode: GlassMode;
  refraction: { amount: number; enabled: boolean; thickness: number };
  shadow: { tone: ShadowTone; value: number };
  specular: GlassSpecular;
  translucency: { enabled: boolean; value: number };
}

const DEFAULT_LIQUID_GLASS: LiquidGlassConfig = {
  mode: "individual",
  specular: "inside",
  blur: { enabled: false, value: 0 },
  refraction: { enabled: true, amount: 20.2, thickness: 15.9 },
  translucency: { enabled: true, value: 0 },
  shadow: { tone: "neutral", value: 22 },
};

interface ResolvedGlass {
  chroma: number;
  edgeHighlight: number;
  glow: number;
  scale: number;
  tint: number;
}

function resolveGlass(config: LiquidGlassConfig): ResolvedGlass {
  const refr = config.refraction.enabled ? config.refraction.amount / 100 : 0;
  const specOn = config.specular !== "none";
  return {
    scale: refr * 0.5,
    chroma: config.refraction.enabled ? Math.min(0.5, refr * 1.5) : 0,
    tint: config.translucency.enabled ? config.translucency.value / 100 : 0,
    edgeHighlight: specOn ? 0.3 : 0,
    glow: specOn ? 0.12 : 0,
  };
}

const DOCK_W = 392;
const DOCK_H = 84;
const BOTTOM_INSET = 18;
const PAD_X = 10;
const PAD_Y = 9;
const ITEM_GAP = 4;
const COL = (DOCK_W - 2 * PAD_X - 3 * ITEM_GAP) / 4;
const LENS_W = COL - 4;
const LENS_H = 64;
const PILL_H = 64;
const PILL_RADIUS = 32;
const BAR_RADIUS = 42;
const BAR_GLASS_TRIM = 42;
const BAR_GLASS_MUL = 0.7;
const POS_SPRING = { stiffness: 90, damping: 18, restDelta: 0.5, restSpeed: 6 };
const MAX_MUL = 0.66;
const LIFT_UP = 0.16;
const LIFT_DOWN = 0.3;
const LENS_GROW = 0.2;
const LENS_TINT = 0.35;
const ARRIVE = 16;
const FADE_EASE = cubicBezier(0, 0, 0.58, 1);

const ACCENT = "#58a6ff";
const IDLE = "rgba(255,255,255,0.82)";
const HOVER = "#ffffff";
const BADGE_BG = "#ff514c";
const PILL_GREY = "rgba(255,255,255,0.16)";
const PILL_SHADOW =
  "inset 0 1px 1px rgba(255,255,255,0.22), 0 1px 3px -1px rgba(0,0,0,0.3)";

const GRID_STYLE = {
  top: PAD_Y,
  right: PAD_X,
  bottom: PAD_Y,
  left: PAD_X,
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: ITEM_GAP,
} as const;

function itemCenter(index: number): number {
  return PAD_X + index * (COL + ITEM_GAP) + COL / 2;
}

function clamp(value: number, lo: number, hi: number): number {
  return value < lo ? lo : value > hi ? hi : value;
}

interface GlassDockItem {
  badge?: ReactNode;
  icon: ReactNode;
  id: string;
  label: string;
}

interface GlassDockProps {
  accentColor?: string;
  align?: "bottom" | "center";
  "aria-label"?: string;
  children?: ReactNode;
  className?: string;
  defaultValue?: string;
  glass?: LiquidGlassConfig;
  hoverColor?: string;
  idleColor?: string;
  items: GlassDockItem[];
  onValueChange?: (id: string) => void;
  pillColor?: string;
  tintBlur?: number;
  tintColor?: string;
  value?: string;
}

function GlassDock({
  accentColor,
  align = "center",
  "aria-label": ariaLabel = "Primary navigation",
  children,
  className,
  defaultValue,
  glass,
  hoverColor,
  idleColor,
  items,
  onValueChange,
  pillColor,
  tintBlur,
  tintColor,
  value,
}: GlassDockProps) {
  const safari = isSafariBrowser();
  const resolved = resolveGlass(glass ?? DEFAULT_LIQUID_GLASS);
  const accent = accentColor ?? ACCENT;
  const idle = idleColor ?? IDLE;
  const hoverCol = hoverColor ?? HOVER;
  const pillFill = pillColor ?? PILL_GREY;

  const [internal, setInternal] = useState(() => defaultValue ?? items[0]?.id);
  const [hover, setHover] = useState<number | null>(null);
  const active = value ?? internal;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === active)
  );
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const barBoxRef = useRef<HTMLDivElement | null>(null);
  const barMarkerRef = useRef<HTMLDivElement | null>(null);
  const barGlassRef = useRef<HTMLDivElement | null>(null);
  const lensMarkerRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);

  const cx = useRef(new MotionValue(itemCenter(activeIndex)));
  const lift = useRef(new MotionValue(0));
  const frame = useRef(0);
  const initialized = useRef(false);
  const pointerDown = useRef(false);
  const dragAllowed = useRef(false);
  const draggingRef = useRef(false);
  const startX = useRef(0);
  const liftPending = useRef(false);
  const dropping = useRef(false);

  const liftUp = useCallback(() => {
    liftPending.current = false;
    dropping.current = false;
    if (prefersReducedMotion()) {
      lift.current.jump(1);
      return;
    }
    tween(lift.current, 1, LIFT_UP, glassEase);
  }, []);

  const liftDown = useCallback(() => {
    liftPending.current = false;
    dropping.current = true;
    if (prefersReducedMotion()) {
      lift.current.jump(0);
      return;
    }
    tween(lift.current, 0, LIFT_DOWN, FADE_EASE);
  }, []);

  const placeStatic = useCallback(() => {
    const root = rootRef.current;
    const box = barBoxRef.current;
    const mark = barMarkerRef.current;
    const barGlass = barGlassRef.current;
    if (!(root && box && mark && barGlass)) {
      return;
    }
    const base = root.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    const bx = r.left - base.left;
    const by = r.top - base.top;
    mark.style.left = `${bx}px`;
    mark.style.top = `${by}px`;
    mark.style.width = `${r.width}px`;
    mark.style.height = `${r.height}px`;
    mark.style.borderRadius = `${BAR_RADIUS}px`;
    barGlass.style.left = `${bx}px`;
    barGlass.style.top = `${by}px`;
    barGlass.style.width = `${r.width - BAR_GLASS_TRIM}px`;
    barGlass.style.height = `${r.height}px`;
    barGlass.style.borderRadius = `${BAR_RADIUS}px`;
  }, []);

  const apply = useCallback(() => {
    frame.current = 0;
    placeStatic();
    const root = rootRef.current;
    const box = barBoxRef.current;
    const lens = lensMarkerRef.current;
    if (!(root && box && lens)) {
      return;
    }
    const base = root.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    const cxNow = cx.current.get();
    if (
      liftPending.current &&
      Math.abs(cxNow - itemCenter(activeIndexRef.current)) <= ARRIVE
    ) {
      liftDown();
    }
    const l = clamp(lift.current.get(), 0, 1);
    const grow = 1 + l * LENS_GROW;
    const lensW = LENS_W * grow;
    const lensH = LENS_H * grow;
    lens.style.left = `${r.left - base.left + cxNow - lensW / 2}px`;
    lens.style.top = `${r.top - base.top + (DOCK_H - lensH) / 2}px`;
    lens.style.width = `${lensW}px`;
    lens.style.height = `${lensH}px`;
    lens.style.borderRadius = `${lensH / 2}px`;
    lens.dataset.glassMul = String(l * MAX_MUL);
    lens.dataset.glassTint = String(l * LENS_TINT);
    const pill = pillRef.current;
    if (pill) {
      pill.style.left = `${cxNow - LENS_W / 2}px`;
      pill.style.top = `${(DOCK_H - PILL_H) / 2}px`;
      pill.style.opacity = dropping.current ? "1" : `${1 - l}`;
    }
  }, [placeStatic, liftDown]);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  const driver = useRef<SpringDriver | null>(null);
  if (!driver.current) {
    driver.current = new SpringDriver(cx.current, POS_SPRING, () =>
      itemCenter(activeIndexRef.current)
    );
  }

  const glide = useCallback(() => {
    if (prefersReducedMotion()) {
      cx.current.jump(itemCenter(activeIndexRef.current));
      lift.current.jump(0);
      apply();
      return;
    }
    driver.current?.start();
  }, [apply]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    if (!initialized.current) {
      initialized.current = true;
      const r = root.getBoundingClientRect();
      const x = clamp((r.width - DOCK_W) / 2, 0, Math.max(0, r.width - DOCK_W));
      const y = clamp(
        align === "bottom"
          ? r.height - DOCK_H - BOTTOM_INSET
          : r.height * 0.6 - DOCK_H / 2,
        0,
        Math.max(0, r.height - DOCK_H)
      );
      for (const el of [contentRef.current, overlayRef.current]) {
        if (el) {
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        }
      }
    }
    apply();
  }, [apply, align]);

  useEffect(() => {
    const off = cx.current.on(schedule);
    const offLift = lift.current.on(schedule);
    cx.current.jump(itemCenter(activeIndexRef.current));
    measure();
    const root = rootRef.current;
    const resize = new ResizeObserver(() => {
      initialized.current = false;
      measure();
    });
    if (root) {
      resize.observe(root);
    }
    return () => {
      off();
      offLift();
      resize.disconnect();
      cancelAnimationFrame(frame.current);
      driver.current?.stop();
    };
  }, [measure, schedule]);

  const select = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) {
        return;
      }
      if (value === undefined) {
        setInternal(item.id);
      }
      onValueChange?.(item.id);
    },
    [items, onValueChange, value]
  );

  const barLocalX = useCallback(
    (clientX: number): number => {
      const box = barBoxRef.current;
      if (!box) {
        return cx.current.get();
      }
      const r = box.getBoundingClientRect();
      return clamp(clientX - r.left, itemCenter(0), itemCenter(items.length - 1));
    },
    [items.length]
  );

  const nearest = useCallback(
    (localX: number): number => {
      let best = 0;
      let min = Number.POSITIVE_INFINITY;
      for (let i = 0; i < items.length; i++) {
        const dist = Math.abs(localX - itemCenter(i));
        if (dist < min) {
          min = dist;
          best = i;
        }
      }
      return best;
    },
    [items.length]
  );

  const goTo = useCallback(
    (index: number) => {
      if (index !== activeIndexRef.current) {
        liftUp();
      }
      select(index);
      liftPending.current = true;
      glide();
    },
    [glide, liftUp, select]
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerDown.current = true;
    draggingRef.current = false;
    startX.current = event.clientX;
    dragAllowed.current = nearest(barLocalX(event.clientX)) === activeIndex;
    if (dragAllowed.current) {
      overlayRef.current?.setPointerCapture(event.pointerId);
      driver.current?.stop();
      liftUp();
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!(pointerDown.current && dragAllowed.current)) {
      return;
    }
    if (!draggingRef.current && Math.abs(event.clientX - startX.current) > 4) {
      draggingRef.current = true;
    }
    if (!draggingRef.current) {
      return;
    }
    const x = barLocalX(event.clientX);
    cx.current.set(x);
    setHover(nearest(x));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerDown.current) {
      return;
    }
    pointerDown.current = false;
    if (draggingRef.current) {
      draggingRef.current = false;
      setHover(null);
      select(nearest(barLocalX(event.clientX)));
      liftDown();
      glide();
      return;
    }
    goTo(nearest(barLocalX(startX.current)));
  };

  const iconNodes = items.map((item, index) => {
    const isActive = index === activeIndex;
    const isHover = index === hover;
    const iconColor = isActive ? accent : isHover ? hoverCol : idle;
    const labelColor = isActive ? idle : isHover ? hoverCol : idle;
    return (
      <div
        className="relative grid place-items-center content-center"
        key={item.id}
        style={{ gap: 5, padding: "10px 5px 9px", color: labelColor }}
      >
        <span
          className="grid size-[28px] place-items-center"
          style={{ color: iconColor }}
        >
          {item.icon}
        </span>
        <span
          className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-[650] text-[12px] leading-none"
          style={{ color: labelColor }}
        >
          {item.label}
        </span>
        {item.badge == null ? null : (
          <span
            className="absolute grid place-items-center text-[10px] text-white"
            style={{
              top: 4,
              right: 5,
              minWidth: 20,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              background: BADGE_BG,
              fontWeight: 750,
            }}
          >
            {item.badge}
          </span>
        )}
      </div>
    );
  });

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onDragStart={(event) => event.preventDefault()}
      ref={rootRef}
    >
      <Glass
        chroma={0.12}
        className="pointer-events-none absolute inset-0"
        depth={12}
        domeDepth={12}
        edgeHighlight={0}
        glow={0}
        lens={
          <>
            <div
              className="absolute"
              data-glass-edge-highlight={0}
              data-glass-glow={0}
              data-glass-lens
              data-glass-mul={0}
              ref={barMarkerRef}
            />
            <div
              className="absolute"
              data-glass-edge-highlight={0}
              data-glass-glow={0}
              data-glass-lens
              data-glass-mul={BAR_GLASS_MUL}
              data-glass-tint={0}
              ref={barGlassRef}
            />
          </>
        }
        resolution={1}
        scaleX={resolved.scale}
        scaleY={safari ? resolved.scale * 1.1 : resolved.scale}
        tint={resolved.tint}
        tintBlur={tintBlur ?? 12}
        tintColor={tintColor}
      >
        {children}
      </Glass>
      <Glass
        chroma={0.5}
        className="pointer-events-none absolute inset-0"
        depth={14}
        domeDepth={20}
        edgeHighlight={resolved.edgeHighlight}
        glow={resolved.glow}
        lens={
          <div
            className="absolute"
            data-glass-blend="1"
            data-glass-dome-depth={20}
            data-glass-lens
            data-glass-mul={0}
            ref={lensMarkerRef}
          />
        }
        resolution={1}
        scaleX={resolved.scale}
        scaleY={safari ? resolved.scale * 1.1 : resolved.scale}
        tint={0}
        tintBlur={4}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute"
            ref={contentRef}
            style={{ width: DOCK_W, height: DOCK_H }}
          >
            <div
              className="pointer-events-none absolute"
              ref={pillRef}
              style={{
                width: LENS_W,
                height: PILL_H,
                borderRadius: PILL_RADIUS,
                background: pillFill,
                boxShadow: PILL_SHADOW,
              }}
            />
            <div className="absolute grid text-white" style={GRID_STYLE}>
              {iconNodes}
            </div>
          </div>
        </div>
      </Glass>
      <div
        aria-label={ariaLabel}
        className="absolute touch-none select-none"
        onPointerCancel={onPointerUp}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={overlayRef}
        style={{ width: DOCK_W, height: DOCK_H }}
      >
        <div className="relative size-full" ref={barBoxRef}>
          <div className="absolute grid" style={GRID_STYLE}>
            {items.map((item, index) => (
              <button
                aria-current={index === activeIndex ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "rounded-[38px] outline-none",
                  index === activeIndex
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-pointer"
                )}
                key={item.id}
                onClick={(event) => {
                  if (event.detail === 0) {
                    goTo(index);
                  }
                }}
                onPointerEnter={() => {
                  if (!draggingRef.current) {
                    setHover(index);
                  }
                }}
                onPointerLeave={() => {
                  if (!draggingRef.current) {
                    setHover((h) => (h === index ? null : h));
                  }
                }}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_LIQUID_GLASS, GlassDock, resolveGlass };
export type {
  GlassDockItem,
  GlassDockProps,
  GlassMode,
  GlassSpecular,
  LiquidGlassConfig,
  ShadowTone,
};
