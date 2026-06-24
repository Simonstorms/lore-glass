"use client";

import { Glass, isSafariBrowser } from "@/components/ui/glass";
import {
  glassEase,
  MotionValue,
  prefersReducedMotion,
  PRESS_DURATION,
  RELEASE_DURATION,
  SpringDriver,
  tween,
} from "@/components/ui/glass-motion";
import { cn } from "@/lib/utils";
import {
  type KeyboardEvent,
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

const SHADOW_RGB: Record<ShadowTone, string> = {
  neutral: "0,0,0",
  warm: "40,20,4",
  cool: "4,16,48",
};

interface ResolvedGlass {
  blur: number;
  chroma: number;
  domeDepth: number;
  edgeHighlight: number;
  glow: number;
  scale: number;
  shadow: number;
  tint: number;
}

function resolveGlass(config: LiquidGlassConfig): ResolvedGlass {
  const refr = config.refraction.enabled ? config.refraction.amount / 100 : 0;
  const specOn = config.specular !== "none";
  return {
    scale: refr * 0.5,
    chroma: config.refraction.enabled ? Math.min(0.5, refr * 1.5) : 0,
    domeDepth: config.refraction.enabled ? (config.refraction.thickness / 100) * 250 : 0,
    blur: config.blur.enabled ? (config.blur.value / 100) * 3 : 0,
    tint: config.translucency.enabled ? config.translucency.value / 100 : 0,
    edgeHighlight: specOn ? 0.3 : 0,
    glow: specOn ? 0.12 : 0,
    shadow: (config.shadow.value / 100) * 0.5,
  };
}

const POS_SPRING = { stiffness: 60, damping: 15 };
const LENS_W = 112;
const LENS_H = 108;
const LIFT_GROW = 0.1;

const BAR_GAP = 36;
const ACCENT = "#8fb4ff";
const IDLE = "#f4f4f6";
const BAR_FILL = "rgba(30,32,42,0.4)";
const BAR_HIGHLIGHT =
  "inset 0 2px 1px rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.06)";
const BAR_SHEEN =
  "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 22%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.04) 100%)";
const SEARCH_SIZE = 66;

const CELL =
  "relative inline-flex min-w-[84px] shrink-0 flex-col items-center justify-end gap-[5px] px-[14px] pt-[11px] pb-[9px]";
const ICON_WRAP =
  "flex h-[28px] items-center justify-center transition-colors duration-200";
const LABEL =
  "font-semibold text-[13px] leading-none tracking-[-0.01em] transition-colors duration-200";

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

interface GlassTabBarItem {
  icon: ReactNode;
  label: string;
  value: string;
}

interface GlassTabBarProps {
  accessory?: ReactNode;
  accessoryLabel?: string;
  align?: "bottom" | "top";
  children?: ReactNode;
  className?: string;
  defaultValue?: string;
  glass?: LiquidGlassConfig;
  items: GlassTabBarItem[];
  onAccessoryClick?: () => void;
  onValueChange?: (value: string) => void;
  showLens?: boolean;
  value?: string;
}

function GlassTabBar({
  accessory,
  accessoryLabel = "Search",
  align = "bottom",
  children,
  className,
  defaultValue,
  glass,
  items,
  onAccessoryClick,
  onValueChange,
  showLens = true,
  value,
}: GlassTabBarProps) {
  const alignTop = align === "top";
  const safari = isSafariBrowser();
  const config = glass ?? DEFAULT_LIQUID_GLASS;
  const resolved = resolveGlass(config);

  const [internal, setInternal] = useState(
    () => defaultValue ?? items[0]?.value
  );
  const [hoverValue, setHoverValue] = useState<string | null>(null);
  const active = value ?? internal;
  const displayValue = hoverValue ?? active;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === active)
  );

  const setActive = useCallback(
    (next: string) => {
      if (value === undefined) {
        setInternal(next);
      }
      onValueChange?.(next);
    },
    [onValueChange, value]
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const barBoxRef = useRef<HTMLDivElement | null>(null);
  const accBoxRef = useRef<HTMLButtonElement | null>(null);
  const barMarkerRef = useRef<HTMLDivElement | null>(null);
  const searchMarkerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const rimRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const dragging = useRef(false);
  const release = useRef<(() => void) | null>(null);

  const cx = useRef(new MotionValue(0));
  const lift = useRef(new MotionValue(0));
  const geom = useRef({ cy: 0 });
  const initialized = useRef(false);
  const frame = useRef(0);

  const apply = useCallback(() => {
    frame.current = 0;
    const marker = markerRef.current;
    const rim = rimRef.current;
    if (!marker) {
      return;
    }
    const x = cx.current.get();
    const l = clamp01(lift.current.get());
    const scale = 1 + l * LIFT_GROW;
    const w = LENS_W * scale;
    const h = LENS_H * scale;
    const left = x - w / 2;
    const top = geom.current.cy - h / 2;
    for (const el of [marker, rim]) {
      if (el) {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.borderRadius = `${w / 2}px / ${h / 2}px`;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      }
    }
  }, []);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  const target = useRef(0);
  const driver = useRef<SpringDriver | null>(null);
  if (!driver.current) {
    driver.current = new SpringDriver(cx.current, POS_SPRING, () => target.current);
  }

  const placeStatic = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const base = root.getBoundingClientRect();
    const place = (box: HTMLElement | null, mark: HTMLDivElement | null) => {
      if (!(box && mark)) {
        return;
      }
      const r = box.getBoundingClientRect();
      mark.style.left = `${r.left - base.left}px`;
      mark.style.top = `${r.top - base.top}px`;
      mark.style.width = `${r.width}px`;
      mark.style.height = `${r.height}px`;
      mark.style.borderRadius = `${r.height / 2}px`;
    };
    place(barBoxRef.current, barMarkerRef.current);
    place(accBoxRef.current, searchMarkerRef.current);
  }, []);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const bar = barBoxRef.current;
    const item = itemRefs.current[activeIndexRef.current];
    if (!(root && bar && item)) {
      return;
    }
    placeStatic();
    const base = root.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    geom.current.cy = barRect.top - base.top + barRect.height / 2;
    target.current = rect.left - base.left + rect.width / 2;
    if (!initialized.current || prefersReducedMotion()) {
      initialized.current = true;
      cx.current.jump(target.current);
      apply();
      return;
    }
    driver.current?.start();
  }, [apply, placeStatic]);

  useEffect(() => {
    const subs = [cx.current.on(schedule), lift.current.on(schedule)];
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
      for (const off of subs) {
        off();
      }
      resize.disconnect();
      cancelAnimationFrame(frame.current);
      release.current?.();
      driver.current?.stop();
    };
  }, [measure, schedule]);

  useEffect(() => {
    measure();
  }, [measure, activeIndex]);

  const tabCenters = useCallback((): number[] => {
    const root = rootRef.current;
    if (!root) {
      return [];
    }
    const base = root.getBoundingClientRect();
    return itemRefs.current.map((el) =>
      el ? el.getBoundingClientRect().left - base.left + el.offsetWidth / 2 : 0
    );
  }, []);

  const nearestTab = useCallback(
    (xValue: number): number => {
      const centers = tabCenters();
      let best = activeIndexRef.current;
      let min = Number.POSITIVE_INFINITY;
      for (let i = 0; i < centers.length; i++) {
        const dist = Math.abs(xValue - centers[i]);
        if (dist < min) {
          min = dist;
          best = i;
        }
      }
      return best;
    },
    [tabCenters]
  );

  const pointerToX = useCallback(
    (clientX: number): number => {
      const root = rootRef.current;
      if (!root) {
        return cx.current.get();
      }
      const base = root.getBoundingClientRect();
      const centers = tabCenters();
      const lo = centers[0] ?? 0;
      const hi = centers[centers.length - 1] ?? 0;
      return Math.min(Math.max(clientX - base.left, lo), hi);
    },
    [tabCenters]
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) {
      return;
    }
    dragging.current = true;
    driver.current?.stop();
    const x = pointerToX(event.clientX);
    cx.current.jump(x);
    setHoverValue(items[nearestTab(x)].value);
    tween(lift.current, 1, prefersReducedMotion() ? 0 : PRESS_DURATION, glassEase);

    const move = (e: globalThis.PointerEvent) => {
      const nx = pointerToX(e.clientX);
      cx.current.set(nx);
      setHoverValue(items[nearestTab(nx)].value);
    };
    const end = () => {
      if (!dragging.current) {
        return;
      }
      dragging.current = false;
      release.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      const centers = tabCenters();
      const idx = nearestTab(cx.current.get());
      setActive(items[idx].value);
      setHoverValue(null);
      target.current = centers[idx] ?? cx.current.get();
      if (prefersReducedMotion()) {
        cx.current.jump(target.current);
      } else {
        driver.current?.start();
      }
      tween(lift.current, 0, prefersReducedMotion() ? 0 : RELEASE_DURATION, glassEase);
    };
    release.current = end;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const onKeyNav = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const dir = event.key === "ArrowRight" ? 1 : -1;
      const next = (activeIndex + dir + items.length) % items.length;
      setActive(items[next].value);
      itemRefs.current[next]?.focus();
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)} ref={rootRef}>
      <Glass
        blur={resolved.blur}
        chroma={resolved.chroma}
        className="pointer-events-none absolute inset-0"
        colorScheme="dark"
        depth={12}
        domeDepth={resolved.domeDepth}
        edgeHighlight={resolved.edgeHighlight}
        glow={resolved.glow}
        lens={
          <>
            <div className="absolute" data-glass-lens ref={barMarkerRef} />
            {accessory ? (
              <div className="absolute" data-glass-lens ref={searchMarkerRef} />
            ) : null}
            {showLens ? (
              <div data-glass-lens ref={markerRef} style={{ position: "absolute" }} />
            ) : null}
          </>
        }
        resolution={2}
        scaleX={resolved.scale}
        scaleY={safari ? resolved.scale * 1.1 : resolved.scale}
        tint={resolved.tint}
      >
        {children}
      </Glass>
      <div
        className={cn(
          "absolute right-0 left-0 flex justify-center gap-3",
          alignTop ? "top-0 items-start" : "bottom-0 items-end"
        )}
        style={alignTop ? { paddingTop: BAR_GAP } : { paddingBottom: BAR_GAP }}
      >
        <div
          aria-label="Primary"
          className="relative inline-flex cursor-pointer touch-none select-none overflow-hidden rounded-full p-[6px]"
          onPointerDown={onPointerDown}
          ref={barBoxRef}
          role="tablist"
          style={{ background: BAR_FILL, boxShadow: BAR_HIGHLIGHT }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: BAR_SHEEN }}
          />
          <div className="relative flex items-stretch">
            {items.map((item, index) => {
              const selected = item.value === active;
              return (
                <button
                  aria-selected={selected}
                  className={cn(CELL, "outline-none focus-visible:outline-none")}
                  key={item.value}
                  onKeyDown={onKeyNav}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  role="tab"
                  tabIndex={selected ? 0 : -1}
                  type="button"
                >
                  <span
                    className={ICON_WRAP}
                    style={{ color: item.value === displayValue ? ACCENT : IDLE }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={LABEL}
                    style={{ color: item.value === displayValue ? ACCENT : IDLE }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {accessory ? (
          <button
            aria-label={accessoryLabel}
            className="relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full"
            onClick={onAccessoryClick}
            ref={accBoxRef}
            style={{
              height: SEARCH_SIZE,
              width: SEARCH_SIZE,
              background: BAR_FILL,
              boxShadow: BAR_HIGHLIGHT,
              color: IDLE,
            }}
            type="button"
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ background: BAR_SHEEN }}
            />
            <span className="relative">{accessory}</span>
          </button>
        ) : null}
      </div>
      {showLens ? (
        <div
          className="pointer-events-none absolute top-0 left-0"
          ref={rimRef}
          style={{
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.6), 0 14px 34px -10px rgba(${SHADOW_RGB[config.shadow.tone]},${resolved.shadow})`,
          }}
        />
      ) : null}
    </div>
  );
}

export { DEFAULT_LIQUID_GLASS, GlassTabBar, resolveGlass };
export type {
  GlassMode,
  GlassSpecular,
  GlassTabBarItem,
  GlassTabBarProps,
  LiquidGlassConfig,
  ShadowTone,
};
