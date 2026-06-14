# Glass Button

> The circular iOS icon button and its text capsule sibling. A frosted glass disc blurs whatever sits behind it, and pressing squeezes the button with a gel response: the disc scales down and the tint clears while held.

## Install

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-button.json
# or, with the @lore-glass namespace registered:
npx shadcn@latest add @lore-glass/glass-button
```

## Props

### GlassButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"icon" \| "capsule"` | `"icon"` | icon renders a fixed-size disc, capsule a pill that grows with its label. |
| `size` | `number` | `44` | Disc diameter, or capsule height, in px. |
| `tint` | `number` | `0.2` | Glass tint from 0 (clear) to 1 (opaque). |
| `tintColor` | `string` | `theme` | Tint color as an r,g,b triple. |
| `...props` | `ComponentProps<"button">` | — | All native button props are forwarded. |

## Usage

```tsx
import { Bell, Ellipsis } from "@/components/docs/icons";
import { GlassButton } from "@/components/ui/glass-button";

function GlassButtonDemo({ tint }: { tint?: number }) {
  return (
    <div className="flex items-center justify-center gap-5">
      <GlassButton aria-label="More options" tint={tint}>
        <Ellipsis className="size-5" />
      </GlassButton>
      <GlassButton aria-label="Notifications" tint={tint}>
        <Bell className="size-5" />
      </GlassButton>
      <GlassButton tint={tint} variant="capsule">
        Continue
      </GlassButton>
    </div>
  );
}

export { GlassButtonDemo };
```
