# Featured projects

## Context
- Portfolio section for hiring managers and developers, using the owner's selected **Compact stories** layout.
- Preserve the existing site's dark palette, typography, navigation, and interactive grain background.
- Dials: DESIGN_VARIANCE=4, MOTION_INTENSITY=1, VISUAL_DENSITY=5.
- Signature: actual project evidence beside project names and functional links. The owner requested names only, with no introduction, taglines, descriptions, or technology labels. Civicfolio shows the built UI with fictional demo data; AgentOps shows a still from its recorded workflow; SQLSage shows an excerpt from its published offline demo output. Demo captions remain available to screen readers rather than appearing as visible copy.
- The three featured projects appear once above the six other projects and the public report outcomes.

## Typography
- Existing system sans-serif is retained for continuity; SFMono-Regular/Consolas for the CLI excerpt.
- New section tokens: 12px code, 14px links, 20px project names. Code line-height 1.6; project headings 1.25.
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
- Each story uses text and media columns in a 1.1:1 ratio with a 32px gap; both columns may shrink without overflow.
- At 600px and below, media appears above the project name and links. All actions and accessible captions remain present.
- One separator between stories; no card outline, shadow, colored label, or decorative icon.
- Radii: 0 and 4px. Images retain their full aspect ratio.
- Link targets are at least 44px tall for coarse pointers. Global focus indicators remain in effect.

## Motion
- No new animation. AgentOps media is a static frame; its demo opens only when selected.
- Existing background motion and its reduced-motion behavior are unchanged.

## Source assets
- `public/projects/civicfolio.png`: published Civicfolio README screenshot, with its fictional-data caption retained.
- `public/projects/agentops.png`: frame at 18 seconds from the published AgentOps demo recording.
- SQLSage excerpt: `Figo5/sqlsage/docs/demo-output.txt`, with the actual demo command. It is an excerpt, with no invented timing or speedup.
- Public source links are recorded in `NOTICE.md`.

## Verification
- October 30, 2026: production build, TypeScript check, and all 69 existing tests passed.
- Rendered in the browser at 1920px and 390px. Both source images loaded. The section contains exactly Civicfolio, AgentOps, and SQLSage; the lower list contains the six remaining projects.
- On mobile, each story and media column was 350px wide inside the 390px viewport. Document scroll width equaled viewport width, with no horizontal overflow.
- Source, demo, and walkthrough links retain their public GitHub destinations. All content and actions remain present in the stacked layout.
- Hard-no scan passed for the new section: no invented screenshots, performance claims, icon sets, decorative labels, looping animation, or card chrome. Existing system typography and background are preserved intentionally.
