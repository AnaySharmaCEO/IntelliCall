# IntelliCall — Phase 6: Refinement Pass

You already built IntelliCall per `INTELLICALL_FRONTEND_DESIGN_SYSTEM.md` and `intellicall_design_system_reference.html`. Those two files remain the source of truth — every fix below must use existing tokens/components, not new ones. This phase fixes five specific issues found in review. Do not touch color palette, typography, or component visual language — this is a structural/behavioral pass, not a redesign.

---

## 1. Dashboard — fix the dead space next to Campaign Performance (root-cause fix, not a stretch hack)

Problem: the "Campaign performance" card ends up with empty space below the chart because the "Recent decisions" card next to it is much taller than it should be.

The actual cause is a **component misuse**, not a layout bug: the dashboard is currently rendering each recent decision using the full dense `DecisionCard` (evidence quotes, tags, inline Approve/Override buttons, "View reasoning"). Per §41, the dashboard is supposed to be light-touch — that dense treatment belongs on the Decisions ledger screen, not here. Fix the component choice and the height mismatch mostly resolves itself, without stretching or forcing either card.

Fix — two changes, both structural, no new widgets:

1. **Recent Decisions panel**: replace the full `DecisionCard` with a compact row — status dot, lead name, confidence %, a single-line reason, and one "Review" link that opens the existing decision drawer (do not show inline Approve/Override buttons or expandable reasoning here — that's ledger-level density). Cap the panel at 3 rows. This naturally shortens the left column instead of the right column being force-matched to it.
2. **Campaign performance chart**: change it from a vertical bar chart to a horizontal ranked-bar list — one row per campaign (name, horizontal bar, qualification % as text). Each campaign is a real row with real content, so the card's height scales with the actual number of campaigns rather than needing padding inflated to "look full." Do not stretch or artificially pad a vertical bar chart to fill a taller card — that produces the exact oversized/empty look already flagged as a problem.

Do **not** add a new widget, stat block, or second chart to fill remaining space, and do not force the two cards to match heights via CSS alignment tricks. If, after both changes above, the two panels are still visibly uneven, that's acceptable — uneven card heights from genuinely different content amounts is normal in SaaS dashboards. The goal is that neither panel looks artificially stretched or sparse on its own.

---

## 2. Fix broken modularity in hooks/ and services/

Problem: all hooks were placed into a single `hooks/index.ts` and all services into a single `services/index.ts`, instead of one file per entity as specified in §53 of the design system.

Fix:
- Split into `hooks/useLeads.ts`, `hooks/useCampaigns.ts`, `hooks/useAgents.ts`, `hooks/useCalls.ts`, `hooks/useDecisions.ts`, `hooks/useOutcomes.ts` — one hook per file.
- Split into matching `services/leadsService.ts`, `services/campaignsService.ts`, `services/agentsService.ts`, `services/callsService.ts`, `services/decisionsService.ts`, `services/outcomesService.ts`.
- `hooks/index.ts` and `services/index.ts` should only re-export from these files (barrel pattern) — no logic should live in the index files themselves.
- Audit the rest of the codebase for the same anti-pattern (all component types dumped into one `types.ts`, all mock data into one `mockData.ts`, etc.) and split any file that violates the folder structure defined in §53 of the design system into per-entity files the same way. Report back what else you found and fixed.

---

## 3. Smooth out loading animations — using existing tokens only

Problem: current loading transitions feel jarring/default, not using the motion system already defined in §16 and §39.

Fix:
- Every transition (skeleton fade-in, drawer/modal open-close, tab switch) must use the existing tokens: `motion.duration.fast` (120ms) for hover/focus, `motion.duration.base` (180ms) for drawers/panels/tabs, `motion.duration.slow` (280ms) for modals, all with `motion.easing.standard` (`cubic-bezier(0.4, 0, 0.2, 1)`). Remove any animation curve/duration Figma Make introduced on its own.
- Loading states stay skeleton rows matching real row height (already specified) — no spinners, no bouncing/scaling entrance effects, no page-load entrance animations.
- Keep the one permitted exception as-is: the subtle pulse on the live call "Connected/Processing" state.
- Respect `prefers-reduced-motion` everywhere per §16.

---

## 4. Make the profile icon (top right) functional

Problem: it's currently decorative only.

Fix — clicking it opens a small dropdown (standard `shadow.md`, `radius` token, same as other dropdowns/popovers in the system) containing:
- **Theme toggle** — light/dark, same toggle behavior already defined for the sidebar theme switch; this becomes the second entry point to the same state, not a separate implementation.
- **Account settings** — opens a new minimal page at `/settings/account` (separate from the existing workspace-level Settings page): user's name, email, password change, and notification preferences. Keep this MVP-scoped — no avatar upload, no multi-field profile builder. Use the existing constrained single-column settings form pattern (~720px max width) already defined for Settings.
- **Log out** — standard destructive-style action per existing badge/button color conventions, returns user to the landing page (see #5).

---

## 5. Add a landing page

New public route `/` (not behind auth), using the same design tokens — this is not a separate marketing theme.

- Simple hero: product name, one-line description of IntelliCall (the product) and its Resonology AI engine (per the naming rule in §2 — Resonology AI is named in copy, never a separate visual brand layer), 2–3 short value points max. No dense marketing sections, no invented illustration style.
- CTA logic:
  - Logged out: two buttons — "Sign in" and "Get started."
  - Logged in: single "Go to Dashboard" button, routes straight to `/dashboard`.
- Keep it to one screen's worth of content — this is an MVP entry point, not a full marketing site.

---

## Constraints for all five fixes

- No new colors, fonts, spacing, radius, or shadow values — reference existing tokens only.
- No new components unless explicitly listed above (the profile dropdown and landing page are the only new UI surfaces in this phase).
- Confirm at the end, per fix:
```
WHAT WAS WRONG
WHAT WAS CHANGED
WHAT WAS NOT TOUCHED
```