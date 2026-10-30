# Featured projects

## Context
- Portfolio section for hiring managers and developers, using the owner's requested **Visual showcase** carousel.
- Preserve the existing site's dark palette, typography, navigation, and interactive grain background.
- Dials: DESIGN_VARIANCE=4, MOTION_INTENSITY=1, VISUAL_DENSITY=5.
- Signature: one full-width original screenshot, playable recording, or selectable CLI excerpt at a time, followed by the project name, factual description, technology labels, and functional links. No introductory quips or promotional taglines. Demo captions remain available to screen readers.
- Includes only projects already on the site: Civicfolio, AgentOps, SQLSage, EdgeTerminal, DiffGuard, and Lab in a Box. The other three projects remain in the regular list, with no duplication.

## Typography
- Existing system sans-serif is retained for continuity; SFMono-Regular/Consolas for the CLI excerpt.
- New section tokens: 12px technology labels, 14px descriptions/links, 20px project names, 16px desktop CLI text (14px mobile). Description line-height 1.6 and CLI line-height 1.75; project headings 1.25.
- Existing shared section headings retain the site's global type rules. New project headings use weight 500.

## Color
All colors inherit the existing global roles. Their current approximate OKLCH equivalents are recorded for reference; no site-wide palette changes are introduced.

| Role | Token | OKLCH equivalent |
| --- | --- | --- |
| Background | `--background` | `oklch(0.19 0.008 230)` |
| Code surface | `--surface` | `oklch(0.22 0.009 230)` |
| Foreground | `--text` | `oklch(0.93 0.004 230)` |
| Separator | `--line` | `oklch(0.30 0.012 230)` |
| Links | `--accent` | `oklch(0.81 0.04 230)` |
| Focus | `--focus` | `oklch(0.76 0.06 230)` |

No new success, warning, or error states are needed. Source image colors retain the original pixels.

## Spacing and shape
- 4px base unit: 8, 12, 16, 20, 24, 32, 40px spacing.
- Each slide fills the content width. Media height is clamped between 280px and 620px; images retain their aspect ratio and are never cropped. Original PNG files are linked directly for inspection.
- At 600px and below, details and links stack. The project picker and navigation fit a 350px content width. Scrollable CLI regions are keyboard focusable.
- One separator below the slide; no card outline, shadow, colored label, or decorative icon.
- Radii: 0 and 4px. Controls and links have at least 44px targets. Global focus indicators remain in effect.

## Motion and interaction
- Uses the existing Embla dependency with manual controls, no loop, and no autoplay. The native project picker, Previous/Next buttons, arrow keys, Home/End, and drag gestures select slides. End buttons disable at the bounds.
- Control-triggered transitions jump when reduced motion is requested. Inactive slides are inert and hidden from accessibility navigation, and selection changes are announced politely.
- AgentOps is a native controlled video with a poster and no preload. Its source is assigned only on its selected slide, and leaving the slide pauses playback. Dragging does not intercept videos, links, buttons, or selectable CLI text.
- Existing background motion and its reduced-motion behavior are unchanged.

## Source assets
- `public/projects/civicfolio.png`: published Civicfolio README screenshot, with its fictional-data caption retained.
- `public/projects/agentops.png`: frame at 18 seconds from the published AgentOps demo recording.
- SQLSage excerpt: `Figo5/sqlsage/docs/demo-output.txt`, with the actual demo command. It is an excerpt, with no invented timing or speedup.
- `public/projects/agentops-demo.mp4`: original published recording, without re-encoding.
- `public/projects/edgeterminal.png`: published desktop research-board screenshot.
- DiffGuard excerpt: published `docs/example-output.txt`, explicitly labeled as fixture output.
- `public/projects/lab-in-a-box.png`: published labctl help capture.
- Public source links are recorded in `NOTICE.md`.

## Verification
- October 30, 2026: production build, TypeScript check, and all 69 existing tests passed before browser QA.
- Browser QA at 1920px and 390px verified all six slide selections, disabled end controls, Home/arrow-key navigation, drag navigation, and offscreen inert states. All three images loaded at their original source dimensions.
- AgentOps playback reached ready state 4 at 1440px video width; switching slides paused playback and removed its source.
- On mobile, the section was 350px wide inside the 390px viewport. Document scroll width equaled viewport width, with no horizontal overflow.
- Source, full-size image, documentation, and example links retain their verified destinations. FairwayOS, Gmail Tidy, and Balatro AI Sparring remain under More projects.
- Hard-no scan: no invented screenshots, performance claims, icon sets, decorative labels, looping animation, or card chrome. Existing system typography and background remain.
