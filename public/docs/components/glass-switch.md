# Glass Switch

> The iOS toggle. The thumb rests as an opaque platter and lifts into a clear warping lens on press, deforms with drag velocity like gel, and rubber-bands when dragged past the ends. Holding it keeps the lens raised until you let go.

## Install

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-switch.json
# or, with the @lore-glass namespace registered:
npx shadcn@latest add @lore-glass/glass-switch
```

## Props

### GlassSwitch

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked / defaultChecked` | `boolean` | `false` | Controlled and uncontrolled state. |
| `onCheckedChange` | `(checked: boolean) => void` | `undefined` | Called when the state commits. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `name / value` | `string` | `undefined` | Form integration for the hidden checkbox. |
| `ariaLabel` | `string` | `undefined` | Accessible label for the hidden checkbox. |

## Usage

```tsx
import { ShowcaseCard } from "@/components/docs/showcase-card";
import { GlassSwitch } from "@/components/ui/glass-switch";

function GlassSwitchDemo() {
  return (
    <ShowcaseCard>
      <GlassSwitch ariaLabel="Enable" defaultChecked />
    </ShowcaseCard>
  );
}

export { GlassSwitchDemo };
```
