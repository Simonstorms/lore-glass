# Glass Slider

> An iOS slider whose handle rests as a solid platter and lifts into a clear refracting lens while you drag, keeping the fill value readable through the glass. Overdragging rubber-bands past the ends, and a hidden native range input keeps it accessible.

## Install

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-slider.json
# or, with the @lore-glass namespace registered:
npx shadcn@latest add @lore-glass/glass-slider
```

## Props

### GlassSlider

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value / defaultValue` | `number` | `50` | Controlled and uncontrolled value. |
| `min / max` | `number` | `0 / 100` | Value range. |
| `step` | `number` | `1` | Snap increment. |
| `onValueChange` | `(value: number) => void` | `undefined` | Called with the snapped value while dragging. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `ariaLabel` | `string` | `"Value"` | Accessible label for the hidden range input. |

## Usage

```tsx
import { ShowcaseCard } from "@/components/docs/showcase-card";
import { GlassSlider } from "@/components/ui/glass-slider";

function GlassSliderDemo() {
  return (
    <ShowcaseCard>
      <GlassSlider ariaLabel="Volume" defaultValue={38} />
    </ShowcaseCard>
  );
}

export { GlassSliderDemo };
```
