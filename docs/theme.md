# ZELL Design Tokens & Theme System Documentation

This document describes the design tokens, theme mappings, and configuration setup for the ZELL storefront UI.

## Color Tokens

We use custom HSL/HEX mappings defined inside `web/src/app/globals.css` and mapped via Tailwind CSS `@theme`.

### Brand Colors

- **Primary Violet/Purple**: `--color-primary-[50-950]`
  - Used for accent accents, premium highlights, and active states.
  - Core color is `primary-500` (`#8b5cf6`) to `primary-600` (`#7c3aed`).
- **Accent Rose**: `--color-accent-[50-950]`
  - Used for secondary highlights, decorative banners, and interest points.
  - Core color is `accent-500` (`#e11d48`).

### Functional Mappings

Tailwind styles dynamically map to CSS-equivalent tokens defined in `:root` (light mode) and `.dark` (dark mode) blocks:

| CSS Variable           | Light Theme | Dark Theme | Purpose                              |
| :--------------------- | :---------- | :--------- | :----------------------------------- |
| `--background`         | `#ffffff`   | `#09090b`  | Page background                      |
| `--foreground`         | `#09090b`   | `#fafafa`  | Primary text color                   |
| `--card`               | `#ffffff`   | `#09090b`  | Card container background            |
| `--primary`            | `#18181b`   | `#fafafa`  | Dominant primary button/accent BG    |
| `--primary-foreground` | `#fafafa`   | `#18181b`  | Text on primary BG                   |
| `--muted-foreground`   | `#71717a`   | `#a1a1aa`  | Low-emphasis helper/description text |
| `--border`             | `#e4e4e7`   | `#27272a`  | Layout line and grid divider         |
| `--destructive`        | `#ef4444`   | `#7f1d1d`  | Alert/Error actions                  |

---

## Typography

- **Sans-Serif Font**: `Geist Sans` (mapped to `--font-sans`), falls back to `Inter` and system sans-serif.
- **Monospace Font**: `Geist Mono` (mapped to `--font-mono`).

---

## Transition & Animations

All transitions are styled for luxury smooth responsiveness, utilizing:

- **Ease Spring**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for button popups and tooltips.
- **Ease In-Out Cubic**: `cubic-bezier(0.645, 0.045, 0.355, 1)` for smooth slide drawers and dialog overlays.
- **Accordion Animations**: Custom dynamic height animations for Radix Accordions.
