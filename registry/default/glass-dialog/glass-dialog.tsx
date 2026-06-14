"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { GlassSurface } from "@/components/ui/glass-surface";
import { cn } from "@/lib/utils";

const GlassDialog = DialogPrimitive.Root;
const GlassDialogTrigger = DialogPrimitive.Trigger;
const GlassDialogClose = DialogPrimitive.Close;

interface GlassDialogContentProps extends DialogPrimitive.Popup.Props {
  tint?: number;
  tintColor?: string;
}

function GlassDialogContent({
  tint = 0.75,
  tintColor,
  className,
  children,
  ...props
}: GlassDialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[8px] transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <DialogPrimitive.Popup
        className={cn(
          "-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 outline-none transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-out data-[starting-style]:scale-[0.85]",
          className
        )}
        {...props}
      >
        <GlassSurface blur={24} radius={28} tint={tint} tintColor={tintColor}>
          <div className="w-[min(calc(100vw-2rem),400px)] p-6 text-[#1d1d1f] dark:text-[#f5f5f7]">
            {children}
          </div>
        </GlassSurface>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function GlassDialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-semibold text-[17px] leading-snug tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function GlassDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1.5 text-[14px] leading-relaxed opacity-65", className)}
      {...props}
    />
  );
}

export {
  GlassDialog,
  GlassDialogClose,
  GlassDialogContent,
  GlassDialogDescription,
  GlassDialogTitle,
  GlassDialogTrigger,
};
export type { GlassDialogContentProps };
