"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { GlassSurface } from "@/components/ui/glass-surface";
import { cn } from "@/lib/utils";

const GlassTooltipProvider = TooltipPrimitive.Provider;
const GlassTooltip = TooltipPrimitive.Root;
const GlassTooltipTrigger = TooltipPrimitive.Trigger;

interface GlassTooltipContentProps extends TooltipPrimitive.Popup.Props {
  align?: TooltipPrimitive.Positioner.Props["align"];
  side?: TooltipPrimitive.Positioner.Props["side"];
  sideOffset?: number;
  tint?: number;
  tintColor?: string;
}

function GlassTooltipContent({
  align = "center",
  side = "top",
  sideOffset = 8,
  tint = 0.6,
  tintColor,
  className,
  children,
  ...props
}: GlassTooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        className="z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          className={cn(
            "origin-[var(--transform-origin)] transition-[scale,opacity] duration-200 ease-[cubic-bezier(0.34,1.3,0.64,1)] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:duration-100 data-[starting-style]:scale-75",
            className
          )}
          {...props}
        >
          <GlassSurface
            blur={12}
            radius={999}
            tint={tint}
            tintColor={tintColor}
          >
            <span className="block whitespace-nowrap px-3.5 py-2 font-medium text-[#1d1d1f] text-[13px] leading-none dark:text-[#f5f5f7]">
              {children}
            </span>
          </GlassSurface>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export {
  GlassTooltip,
  GlassTooltipContent,
  GlassTooltipProvider,
  GlassTooltipTrigger,
};
export type { GlassTooltipContentProps };
