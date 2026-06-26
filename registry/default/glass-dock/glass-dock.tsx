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
  domeDepth: number;
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
    domeDepth: config.refraction.enabled
      ? (config.refraction.thickness / 100) * 250
      : 0,
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
const LENS_W = COL - 8;
const LENS_H = DOCK_H - 2 * PAD_Y - 10;
const BAR_RADIUS = 46;
const POS_SPRING = { stiffness: 70, damping: 16 };

const ACCENT = "#58a6ff";
const IDLE = "rgba(255,255,255,0.82)";
const HOVER = "#ffffff";
const BADGE_BG = "#ff514c";
const RIM =
  "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.18)";
const SHEEN =
  "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0) 70%)";
const PILL_FILL = "rgba(255,255,255,0.12)";
const PILL_SHADOW =
  "inset 0 1px 1px rgba(255,255,255,0.3), 0 8px 18px -10px rgba(0,0,0,0.5)";

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
  draggable?: boolean;
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
  draggable = false,
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
  const highlight = hover ?? activeIndex;
  const highlightRef = useRef(highlight);
  highlightRef.current = highlight;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const barBoxRef = useRef<HTMLElement | null>(null);
  const barMarkerRef = useRef<HTMLDivElement | null>(null);
  const lensMarkerRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);

  const cx = useRef(new MotionValue(itemCenter(highlight)));
  const dockPos = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const initialized = useRef(false);
  const dragged = useRef(false);

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
    const root = rootRef.current;
    const box = barBoxRef.current;
    if (!(root && box)) {
      return;
    }
    const base = root.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    const x = cx.current.get();
    const localLeft = x - LENS_W / 2;
    const localTop = (DOCK_H - LENS_H) / 2;
    const lens = lensMarkerRef.current;
    if (lens) {
      lens.style.left = `${r.left - base.left + localLeft}px`;
      lens.style.top = `${r.top - base.top + localTop}px`;
      lens.style.width = `${LENS_W}px`;
      lens.style.height = `${LENS_H}px`;
      lens.style.borderRadius = `${LENS_H / 2}px`;
    }
    const pill = pillRef.current;
    if (pill) {
      pill.style.left = `${localLeft}px`;
      pill.style.top = `${localTop}px`;
    }
  }, [placeStatic]);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  const driver = useRef<SpringDriver | null>(null);
  if (!driver.current) {
    driver.current = new SpringDriver(cx.current, POS_SPRING, () =>
      itemCenter(highlightRef.current)
    );
  }

  const glide = useCallback(() => {
    if (prefersReducedMotion()) {
      cx.current.jump(itemCenter(highlightRef.current));
      apply();
      return;
    }
    driver.current?.start();
  }, [apply]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const dock = dockRef.current;
    if (!(root && dock)) {
      return;
    }
    if (!initialized.current) {
      initialized.current = true;
      const r = root.getBoundingClientRect();
      const x = clamp((r.width - DOCK_W) / 2, 0, Math.max(0, r.width - DOCK_W));
      const y = clamp(
        r.height * 0.62 - DOCK_H / 2,
        0,
        Math.max(0, r.height - DOCK_H)
      );
      dockPos.current = { x, y };
      dock.style.left = `${x}px`;
      dock.style.top = `${y}px`;
      cx.current.jump(itemCenter(highlightRef.current));
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

  const onItemClick = (index: number) => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    select(index);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggable) {
      return;
    }
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...dockPos.current };
    dragged.current = false;
    const move = (e: globalThis.PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragged.current && Math.hypot(dx, dy) > 4) {
        dragged.current = true;
        setHover(null);
      }
      if (!dragged.current) {
        return;
      }
      const root = rootRef.current;
      const dock = dockRef.current;
      if (!(root && dock)) {
        return;
      }
      const r = root.getBoundingClientRect();
      const nx = clamp(origin.x + dx, 0, Math.max(0, r.width - DOCK_W));
      const ny = clamp(origin.y + dy, 0, Math.max(0, r.height - DOCK_H));
      dockPos.current = { x: nx, y: ny };
      dock.style.left = `${nx}px`;
      dock.style.top = `${ny}px`;
      schedule();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div className={cn("relative overflow-hidden", className)} ref={rootRef}>
      <Glass
        blur={resolved.blur}
        chroma={resolved.chroma}
        className="pointer-events-none absolute inset-0"
        depth={12}
        domeDepth={resolved.domeDepth}
        edgeHighlight={resolved.edgeHighlight}
        glow={resolved.glow}
        lens={
          <>
            <div className="absolute" data-glass-lens ref={barMarkerRef} />
            <div className="absolute" data-glass-lens ref={lensMarkerRef} />
          </>
        }
        resolution={2}
        scaleX={resolved.scale}
        scaleY={safari ? resolved.scale * 1.1 : resolved.scale}
        tint={resolved.tint}
      >
        <div className="absolute inset-0 overflow-hidden">{children}</div>
      </Glass>
      <div
        className={cn(
          "absolute text-white",
          draggable && "cursor-grab touch-none select-none active:cursor-grabbing"
        )}
        onPointerDown={onPointerDown}
        ref={dockRef}
        style={{ width: DOCK_W, height: DOCK_H }}
      >
        <nav
          aria-label={ariaLabel}
          className="relative size-full"
          ref={barBoxRef}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: BAR_RADIUS, boxShadow: RIM, background: SHEEN }}
          />
          <div
            className="pointer-events-none absolute"
            ref={pillRef}
            style={{
              width: LENS_W,
              height: LENS_H,
              borderRadius: LENS_H / 2,
              background: PILL_FILL,
              boxShadow: PILL_SHADOW,
            }}
          />
          <div
            className="absolute grid"
            style={{
              top: PAD_Y,
              right: PAD_X,
              bottom: PAD_Y,
              left: PAD_X,
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: ITEM_GAP,
            }}
          >
            {items.map((item, index) => {
              const color =
                index === activeIndex
                  ? ACCENT
                  : index === hover
                    ? HOVER
                    : IDLE;
              return (
                <button
                  aria-current={index === activeIndex ? "page" : undefined}
                  className="relative grid cursor-pointer place-items-center content-center outline-none"
                  key={item.id}
                  onClick={() => onItemClick(index)}
                  onPointerEnter={() => {
                    setHover(index);
                    glide();
                  }}
                  onPointerLeave={() => {
                    setHover((h) => (h === index ? null : h));
                    glide();
                  }}
                  style={{
                    gap: 5,
                    padding: "10px 5px 9px",
                    borderRadius: 38,
                    color,
                    transition: "color 120ms ease",
                  }}
                  type="button"
                >
                  <span
                    className="relative grid size-[28px] place-items-center"
                    style={{ color }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className="relative max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-[650] text-[12px] leading-none"
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
                </button>
              );
            })}
          </div>
        </nav>
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
