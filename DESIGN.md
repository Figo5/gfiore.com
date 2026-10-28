# Portfolio interaction design

## Context

Extend Gio Fiore's existing personal portfolio for people exploring his projects and public contributions. Preserve the dark, understated layout, content hierarchy, links and current identity. Add a decorative cursor interaction using the existing React setup.

- Custom existing system: no new UI or animation dependencies.
- Dials: DESIGN_VARIANCE=2, MOTION_INTENSITY=2, VISUAL_DENSITY=6.
- Signature interaction: a 32px outlined circle follows the pointer with gentle lag and expands over links and controls. The native cursor stays visible.
- SQLSage remains a project. Its release promotion is removed from Findings & contributions.

## Typography

Preserve the native system font stack for fast loading and a quiet developer portfolio. Hierarchy comes from size and weight rather than a second font. Existing typography and content spacing remain unchanged. The cursor adds no text or controls.

## Color

The OKLCH values below document the existing palette; CSS continues to use its established variables. No palette migration or new semantic colors is part of this change.

| Role | OKLCH | Source |
| --- | --- | --- |
| bg | `oklch(18.89% 0.0062 236.93)` | Existing `#111416` token; preserved |
| surface | `oklch(22.36% 0.0084 240.27)` | Existing `#181c1f` token; preserved |
| fg | `oklch(93.22% 0.0025 165.07)` | Existing `#e7e9e8` token; preserved |
| body | `oklch(76.83% 0.0115 234.87)` | Existing `#adb5ba` token; preserved |
| muted | `oklch(60.28% 0.0187 236.90)` | Existing `#77838b` token; preserved |
| border | `oklch(30.50% 0.0111 236.98)` | Existing `#2a3034` token; preserved |
| accent | `oklch(80.85% 0.0395 228.66)` | Existing `#a7c6d5` token; preserved |
| focus | `oklch(75.44% 0.0542 226.31)` | Existing `#8bb7ca` token; preserved |
| error | `oklch(80.66% 0.0852 19.09)` | Existing `#f2aaaa` token; preserved |

Success and warning roles are unused in this interaction. The follower uses the existing accent and focus tokens.

## Spacing and shape

The follower is a 32px circle with a 1px outline, expanding to 1.45 times its size over interactive elements. It has no shadow or fill. Existing page, row and control geometry is preserved.

## Iconography and motion

No new icons. Pointer tracking uses a 65ms exponential follow, with 140ms visibility and 160ms hover transitions. Animation frames stop after the circle settles and on blur, keyboard use or leaving the window. No perpetual animation loop.

## Behavior and accessibility

Only fine pointers with hover and no reduced-motion preference enable tracking. Touchscreens and reduced-motion users receive no follower. The decoration is aria-hidden and pointer-events:none; native cursor, keyboard focus, links and disclosures retain their behavior. The rest of the page stays server-rendered. No new dependencies, network requests, search or filters.

## Verification

All 64 existing tests, TypeScript checking and the production build pass. Isolated behavior checks also verify preference gating, pointer lag, hover feedback, idle frame shutdown, keyboard/touch hiding, preference changes and cleanup. Lint reports no errors; its existing img-element warning remains. Visual verification of the new cursor is blocked by the locked Mac; prior desktop and mobile review covered the inherited layout only. Existing small typography in unrelated findings/favorites is outside this scoped change.

## Drift log

October 28, 2026: documented the existing visual system alongside the user-requested cursor animation; removed the SQLSage release card. No global font, palette, identity or navigation change.
