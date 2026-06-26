"use client";

import { Glass, isSafariBrowser } from "@/components/ui/glass";
import {
  MotionValue,
  prefersReducedMotion,
  SpringDriver,
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
  scale: number;
  tint: number;
}

function resolveGlass(config: LiquidGlassConfig): ResolvedGlass {
  const refr = config.refraction.enabled ? config.refraction.amount / 100 : 0;
  return {
    scale: refr * 0.5,
    chroma: config.refraction.enabled ? Math.min(0.5, refr * 1.5) : 0,
    blur: config.blur.enabled ? (config.blur.value / 100) * 3 : 0,
    tint: config.translucency.enabled ? config.translucency.value / 100 : 0,
  };
}

const DOCK_W = 428;
const DOCK_H = 100;
const PAD_X = 10;
const PAD_Y = 9;
const ITEM_GAP = 4;
const COL = (DOCK_W - 2 * PAD_X - 3 * ITEM_GAP) / 4;
const LENS_W = COL - 6;
const LENS_H = DOCK_H - 2 * PAD_Y - 8;
const BAR_RADIUS = 46;
const POS_SPRING = { stiffness: 90, damping: 19 };

const ACCENT = "#58a6ff";
const IDLE = "rgba(255,255,255,0.82)";
const HOVER = "#ffffff";
const BADGE_BG = "#ff514c";
const BAR_FILL = "rgba(17,19,30,0.5)";
const RIM =
  "inset 0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.2)";
const SHEEN =
  "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 28%, rgba(255,255,255,0) 64%)";

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
  const active = value ?? internal;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === active)
  );
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const barBoxRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lensMarkerRef = useRef<HTMLDivElement | null>(null);

  const cx = useRef(new MotionValue(itemCenter(activeIndex)));
  const dockLeft = useRef(0);
  const dockTop = useRef(0);
  const frame = useRef(0);
  const initialized = useRef(false);
  const pointerDown = useRef(false);
  const dragging = useRef(false);
  const startX = useRef(0);

  const apply = useCallback(() => {
    frame.current = 0;
    const root = rootRef.current;
    const box = barBoxRef.current;
    const lens = lensMarkerRef.current;
    if (!(root && box && lens)) {
      return;
    }
    const base = root.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    const left = r.left - base.left + cx.current.get() - LENS_W / 2;
    const top = r.top - base.top + (DOCK_H - LENS_H) / 2;
    lens.style.left = `${left}px`;
    lens.style.top = `${top}px`;
    lens.style.width = `${LENS_W}px`;
    lens.style.height = `${LENS_H}px`;
    lens.style.borderRadius = `${LENS_H / 2}px`;
  }, []);

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
      dockLeft.current = clamp(
        (r.width - DOCK_W) / 2,
        0,
        Math.max(0, r.width - DOCK_W)
      );
      dockTop.current = clamp(
        r.height * 0.6 - DOCK_H / 2,
        0,
        Math.max(0, r.height - DOCK_H)
      );
      for (const el of [dockRef.current, overlayRef.current]) {
        if (el) {
          el.style.left = `${dockLeft.current}px`;
          el.style.top = `${dockTop.current}px`;
        }
      }
      cx.current.jump(itemCenter(activeIndexRef.current));
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

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    overlayRef.current?.setPointerCapture(event.pointerId);
    pointerDown.current = true;
    dragging.current = false;
    startX.current = event.clientX;
    driver.current?.stop();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerDown.current) {
      return;
    }
    if (!dragging.current && Math.abs(event.clientX - startX.current) > 4) {
      dragging.current = true;
    }
    if (!dragging.current) {
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
    const idx = nearest(barLocalX(event.clientX));
    select(idx);
    setHover(dragging.current ? null : idx);
    glide();
  };

  const itemNodes = items.map((item, index) => {
    const color =
      index === activeIndex ? ACCENT : index === hover ? HOVER : IDLE;
    return (
      <div
        className="relative grid place-items-center content-center"
        key={item.id}
        style={{ gap: 5, padding: "10px 5px 9px", color }}
      >
        <span
          className="grid size-[28px] place-items-center"
          style={{ color }}
        >
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

  const gridStyle = {
    top: PAD_Y,
    right: PAD_X,
    bottom: PAD_Y,
    left: PAD_X,
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: ITEM_GAP,
  } as const;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onDragStart={(event) => event.preventDefault()}
      ref={rootRef}
    >
      <Glass
        blur={resolved.blur}
        chroma={0.16}
        className="pointer-events-none absolute inset-0"
        depth={10}
        lens={
          <div
            className="absolute"
            data-glass-depth={18}
            data-glass-dome-depth={34}
            data-glass-edge-highlight={0.2}
            data-glass-glow={0.08}
            data-glass-lens
            data-glass-mul={0.55}
            ref={lensMarkerRef}
          />
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
            ref={dockRef}
            style={{ width: DOCK_W, height: DOCK_H }}
          >
            <div className="relative size-full" ref={barBoxRef}>
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: BAR_RADIUS,
                  background: BAR_FILL,
                  boxShadow: RIM,
                }}
              />
              <div
                className="absolute inset-0"
                style={{ borderRadius: BAR_RADIUS, background: SHEEN }}
              />
              <div className="absolute grid text-white" style={gridStyle}>
                {itemNodes}
              </div>
            </div>
          </div>
        </div>
      </Glass>
      <div
        aria-label={ariaLabel}
        className="absolute cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerCancel={onPointerUp}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={overlayRef}
        style={{ width: DOCK_W, height: DOCK_H }}
      >
        <div className="absolute grid size-full" style={gridStyle}>
          {items.map((item, index) => (
            <button
              aria-current={index === activeIndex ? "page" : undefined}
              aria-label={item.label}
              className="rounded-[38px] outline-none"
              key={item.id}
              onClick={(event) => {
                if (event.detail === 0) {
                  select(index);
                  glide();
                }
              }}
              onPointerEnter={() => {
                if (!dragging.current) {
                  setHover(index);
                }
              }}
              onPointerLeave={() => {
                if (!dragging.current) {
                  setHover((h) => (h === index ? null : h));
                }
              }}
              type="button"
            />
          ))}
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
