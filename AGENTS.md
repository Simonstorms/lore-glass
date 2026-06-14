# AGENTS.md

Guidance for AI coding agents working with lore-glass, in this repo or in a project that consumes it.

## What this is

lore-glass is a family of Apple "Liquid Glass" components for React, installed as
source with the shadcn CLI (you own the files after install, like any shadcn
component). Everything is built on a cross-browser lens engine: an SVG
`feDisplacementMap` filter refracts live DOM, so text under the lens stays
selectable and links stay clickable.

- Live docs as plain text: https://loreglasses.com/llms.txt
- Everything (docs + full component source) in one file:
  https://loreglasses.com/llms-full.txt
- Per-component markdown: https://loreglasses.com/docs/components/{name}.md

## Requirements

- React 19 and Tailwind CSS v4.
- A project initialized with the shadcn CLI, so the `@/components` and `@/lib`
  aliases resolve.
- No runtime dependency is added. Components built on a headless primitive pull
  in `@base-ui/react` automatically.

## Installing a component

```bash
npx shadcn@latest add https://loreglasses.com/r/{name}.json
```

Or register the namespace once in the consumer's `components.json`, then add by
short name:

```json
{
  "registries": {
    "@lore-glass": "https://loreglasses.com/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @lore-glass/glass-popover
```

Every component depends on the `glass` package through a registry dependency, so
it installs automatically. Install names: `glass`, `glass-button`,
`glass-dialog`, `glass-input`, `glass-popover`, `glass-slider`, `glass-switch`,
`glass-tabs`, `glass-tooltip`.

## The two things that trip agents up

1. **The lens contract (core `glass`).** `Glass` refracts only its own children.
   Put the background *inside* `<Glass>` and pass each refracting region through
   the `lens` prop, marked with `data-glass-lens`. The engine tracks each lens
   region's position, size, and border radius every frame.

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

   To put glass *over* arbitrary app content the engine cannot reach (portals,
   the rest of the page), use `GlassSurface` (exported from the `glass` package)
   instead. The popover, dialog, tooltip, and input components already do this.

2. **Tailwind v4 transitions.** Tailwind v4 compiles `translate-x-*` and
   `scale-*` to the CSS `translate` and `scale` properties, not `transform`.
   Transition `translate`/`scale`, not `transform`, when animating a lens.

## Tint

Text-bearing components (button, popover, dialog, tooltip, input, tabs) take
`tint`, a number from 0 (ultra clear) to 1 (fully tinted), modeled on the iOS 27
Liquid Glass appearance slider. `tintColor` overrides the color as an `r,g,b`
triple. The switch and slider take no tint: their thumbs rest as solid platters
and only clear into a lens while pressed.

## Browser support

The lens refracts live DOM in every modern browser. On Safari, when `Glass`
wraps a single raster element (video, canvas, or image), it auto-switches to a
WebGL renderer that reproduces the same lens, since WebKit cannot run
`feDisplacementMap` over live `<video>`/`<canvas>`. Detection is automatic with
no API change. Force a path while developing with `?glassRenderer=webgl` or
`?glassRenderer=svg`.

## Working in this repo

- Components ship from `registry/default/<name>/`. The site mirrors them in
  `src/components/ui/` for the live demos.
- Edit component source in `registry/default/`, then run `bun run build:registry`
  (`shadcn build`) to regenerate `public/r/*.json`.
- Doc content lives as `ComponentDoc` objects in `src/docs/components/`. The
  AI artifacts (`public/llms.txt`, `public/llms-full.txt`,
  `public/docs/**/*.md`) are generated from them by
  `scripts/generate-llms.mjs`; run `bun run build:llms` after changing docs.
  The full `bun run build` runs registry, llms, and the Vite build in order.
- House rules: no comments in code, avoid the `any` type, avoid `useEffect`
  unless there is no better option, and no em dashes in prose.
