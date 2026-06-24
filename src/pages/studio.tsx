import { useState } from "react";
import { DocPage } from "@/components/docs/doc-page";
import {
  Bell,
  Check,
  Copy,
  Ellipsis,
  House,
  MessagesFilled,
  Search,
} from "@/components/docs/icons";
import { LiquidGlassInspector } from "@/components/docs/liquid-glass-inspector";
import {
  DEFAULT_LIQUID_GLASS,
  GlassTabBar,
  type LiquidGlassConfig,
} from "@/components/ui/glass-tab-bar";

const ITEMS = [
  {
    value: "home",
    label: "Home",
    icon: <House className="size-[25px]" strokeWidth={2.1} />,
  },
  {
    value: "dms",
    label: "DMs",
    icon: <MessagesFilled className="size-[27px]" />,
  },
  {
    value: "activity",
    label: "Activity",
    icon: <Bell className="size-[25px]" strokeWidth={2.1} />,
  },
  {
    value: "more",
    label: "More",
    icon: <Ellipsis className="size-[25px]" strokeWidth={2.6} />,
  },
];

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

function StudioPage() {
  const [config, setConfig] = useState<LiquidGlassConfig>(DEFAULT_LIQUID_GLASS);
  const [more, setMore] = useState("dms");
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard
      ?.writeText(`glass={${JSON.stringify(config)}}`)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => undefined);
  };

  return (
    <DocPage
      description="Compose the bar's liquid glass exactly like the 2026 inspector. Press and drag along the bar to move the lens between tabs, then tune its material on the right. Every control maps to the live refraction engine."
      title="Studio"
    >
      <div className="mt-8 flex flex-col items-start gap-6 lg:flex-row">
        <div
          className="relative w-full max-w-[560px] overflow-hidden rounded-[26px] text-white"
          style={{ background: "#0e0e11" }}
        >
          <GlassTabBar
            accessory={<Search className="size-[23px]" />}
            accessoryLabel="Search"
            className="h-[440px] w-full"
            glass={config}
            items={ITEMS}
            onValueChange={setMore}
            value={more}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(130% 110% at 50% 18%, #36373f 0%, #202127 72%)",
              }}
            />
            <div className="relative px-6 pt-5">
              <div className="font-semibold text-[15px] text-white/60">
                Channels
              </div>
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
          </GlassTabBar>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto">
          <LiquidGlassInspector onChange={setConfig} value={config} />
          <div className="flex items-center gap-3 px-1">
            <button
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-medium text-[13px] text-foreground transition-colors hover:bg-accent"
              onClick={onCopy}
              type="button"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy config"}
            </button>
            <button
              className="inline-flex cursor-pointer items-center rounded-full px-3 py-2 font-medium text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setConfig(DEFAULT_LIQUID_GLASS)}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </DocPage>
  );
}

export { StudioPage };
