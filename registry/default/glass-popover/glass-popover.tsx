"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { GlassSurface } from "@/components/ui/glass-surface";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const GlassPopover = MenuPrimitive.Root;
const GlassPopoverTrigger = MenuPrimitive.Trigger;

interface GlassPopoverContentProps extends MenuPrimitive.Popup.Props {
  align?: MenuPrimitive.Positioner.Props["align"];
  side?: MenuPrimitive.Positioner.Props["side"];
  sideOffset?: number;
  tint?: number;
  tintColor?: string;
}

function GlassPopoverContent({
  align = "start",
  side = "bottom",
  sideOffset = 10,
  tint = 0.55,
  tintColor,
  className,
  children,
  ...props
}: GlassPopoverContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        className="z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          className={cn(
            "origin-[var(--transform-origin)] outline-none transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-out data-[starting-style]:scale-[0.6]",
            className
          )}
          {...props}
        >
          <GlassSurface
            blur={30}
            radius={26}
            tint={tint}
            tintColor={tintColor}
          >
            <div className="min-w-[230px] py-2.5">{children}</div>
          </GlassSurface>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

interface GlassPopoverItemProps extends MenuPrimitive.Item.Props {
  destructive?: boolean;
  icon?: ReactNode;
  label: string;
  sublabel?: string;
}

function GlassPopoverItem({
  destructive = false,
  icon,
  label,
  sublabel,
  className,
  ...props
}: GlassPopoverItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "mx-2.5 flex cursor-pointer select-none items-center gap-4 rounded-[14px] px-3 py-2.5 text-[#1d1d1f] outline-none data-[highlighted]:bg-black/8 dark:text-[#f5f5f7] dark:data-[highlighted]:bg-white/12",
        destructive && "text-[#e5484d] dark:text-[#ff6369]",
        className
      )}
      label={label}
      {...props}
    >
      {icon ? (
        <span className="inline-flex w-6 shrink-0 items-center justify-center [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[16px] leading-tight">{label}</span>
        {sublabel ? (
          <span className="truncate text-[13px] leading-tight opacity-55">
            {sublabel}
          </span>
        ) : null}
      </span>
    </MenuPrimitive.Item>
  );
}

function GlassPopoverSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      className={cn("mx-5 my-2 h-px bg-black/10 dark:bg-white/12", className)}
      {...props}
    />
  );
}

export {
  GlassPopover,
  GlassPopoverContent,
  GlassPopoverItem,
  GlassPopoverSeparator,
  GlassPopoverTrigger,
};
export type { GlassPopoverContentProps, GlassPopoverItemProps };
