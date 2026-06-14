"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Glass, isSafariBrowser, useGlassDark } from "@/components/ui/glass";
import {
  MotionValue,
  prefersReducedMotion,
  SpringDriver,
} from "@/components/ui/glass-motion";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef } from "react";

const PAD_X = 40;
const PAD_Y = 80;
const INDICATOR_SPRING = { stiffness: 50, damping: 13 };
const DEFORM_SPRING = { stiffness: 66, damping: 9 };
const VELOCITY_SCALE = 0.134;
const DEFORM_CLAMP = 0.3;
const SQUEEZE_X = 0.3;
const STRETCH_X = 2;
const RATIO_Y = 4;

const BG1_LIGHT = "#faf9f9";
const BG1_DARK = "#100f0f";
const BORDER1_LIGHT = "#2e0f0f14";
const BORDER1_DARK = "#ffffff14";
const BODY_LIGHT = "#fff";
const BODY_DARK = "#100f0f";

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-3", className)}
      data-slot="tabs"
      {...props}
    />
  );
}

interface TabsListProps extends TabsPrimitive.List.Props {
  tint?: number;
}

function TabsList({
  className,
  children,
  tint = 0,
  ...props
}: TabsListProps) {
  const dark = useGlassDark();
  const safari = isSafariBrowser();
  const listRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);

  const cx = useRef(new MotionValue(0));
  const cy = useRef(new MotionValue(0));
  const hw = useRef(new MotionValue(0));
  const hh = useRef(new MotionValue(0));
  const deform = useRef(new MotionValue(0));
  const initialized = useRef(false);
  const frame = useRef(0);

  const apply = useCallback(() => {
    frame.current = 0;
    const marker = markerRef.current;
    if (!marker) {
      return;
    }
    const q = Math.max(0, deform.current.get());
    const widthFactor = 1 - q * (q > 0 ? SQUEEZE_X : STRETCH_X);
    const heightFactor = 1 + q * RATIO_Y;
    const w = Math.max(hw.current.get() * 2 * widthFactor, 0);
    const h = Math.max(hh.current.get() * 2 * heightFactor, 0);
    marker.style.width = `${w}px`;
    marker.style.height = `${h}px`;
    marker.style.borderRadius = `${Math.min(w, h) / 2}px`;
    marker.style.left = `${PAD_X + cx.current.get() - w / 2}px`;
    marker.style.top = `${PAD_Y + cy.current.get() - h / 2}px`;
  }, []);

  const schedule = useCallback(() => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(apply);
    }
  }, [apply]);

  const springTargets = useRef({ cx: 0, cy: 0, hw: 0, hh: 0 });
  const springDrivers = useRef<SpringDriver[] | null>(null);
  if (!springDrivers.current) {
    springDrivers.current = [
      new SpringDriver(cx.current, INDICATOR_SPRING, () => springTargets.current.cx),
      new SpringDriver(cy.current, INDICATOR_SPRING, () => springTargets.current.cy),
      new SpringDriver(hw.current, INDICATOR_SPRING, () => springTargets.current.hw),
      new SpringDriver(hh.current, INDICATOR_SPRING, () => springTargets.current.hh),
    ];
  }

  const deformDriver = useRef<SpringDriver | null>(null);
  if (!deformDriver.current) {
    deformDriver.current = new SpringDriver(
      deform.current,
      DEFORM_SPRING,
      () => {
        const list = listRef.current;
        const width = list
          ? list.getBoundingClientRect().width + 2 * PAD_X
          : 1;
        const vNorm = Math.abs(cx.current.getVelocity()) / Math.max(width, 1);
        return Math.min(DEFORM_CLAMP, Math.sqrt(vNorm) * VELOCITY_SCALE);
      },
      () => Math.abs(cx.current.getVelocity()) < 0.005
    );
  }

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!active) {
      return;
    }
    const listRect = list.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    const targets = springTargets.current;
    targets.cx = rect.left - listRect.left + rect.width / 2;
    targets.cy = rect.top - listRect.top + rect.height / 2;
    targets.hw = rect.width / 2;
    targets.hh = rect.height / 2;
    if (!initialized.current || prefersReducedMotion()) {
      initialized.current = true;
      cx.current.jump(targets.cx);
      cy.current.jump(targets.cy);
      hw.current.jump(targets.hw);
      hh.current.jump(targets.hh);
      apply();
      return;
    }
    for (const driver of springDrivers.current ?? []) {
      driver.start();
    }
    deformDriver.current?.start();
  }, [apply]);

  useEffect(() => {
    const subs = [
      cx.current.on(() => {
        schedule();
        deformDriver.current?.start();
      }),
      cy.current.on(schedule),
      hw.current.on(schedule),
      hh.current.on(schedule),
      deform.current.on(schedule),
    ];
    measure();
    const list = listRef.current;
    const observer = new MutationObserver(measure);
    if (list) {
      observer.observe(list, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-selected"],
      });
    }
    const resize = new ResizeObserver(() => {
      initialized.current = false;
      measure();
    });
    if (list) {
      resize.observe(list);
    }
    return () => {
      for (const off of subs) {
        off();
      }
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame.current);
      for (const driver of springDrivers.current ?? []) {
        driver.stop();
      }
      deformDriver.current?.stop();
    };
  }, [measure, schedule]);

  const config = dark
    ? {
        brightness: 0.06,
        specularAngle: 45,
        glow: 0.5,
        glowSpread: 0.3,
        glowExponent: 1.5,
        edgeHighlight: 0.6,
        edgeWidth: 1,
        edgeExponent: 1.5,
        specularDark: false,
      }
    : {
        brightness: -0.04,
        specularAngle: 28,
        glow: 0,
        glowSpread: 0.5,
        glowExponent: 3,
        edgeHighlight: 0.15,
        edgeWidth: 1.5,
        edgeExponent: 1,
        specularDark: true,
      };

  const pillStyle = {
    background: dark ? BG1_DARK : BG1_LIGHT,
    border: `1px solid ${dark ? BORDER1_DARK : BORDER1_LIGHT}`,
  };

  return (
    <TabsPrimitive.List
      className={cn("relative inline-flex rounded-full p-[2px]", className)}
      data-slot="tabs-list"
      ref={listRef}
      style={pillStyle}
      {...props}
    >
      <Glass
        chroma={0.1}
        className="pointer-events-none absolute z-0"
        depth={2.5}
        domeDepth={0}
        edgeExponent={config.edgeExponent}
        edgeHighlight={config.edgeHighlight}
        edgeWidth={config.edgeWidth}
        glow={config.glow}
        glowExponent={config.glowExponent}
        glowSpread={config.glowSpread}
        lens={
          <div className="absolute" data-glass-lens ref={markerRef}>
            <div
              className="absolute inset-0 rounded-[inherit]"
              style={{
                background: config.brightness >= 0 ? "#fff" : "#000",
                opacity: Math.abs(config.brightness),
              }}
            />
          </div>
        }
        reveal
        scaleX={0.045}
        scaleY={safari ? 0.075 : 0.025}
        specularAngle={config.specularAngle}
        specularDark={config.specularDark}
        specularStrength={1}
        splay={1}
        tint={tint}
        style={{
          left: -PAD_X,
          top: -PAD_Y,
          width: `calc(100% + ${2 * PAD_X}px)`,
          height: `calc(100% + ${2 * PAD_Y}px)`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: dark ? BODY_DARK : BODY_LIGHT }}
        />
      </Glass>
      <div className="relative z-10 flex">{children}</div>
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "inline-flex cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-full px-[13px] py-[10px] font-medium text-[#727274] text-sm leading-none transition-colors hover:text-[#5a5858] focus-visible:shadow-[0_0_0_2px_#9896ff] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-black dark:text-[#8f8e8e] dark:hover:text-[#bcbbbb] dark:data-[active]:text-white",
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
