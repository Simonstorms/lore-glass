import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://loreglasses.com";

const CONCEPTS = `## What it is

lore-glass is a family of Apple "Liquid Glass" components for React, installed
as source into your own project with the shadcn CLI. It is built on a
cross-browser lens engine: an SVG \`feDisplacementMap\` filter refracts live DOM
(text stays selectable, links stay clickable), and the components layer the iOS
interactions on top (gel presses, velocity deformation, rubber-band overdrag,
spring travel).

Requirements: Tailwind CSS v4 and React 19, in a project initialized with the
shadcn CLI (so the \`@/components\` and \`@/lib\` aliases resolve). No runtime
dependency is added; components that use a headless primitive pull in
\`@base-ui/react\`.

## Install

Every install command writes source files you own under \`@/components/ui\`.

\`\`\`bash
# By URL
npx shadcn@latest add ${SITE}/r/glass-popover.json

# Or register the namespace once in components.json, then add by name:
#   "registries": { "@lore-glass": "${SITE}/r/{name}.json" }
npx shadcn@latest add @lore-glass/glass-popover
\`\`\`

Components depend on the \`glass\` package through registry dependencies, so it
installs automatically. Swap the trailing name for any component below.

## The Glass engine and the lens contract

\`Glass\` filters its own children. Inside the \`lens\` prop, every element marked
\`data-glass-lens\` becomes a refracting region that tracks position, size, and
border radius each frame.

\`\`\`tsx
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
\`\`\`

Key props: \`scaleX\`/\`scaleY\` (refraction strength), \`depth\` (edge falloff band),
\`domeDepth\` (curvature), \`splay\`, \`chroma\`, \`blur\`, \`glow\`, \`edgeHighlight\`,
\`specularAngle\`, \`specularStrength\`. The engine bends only its own children, not
arbitrary page content behind it.

## Tint

Every text-bearing component (button, popover, dialog, tooltip, input, tabs)
takes \`tint\`, a number from 0 (ultra clear) to 1 (fully tinted), modeled on the
iOS 27 Liquid Glass appearance slider. Rising tint fades in a frosted backdrop,
grows the blur, and softens the refraction; even fully tinted glass stays
slightly translucent, and text on the glass never tints. \`tintColor\` overrides
the tint color as an \`r,g,b\` triple (defaults to white in light mode, dark gray
in dark mode). On the core engine, individual lenses override it with
\`data-glass-tint\`. The switch and slider take no tint: their thumbs rest as solid
platters and only clear into a lens while pressed.

## Overlay panels

Popover, dialog, tooltip, and input float over arbitrary app content, which the
engine cannot refract (it bends its own children only). They render on
\`GlassSurface\`: a frosted, tinted panel built from plain \`backdrop-filter\` blur
and saturation, the same material iOS uses for menus and alerts. It renders
identically in every browser. Wrapping your whole page in \`Glass\` does not
survive portals, so use \`GlassSurface\` for floating UI.

## Browser support

The lens engine refracts live DOM in every modern browser. WebKit (Safari)
cannot run an SVG \`feDisplacementMap\` over a live \`<video>\` or \`<canvas>\`, so when
\`Glass\` wraps a single raster element (video, canvas, or image) it automatically
switches to a WebGL renderer on Safari that reproduces the same lens. Detection
is automatic with no API change, and it falls back to the plain element if WebGL
is unavailable. The WebGL path covers refraction, chromatic aberration,
specular and edge highlights, dome, splay, and per-lens overrides; the \`blur\`
prop is not applied on it. Force a path during development with
\`?glassRenderer=webgl\` or \`?glassRenderer=svg\`.

## Gotchas

- With \`chroma\` on, the refraction layer must be opaque or anti-aliased edges
  grow dark halos.
- Tailwind v4 compiles \`translate-x-*\` and \`scale-*\` to the \`translate\` and
  \`scale\` properties; transition those, not \`transform\`, when animating a lens.`;

function cell(text) {
  return String(text ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function propsMarkdown(props) {
  if (!props?.length) return "";
  const blocks = props.map((section) => {
    const head = `### ${section.title}\n\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |`;
    const rows = section.rows
      .map(
        (row) =>
          `| \`${cell(row.name)}\` | \`${cell(row.type)}\` | ${
            row.defaultValue ? `\`${cell(row.defaultValue)}\`` : "—"
          } | ${cell(row.description)} |`
      )
      .join("\n");
    return `${head}\n${rows}`;
  });
  return `## Props\n\n${blocks.join("\n\n")}`;
}

function examplesMarkdown(examples) {
  if (!examples?.length) return "";
  const blocks = examples.map((ex) => {
    const desc = ex.description ? `\n${ex.description}\n` : "";
    return `### ${ex.title}\n${desc}\n\`\`\`tsx\n${ex.source.trim()}\n\`\`\``;
  });
  return `## Examples\n\n${blocks.join("\n\n")}`;
}

function componentMarkdown(doc) {
  const url = `${SITE}/r/${doc.registryName}.json`;
  const parts = [
    `# Glass ${doc.title === "Glass" ? "" : doc.title}`.trim(),
    `> ${doc.description}`,
    `## Install\n\n\`\`\`bash\nnpx shadcn@latest add ${url}\n# or, with the @lore-glass namespace registered:\nnpx shadcn@latest add @lore-glass/${doc.registryName}\n\`\`\``,
  ];
  if (doc.tintable && doc.tintNote) {
    parts.push(`## Tint\n\n${doc.tintNote}`);
  }
  const props = propsMarkdown(doc.props);
  if (props) parts.push(props);
  if (doc.demoSource) {
    parts.push(`## Usage\n\n\`\`\`tsx\n${doc.demoSource.trim()}\n\`\`\``);
  }
  const examples = examplesMarkdown(doc.examples);
  if (examples) parts.push(examples);
  return parts.join("\n\n") + "\n";
}

function sourceMarkdown(entry) {
  if (!entry?.files?.length) return "";
  const blocks = entry.files.map(
    (file) =>
      `#### \`${file.name}\`\n\n\`\`\`tsx\n${file.source.trim()}\n\`\`\``
  );
  return `## Source\n\n${blocks.join("\n\n")}`;
}

function llmsIndex(docs) {
  const lines = [
    "# lore-glass",
    "",
    "> Apple Liquid Glass components for React, installed as source with the shadcn CLI. A cross-browser SVG displacement-map lens refracts live DOM, and a family of components builds the iOS interactions on top.",
    "",
    "Install any component with `npx shadcn@latest add " +
      SITE +
      "/r/{name}.json`, or register the `@lore-glass` namespace in `components.json` (`\"registries\": { \"@lore-glass\": \"" +
      SITE +
      "/r/{name}.json\" }`) and add by name. Requires Tailwind v4 and React 19 in a shadcn-initialized project.",
    "",
    "## Components",
    "",
  ];
  for (const doc of docs) {
    lines.push(
      `- [${doc.title}](${SITE}/docs/components/${doc.slug}.md): ${doc.description} Install: \`@lore-glass/${doc.registryName}\``
    );
  }
  lines.push(
    "",
    "## Docs",
    "",
    `- [Concepts and installation](${SITE}/docs/installation.md): the lens contract, the tint model, overlay panels, browser support, and gotchas`,
    `- [Full text (everything in one file)](${SITE}/llms-full.txt): every component doc plus full component source`,
    "",
    "## Optional",
    "",
    `- [GitHub repository](https://github.com/Simonstorms/lore-glass)`,
    ""
  );
  return lines.join("\n");
}

async function main() {
  const server = await createServer({
    root: ROOT,
    logLevel: "warn",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const { DOCS } = await server.ssrLoadModule("/src/docs/registry-docs.ts");
    const { registryEntry } = await server.ssrLoadModule(
      "/src/docs/registry-source.ts"
    );

    const written = [];
    async function emit(relPath, content) {
      const full = resolve(ROOT, "public", relPath);
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, content, "utf8");
      written.push(`public/${relPath}`);
    }

    for (const doc of DOCS) {
      await emit(`docs/components/${doc.slug}.md`, componentMarkdown(doc));
    }

    await emit("docs/installation.md", `# Installation and concepts\n\n${CONCEPTS}\n`);
    await emit("llms.txt", llmsIndex(DOCS));

    const fullParts = [
      "# lore-glass: full documentation",
      "",
      "> Apple Liquid Glass components for React, installed as source with the shadcn CLI. This single file contains every component's docs and full source.",
      "",
      CONCEPTS,
      "",
      "---",
      "",
      "# Components",
    ];
    for (const doc of DOCS) {
      fullParts.push("", "---", "", componentMarkdown(doc).trim());
      const src = sourceMarkdown(registryEntry(doc.registryName));
      if (src) fullParts.push("", src);
    }
    await emit("llms-full.txt", fullParts.join("\n") + "\n");

    console.log(`Generated ${written.length} AI artifacts:`);
    for (const path of written) console.log(`  ${path}`);
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
