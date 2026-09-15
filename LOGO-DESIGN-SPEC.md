# My Challenges — Logo Design Specification

## Overview

The **My Challenges** logo system consists of four components designed for the project management application rebranded from "Plane" to "My Challenges."

---

## 1. Icon Symbol (`MyChallengesIcon`)

**Concept:** A mountain range silhouette with a flag at the summit — representing overcoming challenges and achieving goals.

### SVG Code

```svg
<svg width="85" height="52" viewBox="0 0 85 52" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <!-- Left mountain (shorter) -->
  <path d="M2 48 L22 16 L42 48 Z" fill="currentColor"/>
  <!-- Right mountain (taller) -->
  <path d="M30 48 L55 2 L82 48 Z" fill="currentColor"/>
  <!-- Flag at the summit (semi-transparent) -->
  <path d="M55 2 L55 14 L65 8 Z" fill="currentColor" opacity="0.6"/>
</svg>
```

### Specifications

- **ViewBox:** `0 0 85 52`
- **Default size:** 85×52 px
- **Left peak:** rises to y=16 (shorter)
- **Right peak:** rises to y=2 (taller, main peak)
- **Flag:** triangular pennant at (55,2), 60% opacity for depth
- **Color:** Inherits from `currentColor` via CSS

### Minimum sizes

- **Favicon/small:** 16×16 px (flag may not be visible below 20px height)
- **Recommended minimum:** 24×15 px

---

## 2. Logo Mark (`MyChallengesLogo`)

Same as the icon symbol — used when only the icon is needed (no text).

**File:** `packages/propel/src/icons/brand/my-challenges-logo.tsx`

---

## 3. Wordmark (`MyChallengesWordmark`)

**Concept:** "My Challenges" rendered in Inter Semibold (600 weight).

### SVG Code

```svg
<svg width="320" height="48" viewBox="0 0 320 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <text
    x="0" y="38"
    font-family='"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    font-size="36"
    font-weight="600"
    fill="currentColor"
  >
    My Challenges
  </text>
</svg>
```

### Specifications

- **ViewBox:** `0 0 320 48`
- **Default size:** 320×48 px
- **Font:** Inter Variable / Inter, semibold (600)
- **Font size:** 36px
- **Baseline:** y=38

---

## 4. Lockup (`MyChallengesLockup`)

**Concept:** Icon + wordmark combined for header/brand usage.

### SVG Code

```svg
<svg width="360" height="52" viewBox="0 0 360 52" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, 2) scale(0.56)">
    <path d="M2 48 L22 16 L42 48 Z" fill="currentColor"/>
    <path d="M30 48 L55 2 L82 48 Z" fill="currentColor"/>
    <path d="M55 2 L55 14 L65 8 Z" fill="currentColor" opacity="0.6"/>
  </g>
  <text
    x="56" y="38"
    font-family='"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    font-size="32"
    font-weight="600"
    fill="currentColor"
  >
    My Challenges
  </text>
</svg>
```

### Specifications

- **ViewBox:** `0 0 360 52`
- **Default size:** 360×52 px
- **Icon:** Scaled to 56% and positioned at left (0,2)
- **Text:** "My Challenges" in Inter 600 at 32px, starting at x=56
- **Spacing:** ~8px gap between icon and text

---

## 5. App Rail Icon (`MyChallengesNewIcon`)

**Concept:** A compact "C" shape (for Challenges) using two overlapping rounded squares — used in the app navigation rail.

### SVG Code (20×20 viewBox)

```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
  <path d="M10.36 10.36V12.84C10.36 13.83 9.56 14.63 8.57 14.63H3.17C2.18 14.63 1.38 13.83 1.38 12.84V7.44C1.38 6.45 2.18 5.65 3.17 5.65H5.65V8.57C5.65 9.56 6.45 10.36 7.44 10.36H10.36Z"/>
  <path d="M14.63 3.17V8.57C14.63 9.56 13.83 10.36 12.84 10.36H10.36V7.44C10.36 6.45 9.56 5.65 8.57 5.65H5.65V3.17C5.65 2.18 6.45 1.38 7.44 1.38H12.84C13.83 1.38 14.63 2.18 14.63 3.17Z"/>
</svg>
```

---

## 6. Brand Colors

| Color            | Hex       | Usage                                   |
| ---------------- | --------- | --------------------------------------- |
| Primary Blue     | `#3F76FF` | Logo on light backgrounds               |
| Dark             | `#1F2937` | Logo on light backgrounds (alternative) |
| Light Gray       | `#E5E7EB` | Logo on dark backgrounds                |
| Muted            | `#6B7280` | Labels, secondary text                  |
| Background Light | `#F9FAFB` | Light mode background                   |
| Background Dark  | `#111827` | Dark mode background                    |

---

## 7. Typography

| Property                   | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Font family                | Inter Variable, Inter, -apple-system, BlinkMacSystemFont, sans-serif |
| Wordmark weight            | 600 (Semibold)                                                       |
| Wordmark size (lockup)     | 32px                                                                 |
| Wordmark size (standalone) | 36px                                                                 |

---

## 8. Usage Guidelines

### Do

- Use the lockup in headers, login pages, and marketing materials
- Use the icon alone for favicons, app icons, and small spaces
- Use `currentColor` to inherit text color from parent
- Maintain aspect ratio when scaling

### Don't

- Stretch or distort the logo
- Place the logo on busy backgrounds without sufficient contrast
- Recreate the logo with different fonts or proportions
- Add effects (shadows, outlines, gradients) to the SVG

---

## 9. Static Assets (Designer Tasks)

The following raster assets need to be recreated by a designer:

| Asset            | Location                                         | Notes                                     |
| ---------------- | ------------------------------------------------ | ----------------------------------------- |
| Gradient logo    | `apps/web/app/assets/auth/gradient-logo.webp`    | Used on login/welcome page                |
| Background logo  | `apps/web/app/assets/auth/gradient-bg-logo.webp` | Decorative background element             |
| Horizontal logos | `apps/web/app/assets/my-challenges-logos/`       | Black and white variants with blue accent |
| PWA icons        | `apps/web/app/assets/icons/`                     | 180×180 and 512×512                       |
| Favicons         | `apps/web/app/assets/favicon/`                   | 16×16, 32×32, ICO, apple-touch            |
| Logo spinners    | `apps/web/app/assets/images/logo-spinner-*.gif`  | Dark and light loading animations         |
| Space logos      | `apps/space/app/assets/my-challenges-logos/`     | Same variants as web                      |
| Space SVG        | `apps/space/app/assets/my-challenges-logo.svg`   | Static SVG for space app                  |

---

## 10. File Locations

```
packages/propel/src/icons/brand/
├── my-challenges-icon.tsx      # Icon + flag SVG component
├── my-challenges-logo.tsx      # Icon-only (same as icon)
├── my-challenges-wordmark.tsx  # "My Challenges" text SVG
├── my-challenges-lockup.tsx    # Icon + text combined
├── plane-lockup.tsx            # Legacy (backward compat)
├── plane-logo.tsx              # Legacy (backward compat)
└── plane-wordmark.tsx          # Legacy (backward compat)

packages/propel/src/icons/sub-brand/
├── my-challenges-icon.tsx      # App rail icon (C shape)
└── plane-icon.tsx              # Legacy (backward compat)
```
