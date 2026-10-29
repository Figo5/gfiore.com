# Portfolio interaction design

## Context

Extend Gio Fiore's existing personal portfolio for people exploring his projects and public contributions. Preserve the dark, understated layout, content hierarchy, links and current identity. Add the approved interactive monochrome grain background to the existing portfolio. Preserve all original typography, wording, content layout and links.

- Custom existing system: no new UI or animation dependencies.
- Dials: DESIGN_VARIANCE=2, MOTION_INTENSITY=4, VISUAL_DENSITY=6.
- Signature: low-contrast halftone field bends with pointer movement; background clicks or taps send fading ripples through it. No cursor decoration.
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

Existing page, row and control geometry is preserved. A fixed canvas sits behind the content without capturing input. The footer gains a plain pause/play background control matching its existing links.

## Iconography and motion

No new icons. Standard browser cursor and existing native disclosures remain. Canvas backing resolution is capped at 320x220 at 24fps; ripples are capped at five and expire after three seconds. Reduced motion renders a static field; pause and hidden tabs stop animation. Pointer distortion stays in the field itself.

## Behavior and accessibility

Content stays server-rendered. Keyboard focus, links, text selection and native disclosures retain their behavior. No search or filters. Links and controls do not trigger ripples; scroll drags and cancelled pointer sequences do not trigger them. Touch input supports taps without blocking scroll. Effect cleanup removes listeners, disconnects its resize observer and cancels animation frames.

## Verification

The approved local concept was ported to a small client component and scoped background renderer. Existing text and font styles are unchanged. Rendered at 1920x1080 and 390x844. Verified pointer distortion, click ripple, footer pause/play, original heading font and no horizontal overflow. All 69 tests, type checking, production build and diff checks pass. Lint has no errors; the pre-existing img-element warning remains. Existing small typography in unrelated findings/favorites is outside this scoped change.

## Drift log

October 28, 2026: documented the existing visual system alongside the user-requested cursor animation; removed the SQLSage release card. No global font, palette, identity or navigation change.

October 29, 2026: removed the cursor follower at the user’s request. Keep the minimal live site while separate design previews are evaluated.

October 29, 2026: user approved interactive C for production after restoring original text and font. Only the background, its pause control, and independently verified credit status updates are authorized.

Credit review: authenticated metadata for all 14 reports confirms 12 in triage, two closed and none published. Primary and secondary mail searches found no newer publication notice. Only aggregate status and the checked date are updated publicly; confidential findings and the pending Apache attribution stay private.
