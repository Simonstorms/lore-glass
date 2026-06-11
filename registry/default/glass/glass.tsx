"use client";

import { cn } from "@/lib/utils";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";

const MAP_SIZE = 128;
const SQRT_PI = 1.772_453_850_9;

interface MapParams {
  depth: number;
  edgeExponent: number;
  edgeStrength: number;
  edgeWidth: number;
  glowExponent: number;
  glowSpread: number;
  glowStrength: number;
  halfH: number;
  halfW: number;
  radius: number;
  specularAngle: number;
}

function roundedBoxSdf(
  ax: number,
  ay: number,
  halfW: number,
  halfH: number,
  r: number
): number {
  const dx = ax - halfW + r;
  const dy = ay - halfH + r;
  const ux = Math.max(dx, 0);
  const uy = Math.max(dy, 0);
  return Math.hypot(ux, uy) + Math.min(Math.max(dx, dy), 0) - r;
}

function specularField(
  d: number,
  falloff: number,
  sdf: number,
  p: MapParams,
  spreadStart: number,
  spreadRange: number
): number {
  let v = 0;
  if (p.glowStrength > 0 && spreadRange > 0.001) {
    const t = Math.min(1, Math.max(0, (d - spreadStart) / spreadRange));
    v += p.glowStrength * t ** p.glowExponent * falloff;
  }
  if (p.edgeStrength > 0) {
    const rim = sdf < 0 ? Math.max(0, 1 + sdf / p.edgeWidth) : 0;
    v += p.edgeStrength * rim * d ** p.edgeExponent;
  }
  return Math.min(1, v);
}

function generateLensMap(p: MapParams): string | null {
  if (p.halfW < 4 || p.halfH < 4) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = MAP_SIZE;
  canvas.height = MAP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const image = ctx.createImageData(MAP_SIZE, MAP_SIZE);
  const data = image.data;
  const r0 = Math.min(p.radius, p.halfW, p.halfH);
  const innerW = Math.max(p.halfW - p.depth, 0);
  const innerH = Math.max(p.halfH - p.depth, 0);
  const innerR = Math.min(r0, innerW, innerH);
  const invSigma = p.depth > 0 ? 1 / (p.depth * Math.SQRT2) : 1e6;
  const theta = (p.specularAngle * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const spreadStart = (1 - p.glowSpread) * Math.SQRT2;
  const spreadRange = p.glowSpread * Math.SQRT2;
  const half = MAP_SIZE / 2;
  const stepX = (2 * p.halfW) / MAP_SIZE;
  const stepY = (2 * p.halfH) / MAP_SIZE;
  const write = (
    col: number,
    row: number,
    rv: number,
    gv: number,
    bv: number
  ) => {
    const i = (row * MAP_SIZE + col) * 4;
    data[i] = rv;
    data[i + 1] = gv;
    data[i + 2] = bv;
    data[i + 3] = 255;
  };
  for (let row = 0; row < half; row++) {
    const py = p.halfH - (row + 0.5) * stepY;
    for (let col = 0; col < half; col++) {
      const px = p.halfW - (col + 0.5) * stepX;
      const mc = MAP_SIZE - 1 - col;
      const mr = MAP_SIZE - 1 - row;
      const sdf = roundedBoxSdf(px, py, p.halfW, p.halfH, r0);
      if (sdf >= 0) {
        write(col, row, 128, 128, 128);
        write(mc, row, 128, 128, 128);
        write(col, mr, 128, 128, 128);
        write(mc, mr, 128, 128, 128);
        continue;
      }
      const xN = Math.min(px / p.halfW, 1);
      const yN = Math.min(py / p.halfH, 1);
      const innerSdf = roundedBoxSdf(px, py, innerW, innerH, innerR);
      const f = 0.5 * (1 + Math.tanh(SQRT_PI * innerSdf * invSigma));
      const rv = Math.round((0.5 + 0.5 * xN * f) * 255);
      const gv = Math.round((0.5 + 0.5 * yN * f) * 255);
      const a = xN * cosT;
      const b = yN * sinT;
      const b1 = Math.round(
        127 *
          specularField(Math.abs(a + b), f, sdf, p, spreadStart, spreadRange) +
          128
      );
      const b2 = Math.round(
        127 *
          specularField(Math.abs(a - b), f, sdf, p, spreadStart, spreadRange) +
          128
      );
      write(col, row, rv, gv, b1);
      write(mc, row, 255 - rv, gv, b2);
      write(col, mr, rv, 255 - gv, b2);
      write(mc, mr, 255 - rv, 255 - gv, b1);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

interface GlassProps extends ComponentProps<"div"> {
  blur?: number;
  brightness?: number;
  chroma?: number;
  depth?: number;
  edgeExponent?: number;
  edgeHighlight?: number;
  edgeWidth?: number;
  glow?: number;
  glowExponent?: number;
  glowSpread?: number;
  lensRadius?: number;
  refraction?: ReactNode;
  specularAngle?: number;
  specularStrength?: number;
  strength?: number;
}

interface LensState {
  height: number;
  key: number;
  url: string;
  width: number;
}

const DEFAULT_REFRACTION_FILL =
  "radial-gradient(120% 120% at 50% 30%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.35) 95%)";

function Glass({
  strength = 10,
  depth = 6,
  chroma = 0.2,
  blur = 0.5,
  glow = 0.1,
  glowSpread = 1,
  glowExponent = 0.5,
  edgeHighlight = 0.25,
  edgeWidth = 3,
  edgeExponent = 1.5,
  specularStrength = 1,
  specularAngle = 45,
  brightness = 0,
  lensRadius = 14,
  refraction,
  className,
  children,
  ...props
}: GlassProps) {
  const filterBase = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const [lens, setLens] = useState<LensState | null>(null);
  const generation = useRef(0);
  const lastSize = useRef<{ w: number; h: number } | null>(null);

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || typeof ResizeObserver === "undefined") {
        return;
      }
      const regenerate = (w: number, h: number) => {
        const prev = lastSize.current;
        if (prev && Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1) {
          return;
        }
        lastSize.current = { w, h };
        const url = generateLensMap({
          halfW: w / 2,
          halfH: h / 2,
          radius: lensRadius,
          depth,
          glowStrength: glow,
          glowSpread,
          glowExponent,
          edgeStrength: edgeHighlight,
          edgeWidth,
          edgeExponent,
          specularAngle,
        });
        generation.current += 1;
        setLens(
          url ? { url, width: w, height: h, key: generation.current } : null
        );
      };
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        const box = entry.contentRect;
        regenerate(Math.round(box.width), Math.round(box.height));
      });
      observer.observe(node);
      regenerate(Math.round(node.clientWidth), Math.round(node.clientHeight));
      return () => {
        observer.disconnect();
        lastSize.current = null;
      };
    },
    [
      depth,
      edgeExponent,
      edgeHighlight,
      edgeWidth,
      glow,
      glowExponent,
      glowSpread,
      lensRadius,
      specularAngle,
    ]
  );

  const filterId = lens ? `${filterBase}-${lens.key}` : null;
  const source = blur > 0 ? "blurred" : "SourceGraphic";

  return (
    <div className={cn("relative", className)} ref={attach} {...props}>
      {children}
      {filterId && lens ? (
        <>
          <svg
            aria-hidden="true"
            className="absolute h-0 w-0"
            focusable="false"
          >
            <defs>
              <filter
                colorInterpolationFilters="sRGB"
                filterUnits="objectBoundingBox"
                height="100%"
                id={filterId}
                width="100%"
                x="0%"
                y="0%"
              >
                <feImage
                  height={lens.height}
                  href={lens.url}
                  preserveAspectRatio="none"
                  result="map"
                  width={lens.width}
                  x="0"
                  y="0"
                />
                {blur > 0 && (
                  <feGaussianBlur
                    in="SourceGraphic"
                    result="blurred"
                    stdDeviation={blur}
                  />
                )}
                {chroma > 0 ? (
                  <>
                    <feDisplacementMap
                      in={source}
                      in2="map"
                      result="dispR"
                      scale={strength * (1 + 0.2 * chroma)}
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                    <feColorMatrix
                      in="dispR"
                      result="chanR"
                      type="matrix"
                      values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    />
                    <feDisplacementMap
                      in={source}
                      in2="map"
                      result="dispG"
                      scale={strength * (1 + 0.1 * chroma)}
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                    <feColorMatrix
                      in="dispG"
                      result="chanG"
                      type="matrix"
                      values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    />
                    <feDisplacementMap
                      in={source}
                      in2="map"
                      result="dispB"
                      scale={strength}
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                    <feColorMatrix
                      in="dispB"
                      result="chanB"
                      type="matrix"
                      values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                    />
                    <feComposite
                      in="chanR"
                      in2="chanG"
                      k1="0"
                      k2="1"
                      k3="1"
                      k4="0"
                      operator="arithmetic"
                      result="chanRG"
                    />
                    <feComposite
                      in="chanRG"
                      in2="chanB"
                      k1="0"
                      k2="1"
                      k3="1"
                      k4="0"
                      operator="arithmetic"
                      result="refr"
                    />
                  </>
                ) : (
                  <feDisplacementMap
                    in={source}
                    in2="map"
                    result="refr"
                    scale={strength}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                )}
                {(glow > 0 || edgeHighlight > 0) && (
                  <>
                    <feColorMatrix
                      in="map"
                      result="spec"
                      type="matrix"
                      values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 -0.5019607843"
                    />
                    <feComposite
                      in="spec"
                      in2="refr"
                      k1="0"
                      k2={specularStrength}
                      k3="1"
                      k4="0"
                      operator="arithmetic"
                    />
                  </>
                )}
              </filter>
            </defs>
          </svg>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          >
            <div
              className="absolute inset-0 rounded-[inherit]"
              style={{ filter: `url(#${filterId})` }}
            >
              {refraction ?? (
                <div
                  className="absolute inset-0 rounded-[inherit]"
                  style={{ background: DEFAULT_REFRACTION_FILL }}
                />
              )}
            </div>
            {brightness > 0 && (
              <div
                className="absolute inset-0 rounded-[inherit] bg-white"
                style={{ opacity: brightness }}
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export { Glass };
