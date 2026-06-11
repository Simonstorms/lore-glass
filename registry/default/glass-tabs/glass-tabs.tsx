"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Glass } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { Children, isValidElement, type ReactNode } from "react";

const SPRING =
  "duration-[400ms] ease-[linear(0,0.0653,0.2121,0.3862,0.5547,0.7,0.8153,0.9006,0.9592,0.9962,1.0169,1.0263,1.0283,1.0261,1.0218,1.0168,1.0121,1.0081,1.0049,1.0026,1)]";

function lensCopy(children: ReactNode): ReactNode {
  const items = Children.toArray(children);
  if (!items.every((item) => isValidElement(item))) {
    return null;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-0 left-0 inline-flex h-7 w-max items-center gap-1 bg-muted pl-1 transition-transform",
        SPRING,
        "translate-x-[calc(-1*var(--active-tab-left))]"
      )}
    >
      {items.map((item, i) => (
        <span
          className="inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 font-medium text-foreground text-xs"
          key={
            isValidElement<{ value?: string }>(item)
              ? (item.props.value ?? i)
              : i
          }
        >
          {isValidElement<{ children?: ReactNode }>(item)
            ? item.props.children
            : null}
        </span>
      ))}
    </span>
  );
}

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-3", className)}
      data-slot="tabs"
      {...props}
    />
  );
}

function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      className={cn(
        "relative inline-flex h-9 items-center gap-1 rounded-full bg-muted p-1 text-muted-foreground",
        className
      )}
      data-slot="tabs-list"
      {...props}
    >
      <TabsPrimitive.Indicator
        className={cn(
          "glass-lens pointer-events-none absolute top-1 bottom-1 left-0 z-20 rounded-full",
          "transition-[translate,width]",
          SPRING,
          "w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)]"
        )}
        data-slot="tabs-indicator"
      >
        <Glass
          blur={0}
          brightness={0.08}
          className="absolute inset-0 rounded-full"
          refraction={lensCopy(children)}
        />
      </TabsPrimitive.Indicator>
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative z-10 inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 font-medium text-muted-foreground text-xs ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:text-foreground",
        className
      )}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn(
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
