import { GlassTabBarDemo } from "@/docs/demos/glass-tab-bar-demo";
import glassTabBarDemoSource from "@/docs/demos/glass-tab-bar-demo.tsx?raw";
import type { ComponentDoc } from "@/docs/types";

const glassTabBarDoc: ComponentDoc = {
  slug: "glass-tab-bar",
  title: "Tab Bar",
  description:
    "An iOS 26 style liquid-glass bottom tab bar. It wraps your screen content and refracts it: the selected tab rests as a soft capsule and, on press, swells up out of the bar into a magnifying lens that lifts the icon, bends the content behind it, and fringes its edges with chromatic light. Press and drag along the bar and the lens follows.",
  registryName: "glass-tab-bar",
  demo: GlassTabBarDemo,
  demoMinHeight: 460,
  tintable: false,
  tintNote:
    "The bar renders as fixed dark liquid glass that refracts whatever you pass as children, so it has no tint slider.",
  props: [
    {
      title: "GlassTabBar",
      rows: [
        {
          name: "items",
          type: "{ value, label, icon }[]",
          defaultValue: "required",
          description: "The tabs to render, each with a value, label, and icon.",
        },
        {
          name: "children",
          type: "ReactNode",
          defaultValue: "undefined",
          description:
            "The screen content the bar overlays and refracts through its lens.",
        },
        {
          name: "value / defaultValue",
          type: "string",
          defaultValue: "first item",
          description: "Controlled and uncontrolled selected tab value.",
        },
        {
          name: "onValueChange",
          type: "(value) => void",
          defaultValue: "undefined",
          description: "Called with the new value when a tab is selected.",
        },
        {
          name: "accessory",
          type: "ReactNode",
          defaultValue: "undefined",
          description:
            "Optional trailing glass circle content, such as a search icon.",
        },
        {
          name: "onAccessoryClick",
          type: "() => void",
          defaultValue: "undefined",
          description: "Called when the trailing accessory circle is pressed.",
        },
      ],
    },
  ],
  demoSource: glassTabBarDemoSource,
};

export { glassTabBarDoc };
