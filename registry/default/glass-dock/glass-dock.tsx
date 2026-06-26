"use client";

import { Glass, isSafariBrowser } from "@/components/ui/glass";
import {
  glassEase,
  MotionValue,
  prefersReducedMotion,
  TRAVEL_DURATION,
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
  blur: number;
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
    blur: config.blur.enabled ? (config.blur.value / 100) * 3 : 0,
    tint: config.translucency.enabled ? config.translucency.value / 100 : 0,
    edgeHighlight: specOn ? 0.3 : 0,
    glow: specOn ? 0.12 : 0,
  };
}

const DOCK_W = 428;
const DOCK_H = 100;
const PAD_X = 10;
const PAD_Y = 9;
const ITEM_GAP = 4;
const COL = (DOCK_W - 2 * PAD_X - 3 * ITEM_GAP) / 4;
const PILL_W = COL - 8;
const PILL_H = DOCK_H - 2 * PAD_Y - 10;
const BAR_RADIUS = 46;

const ACCENT = "#58a6ff";
const IDLE = "rgba(255,255,255,0.82)";
const HOVER = "#ffffff";
const BADGE_BG = "#ff514c";
const PILL_FILL = "rgba(255,255,255,0.16)";
const PILL_SHADOW =
  "inset 0 1px 1px rgba(255,255,255,0.32), 0 6px 16px -10px rgba(0,0,0,0.5)";
const RIM =
  "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.18)";
const SHEEN =
  "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0) 70%)";

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
  "aria-label"?: string;
  children?: ReactNode;
  className?: string;
  defaultValue?: string;
  glass?: LiquidGlassConfig;
  items: GlassDockItem[];
  onValueChange?: (id: string) => void;
  value?: string;
}

function GlassDock({
  "aria-label": ariaLabel = "Primary navigation",
  children,
  className,
  defaultValue,
  glass,
  items,
  onValueChange,
  value,
}: GlassDockProps) {
  const safari = isSafariBrowser();
  const resolved = resolveGlass(glass ?? DEFAULT_LIQUID_GLASS);

  const [internal, setInternal] = useState(() => defaultValue ?? items[0]?.id);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const active = value ?? internal;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === active)
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const barBoxRef = useRef<HTMLDivElement | null>(null);
  const barMarkerRef = useRef<HTMLDivElement | null>(null);
  const lensMarkerRef = useRef<HTMLDivElement | null>(null);

  const cx = useRef(new MotionValue(itemCenter(activeIndex)));
  const frame = useRef(0);
  const initialized = useRef(false);
  const pointerDown = useRef(false);
  const dragAllowed = useRef(false);
  const draggingRef = useRef(false);
  const startX = useRef(0);

  const placeStatic = useCallback(() => {
    const root = rootRef.current;
    const box = barBoxRef.current;
    const mark = barMarkerRef.current;
    if (!(root && box && mark)) {
      return;
    }
    const base = root.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    mark.style.left = `${r.left - base.left}px`;
    mark.style.top = `${r.top - base.top}px`;
    mark.style.width = `${r.width}px`;
    mark.style.height = `${r.height}px`;
    mark.style.borderRadius = `${BAR_RADIUS}px`;
  }, []);

  const apply = useCallback(() => {
    frame.current = 0;
    placeStatic();
    const lens = lensMarkerRef.current;
    const root = rootRef.current;
    const box = barBoxRef.current;
    if (!(lens && root && box)) {
      return;
    }
    const base = root.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    lens.style.left = `${r.left - base.left + cx.current.get() - PILL_W / 2}px`;
    lens.style.top = `${r.top - base.top + (DOCK_H - PILL_H) / 2}px`;
    lens.style.width = `${PILL_W}px`;
    lens.style.height = `${PILL_H}px`;
    lens.style.borderRadius = `${PILL_H / 2}px`;
  }, [placeStatic]);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
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
        r.height * 0.6 - DOCK_H / 2,
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
  }, [apply]);

  useEffect(() => {
    const off = cx.current.on(schedule);
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
      resize.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [measure, schedule]);

  useEffect(() => {
    if (dragging) {
      apply();
    }
  }, [dragging, apply]);

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

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerDown.current = true;
    draggingRef.current = false;
    startX.current = event.clientX;
    dragAllowed.current = nearest(barLocalX(event.clientX)) === activeIndex;
    if (dragAllowed.current) {
      overlayRef.current?.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!(pointerDown.current && dragAllowed.current)) {
      return;
    }
    if (!draggingRef.current && Math.abs(event.clientX - startX.current) > 4) {
      draggingRef.current = true;
      cx.current.jump(barLocalX(event.clientX));
      setDragging(true);
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
    const idx = draggingRef.current
      ? nearest(barLocalX(event.clientX))
      : nearest(barLocalX(startX.current));
    select(idx);
    if (draggingRef.current) {
      draggingRef.current = false;
      setHover(null);
      const settle = () => setDragging(false);
      if (prefersReducedMotion()) {
        settle();
      } else {
        tween(cx.current, itemCenter(idx), TRAVEL_DURATION, glassEase, settle);
      }
    }
  };

  const iconNodes = items.map((item, index) => {
    const color =
      index === activeIndex ? ACCENT : index === hover ? HOVER : IDLE;
    return (
      <div
        className="relative grid place-items-center content-center"
        key={item.id}
        style={{ gap: 5, padding: "10px 5px 9px", color }}
      >
        <span className="grid size-[28px] place-items-center" style={{ color }}>
          {item.icon}
        </span>
        <span
          className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-[650] text-[12px] leading-none"
          style={{ color }}
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
        blur={resolved.blur}
        chroma={resolved.chroma}
        className="pointer-events-none absolute inset-0"
        depth={12}
        domeDepth={12}
        edgeHighlight={resolved.edgeHighlight}
        glow={resolved.glow}
        lens={
          <>
            <div
              className="absolute"
              data-glass-depth={16}
              data-glass-lens
              data-glass-mul={0.55}
              ref={barMarkerRef}
            />
            {dragging ? (
              <div
                className="absolute"
                data-glass-depth={20}
                data-glass-dome-depth={34}
                data-glass-edge-highlight={0.22}
                data-glass-glow={0.1}
                data-glass-lens
                data-glass-mul={0.7}
                ref={lensMarkerRef}
              />
            ) : null}
          </>
        }
        resolution={1}
        scaleX={resolved.scale}
        scaleY={safari ? resolved.scale * 1.1 : resolved.scale}
        tint={resolved.tint}
      >
        <div className="absolute inset-0 overflow-hidden">
          {children}
          <div
            className="absolute"
            ref={contentRef}
            style={{ width: DOCK_W, height: DOCK_H }}
          >
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
          <div
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: BAR_RADIUS, boxShadow: RIM, background: SHEEN }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              left: itemCenter(activeIndex) - PILL_W / 2,
              top: (DOCK_H - PILL_H) / 2,
              width: PILL_W,
              height: PILL_H,
              borderRadius: PILL_H / 2,
              background: PILL_FILL,
              boxShadow: PILL_SHADOW,
              opacity: dragging ? 0 : 1,
              transition:
                "left 320ms cubic-bezier(0.22,1,0.36,1), opacity 140ms ease",
            }}
          />
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
                    select(index);
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
