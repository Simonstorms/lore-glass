# Glass Tab Bar

> An iOS 26 style liquid-glass bottom tab bar. It wraps your screen content and refracts it: the selected tab rests as a soft capsule and, on press, swells up out of the bar into a magnifying lens that lifts the icon, bends the content behind it, and fringes its edges with chromatic light. Press and drag along the bar and the lens follows.

## Install

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-tab-bar.json
# or, with the @lore-glass namespace registered:
npx shadcn@latest add @lore-glass/glass-tab-bar
```

## Props

### GlassTabBar

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `{ value, label, icon }[]` | `required` | The tabs to render, each with a value, label, and icon. |
| `children` | `ReactNode` | `undefined` | The screen content the bar overlays and refracts through its lens. |
| `value / defaultValue` | `string` | `first item` | Controlled and uncontrolled selected tab value. |
| `onValueChange` | `(value) => void` | `undefined` | Called with the new value when a tab is selected. |
| `accessory` | `ReactNode` | `undefined` | Optional trailing glass circle content, such as a search icon. |
| `onAccessoryClick` | `() => void` | `undefined` | Called when the trailing accessory circle is pressed. |

## Usage

```tsx
import { type PointerEvent, useRef, useState } from "react";
import {
  Bell,
  Ellipsis,
  House,
  MessagesFilled,
  Search,
} from "@/components/docs/icons";
import { Glass } from "@/components/ui/glass";

const ROWS = [
  { name: "general", text: "important update for everyone" },
  { name: "design", text: "the new glass tokens are live" },
  { name: "engineering", text: "shipped the refraction fix" },
  { name: "random", text: "anyone up for lunch?" },
  { name: "support", text: "ticket #4821 was resolved" },
  { name: "releases", text: "v2.1 is rolling out today" },
  { name: "product", text: "roadmap review at noon" },
  { name: "marketing", text: "launch assets are ready" },
];

const ICON = "size-[25px]";

const TABS = [
  {
    value: "home",
    label: "Home",
    icon: <House className={ICON} strokeWidth={2.1} />,
  },
  {
    value: "dms",
    label: "DMs",
    icon: <MessagesFilled className={ICON} />,
  },
  {
    value: "activity",
    label: "Activity",
    icon: <Bell className={ICON} strokeWidth={2.1} />,
  },
  {
    value: "more",
    label: "More",
    icon: <Ellipsis className={ICON} strokeWidth={2.6} />,
  },
];

const SELECTED = "dms";
const ACCENT = "#8fb4ff";
const IDLE = "#f4f4f6";

const STAGE_H = 420;
const PILL_W = 360;
const ORB = 88;
const BAR_H = 88;
const UNIT_W = PILL_W + 16 + ORB;

function GlassTabBarDemo() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.82 });
  const grab = useRef<{ dx: number; dy: number } | null>(null);

  const toLocal = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const top = `calc(${pos.y * 100}% - ${BAR_H / 2}px)`;

  return (
    <div
      className="relative w-full max-w-[560px] cursor-grab touch-none select-none overflow-hidden rounded-[26px] text-white active:cursor-grabbing"
      onPointerCancel={() => {
        grab.current = null;
      }}
      onPointerDown={(e) => {
        const p = toLocal(e);
        grab.current = { dx: p.x - pos.x, dy: p.y - pos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!grab.current) {
          return;
        }
        const p = toLocal(e);
        setPos({
          x: Math.min(1, Math.max(0, p.x - grab.current.dx)),
          y: Math.min(1, Math.max(0, p.y - grab.current.dy)),
        });
      }}
      onPointerUp={() => {
        grab.current = null;
      }}
      style={{ height: STAGE_H }}
    >
      <Glass
        chroma={0.3}
        className="absolute inset-0"
        colorScheme="dark"
        depth={12}
        domeDepth={40}
        edgeHighlight={0.3}
        glow={0.12}
        lens={
          <>
            <div
              className="flex items-stretch"
              data-glass-lens
              style={{
                position: "absolute",
                left: `calc(${pos.x * 100}% - ${UNIT_W / 2}px)`,
                top,
                width: PILL_W,
                height: BAR_H,
                borderRadius: BAR_H / 2,
              }}
            >
              {TABS.map((tab) => {
                const selected = tab.value === SELECTED;
                return (
                  <div
                    className="relative flex flex-1 flex-col items-center justify-center gap-[5px]"
                    key={tab.value}
                  >
                    {selected ? (
                      <div
                        className="absolute inset-x-[6px] inset-y-[10px] rounded-[22px]"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      />
                    ) : null}
                    <span
                      className="relative flex h-[28px] items-center justify-center"
                      style={{ color: selected ? ACCENT : IDLE }}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className="relative font-semibold text-[13px] leading-none tracking-[-0.01em]"
                      style={{ color: selected ? ACCENT : IDLE }}
                    >
                      {tab.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className="flex items-center justify-center"
              data-glass-lens
              style={{
                position: "absolute",
                left: `calc(${pos.x * 100}% + ${UNIT_W / 2 - ORB}px)`,
                top,
                width: ORB,
                height: ORB,
                borderRadius: ORB / 2,
                color: IDLE,
              }}
            >
              <Search className={ICON} strokeWidth={2.1} />
            </div>
          </>
        }
        scaleX={0.1}
        scaleY={0.1}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 110% at 50% 18%, #36373f 0%, #202127 72%)",
          }}
        />
        <div className="absolute inset-0 overflow-hidden px-6 pt-5">
          <div className="font-semibold text-[15px] text-white/60">Channels</div>
          <div className="mt-3 flex flex-col gap-[9px]">
            {ROWS.map((row) => (
              <div className="flex items-center gap-3" key={row.name}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 font-semibold text-[15px] text-white/55">
                  #
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[14px] text-white/90">
                    {row.name}
                  </div>
                  <div className="truncate text-[13px] text-white/55">
                    {row.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Glass>
    </div>
  );
}

export { GlassTabBarDemo };
```
