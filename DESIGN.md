# Portfolio interaction design

## Context

Extend Gio Fiore's existing personal portfolio for people exploring his projects and public contributions. Preserve the dark, understated layout, content hierarchy, links and current identity. Keep the existing minimal presentation. Design alternatives are reviewed separately before any redesign is deployed.

- Custom existing system: no new UI or animation dependencies.
- Dials: DESIGN_VARIANCE=2, MOTION_INTENSITY=2, VISUAL_DENSITY=6.
- Signature: understated typography and plain project and contribution lists; no cursor decoration.
- SQLSage remains a project. Its release promotion is removed from Findings & contributions.

## Typography

Preserve the native system font stack for fast loading and a quiet developer portfolio. Hierarchy comes from size and weight rather than a second font. Existing typography and content spacing remain unchanged. No new text or controls.

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

Success and warning roles are unused on the portfolio. Existing accent and focus tokens remain.

## Spacing and shape

Existing page, row and control geometry is preserved. No decorative overlay or new shape is added.

## Iconography and motion

No added icons or animations. Standard browser cursor and existing native disclosures remain.

## Behavior and accessibility

Content stays server-rendered. Keyboard focus, links and native disclosures retain their behavior. No search or filters. No pointer tracking listeners or animation frame loop.

## Verification

The cursor component, mount and CSS were removed together. Existing small typography in unrelated findings/favorites is outside this scoped change.

## Drift log

October 28, 2026: documented the existing visual system alongside the user-requested cursor animation; removed the SQLSage release card. No global font, palette, identity or navigation change.

October 29, 2026: removed the cursor follower at the user’s request. Keep the minimal live site while separate design previews are evaluated.
