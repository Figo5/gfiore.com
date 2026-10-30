# Featured projects

## Context
- Scope: the owner-approved Quiet showcase design, implemented in the existing Next.js portfolio with React and CSS Modules.
- Profile: inside-design-system. Preserve the existing dark palette, system type, factual descriptions, and the user's interactive grain background.
- Custom direction: Swiss typographic restraint, informed by the small descriptive project links on Emil Kowalski's portfolio and Rauno Freiberg's project index. No imitation of their branding or copy.
- Dials: DESIGN_VARIANCE=4, MOTION_INTENSITY=3, VISUAL_DENSITY=5.
- Signature: the site's existing interactive dither continues behind transparent project text and media, without a colored panel, navigation toolbar, dots, or screenshot backplate.

## Typography
- Display/body: existing system sans, retained for continuity. Actual CLI output uses SFMono-Regular/Consolas.
- Hierarchy: 24px project names, 18px section title, 14px body and code, 12px metadata and quiet control. Mobile CLI is 13px to preserve published output.
- Body line-height 1.65; headings 1.3/1.5. Weight 400/500 follows the existing site.

## Color
| Role | Value | Notes |
| --- | --- | --- |
| Background | oklch(0.19 0.008 230) | Existing #111416 canvas field |
| Surface | transparent | No feature or media background fill |
| Foreground | oklch(0.93 0.004 230) | Existing off-white |
| Body | #adb5ba | Existing description color |
| Separator | #2a3034 | One section-heading hairline |
| Accent | #a7c6d5 | Existing links |
| Focus | #8bb7ca | Existing focus treatment |

## Spacing and shape
- 4px base: 8, 12, 16, 20, 24, 32px.
- Maximum content width 928px including 32px padding. 352px media stage; 280px mobile. Image aspect ratios are retained.
- Radii 0/4px. No shadows. All wrappers after the page background are transparent.
- One plain-text Pause motion control remains for accessibility. It pauses the background, rotation, and video together. No visible native video controls.

## Interaction
- The existing Embla dependency provides looping five-second automatic rotation, including the video. Hover does not stop it. Video is muted and loops only on its active slide. Rotation waits during drag and stops while the section is offscreen or the tab is hidden.
- Swipe/drag or arrow keys browse manually. Inactive slides are inert and hidden from accessibility navigation.
- The existing site-wide grain implementation, opacity, and pointer/ripple behavior are unchanged. `MotionProvider` shares the user pause state between the carousel and background.
- Reduced motion removes slide transitions and uses the grain algorithm's static fallback. Explicit user-requested rotation remains pausable.

## Sources
- https://emilkowal.ski/
- https://rauno.me/projects
- Civicfolio and EdgeTerminal use the approved October 30 local captures in `public/projects/*-current.jpg`. AgentOps uses its original published recording; Lab in a Box uses its published help image. SQLSage and DiffGuard use actual published CLI excerpts. Full provenance is recorded in `NOTICE.md`. CLI punctuation is published output, not authored marketing copy.

## Verification
- October 30, 2026: all 69 existing tests, TypeScript check, and the production build passed.
- Browser checks at 1920px and 390px confirmed transparent section/slide/media surfaces, a single plain-text section control, no dropdown or native video controls, and current image sources.
- Document width and scroll width both equal the viewport width at 1920px and 390px. The mobile section is 350px wide. CLI excerpts fit their media regions without clipping.
- Confirmed Home/End and arrow-key navigation, wrap from the last slide to the first, native drag from Civicfolio to AgentOps, inert inactive slides, and five-second automatic progression beyond the video.
- AgentOps reached readyState 4, muted and playing without controls; leaving its slide paused it and removed the source. Both pause controls reflected the same state.
- The original background algorithm is unchanged and its existing pointer/ripple, reduced-motion, pause, cleanup, and visibility tests passed.
- Body contrast against the brightest grain composite is 5.94:1 before the darkening overlay.
- Re-audit: no new P0/P1 design issues in this scoped change. Existing system typography, interactive background, and literal published CLI punctuation are deliberate preserved constraints. No new fonts, icons, dependencies, or claims. Justified, coherent, and distinct from the former framed-player treatment.
