# Installation and concepts

## What it is

lore-glass is a family of Apple "Liquid Glass" components for React, installed
as source into your own project with the shadcn CLI. It is built on a
cross-browser lens engine: an SVG `feDisplacementMap` filter refracts live DOM
(text stays selectable, links stay clickable), and the components layer the iOS
interactions on top (gel presses, velocity deformation, rubber-band overdrag,
spring travel).

Requirements: Tailwind CSS v4 and React 19, in a project initialized with the
shadcn CLI (so the `@/components` and `@/lib` aliases resolve). No runtime
dependency is added; components that use a headless primitive pull in
`@base-ui/react`.

## Install

Every install command writes source files you own under `@/components/ui`.

```bash
# By URL
npx shadcn@latest add https://loreglasses.com/r/glass-popover.json

# Or register the namespace once in components.json, then add by name:
#   "registries": { "@lore-glass": "https://loreglasses.com/r/{name}.json" }
npx shadcn@latest add @lore-glass/glass-popover
```

Components depend on the `glass` package through registry dependencies, so it
installs automatically. Swap the trailing name for any component below.

## The Glass engine and the lens contract

`Glass` filters its own children. Inside the `lens` prop, every element marked
`data-glass-lens` becomes a refracting region that tracks position, size, and
border radius each frame.

```tsx
import { Glass } from "@/components/ui/glass";

<Glass
  className="absolute inset-0"
  tint={0.3}
  lens={
    <div
      data-glass-lens
      className="absolute top-10 left-10 h-24 w-32 rounded-3xl"
    />
  }
>
  <BackgroundContent />
</Glass>;
```

Key props: `scaleX`/`scaleY` (refraction strength), `depth` (edge falloff band),
`domeDepth` (curvature), `splay`, `chroma`, `blur`, `glow`, `edgeHighlight`,
`specularAngle`, `specularStrength`. The engine bends only its own children, not
arbitrary page content behind it.

## Tint

Every text-bearing component (button, popover, dialog, tooltip, input, tabs)
takes `tint`, a number from 0 (ultra clear) to 1 (fully tinted), modeled on the
iOS 27 Liquid Glass appearance slider. Rising tint fades in a frosted backdrop,
grows the blur, and softens the refraction; even fully tinted glass stays
slightly translucent, and text on the glass never tints. `tintColor` overrides
the tint color as an `r,g,b` triple (defaults to white in light mode, dark gray
in dark mode). On the core engine, individual lenses override it with
`data-glass-tint`. The switch and slider take no tint: their thumbs rest as solid
platters and only clear into a lens while pressed.

## Overlay panels

Popover, dialog, tooltip, and input float over arbitrary app content, which the
engine cannot refract (it bends its own children only). They render on
`GlassSurface`: a frosted, tinted panel built from plain `backdrop-filter` blur
and saturation, the same material iOS uses for menus and alerts. It renders
identically in every browser. Wrapping your whole page in `Glass` does not
survive portals, so use `GlassSurface` for floating UI.

## Browser support

The lens engine refracts live DOM in every modern browser. WebKit (Safari)
cannot run an SVG `feDisplacementMap` over a live `<video>` or `<canvas>`, so when
`Glass` wraps a single raster element (video, canvas, or image) it automatically
switches to a WebGL renderer on Safari that reproduces the same lens. Detection
is automatic with no API change, and it falls back to the plain element if WebGL
is unavailable. The WebGL path covers refraction, chromatic aberration,
specular and edge highlights, dome, splay, and per-lens overrides; the `blur`
prop is not applied on it. Force a path during development with
`?glassRenderer=webgl` or `?glassRenderer=svg`.

## Gotchas

- With `chroma` on, the refraction layer must be opaque or anti-aliased edges
  grow dark halos.
- Tailwind v4 compiles `translate-x-*` and `scale-*` to the `translate` and
  `scale` properties; transition those, not `transform`, when animating a lens.
