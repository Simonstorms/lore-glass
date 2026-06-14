# lore-glass

Apple's Liquid Glass for React, installable with the shadcn CLI. A cross-browser lens engine built on SVG `feDisplacementMap` refracts live DOM (text stays selectable, links stay clickable), and a family of components builds the iOS interactions on top: gel presses, velocity deformation, rubber-band overdrag, spring travel.

Docs and live demos: run `bun run dev`.

## Components

| Component | Install name | What it is |
| --- | --- | --- |
| Glass | `glass` | The core lens engine, the motion core, and the `GlassSurface` overlay primitive |
| Button | `glass-button` | The circular iOS icon button and a text capsule, with a press gel |
| Dialog | `glass-dialog` | Modal alert sheet on a glass panel with a materialize swell |
| Input | `glass-input` | iOS search bar in a glass capsule with a focus glow |
| Popover | `glass-popover` | The iOS context menu with icon, label, and sublabel rows |
| Slider | `glass-slider` | Handle lifts into a clear refracting lens while dragging |
| Switch | `glass-switch` | The iOS toggle with a lens thumb |
| Tabs | `glass-tabs` | Selection indicator as a spring-driven glass droplet |
| Tooltip | `glass-tooltip` | Frosted chip with provider delay grouping |

## Install

Requires Tailwind v4 and React 19 in a shadcn-initialized project.

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-popover.json
```

Swap `glass-popover` for any install name above. Components depend on the `glass` package through registry dependencies, so it installs automatically.

## Usage

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
</Glass>
```

`Glass` filters its children; every element marked `data-glass-lens` inside `lens` becomes a refracting region that tracks position, size, and border radius each frame. Key props: `scaleX`/`scaleY` (refraction strength), `depth` (edge falloff band), `domeDepth` (curvature), `splay`, `chroma`, `blur`, `glow`, `edgeHighlight`, `specularAngle`, `specularStrength`.

## Tint

Every text-bearing component (button, popover, dialog, tooltip, input, tabs) takes `tint`, a number from 0 (ultra clear) to 1 (fully tinted), modeled on the Liquid Glass appearance slider Apple shipped in iOS 27. Rising tint fades in a frosted backdrop, grows the blur, and softens the refraction; even fully tinted glass stays slightly translucent, and text on the glass never tints. `tintColor` overrides the tint color as an `r,g,b` triple; it defaults to white in light mode and a dark gray in dark mode. On the core engine, individual lenses can override it with `data-glass-tint`.

The switch and slider take no tint. Their thumbs rest as solid platters like the iOS originals and only clear into a lens while pressed.

## Overlay panels

Popover, dialog, tooltip, and input float over arbitrary app content, which the engine cannot refract (it bends its own children only). They render on `GlassSurface`: a frosted, tinted panel built from plain `backdrop-filter` blur and saturation, the same material iOS uses for menus and alerts. It renders identically in every browser. The alternative, wrapping your whole page in `Glass`, does not survive portals.

## Browser support

The lens engine refracts live DOM in every modern browser. WebKit (Safari) cannot run an SVG `feDisplacementMap` over a live `<video>` or `<canvas>`, so when `Glass` wraps a single raster element (video, canvas, or image) it automatically switches to a WebGL renderer on Safari that reproduces the same lens: the real element stays as the native base and a transparent canvas draws the refracted lens regions on top. Chromium keeps the SVG path everywhere. Detection is automatic, with no API change, and it gracefully falls back to the plain element if WebGL is unavailable.

The WebGL path covers refraction, chromatic aberration, specular and edge highlights, dome, splay, and per-lens overrides. The `blur` prop is not applied on it.

To exercise the WebGL path on any browser during development, load the page with `?glassRenderer=webgl` (or set `localStorage.glassRenderer = "webgl"`); `?glassRenderer=svg` forces the SVG path.

## Gotchas

- With `chroma` on, the refraction layer must be opaque or anti-aliased edges grow dark halos.
- Tailwind v4 compiles `translate-x-*` and `scale-*` to the `translate` and `scale` properties; transition those, not `transform`, when animating a lens.

## Credits

Huge thanks to the amazing, ridiculously skilled team at Aave Labs. Their write-up [Building Glass for the Web](https://aave.com/design/building-glass-for-the-web) lays out the `feDisplacementMap` technique this whole library is built on, the generated red/green displacement map, quadrant symmetry, chromatic fringing, the baked specular pass, and the Safari filter-id trick. This is an independent implementation, but the core idea and most of the hard-won details come from their work. Go read it.

Demo photos come from Pexels, free to use under the Pexels license.

## License

MIT
