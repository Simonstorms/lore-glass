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
            "radial-gradient(58% 70% at 18% 12%, rgba(244,114,182,0.55), transparent 62%), radial-gradient(55% 68% at 88% 18%, rgba(56,189,248,0.5), transparent 62%), radial-gradient(72% 78% at 52% 112%, rgba(52,211,153,0.5), transparent 60%), radial-gradient(46% 56% at 98% 96%, rgba(251,191,36,0.42), transparent 60%), linear-gradient(158deg, #20223a 0%, #14141f 55%, #0c0c12 100%)",
        }}
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
