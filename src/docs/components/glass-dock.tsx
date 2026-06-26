import { GlassDockDemo } from "@/docs/demos/glass-dock-demo";
import glassDockDemoSource from "@/docs/demos/glass-dock-demo.tsx?raw";
import type { ComponentDoc } from "@/docs/types";

const glassDockDoc: ComponentDoc = {
  slug: "glass-dock",
  title: "Dock",
  description:
    "A macOS-style liquid-glass application dock: a four-item glass bar built from the refraction engine. A glass lens springs under the highlighted item (hovered or selected), refracting the content beneath it, while the icons stay crisp on top. The whole dock can be dragged across the content it refracts.",
  registryName: "glass-dock",
  demo: GlassDockDemo,
  demoSource: glassDockDemoSource,
  props: [
    {
      title: "GlassDock",
      rows: [
        {
          name: "items",
          type: "{ id, label, icon, badge? }[]",
          defaultValue: "required",
          description:
            "Dock entries. Each has an id, a label, a stroked icon node, and an optional badge.",
        },
        {
          name: "value / defaultValue",
          type: "string",
          defaultValue: "first item",
          description: "Controlled and uncontrolled selected item id.",
        },
        {
          name: "onValueChange",
          type: "(id) => void",
          defaultValue: "undefined",
          description: "Called when the selected item changes.",
        },
        {
          name: "draggable",
          type: "boolean",
          defaultValue: "false",
          description:
            "Lets the user drag the whole dock across the content behind it.",
        },
        {
          name: "glass",
          type: "LiquidGlassConfig",
          defaultValue: "DEFAULT_LIQUID_GLASS",
          description:
            "Tunes the material: specular, blur, refraction { amount, thickness }, translucency, shadow.",
        },
      ],
    },
  ],
};

export { glassDockDoc };
