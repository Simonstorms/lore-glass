# Glass Input

> An iOS search bar: a text field inside a frosted glass capsule with a leading icon slot. Focusing glows in a soft ring while the tint lifts slightly, so the field reads as raised glass while you type.

## Install

```bash
npx shadcn@latest add https://loreglasses.com/r/glass-input.json
# or, with the @lore-glass namespace registered:
npx shadcn@latest add @lore-glass/glass-input
```

## Props

### GlassInput

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `height` | `number` | `44` | Capsule height in px. The radius is always height / 2. |
| `icon` | `ReactNode` | `undefined` | Leading icon slot. |
| `tint` | `number` | `0.5` | Glass tint of the capsule from 0 (clear) to 1 (opaque). |
| `tintColor` | `string` | `theme` | Tint color as an r,g,b triple. |
| `inputClassName` | `string` | `undefined` | Classes for the inner input element. className styles the capsule. |
| `onValueChange` | `(value: string) => void` | `undefined` | Convenience change callback from Base UI Input, alongside the native onChange. |
| `...props` | `Input.Props` | — | All native input props are forwarded. |

## Usage

```tsx
import { Search } from "@/components/docs/icons";
import { GlassInput } from "@/components/ui/glass-input";

function GlassInputDemo({ tint }: { tint?: number }) {
  return (
    <GlassInput
      className="w-72"
      icon={<Search />}
      placeholder="Search components"
      tint={tint}
    />
  );
}

export { GlassInputDemo };
```
