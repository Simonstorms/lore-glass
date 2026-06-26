# Glass Dock

> A macOS-style liquid-glass application dock: a four-item glass bar with a trailing search orb, both built from the refraction engine. The selected item rests as a soft pill and the selection glides between items as a glass lens. The whole dock can be dragged across the content it refracts.

## Install

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-dock.json
# or, with the @lore-glass namespace registered:
npx shadcn@latest add @lore-glass/glass-dock
```

## Props

### GlassDock

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `{ id, label, icon, badge? }[]` | `required` | Dock entries. Each has an id, a label, a stroked icon node, and an optional badge. |
| `value / defaultValue` | `string` | `first item` | Controlled and uncontrolled selected item id. |
| `onValueChange` | `(id) => void` | `undefined` | Called when the selected item changes. |
| `onSearch` | `() => void` | `undefined` | Called when the trailing search orb is pressed. |
| `draggable` | `boolean` | `false` | Lets the user drag the whole dock across the content behind it. |
| `glass` | `LiquidGlassConfig` | `DEFAULT_LIQUID_GLASS` | Tunes the material: specular, blur, refraction { amount, thickness }, translucency, shadow. |

## Usage

```tsx
import type { ReactNode } from "react";
import { GlassDock } from "@/components/ui/glass-dock";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={28}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={28}
    >
      {children}
    </svg>
  );
}

const ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: <Icon>{<path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z" />}</Icon>,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <Icon>
        <rect height="7" rx="1.5" width="7" x="3" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="3" />
        <rect height="7" rx="1.5" width="7" x="3" y="14" />
        <rect height="7" rx="1.5" width="7" x="14" y="14" />
      </Icon>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <Icon>{<path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />}</Icon>,
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <Icon>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.97 19.35a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9.02 4.6 1.7 1.7 0 0 0 10.05 3V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15.08 4.65a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </Icon>
    ),
  },
];

function Scene() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 18% 8%, #2c2e5e 0%, #181826 52%, #0d0d14 100%)",
        }}
      />
      <div
        className="absolute size-[260px] rounded-full blur-[60px]"
        style={{ top: -40, left: 30, background: "rgba(244,114,182,0.55)" }}
      />
      <div
        className="absolute size-[300px] rounded-full blur-[70px]"
        style={{ top: 20, right: -50, background: "rgba(56,189,248,0.5)" }}
      />
      <div
        className="absolute size-[280px] rounded-full blur-[70px]"
        style={{ bottom: -70, left: "38%", background: "rgba(52,211,153,0.45)" }}
      />
      <div
        className="absolute size-[200px] rounded-full blur-[60px]"
        style={{ bottom: -30, right: 40, background: "rgba(251,191,36,0.4)" }}
      />
      <div className="absolute inset-0 px-7 pt-7">
        <div className="font-semibold text-[13px] text-white/55 uppercase tracking-[0.18em]">
          Liquid Glass
        </div>
        <div className="mt-2 max-w-[320px] font-semibold text-[26px] text-white leading-tight">
          Drag the dock across the wallpaper
        </div>
        <div className="mt-3 max-w-[300px] text-[14px] text-white/60">
          Tap an item and the selection glides as a glass lens. The bar and the
          search orb refract whatever sits behind them.
        </div>
      </div>
    </div>
  );
}

function GlassDockDemo() {
  return (
    <div className="flex w-full justify-center">
      <GlassDock
        className="h-[380px] w-full max-w-[560px] rounded-[28px] text-white"
        defaultValue="home"
        draggable
        items={ITEMS}
      >
        <Scene />
      </GlassDock>
    </div>
  );
}

export { GlassDockDemo };
```
