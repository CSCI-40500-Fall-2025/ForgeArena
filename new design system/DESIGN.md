# ForgeArena Design System

Single source of truth for the ForgeArena UI. Use these tokens and patterns for all screens.

## Colors

| Token | Value | Tailwind | Usage |
|-------|--------|----------|--------|
| primary | `#0d59f2` | `primary` | CTAs, links, active nav, focus rings |
| background-light | `#f5f6f8` | `background-light` | Light mode page/surface |
| background-dark | `#101622` | `background-dark` | Dark mode page/surface |
| text-primary (light) | `#0d121c` | — | Body text light mode |
| text-muted | `#49659c` | `text-muted` (theme) or `text-[#49659c]` | Secondary text, placeholders |
| surface-dark | `#2d3748` | `surface-dark` (theme) or `dark:bg-[#2d3748]` | Dark mode cards/panels |
| border-light | `#e7ebf4` | — | Light borders; dark use `slate-800` |
| common | `#94A3B8` | `common` | Rarity border (common items) |
| rare | `#0d59f2` | `rare` | Rarity border (rare items) |
| legendary | `#F59E0B` | `legendary` | Rarity border (legendary items) |

## Typography

- **Font**: Inter for all UI (`font-display` / `sans`).
- **Icons**: Material Symbols Outlined; load via Google Fonts. Use `material-symbols-outlined` class with variation settings `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`.
- **Conventions**: Section titles `text-xl font-bold` or `text-2xl font-bold`; page titles `text-3xl font-black tracking-tight`; body `text-sm`; labels `text-xs font-bold uppercase` or `text-[10px] font-bold uppercase`.

## Spacing and radius

- Use Tailwind’s default spacing scale.
- **Border radius**: `DEFAULT` 0.25rem, `lg` 0.5rem, `xl` 0.75rem, `full` 9999px. Cards and panels: `rounded-xl`.

## Components

- **Sidebar**: `w-64`, fixed, `bg-white dark:bg-background-dark`, `border-r border-gray-200 dark:border-slate-800`. Logo + nav; active nav item: `bg-primary/10 text-primary font-semibold`. Inactive: `text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800`.
- **Header**: Sticky, border-b, title + optional XP bar (Level label, progress bar `bg-primary`, “XP to next level” text). Actions: notification icon, primary CTA (e.g. “Level Up”).
- **Cards**: `rounded-xl`, `border border-gray-100 dark:border-slate-800`, `shadow-sm`, `bg-white dark:bg-slate-900` (or `dark:bg-background-dark` where appropriate).
- **Buttons**: Primary: `bg-primary text-white` + `rounded-lg` + `font-bold` + `shadow-lg shadow-primary/20 hover:bg-primary/90`. Secondary: border or `bg-slate-100` with `hover:bg-slate-200` / `hover:border-primary hover:text-primary`.

## Dark mode

- **Strategy**: Class-based (`darkMode: "class"` in Tailwind). Toggle `dark` on `<html>`.
- **Surfaces**: Page `dark:bg-background-dark`; cards/panels `dark:bg-slate-900` or `dark:bg-[#2d3748]`; inputs `dark:bg-slate-800 dark:border-slate-700`.
- **Borders**: `dark:border-slate-800` or `dark:border-slate-700`.
- **Text**: Body `dark:text-white` or `dark:text-slate-100`; muted `dark:text-gray-400` or keep `text-[#49659c]` where it’s readable.

## Utility classes

- **Scrollbar**: `.no-scrollbar` to hide scrollbar (`::-webkit-scrollbar { display: none }`; `scrollbar-width: none`).
- **Rarity**: `.rarity-common` (border `#94A3B8`), `.rarity-rare` (border `#0d59f2`), `.rarity-legendary` (border `#F59E0B` + glow).
- **Map**: `.map-gradient` for territory/map backgrounds (radial gradient with primary tint).
