import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
} from "react";
import type {
  GlassMode,
  GlassSpecular,
  LiquidGlassConfig,
  ShadowTone,
} from "@/components/ui/glass-tab-bar";

const PANEL_BG = "#e8e8eb";
const ROW_LINE = "rgba(0,0,0,0.08)";
const LABEL_COL = "#1b1b1f";
const ICON_COL = "#3a3a40";
const CHIP_BG = "#fdfdfd";
const CHIP_BORDER = "rgba(0,0,0,0.1)";
const ACCENT = "#2f7bff";
const TRACK_OFF = "#c7c7cc";

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function Chevrons() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
    >
      <path
        d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3"
        stroke={ICON_COL}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ModeGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <circle cx="12" cy="12" r="8.2" stroke={ICON_COL} strokeWidth="1.5" />
      <circle cx="9.5" cy="10" fill={ICON_COL} r="1" />
      <circle cx="14" cy="9.5" fill={ICON_COL} r="1" />
      <circle cx="13" cy="14.5" fill={ICON_COL} r="1" />
    </svg>
  );
}

function SpecularGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <rect
        height="13"
        rx="4.5"
        stroke={ICON_COL}
        strokeWidth="1.5"
        width="17"
        x="3.5"
        y="5.5"
      />
      <path
        d="M7.5 8.5h9"
        stroke={ICON_COL}
        strokeLinecap="round"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BlurGlyph() {
  const dots: ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      dots.push(
        <circle
          cx={5 + c * 4.5}
          cy={5 + r * 4.5}
          fill={ICON_COL}
          key={`${r}-${c}`}
          opacity={0.35 + 0.5 * ((r + c) / 6)}
          r="1"
        />
      );
    }
  }
  return (
    <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
      {dots}
    </svg>
  );
}

function RefractionGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <circle cx="9.5" cy="12" r="6.2" stroke={ICON_COL} strokeWidth="1.5" />
      <circle cx="14.5" cy="12" r="6.2" stroke={ICON_COL} strokeWidth="1.5" />
    </svg>
  );
}

function TranslucencyGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path
        d="M5 8.5h14M5 12h14M5 15.5h14"
        stroke={ICON_COL}
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ShadowGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <rect
        height="13"
        rx="4.5"
        stroke={ICON_COL}
        strokeWidth="1.5"
        width="14"
        x="4"
        y="4.5"
      />
      <path
        d="M8 20.5h11a2 2 0 0 0 2-2v-9"
        stroke={ICON_COL}
        strokeLinecap="round"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArcGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 18 16" width="18">
      <path
        d="M2 13c0-4.4 3.1-8 7-8s7 3.6 7 8"
        stroke={ICON_COL}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RulerGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 18" width="16">
      <path
        d="M8 2v14M8 2 5.5 4.5M8 2l2.5 2.5M8 16l-2.5-2.5M8 16l2.5-2.5"
        stroke={ICON_COL}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path d="M3 6.5h2M3 9h2M3 11.5h2" stroke={ICON_COL} strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

function ResetGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3L3 6.5M3 3v3.5h3.5"
        stroke={ICON_COL}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className="relative inline-flex h-[28px] w-[48px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
      onClick={() => onChange(!checked)}
      role="switch"
      style={{ background: checked ? ACCENT : TRACK_OFF }}
      type="button"
    >
      <span
        className="absolute h-[23px] w-[23px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200"
        style={{ transform: `translateX(${checked ? 22 : 3}px)` }}
      />
    </button>
  );
}

function Dropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  onChange: (next: T) => void;
  options: { label: string; value: T }[];
  value: T;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative inline-flex items-center">
      <span className="pr-[22px] font-semibold text-[16px]" style={{ color: LABEL_COL }}>
        {current?.label ?? value}
      </span>
      <span className="pointer-events-none absolute right-0">
        <Chevrons />
      </span>
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => onChange(e.target.value as T)}
        value={value}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ValueChip({
  icon,
  text,
  trailingIcon,
}: {
  icon?: ReactNode;
  text: string;
  trailingIcon?: ReactNode;
}) {
  return (
    <div
      className="flex h-[34px] items-center justify-between gap-2 rounded-[10px] px-3"
      style={{
        background: CHIP_BG,
        border: `1px solid ${CHIP_BORDER}`,
        boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
      }}
    >
      <span className="flex items-center">{icon}</span>
      <span
        className="font-semibold text-[15px] tabular-nums"
        style={{ color: LABEL_COL }}
      >
        {text}
      </span>
      {trailingIcon ? <span className="flex items-center">{trailingIcon}</span> : null}
    </div>
  );
}

function ScrubChip({
  value,
  min = 0,
  max = 100,
  onChange,
  icon,
  trailingIcon,
}: {
  icon?: ReactNode;
  max?: number;
  min?: number;
  onChange: (next: number) => void;
  trailingIcon?: ReactNode;
  value: number;
}) {
  const start = useRef<{ v: number; x: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    start.current = { x: e.clientX, v: value };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) {
      return;
    }
    const delta = ((e.clientX - start.current.x) * (max - min)) / 200;
    onChange(clamp(Math.round(start.current.v + delta), min, max));
  };
  const onPointerUp = () => {
    start.current = null;
  };
  return (
    <div
      className="flex h-[34px] cursor-ew-resize touch-none select-none items-center justify-between gap-2 rounded-[10px] px-3"
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        background: CHIP_BG,
        border: `1px solid ${CHIP_BORDER}`,
        boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
      }}
    >
      {icon ? <span className="flex items-center">{icon}</span> : null}
      <span
        className="font-semibold text-[15px] tabular-nums"
        style={{ color: LABEL_COL }}
      >
        {Math.round(value)} %
      </span>
      {trailingIcon ? <span className="flex items-center">{trailingIcon}</span> : null}
    </div>
  );
}

function RefractionPad({
  amount,
  thickness,
  onChange,
}: {
  amount: number;
  onChange: (amount: number, thickness: number) => void;
  thickness: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const setFromEvent = (clientX: number, clientY: number) => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    onChange(
      Math.round(x * 1000) / 10,
      Math.round((1 - y) * 1000) / 10
    );
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromEvent(e.clientX, e.clientY);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) {
      setFromEvent(e.clientX, e.clientY);
    }
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const ticksV: ReactNode[] = [];
  for (let i = 1; i < 10; i++) {
    const len = i === 5 ? 14 : 7;
    ticksV.push(
      <line
        key={`v-${i}`}
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="1.3"
        x1={50 - len / 2}
        x2={50 + len / 2}
        y1={`${i * 10}%`}
        y2={`${i * 10}%`}
      />
    );
  }
  const ticksH: ReactNode[] = [];
  for (let i = 1; i < 20; i++) {
    const len = i % 5 === 0 ? 9 : 5;
    ticksH.push(
      <line
        key={`h-${i}`}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.1"
        x1={`${i * 5}%`}
        x2={`${i * 5}%`}
        y1={100}
        y2={100 - len}
      />
    );
  }

  return (
    <div
      className="relative aspect-[1.55/1] w-full cursor-crosshair touch-none select-none overflow-hidden rounded-[12px]"
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      ref={ref}
      style={{
        background: "#d8d8dd",
        border: `1.5px solid ${ACCENT}`,
      }}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        <g style={{ transform: "translateZ(0)" }}>{ticksV}</g>
        {ticksH}
      </svg>
      <span
        className="absolute h-[15px] w-[15px] rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
        style={{
          left: `${amount}%`,
          top: `${100 - thickness}%`,
          transform: "translate(-50%, -50%)",
          background: ACCENT,
        }}
      />
    </div>
  );
}

function Row({
  glyph,
  label,
  control,
  divider = true,
}: {
  control: ReactNode;
  divider?: boolean;
  glyph: ReactNode;
  label: string;
}) {
  return (
    <div
      className="flex min-h-[56px] items-center gap-3 px-4"
      style={divider ? { borderTop: `1px solid ${ROW_LINE}` } : undefined}
    >
      <span className="flex w-[22px] shrink-0 items-center justify-center">
        {glyph}
      </span>
      <span
        className="flex-1 font-semibold text-[17px]"
        style={{ color: LABEL_COL }}
      >
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-2">{control}</div>
    </div>
  );
}

const MODE_OPTIONS: { label: string; value: GlassMode }[] = [
  { label: "Individual", value: "individual" },
  { label: "Combined", value: "combined" },
];
const SPECULAR_OPTIONS: { label: string; value: GlassSpecular }[] = [
  { label: "Inside", value: "inside" },
  { label: "Outside", value: "outside" },
  { label: "None", value: "none" },
];
const SHADOW_OPTIONS: { label: string; value: ShadowTone }[] = [
  { label: "Neutral", value: "neutral" },
  { label: "Warm", value: "warm" },
  { label: "Cool", value: "cool" },
];

const PRESETS: { config: LiquidGlassConfig; label: string }[] = [
  {
    label: "Default",
    config: {
      mode: "individual",
      specular: "inside",
      blur: { enabled: false, value: 0 },
      refraction: { enabled: true, amount: 20.2, thickness: 15.9 },
      translucency: { enabled: true, value: 0 },
      shadow: { tone: "neutral", value: 22 },
    },
  },
  {
    label: "Clear",
    config: {
      mode: "individual",
      specular: "inside",
      blur: { enabled: false, value: 0 },
      refraction: { enabled: true, amount: 34, thickness: 28 },
      translucency: { enabled: true, value: 4 },
      shadow: { tone: "neutral", value: 18 },
    },
  },
  {
    label: "Frosted",
    config: {
      mode: "individual",
      specular: "inside",
      blur: { enabled: true, value: 80 },
      refraction: { enabled: true, amount: 14, thickness: 22 },
      translucency: { enabled: true, value: 32 },
      shadow: { tone: "neutral", value: 30 },
    },
  },
  {
    label: "Chromatic",
    config: {
      mode: "individual",
      specular: "outside",
      blur: { enabled: false, value: 0 },
      refraction: { enabled: true, amount: 52, thickness: 40 },
      translucency: { enabled: true, value: 6 },
      shadow: { tone: "cool", value: 26 },
    },
  },
];

function matchPreset(config: LiquidGlassConfig): string {
  const found = PRESETS.find(
    (p) => JSON.stringify(p.config) === JSON.stringify(config)
  );
  return found?.label ?? "Custom";
}

function LiquidGlassInspector({
  value,
  onChange,
}: {
  onChange: (next: LiquidGlassConfig) => void;
  value: LiquidGlassConfig;
}) {
  return (
    <div
      className="w-full max-w-[360px] overflow-hidden rounded-[22px] pb-2"
      style={{
        background: PANEL_BG,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 40px rgba(0,0,0,0.18)",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span
          className="font-semibold text-[15px] tracking-[0.01em]"
          style={{ color: "#6b6b70" }}
        >
          Liquid Glass
        </span>
        <div className="relative inline-flex items-center" style={{ color: "#6b6b70" }}>
          <span className="pr-[20px] font-medium text-[15px]">
            {matchPreset(value)}
          </span>
          <span className="pointer-events-none absolute right-0">
            <Chevrons />
          </span>
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              const preset = PRESETS.find((p) => p.label === e.target.value);
              if (preset) {
                onChange(preset.config);
              }
            }}
            value={matchPreset(value)}
          >
            {matchPreset(value) === "Custom" ? (
              <option value="Custom">Custom</option>
            ) : null}
            {PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Row
        control={
          <Dropdown
            onChange={(mode) => onChange({ ...value, mode })}
            options={MODE_OPTIONS}
            value={value.mode}
          />
        }
        divider={false}
        glyph={<ModeGlyph />}
        label="Mode"
      />

      <Row
        control={
          <Dropdown
            onChange={(specular) => onChange({ ...value, specular })}
            options={SPECULAR_OPTIONS}
            value={value.specular}
          />
        }
        glyph={<SpecularGlyph />}
        label="Specular"
      />

      <Row
        control={
          <>
            <Toggle
              checked={value.blur.enabled}
              onChange={(enabled) =>
                onChange({ ...value, blur: { ...value.blur, enabled } })
              }
            />
            <div className="w-[78px]">
              <ScrubChip
                onChange={(v) =>
                  onChange({ ...value, blur: { ...value.blur, value: v } })
                }
                value={value.blur.value}
              />
            </div>
          </>
        }
        glyph={<BlurGlyph />}
        label="Blur"
      />

      <div style={{ borderTop: `1px solid ${ROW_LINE}` }}>
        <div className="flex min-h-[56px] items-center gap-3 px-4">
          <span className="flex w-[22px] shrink-0 items-center justify-center">
            <RefractionGlyph />
          </span>
          <span
            className="flex-1 font-semibold text-[17px]"
            style={{ color: LABEL_COL }}
          >
            Refraction
          </span>
          <Toggle
            checked={value.refraction.enabled}
            onChange={(enabled) =>
              onChange({
                ...value,
                refraction: { ...value.refraction, enabled },
              })
            }
          />
        </div>
        {value.refraction.enabled ? (
          <div className="flex items-stretch gap-3 px-4 pb-4">
            <div className="flex-1">
              <RefractionPad
                amount={value.refraction.amount}
                onChange={(amount, thickness) =>
                  onChange({
                    ...value,
                    refraction: { ...value.refraction, amount, thickness },
                  })
                }
                thickness={value.refraction.thickness}
              />
            </div>
            <div className="flex w-[104px] flex-col justify-center gap-2">
              <ValueChip
                icon={<ArcGlyph />}
                text={`${value.refraction.amount.toFixed(1)} %`}
              />
              <ValueChip
                icon={<RulerGlyph />}
                text={`${value.refraction.thickness.toFixed(1)} %`}
              />
            </div>
          </div>
        ) : null}
      </div>

      <Row
        control={
          <>
            <Toggle
              checked={value.translucency.enabled}
              onChange={(enabled) =>
                onChange({
                  ...value,
                  translucency: { ...value.translucency, enabled },
                })
              }
            />
            <div className="w-[92px]">
              <ScrubChip
                onChange={(v) =>
                  onChange({
                    ...value,
                    translucency: { ...value.translucency, value: v },
                  })
                }
                trailingIcon={
                  <button
                    aria-label="Reset translucency"
                    className="flex cursor-pointer items-center"
                    onClick={() =>
                      onChange({
                        ...value,
                        translucency: { ...value.translucency, value: 0 },
                      })
                    }
                    type="button"
                  >
                    <ResetGlyph />
                  </button>
                }
                value={value.translucency.value}
              />
            </div>
          </>
        }
        glyph={<TranslucencyGlyph />}
        label="Translucency"
      />

      <Row
        control={
          <>
            <Dropdown
              onChange={(tone) =>
                onChange({ ...value, shadow: { ...value.shadow, tone } })
              }
              options={SHADOW_OPTIONS}
              value={value.shadow.tone}
            />
            <div className="w-[72px]">
              <ScrubChip
                onChange={(v) =>
                  onChange({ ...value, shadow: { ...value.shadow, value: v } })
                }
                value={value.shadow.value}
              />
            </div>
          </>
        }
        glyph={<ShadowGlyph />}
        label="Shadow"
      />
    </div>
  );
}

export { LiquidGlassInspector };
