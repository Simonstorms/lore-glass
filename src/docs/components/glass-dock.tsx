import { GlassDockDemo } from "@/docs/demos/glass-dock-demo";
import glassDockDemoSource from "@/docs/demos/glass-dock-demo.tsx?raw";
import type { ComponentDoc } from "@/docs/types";

const glassDockDoc: ComponentDoc = {
  slug: "glass-dock",
  title: "Dock",
  description:
    "A macOS-style liquid-glass application dock: an always-glass bar that refracts the content behind it, with crisp icons on top. The selected item rests as a soft pill; grab it and drag along the bar and it becomes a glass lens that refracts the backdrop as it slides, snapping to the nearest item (and turning back into a pill) on release.",
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
