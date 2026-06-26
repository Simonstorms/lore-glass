import { GlassDockDemo } from "@/docs/demos/glass-dock-demo";
import glassDockDemoSource from "@/docs/demos/glass-dock-demo.tsx?raw";
import type { ComponentDoc } from "@/docs/types";

const glassDockDoc: ComponentDoc = {
  slug: "glass-dock",
  title: "Dock",
  description:
    "A macOS-style liquid-glass application dock: a four-item bar with a glass lens that springs under the selected item and magnifies its icon and label through the refraction engine. Tap an item or grab the lens and drag it along the bar; it snaps to the nearest item on release. The other items stay crisp until the lens passes over them.",
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
