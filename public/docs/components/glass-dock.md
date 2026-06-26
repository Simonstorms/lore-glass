# Glass Dock

> A macOS-style liquid-glass application dock: an always-glass bar that refracts the content behind it. The selected item rests as a soft pill; grab that pill and drag along the bar and it becomes a glass lens that magnifies the icons and labels it slides over, snapping to the nearest item (and turning back into a pill) on release. Only the pill is draggable; pressing another item selects it.

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
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle 140px at 14% 24%, #ff5fa2 0%, #ff5fa2 26%, transparent 60%), radial-gradient(circle 150px at 86% 30%, #2bb6ff 0%, #2bb6ff 24%, transparent 58%), radial-gradient(circle 170px at 44% 96%, #18d0a0 0%, #18d0a0 26%, transparent 60%), radial-gradient(circle 120px at 92% 86%, #ffb02e 0%, #ffb02e 26%, transparent 58%), radial-gradient(circle 120px at 58% 62%, #7c4dff 0%, #7c4dff 22%, transparent 56%), linear-gradient(150deg, #2a1a44 0%, #161427 55%, #100f1c 100%)",
        }}
      />
      <div className="absolute inset-0 px-7 pt-7">
        <div className="font-semibold text-[13px] text-white/55 uppercase tracking-[0.18em]">
          Liquid Glass
        </div>
        <div className="mt-2 max-w-[320px] font-semibold text-[26px] text-white leading-tight">
          Grab the selection and drag it
        </div>
        <div className="mt-3 max-w-[300px] text-[14px] text-white/60">
          The bar is glass and the selected item rests as a pill. Grab that pill
          and drag, and it turns into a glass lens that magnifies the icons as it
          slides.
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
        items={ITEMS}
      >
        <Scene />
      </GlassDock>
    </div>
  );
}

export { GlassDockDemo };
```
