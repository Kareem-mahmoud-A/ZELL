# ZELL Reusable UI Components Documentation

All components are located in `web/src/components/ui/` and layout files are in `web/src/components/layout/`. They are built with accessibility (WCAG 2.2 AA) and dark theme support.

## Base Elements

### Button (`button.tsx`)

- **Props**: `variant` (default, secondary, outline, destructive, ghost, link), `size` (default, sm, lg, icon), `isLoading` (boolean, triggers spinner and disables interactions).
- **Accessibility**: Includes focus outline ring, handles keyboard `Enter` / `Space`, disables properly.
- **Storybook**: Colocated stories in `button.stories.tsx`.

### Spinner (`spinner.tsx`)

- **Props**: `size` (sm, md, lg).
- **Accessibility**: ARIA role `status` with screen-reader only `Loading...` description.

---

## Form Elements

Form components support full `React Hook Form` integration by forwarding refs using `React.forwardRef`.

### Input (`input.tsx`)

- **Props**: Standard HTML input props, `label`, `error`, `helperText`.
- **Accessibility**: Screen reader safety using `aria-invalid` and `aria-describedby` pointing dynamically to helper text and error message IDs.

### Textarea (`textarea.tsx`)

- **Props**: Standard HTML textarea props, `label`, `error`, `helperText`.
- **Accessibility**: Same as `Input`.

### Select (`select.tsx`)

- **Props**: `options` array, `placeholder`, `label`, `error`, `helperText`.

### Checkbox (`checkbox.tsx`)

- **Props**: Standard checkbox properties, `label`, `error`.
- **Accessibility**: Uses standard checkbox state wrapped inside custom accessibility divs.

### Switch (`switch.tsx`)

- **Props**: Radix UI Switch Primitive root attributes, `label`.
- **Accessibility**: Built on top of Radix UI Switch for native WCAG ARIA toggles.

---

## Metadata & Card Containers

### Badge (`badge.tsx`)

- **Props**: `variant` (default, secondary, outline, destructive, success, warning).

### Chip (`chip.tsx`)

- **Props**: `label`, `onRemove` callback, `variant` (default, secondary, outline).

### Card (`card.tsx`)

- Includes compound subcomponents: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

---

## Headless Overlays & Navigation

### Dialog/Modal (`dialog.tsx`)

- Built on Radix Dialog. Supports focus traps, keyboard Esc close, and screen reader announcements.

### Drawer (`drawer.tsx`)

- Sliding sheet overlay. Supports `side` positioning (left, right, top, bottom). Used to drive the mobile menu sidebar.

### Accordion (`accordion.tsx`)

- Collapsible elements. Built on Radix Accordion with keyboard arrow controls.
