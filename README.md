# lore-glass

A liquid-glass lens for React, installable via the shadcn CLI. It refracts a decorative layer (or a copy of your content) through an SVG `feDisplacementMap`, with edge falloff, chromatic aberration, and a baked specular highlight. Works in every modern browser.

The technique follows Aave Labs' [Building Glass for the Web](https://aave.com/design/building-glass-for-the-web). This is an independent implementation.

## Install

```bash
npx shadcn@latest add https://raw.githubusercontent.com/Simonstorms/lore-glass/main/public/r/glass.json
```

Tabs with a glass lens indicator:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/Simonstorms/lore-glass/main/public/r/glass-tabs.json
```

Requires Tailwind v4 and React 19.

## Usage

```tsx
import { Glass } from "@/components/ui/glass";

<button className="glass-lens relative isolate rounded-full px-4 py-2">
  <Glass className="-z-10 absolute inset-0 rounded-full" />
  Save
</button>
```

The lens never bends live content, so text stays crisp and clickable. For the full effect on a sliding selection pill, pass an opaque highlighted copy of the underlying content as `refraction`; `glass-tabs.tsx` shows the complete pattern.

Key props: `strength` (bend in px, ~0.1 × lens width), `depth` (rim band width), `chroma`, `glow`, `edgeHighlight`, `specularAngle`, `lensRadius`, `refraction`. Also installs the CSS utilities `glass-lens`, `lens-depth`, `glass`, `glass-strong`, and `glass-chip`.

## Gotchas

- With `chroma` on, the refraction layer must be opaque or anti-aliased edges grow dark halos.
- Tailwind v4 compiles `translate-x-*` to the `translate` property; transition `translate`, not `transform`, when animating a lens.

## License

MIT
