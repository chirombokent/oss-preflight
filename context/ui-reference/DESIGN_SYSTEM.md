# OSS Preflight Design System

> The visual identity and component tokens for OSS Preflight, the evidence-backed recommendation engine.

---

## Overview

The OSS Preflight design system is a token-first architecture built on clarity, trust, and evidence. It evolved from the Dreamverse core design system but is optimized for technical decision-making interfaces.

**Core principles:**

- **Evidence first.** The visual hierarchy guides the eye from facts (sourced data) to interpretation (AI-derived insights).
- **Technical clarity.** Monospace fonts, clean information density, no decorative clutter.
- **Calm sophistication.** Warm neutrals and indigo/copper accents create a professional but approachable feel.
- **Dark-mode native.** Light mode is default, but dark mode is equally functional and vetted.

---

## Color System

### Brand Colors

**Primary — Slate (Clarity & Evidence)**

- `--pf-slate-deep`: `#3B4E7A` — Primary buttons, headings, primary text
- `--pf-slate-mid`: `#5268A0` — Hover states, secondary accents
- `--pf-slate-light`: `#6B82BA` — Disabled states, muted content

The slate palette signals precision and technical trust. Use slate for:
- Primary CTA buttons ("Scaffold this recommendation")
- H1/H2 headings
- Link text
- Primary data (package names, scores)

**Secondary — Copper (Warmth & Approachability)**

- `--pf-copper-warm`: `#C9A96E` — Highlight, accent, non-critical CTAs
- `--pf-copper-light`: `#D4BC8A` — Tinted backgrounds, light accents
- `--pf-copper-dark`: `#B8944F` — Labels, eyebrow text

Use copper for:
- Secondary CTAs
- Highlights in evidence passports (e.g., "Underrated pick")
- Accent underlines, dividers
- Warm visual breaks

**Evidence Quality — Slate & Copper Derivatives**

- `--pf-evidence-solid`: `#6B7D9F` — "Sourced fact" badge
- `--pf-evidence-light`: `#8B9DBF` — "Inferred" badge

### Semantic Colors

| Purpose | Color | Usage |
|---|---|---|
| Success | `--pf-success: #2E7D4F` | "Test passed", "Safe to use" |
| Warning | `--pf-warning: #B8860B` | "Review recommended", "Caution signal" |
| Error | `--pf-error: #C0392B` | "Critical issue", "Do not use" |
| Info | `--pf-info: #3B4E7A` | Notes, informational messages |

### Neutrals (Warm Gray)

| Variable | Hex | Usage |
|---|---|---|
| `--pf-charcoal` | `#1A1A1A` | Primary text |
| `--pf-stone` | `#6E6E6E` | Secondary text |
| `--pf-stone-mid` | `#9E9E9E` | Tertiary text, placeholders |
| `--pf-sand-light` | `#E8DFD0` | Borders |
| `--pf-sand-pale` | `#F0EBE1` | Muted backgrounds |
| `--pf-ivory` | `#FAFAF5` | Default background |
| `--pf-ivory-warm` | `#F5F0E8` | Raised surfaces |

The warm gray palette (no cool blues in neutrals) creates visual continuity with the copper accent.

---

## Typography

### Type Families

```css
--pf-font-display: "Playfair Display", Georgia, "Times New Roman", serif;
--pf-font-body:    "DM Sans", "Satoshi", system-ui, "Segoe UI", sans-serif;
--pf-font-mono:    "JetBrains Mono", Consolas, ui-monospace, monospace;
```

### Scale (Rem-based, 16px base)

| Token | Size | Usage |
|---|---|---|
| `--pf-size-xs` | 0.75rem (12px) | Captions, micro labels |
| `--pf-size-sm` | 0.875rem (14px) | Small text, details |
| `--pf-size-base` | 1rem (16px) | Body text |
| `--pf-size-md` | 1.125rem (18px) | Large body, subheadings |
| `--pf-size-lg` | 1.25rem (20px) | Subheading level 3 |
| `--pf-size-xl` | 1.5rem (24px) | Heading level 2 |
| `--pf-size-2xl` | 1.875rem (30px) | Heading level 1 |
| `--pf-size-3xl` | 2.25rem (36px) | Major heading |
| `--pf-size-4xl` | 3rem (48px) | Display large |
| `--pf-size-5xl` | 3.75rem (60px) | Display XL |

### Font Weights

| Token | Weight | Usage |
|---|---|---|
| `--pf-weight-regular` | 400 | Body copy |
| `--pf-weight-medium` | 500 | Emphasis, highlights |
| `--pf-weight-semibold` | 600 | Subheadings, labels |
| `--pf-weight-bold` | 700 | Headings, strong emphasis |

### Line Heights

| Token | Value | Usage |
|---|---|---|
| `--pf-line-tight` | 1.15 | Headings (compact) |
| `--pf-line-snug` | 1.25 | Subheadings |
| `--pf-line-normal` | 1.5 | Captions, short text |
| `--pf-line-relaxed` | 1.72 | Body paragraphs (readable) |

### Semantic Type Roles

Use these classes, not raw sizes:

```html
<!-- Display levels (serif, display font) -->
<h1 class="pf-display-xl">Welcome to OSS Preflight</h1>
<h1 class="pf-display-lg">Stack Recommendations</h1>

<!-- Headings (mix of display and body fonts) -->
<h1 class="pf-h1">Your Top Pick</h1>
<h2 class="pf-h2">Evidence Passport</h2>
<h3 class="pf-h3">Recommended Alongside</h3>
<h4 class="pf-h4">Package Details</h4>

<!-- Body copy -->
<p class="pf-body">OSS Preflight found three stacks that match your intent...</p>
<p class="pf-body-lg">This package is mature and actively maintained.</p>
<p class="pf-small">Last updated 2 days ago</p>
<p class="pf-caption">Source: npm weekly downloads</p>

<!-- Special -->
<span class="pf-eyebrow">FACT (SOURCED)</span>
<em class="pf-emphasis">Strong recommendation</em>
<code class="pf-code">discord.js</code>
<a class="pf-link" href="#">View on GitHub</a>
```

---

## Spacing & Layout

### Spacing Scale (4/8 base)

```css
--pf-space-0:  0;
--pf-space-1:  0.25rem (4px);
--pf-space-2:  0.5rem (8px);
--pf-space-3:  0.75rem (12px);
--pf-space-4:  1rem (16px);
--pf-space-5:  1.25rem (20px);
--pf-space-6:  1.5rem (24px);
--pf-space-8:  2rem (32px);
--pf-space-10: 2.5rem (40px);
--pf-space-12: 3rem (48px);
--pf-space-16: 4rem (64px);
--pf-space-20: 5rem (80px);
--pf-space-24: 6rem (96px);
```

**Rules:**

- Inner padding: `--pf-space-4` (16px) to `--pf-space-6` (24px)
- Card gaps: `--pf-space-4` (16px)
- Section gaps: `--pf-space-8` (32px) to `--pf-space-12` (48px)
- Gutters: `--pf-space-4` on mobile, `--pf-space-6` on desktop

### Radii

```css
--pf-radius-none: 0;
--pf-radius-sm:   0.5rem (8px);
--pf-radius-md:   0.75rem (12px);
--pf-radius-lg:   1rem (16px);
--pf-radius-xl:   1.25rem (20px);
--pf-radius-2xl:  1.5rem (24px);
--pf-radius-full: 50%;          /* Circle for square elements */
--pf-radius-pill: 9999px;       /* Pill / capsule */
```

**Usage:**

- Cards, panels: `--pf-radius-lg`
- Input fields: `--pf-radius-md`
- Badges, tags: `--pf-radius-pill`
- Buttons: `--pf-radius-md`

---

## Shadows

Warm, quiet shadows (not blue):

```css
--pf-shadow-sm:    0 1px 2px rgba(59, 78, 122, 0.05);
--pf-shadow-md:    0 4px 12px rgba(59, 78, 122, 0.08);
--pf-shadow-lg:    0 8px 24px rgba(59, 78, 122, 0.12);
--pf-shadow-xl:    0 16px 48px rgba(59, 78, 122, 0.16);
--pf-shadow-card:  0 1px 3px rgba(59, 78, 122, 0.04), 0 4px 12px rgba(59, 78, 122, 0.06);
--pf-shadow-glow:  0 0 20px rgba(201, 169, 110, 0.22);  /* Copper glow */
--pf-shadow-focus: 0 0 0 3px var(--pf-ring);             /* Focus ring */
```

**Usage:**

- Cards at rest: `--pf-shadow-card`
- Cards on hover: `--pf-shadow-md`
- Modals, dropdowns: `--pf-shadow-lg`
- Raised surfaces: `--pf-shadow-sm`
- Focus states: `--pf-shadow-focus` + border color change
- Accent highlights: `--pf-shadow-glow`

---

## Motion

Calm, purposeful transitions:

```css
--pf-motion-fast:   150ms;   /* Icons, hover states */
--pf-motion-normal: 250ms;   /* Default transitions */
--pf-motion-slow:   400ms;   /* Page transitions, modals */
--pf-motion-ease:   cubic-bezier(0.4, 0, 0.2, 1);   /* Standard easing */
--pf-motion-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1);  /* Playful */
```

**Principles:**

- Fast for micro-interactions (hover, focus, small state changes)
- Normal for component transitions (open/close, in/out)
- Slow for page-level transitions or long-distance moves
- Always respect `prefers-reduced-motion: reduce`

---

## Breakpoints

```css
--pf-bp-sm: 640px;   /* Tablet */
--pf-bp-md: 768px;   /* Small desktop */
--pf-bp-lg: 1024px;  /* Desktop */
--pf-bp-xl: 1280px;  /* Wide desktop */
```

**Mobile-first approach:**

```css
/* Mobile (default) */
.pf-card { padding: var(--pf-space-4); }

/* Tablet and up */
@media (min-width: var(--pf-bp-md)) {
  .pf-card { padding: var(--pf-space-6); }
}
```

---

## Z-Index Layers

```css
--pf-z-base:    0;      /* Default layer */
--pf-z-raised:  10;     /* Raised surfaces, sticky headers */
--pf-z-sticky:  100;    /* Sticky sidebars, navigation */
--pf-z-overlay: 200;    /* Dropdown menus, tooltips */
--pf-z-modal:   300;    /* Modals, dialogs */
--pf-z-toast:   400;    /* Toast notifications */
```

Never use arbitrary z-index. Always pick from this scale.

---

## OSS Preflight-Specific Utilities

### Fact vs. Inferred Badges

Evidence is a key part of OSS Preflight's trust story. Visual distinction between sourced facts and AI inferences is critical.

```html
<span class="pf-fact-badge">Fact</span>  <!-- Solid evidence color -->
<span class="pf-inferred-badge">Inferred</span>  <!-- Light evidence color -->
```

### Score Bar Segments

The six dimensions of the scoring model each have a distinct color segment:

```css
.pf-score-goal-fit {     background-color: var(--pf-slate-deep); }   /* 30% */
.pf-score-compat {       background-color: var(--pf-slate-mid); }    /* 25% */
.pf-score-maintenance {  background-color: var(--pf-slate-light); }  /* 15% */
.pf-score-safety {       background-color: var(--pf-copper-dark); }  /* 15% */
.pf-score-community {    background-color: var(--pf-copper-warm); }  /* 10% */
.pf-score-docs {         background-color: var(--pf-copper-light); } /* 5% */
```

Render as a stacked horizontal bar with each segment proportional to its weight. Add a tooltip on hover showing the name and value.

### Evidence Quality Indicators

```html
<!-- Fresh data (live API call) -->
<div class="pf-evidence-fresh">
  Last commit: May 14, 2026 (live)
</div>

<!-- Cached data (from disk) -->
<div class="pf-evidence-cached">
  Last commit: May 14, 2026 (cached)
</div>
```

---

## Dark Mode

Dark mode is enabled by adding `class="dark"` to `<html>` or `[data-theme="dark"]` to any ancestor.

The palette automatically adjusts:
- Backgrounds darken
- Text lightens
- Colors remain visually distinct

Test dark mode for:
- Text contrast (WCAG AA minimum)
- Card elevation (shadows still visible)
- Link colors (readable on dark backgrounds)

---

## Calm Mode

Reduce visual stimulation by setting `[data-calm="true"]` on the root:

```html
<html data-calm="true">
  <!-- Shadows are reduced, surfaces are flatter -->
</html>
```

This disables glows, reduces shadow depth, and flattens layering. Useful for accessibility or when the user prefers reduced visual noise.

---

## Migration from VouchStack Design

If you have existing VouchStack UI components:

1. **Replace token prefixes:** `--dv-` → `--pf-`
2. **Update class names:** `.dv-*` → `.pf-*`
3. **Color substitutions:**
   - `--dv-forest-deep` → `--pf-slate-deep` (primary changed from green to indigo)
   - `--dv-copper-*` → `--pf-copper-*` (unchanged)
   - All other neutrals remain the same
4. **Semantic mapping:**
   - The semantic tokens (success, warning, error, info) are the same concept but with OSS Preflight-appropriate messaging

**Example migration:**

```css
/* VouchStack */
.dv-h1 { color: var(--dv-forest-deep); }
.dv-badge { background: var(--dv-copper-warm); }

/* OSS Preflight */
.pf-h1 { color: var(--pf-slate-deep); }
.pf-badge { background: var(--pf-copper-warm); }
```

---

## Fonts: Self-Hosting

All fonts are self-hosted in `ui-reference/fonts/`:

- `Satoshi-Medium.woff2` / `Satoshi-Medium.woff` — Headlines
- `JetBrainsMono-VariableFont.ttf` + italic variant — Code
- DM Sans + Playfair Display from Google Fonts (optional, loaded in `<head>`)

To use:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./oss-preflight-design-tokens.css">
```

---

## Accessibility (A11y)

**Color contrast:**

- All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Dark mode is equally vetted
- Do not rely on color alone to convey information (always pair with text label)

**Motion:**

- All transitions respect `prefers-reduced-motion: reduce`
- Set motion tokens to `0ms` if the user prefers reduced motion

**Focus states:**

- All interactive elements have a clear focus ring: `--pf-shadow-focus`
- Focus visible on keyboard navigation
- Never use `outline: none` without a replacement

**Semantic HTML:**

- Use proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`, not skipped)
- Use `<button>` for actions, `<a>` for navigation
- Label form fields with `<label>`
- Use `role` and `aria-*` attributes for complex patterns

---

## Files

| File | Purpose |
|---|---|
| `oss-preflight-design-tokens.css` | Master design tokens (colors, type, spacing, motion) |
| `DESIGN_SYSTEM.md` | This guide |
| `ui-reference/` | Reference components and examples (optional) |
| `fonts/` | Self-hosted webfonts |

---

## Questions?

For implementation questions, refer to:

- [Architecture (Source of Truth)](../docs/architecture.md) — Solution, system design, data flows
- [Implementation Plan](../docs/implementation-plan.md) — Build sequence and pro tips
