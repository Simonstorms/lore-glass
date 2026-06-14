# Glass Tabs

> Base UI tabs where the selection indicator is a glass lens. It springs between options, stretching like a droplet with velocity, and sits behind the crisp labels so they stay perfectly legible while it slides.

## Install

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-tabs.json
# or, with the @lore-glass namespace registered:
npx shadcn@latest add @lore-glass/glass-tabs
```

## Props

### Tabs

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value / defaultValue` | `string` | `undefined` | Controlled and uncontrolled selected tab. |
| `onValueChange` | `(value) => void` | `undefined` | Called when the selection changes. |

### TabsList

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tint` | `number` | `0` | Glass tint of the selection lens from 0 (clear) to 1 (opaque). |

### TabsTrigger

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | `required` | Tab identifier this trigger selects. |

## Usage

```tsx
import { Chart, Gear, Grid, House } from "@/components/docs/icons";
import { ShowcaseCard } from "@/components/docs/showcase-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/glass-tabs";

const ITEMS = [
  { value: "home", label: "Home", Icon: House },
  { value: "library", label: "Library", Icon: Grid },
  { value: "stats", label: "Stats", Icon: Chart },
  { value: "settings", label: "Settings", Icon: Gear },
];

function GlassTabsDemo({ tint }: { tint?: number }) {
  return (
    <ShowcaseCard>
      <Tabs defaultValue="home">
        <TabsList tint={tint}>
          {ITEMS.map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon className="size-[18px]" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </ShowcaseCard>
  );
}

export { GlassTabsDemo };
```
