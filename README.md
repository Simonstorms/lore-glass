# liquid-glass

A cross-browser liquid-glass lens for React, distributed as a [shadcn registry](https://ui.shadcn.com/docs/registry). The lens refracts a decorative layer, or a copy of your own content, through an SVG `feDisplacementMap`, with smooth edge falloff, chromatic aberration, and a specular highlight baked into the displacement map itself.

The refraction technique follows the approach Aave Labs describes in [Building Glass for the Web](https://aave.com/design/building-glass-for-the-web). This is an independent implementation of that publicly documented mechanic.

## Install

```bash
npx shadcn@latest add https://raw.githubusercontent.com/Simonstorms/liquid-glass/main/public/r/glass.json
```

Tabs with a glass lens indicator (Base UI):

```bash
npx shadcn@latest add https://raw.githubusercontent.com/Simonstorms/liquid-glass/main/public/r/glass-tabs.json
```

Requires Tailwind CSS v4 (the install adds `@utility` definitions to your global CSS) and React 19.

## Usage

The lens never bends your live content. It bends a dedicated refraction layer on top of it, so text stays crisp, selectable, and clickable.

```tsx
import { Glass } from "@/components/ui/glass";

<button className="glass-lens relative isolate rounded-full px-4 py-2">
  <Glass className="-z-10 absolute inset-0 rounded-full" />
  Save
</button>
```

For the full effect on a sliding selection pill, pass a highlighted copy of the underlying content as the `refraction` layer so the lens visibly bends it at the rim. See `glass-tabs.tsx` for the complete pattern: an opaque, counter-translated copy of the tab labels rides inside the lens while a spring moves the pill.

## How it works

1. A 128×128 displacement map is generated on a canvas, computing one quadrant and mirroring it four ways. Red and green channels encode X/Y displacement around a neutral 128. The magnitude is a linear ramp from the lens center gated by a Gaussian-CDF falloff over an inset rounded-rect SDF, so the center is perfectly flat and the bend concentrates in a `depth`-wide band at the rim.
2. The blue channel carries a baked specular field: a glow term along the `specularAngle` axis plus an edge-highlight rim. A color matrix decodes it into a white alpha mask that is additively composited over the refracted output.
3. Chromatic aberration runs three displacement passes at `1 + 0.2·chroma`, `1 + 0.1·chroma`, and base scale, isolates one channel from each, and recombines them with additive arithmetic composites.
4. The filter gets a fresh id on every regeneration, which forces Safari to re-evaluate cached filter output, and the map only regenerates when the lens changes shape, never when it merely moves.

## Props

| Prop               | Default | Meaning                                              |
| ------------------ | ------- | ---------------------------------------------------- |
| `strength`         | `10`    | Displacement scale in px (≈0.1 × lens width)         |
| `depth`            | `6`     | Width of the refraction band at the rim, px          |
| `chroma`           | `0.2`   | Chromatic aberration amount, 0 to 1                  |
| `blur`             | `0.5`   | Gaussian blur of the refraction layer, px            |
| `glow`             | `0.1`   | Specular glow strength, 0 to 1                       |
| `glowSpread`       | `1`     | Angular window of the glow                           |
| `glowExponent`     | `0.5`   | Glow falloff shape                                   |
| `edgeHighlight`    | `0.25`  | Rim highlight strength, 0 to 1                       |
| `edgeWidth`        | `3`     | Rim highlight width, px                              |
| `edgeExponent`     | `1.5`   | Rim highlight falloff shape                          |
| `specularStrength` | `1`     | Multiplier on the composited specular mask           |
| `specularAngle`    | `45`    | Light direction in degrees                           |
| `brightness`       | `0`     | White veil opacity over the lens, 0 to 1             |
| `lensRadius`       | `14`    | Corner radius of the lens shape, px                  |
| `refraction`       | sheen   | The layer the lens bends; defaults to a soft halo    |

## CSS utilities

The `glass` item also installs Tailwind v4 utilities: `glass-lens` (selection pills), `lens-depth` (extruded solid buttons), `glass` and `glass-strong` (popover and sheet surfaces), and `glass-chip` (floating toolbars and FABs).

## Gotchas

- The refraction layer must be opaque if you enable `chroma`. The three channel passes recombine additively, and partial alpha at anti-aliased edges triples into dark halos. Give the layer a solid background, as `glass-tabs` does.
- Tailwind v4 compiles `translate-x-*` to the standalone `translate` property. If you animate a lens indicator, transition `translate`, not `transform`.
- Safari caps the size of filter source graphics. Keep lenses control-sized.

## License

MIT
