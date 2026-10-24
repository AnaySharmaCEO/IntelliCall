# IntelliCall Frontend Design System

Version 1.0 — MVP design lock. This document is the primary source of truth for building the IntelliCall frontend. Where this document and any other reference conflict, this document wins unless an explicit product requirement says otherwise.

---

## 1. Product Design Philosophy

IntelliCall is a business conversation platform that turns voice conversations into explainable decisions and measurable outcomes. It is not an AI dialer and not a CRM with a chatbot bolted on. The interface has three jobs happening at once, on every relevant screen:

- **Operate** — manage leads, campaigns, agents, calls, workflows.
- **Explain** — show the evidence, confidence, and reasoning behind a decision.
- **Prove** — connect a decision back to what actually happened (the outcome).

Every screen decision in this document is evaluated against those three jobs. A screen that only operates, without a path to explain or prove, is incomplete for IntelliCall's purpose.

The interface should read as a serious, daily-use B2B tool — closer in spirit to Linear's structural discipline and Attio's data fluency than to an AI product demo. It should never lean on gradient accents, neon color, or "AI slop" visual signaling to prove it is AI-powered. The product proves it's intelligent by being clear, not by looking futuristic.

---

## 2. IntelliCall vs Resonology AI Brand Hierarchy

**IntelliCall** is the product. It owns the visual identity: logo, navigation, page chrome, primary accent, overall interaction language.

**Resonology AI** is the intelligence layer inside IntelliCall. It is named in copy at the specific moments a claim, decision, or piece of analysis is being asserted by the model — not as a persistent visual brand.

Important correction that governs this entire document: **Resonology AI does not get its own typography, color, layout convention, or component styling used to visually mark "this came from AI."** The interface is unified. Typography, iconography, and layout choices are made for general information hierarchy and explainability — never to create a visually distinct "AI zone." A confidence score is set in tabular figures because it's precise data that needs to align in a column, not because it's AI-generated. A decision's evidence sits in a workspace pane because that's good layout for evidence-plus-context, not because it's an "AI pane."

Practically:

- Use **IntelliCall** in: app chrome, navigation labels, page titles, workspace identity, empty/loading/error copy, settings.
- Use **Resonology AI** in: the specific line of copy attributing a decision, a piece of extracted evidence, or an analysis to the model (e.g. "Decision by Resonology AI," "Resonology AI flagged this objection"). Use it sparingly — once per card/section is enough, not on every line.
- Never rebrand a whole page, section header, or component category as "Resonology AI [X]." The nouns stay IntelliCall's (Decisions, Evidence, Confidence); Resonology AI is the actor, not a section label.

---

## 3. Design Principles

1. **Explainability is a first-class layout concern, not a modal you open.** Evidence and reasoning live one click away from any decision, never buried two levels deep, never forced on-screen by default.
2. **Color is semantic, not decorative.** Every use of color maps to a defined state (success, warning, error, info, confidence tier). No color exists purely to "look AI" or "look premium."
3. **Density scales with expertise of the screen.** Dashboard is light-touch; Decision Trace and Call Detail are dense, because that's where the real work happens.
4. **One spatial convention, reused everywhere.** Detail screens (Lead, Call, Decision) use the same two-pane workspace shape: operational context on the left, decision/evidence context on the right. Users learn the shape once.
5. **The system tells the truth about its own state.** Every AI-driven screen has real states for analyzing, extracting, pending, review-required, executed, and failed — never a generic spinner standing in for what's actually happening.
6. **Never fake the learning loop.** Where a future capability (Strategies/Analytics) isn't built yet, it's shown honestly as "Coming later," never simulated with static or fabricated data.
7. **Build for the smallest team, not for scale theater.** No unnecessary enterprise complexity: fewer, well-made components beat a sprawling library.

---

## 4. Visual Direction

**Design plan (per frontend-design process): color, type, layout, principles — reviewed against the brief before being finalized.**

**Color** (see §6 for full tokens): a restrained slate-blue (`#2B4C8C`) as the single primary accent, on a near-white/very light cool-grey background system. No terracotta, no purple/violet AI gradient, no neon-on-black. Semantic colors (green/amber/red) exist only for state, never as decoration.

**Type**: two families. **IBM Plex Sans** for all interface text (labels, body, headings) — chosen deliberately over the more overused Inter, still a disciplined grotesque appropriate to enterprise software. **IBM Plex Mono**, used narrowly and consistently for *all* precise numeric/data values across the whole product (KPI figures, percentages, IDs, timestamps) — this is a general data-legibility decision (tabular alignment, unambiguous digits), applied uniformly whether the number came from a human-entered field or a model. It is explicitly not reserved for "AI content."

**Layout**: sidebar-left app shell; two-pane workspace pattern for all detail screens.

```
┌────────────┬─────────────────────────────────────────────┐
│            │  Topbar: search · workspace · user           │
│  Sidebar   ├─────────────────────────┬─────────────────────┤
│  (nav)     │  Operational context     │  Decision /         │
│            │  (lead info, transcript, │  evidence context    │
│            │  history)                │  (confidence, trace, │
│            │                          │  recommended action) │
└────────────┴─────────────────────────┴─────────────────────┘
```

List/index screens (Leads, Campaigns, Calls, Decisions) are left-aligned tables with a filter bar above, not centered marketing-style layouts. Dashboard is a light KPI row plus two or three focused panels — not a dense grid of a dozen charts.

**Principles**: restraint over spectacle; one spatial convention repeated; color and type used to encode meaning, not brand an "AI layer."

**Review against generic defaults**: this plan deliberately avoids the SaaS-card kit (identical rounded cards, one shadow everywhere), the ALL-CAPS eyebrow-label-above-everything pattern, gradient washes, and the "monospace = AI" trope specifically named in the correction above. Status/decision badges (QUALIFIED, HIGH, REVIEW REQUIRED) do use uppercase — this is kept deliberately, matching how the product's own domain language already names these states, and matching real ops-tool convention (e.g. Linear's status labels), not used as a generic decorative eyebrow.

---

## 5. Brand / Visual Identity

- **Wordmark**: "IntelliCall" set in IBM Plex Sans Semibold, sentence case, no icon lockup required for MVP — a simple square/rounded monogram mark ("IC" or an abstract waveform-to-checkmark glyph) may accompany it in the sidebar header at 24×24px.
- **Resonology AI mention style**: set in regular weight, same family, same size as surrounding text — it is a name, not a badge. It may be preceded by a small neutral icon (e.g. a simple spark or waveform glyph, single color matching text-secondary) when it appears as an attribution line, but this icon is optional and never colored with the primary accent.
- **Tone of voice**: direct, plain, confident. Buttons name the exact action ("Book meeting," not "Submit"). Errors state what happened and what to do, not apologize.

---

## 6. Color System

All colors are defined as tokens with light and dark values. Components reference tokens, never raw hex.

### Base palette (light mode source values)

| Token | Hex | Use |
|---|---|---|
| `color.blue.900` | `#16294D` | darkest brand blue, dark-mode surfaces |
| `color.blue.700` | `#21396B` | primary hover |
| `color.blue.600` | `#2B4C8C` | primary accent |
| `color.blue.100` | `#E9EEF7` | secondary button / info bg |
| `color.slate.900` | `#171B24` | primary text |
| `color.slate.600` | `#4B5566` | secondary text |
| `color.slate.400` | `#8A93A6` | muted text |
| `color.slate.200` | `#DEE2E8` | default border |
| `color.slate.100` | `#ECEEF2` | subtle border |
| `color.slate.50` | `#F7F8FA` | app background |
| `color.green.600` | `#1E8E5A` | success / high confidence |
| `color.green.100` | `#E4F5EC` | success bg |
| `color.amber.600` | `#B7791F` | warning / medium confidence |
| `color.amber.100` | `#FBF0DD` | warning bg |
| `color.red.600` | `#C0392B` | error / low confidence |
| `color.red.100` | `#FBE7E4` | error bg |

### Semantic tokens

```
color.background.primary       slate.50   / dark: #18181B
color.background.surface       #FFFFFF    / dark: #1D1D21
color.background.elevated      #FFFFFF    / dark: #232327   (+ shadow.lg)
color.background.sunken        #EEF1F5    / dark: #131315   (table headers, recessed rows)

color.text.primary             slate.900  / dark: #E4E4E6
color.text.secondary           slate.600  / dark: #9C9CA3
color.text.muted               slate.400  / dark: #6B6B72
color.text.on-accent           #FFFFFF    / dark: #FFFFFF

color.border.default           slate.200  / dark: #2E2E33
color.border.subtle            slate.100  / dark: #242427

color.action.primary           blue.600   / dark: #7C93BD
color.action.primary.hover     blue.700   / dark: #91A6CA
color.action.primary.solid     blue.600   / dark: #4A6DA0
color.action.primary.solid.hover blue.700 / dark: #3D588A
color.action.secondary.bg      blue.100   / dark: #24262B
color.action.secondary.text    blue.600   / dark: #93A6C8

color.status.success           green.600  / dark: #7FA98D
color.status.success.bg        green.100  / dark: #1D2420
color.status.warning           amber.600  / dark: #BE9C68
color.status.warning.bg        amber.100  / dark: #26211A
color.status.error             red.600    / dark: #BE8074
color.status.error.bg          red.100    / dark: #271E1C
color.status.info              blue.600   / dark: #7C93BD
color.status.info.bg           blue.100   / dark: #21242B

color.confidence.high          = color.status.success
color.confidence.medium        = color.status.warning
color.confidence.low           = color.status.error
```

Confidence colors are aliases of the general semantic palette, not a separate palette — confirming there is no distinct "AI color language."

**Dark mode construction rule**: dark mode is not a simple inversion of the light palette. Backgrounds use a neutral charcoal (`#18181B` family) rather than a blue-black navy, and every accent/status color is desaturated relative to its light-mode value — muted sage green, muted gold, muted terracotta-red, muted grey-blue — rather than the saturated neon-on-near-black look common to generic AI-product dark themes. This is a deliberate rejection of that default, not an oversight: a mature enterprise dark mode should read as calm and legible for hours of use, not as a demo screenshot.

**Primary blue has two roles, not one, and dark mode is where they diverge.** `color.action.primary` is tuned to sit legibly as *text/icon/border* directly on a dark background — nav active state, links, panel-link text, filter-chip active state. That same value, used as a *solid filled surface* (a primary button, a chart bar, a small filled dot) behind white text or as a large flat shape, is measurably low-contrast against white (roughly 3:1, under the WCAG AA 4.5:1 minimum for text) and reads as an uncomfortably bright patch against the surrounding dark UI — this was the exact "AI slop" glare reported during review. `color.action.primary.solid` (and its `.hover`) exists specifically to fix this: a deeper, richer version of the same blue reserved for solid-filled surfaces in dark mode, restoring proper contrast (≈5.3:1 with white text) without introducing a second hue. In light mode `solid` and `primary` are the same value — the split only matters where dark backgrounds make it matter, so brand coherence is unaffected in the theme where it was already working.

---

## 7. Semantic Color System — Usage Rules

- Color never carries meaning alone. Every status badge, confidence indicator, and semantic state pairs color with a text label and/or icon.
- `color.action.primary` is reserved for primary interactive elements (primary buttons, active nav item, links, focus ring) — not for illustrative or decorative use.
- Status colors (`success/warning/error/info`) are used identically whether the state originates from a human action (e.g. "Campaign launched" = success) or an AI decision (e.g. "Qualified, 91%" = success) — one semantic system for the whole product.
- Backgrounds tint (`.bg` tokens) are used for badge/chip fills; the solid color is used for text, icons, and borders on that badge — never solid-fill badges with white text, which reads heavier than the density this product needs.

---

## 8. Typography System

**Families**
```
font.family.ui     "IBM Plex Sans", -apple-system, sans-serif
font.family.data   "IBM Plex Mono", ui-monospace, monospace
```

**Scale** (px / line-height)
```
font.size.xs    12 / 16
font.size.sm    13 / 18
font.size.base  14 / 20   -- default UI text
font.size.md    15 / 22   -- body copy in panels
font.size.lg    18 / 26   -- section headings
font.size.xl    22 / 28   -- page titles
font.size.2xl   28 / 34   -- dashboard KPI figures
font.size.3xl   36 / 42   -- rare, hero-scale numeric only
```

**Weights**: `400` regular (body), `500` medium (labels, table headers), `600` semibold (headings, nav active state, buttons), `700` bold (used sparingly, large KPI numerals only).

**Rules**
- `font.family.data` (mono) is used for: percentages, currency, dates/timestamps, IDs, phone numbers, and any tabular numeric column — anywhere digits need to align or be scanned precisely. It is never used for a whole sentence or paragraph.
- Uppercase is reserved for short status/decision badges (≤ 3 words) that mirror the product's own domain vocabulary (QUALIFIED, HIGH, REVIEW REQUIRED). It is not used for section eyebrows, nav labels, or button text.
- No single word or phrase within a sentence is bolded/colored for emphasis as a substitute for good sentence structure.

---

## 9. Spacing System

4px base unit.
```
space.1   4px
space.2   8px
space.3   12px
space.4   16px
space.5   20px
space.6   24px
space.8   32px
space.10  40px
space.12  48px
space.16  64px
```
Component internal padding defaults to `space.3`–`space.4`. Section-level gaps default to `space.6`–`space.8`. Page-level gutters default to `space.8` on desktop, `space.4` on mobile.

---

## 10. Border Radius System

```
radius.sm    6px   -- buttons, inputs, badges, small chips
radius.md    10px  -- cards, panels within a page
radius.lg    16px  -- modals, drawers, elevated overlays
radius.pill  999px -- status badges, tab pills only
radius.none  0px   -- tables, dividers, full-bleed sections
```
Radius scales with elevation/importance rather than being applied uniformly — tables stay sharp-edged even inside a card with `radius.md`, avoiding the "everything is a rounded card" default.

---

## 11. Elevation / Shadow System

Cool-tinted, not pure black, to match the slate-blue palette.
```
shadow.none  none
shadow.sm    0 1px 2px rgba(23,27,36,0.06)     -- table row hover, subtle card
shadow.md    0 4px 12px rgba(23,27,36,0.08)    -- dropdowns, popovers, standard cards
shadow.lg    0 12px 32px rgba(23,27,36,0.14)   -- modals, drawers
```
Dark mode uses the same shadow shape with `rgba(0,0,0,0.3/0.4/0.5)` respectively — dark surfaces need darker, not lighter, shadows to read as elevated, but kept restrained rather than heavy/high-contrast.

---

## 12. Layout System

- App shell: fixed sidebar (240px) + fluid content area.
- Content max-width: 1440px, centered on very large screens; below that, fluid with `space.8` gutters.
- Two-pane workspace split (Lead/Call/Decision detail): left pane ~60%, right pane fixed at 400px minimum, collapses to full-width stacked below `breakpoint.lg`.
- Page structure: `page-header` (title + primary CTA + breadcrumb) → `filter-bar` (list screens only) → main content region.

---

## 13. Grid System

12-column grid at desktop widths (`≥ breakpoint.lg`), gutter `space.6`. Dashboard KPI row: 4 columns of 3 units each on desktop, 2×2 on tablet, stacked on mobile. Forms and settings use a constrained single-column or two-column grid (max content width ~720px) — never stretched full-bleed, for readability.

---

## 14. Responsive Breakpoints

```
breakpoint.sm   640px
breakpoint.md   768px
breakpoint.lg   1024px
breakpoint.xl   1280px
breakpoint.2xl  1536px
```
Sidebar collapses to an icon rail below `md`, and to a slide-over drawer below `sm`. Two-pane workspaces stack vertically (operational context first, decision context second, collapsible) below `lg`. Tables convert to stacked card rows below `sm`.

---

## 15. Iconography

A single consistent line-icon set (stroke width 1.5px, 20px default size, 16px in dense contexts like table rows). Icons are functional, never decorative filler. No separate icon style or weight is used to mark "AI" content — an evidence icon, a call icon, and a settings icon all come from the same family at the same weight.

---

## 16. Motion / Animation

```
motion.duration.fast   120ms  -- hover states, focus rings
motion.duration.base   180ms  -- drawer/panel open-close, tab switch
motion.duration.slow   280ms  -- modal enter/exit
motion.easing.standard cubic-bezier(0.4, 0, 0.2, 1)
```
One deliberate exception for liveliness: the in-progress call state banner (§18, §41) may use a subtle pulsing indicator on the "Connected"/"Processing" state, since it's the one moment the product needs to feel alive in real time. Everything else is functional motion only — no entrance animations on page load, no hover effects applied to every card indiscriminately.

---

## 17. Accessibility

- WCAG AA contrast minimum for all text and meaningful icons, in both themes.
- Every color-coded state (confidence, status badges) ships with a text label; color is never the sole signal.
- Full keyboard navigation for table rows, filter controls, and the review-queue approve/override actions — these are heavily used by reviewers.
- Visible focus rings using `color.action.primary` at 2px offset outline, never suppressed.
- Respect `prefers-reduced-motion`: disable the call-state pulse and all transition durations drop to near-zero.
- Live regions for state changes that matter (e.g. "Decision updated," "Action executed") so screen reader users get the same real-time feedback sighted users get from the state banner.

---

## 18. Application Shell

```
app-shell
├── sidebar (240px, fixed)
│   ├── workspace switcher / logo
│   ├── nav: Dashboard, Leads, Campaigns, Agents, Calls, Decisions,
│   │        Outcomes, Strategies (muted/"Coming later"), Settings
│   └── theme toggle (light/dark), user menu
├── topbar (56px)
│   ├── search
│   └── workspace + user context
└── main (scrollable content region)
```
Theme resolves from system preference on first load; the toggle in the sidebar footer overrides and persists the choice.

---

## 19. Navigation

- Sidebar items are operational nouns only (per §2 — Resonology AI is never a nav item).
- Active state: `color.action.primary` text + a 2px left border in the same color, background tinted with `color.action.secondary.bg`. No pill/rounded background block behind the whole row (avoids the generic SaaS-kit look).
- "Strategies" nav item is visually present but reduced-opacity (≈60%) with a small "Coming later" tag — clickable through to a real teaser page (§48/§54), never a dead link.

---

## 20. Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `action.primary.solid` | `text.on-accent` | none | one per view — the main forward action |
| Secondary | `action.secondary.bg` | `action.secondary.text` | none | supporting actions |
| Outline | transparent | `text.primary` | `border.default` | tertiary/cancel actions |
| Destructive | `status.error.bg` | `status.error` | none | delete/override actions |
| Ghost/icon | transparent | `text.secondary` | none | table row actions, icon-only buttons |

Primary button background always uses the `.solid` variant of the accent color (§6), not the base `action.primary` token — this matters specifically in dark mode, where the base token is tuned for legibility as text on a dark background and is too light/low-contrast to sit behind white button text.

Sizes: `sm` (28px height, `text.sm`), `md` (36px height, `text.base` — default), `lg` (44px height, `text.md`, used only for primary flow CTAs like "Launch campaign"). Radius `radius.sm`. Label text is sentence case, states the exact action ("Book meeting," "Approve decision," "Send follow-up") — never "Submit," "Confirm," or a bare arrow glyph.

---

## 21. Inputs

Height `md` = 36px, `radius.sm`, `border.default` at rest, `action.primary` border + 2px focus ring on focus, `status.error` border + inline helper text on validation error. Placeholder text uses `text.muted`. Label sits above the field in `text.sm` / `text.secondary` medium weight — labels are never inside the field only (no placeholder-as-label pattern).

---

## 22. Selects / Comboboxes

Same sizing/border rules as inputs. Multi-select (e.g. campaign audience filters) renders selected values as small removable chips (`radius.sm`, `action.secondary.bg`) inside the field, not as a comma-joined string.

---

## 23. Tabs

Underline-style tabs (not pill/segmented-control style, reserved for filter toggles instead). Active tab: `text.primary` semibold + 2px underline in `action.primary`. Inactive: `text.secondary`. Used for switching sub-views within a detail screen (e.g. Call Detail: Transcript / Conversation State / Decisions).

---

## 24. Tables

`radius.none`, full-width, `border.subtle` row dividers, no card wrapper shadow around the table itself — the table sits directly on `background.surface`. Header row: `background.sunken`, `text.secondary` medium weight, small caps not used (sentence case column labels). Row hover: `background.sunken` + `shadow.sm`. Numeric columns right-aligned in `font.family.data`. Row click opens detail (Lead Detail, Call Detail, etc.); row-level actions live in a trailing ghost-icon-button column, revealed on hover on desktop / always visible on touch.

---

## 25. Cards

`radius.md`, `background.surface`, `border.subtle`, `shadow.sm` at rest. Cards are used for discrete units meant to be evaluated (a decision, an outcome, a KPI) — not as a generic wrapper for every piece of content, avoiding the "everything is an identical rounded card" default. KPI cards, DecisionCard, OutcomeCard, and ActionCard share this base card style but differentiate through internal layout, not through different radius/shadow treatments.

---

## 26. Badges / Status

`radius.pill`, `text.sm` medium, colored text + tinted `.bg` token, no border. Used for lead status, campaign status, call status, confidence tier, and decision outcome (QUALIFIED / NOT QUALIFIED / REVIEW REQUIRED). Uppercase only for these short domain-status labels (§8).

---

## 27. Confidence Indicators — `ConfidenceIndicator`

Always shows three things together: the numeral (mono, e.g. `91%`), the tier label (`HIGH` / `MEDIUM` / `LOW`), and a color from `color.confidence.*`. Rendered two ways depending on context:
- **Inline badge** (tables, compact rows): pill badge, `91% · HIGH` — text only, no chart.
- **Detail form** (Decision card, Decision detail): numeral in `font.size.2xl` mono + a horizontal bar (not a circular gauge — a bar reads faster in a dense list of decisions) filled proportionally in the tier color, with threshold tick marks for "review required" vs "auto-action allowed" so the user can see where this decision fell relative to the campaign's configured threshold.

No separate "AI badge" wraps the indicator — the indicator itself, appearing next to a decision, is sufficient context.

---

## 28. Evidence Components

**`EvidenceSnippet`**: a quoted transcript fragment (max ~2 lines, truncated with "Show full transcript" link) paired with its detected signal as a small inline tag (e.g. "Budget confirmed"). Rendered as plain text on `background.surface` with a `border.subtle` left rule (4px, `text.muted` color) — a quiet quote treatment, not a colored highlight box.

**`EvidenceThread`**: the connective visualization from transcript → signal → decision. Rendered as a simple vertical sequence of three compact blocks connected by a thin vertical line (`border.default`, 1px), each block labeled by role (Statement / Signal / Decision) in `text.sm` `text.muted` — not a flowchart with arrows or icons, just a clean stacked trace a user reads top to bottom.

---

## 29. Decision Components — `DecisionCard`

Structure, top to bottom: decision badge (§26) + confidence indicator (§27) on one row; a one-line reason in `text.md`; up to two `EvidenceSnippet`s; recommended action vs. actual action shown as two labeled inline values (if they differ, actual is visually secondary/muted, signaling an override occurred); a footer row with Approve / Override / View trace actions where relevant (review-queue context) or just "View trace" (historical context).

---

## 30. Decision Trace — `DecisionTrace`

Collapsed by default under the DecisionCard, expandable via a plain text toggle ("View reasoning"). Expanded: a vertical step timeline — each step is a short label + one-line description (e.g. "Detected signal: budget confirmed → weight: high"), connected by a 1px vertical rule. This is the single most trust-building component in the product and gets the most whitespace of any list-style component (`space.4` between steps, not `space.2`).

---

## 31. Conversation Components — `ConversationStatePanel`

Two-column mini-layout inside a card: left column "Known," right column "Missing" (or a single list with each item tagged known/missing via a small dot indicator, `status.success`/`text.muted` respectively, if width is constrained). Below: current objective (single line), detected intent (badge), open objection if any (badge, `status.warning` color), and "Next question" as a quoted line in `text.secondary` italic-free plain style (no italics per typography rules — use color/weight instead of italic for this distinction).

---

## 32. Transcript Viewer — `TranscriptViewer`

Timestamped list, speaker label (Agent/Prospect) left-aligned in `text.secondary` small caps avoided — use medium weight instead, timestamp in mono `text.muted` right-aligned. Signal-relevant lines get a `border.subtle` left rule in the relevant semantic color (success/warning) at low opacity background tint — never a bright full-row highlight, which would compete with reading the actual words.

---

## 33. Timeline

Generic vertical timeline component (shared visual language with DecisionTrace) used for lead activity history and outcome progression. Dot + line + content block per entry; dot color reflects entry type (call = info, decision = confidence tier, outcome stage = success/muted).

---

## 34. Charts / Analytics

Line and bar charts only for MVP (no radial gauges, no 3D, no decorative area fills). Chart colors pull directly from the semantic palette — never a separate "chart palette." Filled data marks (bar fills, filled points) use the `.solid` variant of whichever accent/status token applies (§6, §20), for the same contrast reason as buttons — the base token is legible as a thin line/text/border on dark backgrounds but too light as a large filled shape. Axis labels `text.sm`/`text.muted`, data labels in mono where precision matters (e.g. exact percentage on hover tooltip).

---

## 35. Panels / Drawers

Right-side slide-over drawer (`radius.lg` on the leading edge only, `shadow.lg`), used for: inspecting a decision from the ledger, viewing full transcript from a table row, CSV import flow. Width 480px desktop, full-width on mobile. Opens/closes at `motion.duration.base`.

---

## 36. Modals

Centered, `radius.lg`, `shadow.lg`, max-width 560px for confirmation-style modals (e.g. "Override this decision?"), 720px for form-style modals (e.g. quick lead creation). Always has an explicit close action and a clearly labeled primary action — no bare "OK."

---

## 37. Toasts / Notifications

Bottom-right stack, `radius.sm`, `shadow.md`, auto-dismiss at 5s for success, persistent until dismissed for errors. Copy matches the triggering action's verb exactly (§Product principle in the writing guidance: "Published" follows "Publish").

---

## 38. Empty States

Icon (single color, `text.muted`) + one-line explanation of what belongs here + a primary action to fill it (e.g. Leads empty: "No leads yet" / "Import your first leads to start a campaign" / [Import leads] button). Never a mascot illustration or decorative graphic — keep it text-and-icon, consistent with the product's restraint.

---

## 39. Loading States

List/table screens: skeleton rows matching the real row height (not a centered spinner replacing the whole screen). AI-specific processes use the named `AIStateBanner` (§ below) instead of a generic spinner wherever a real process name exists (see §18/§41 for exact states) — this is a hard rule: never show a bare spinner where a real state name is available.

---

## 40. Error States

Inline, next to the affected region, stating what failed and the retry action ("Couldn't load calls — Retry"). Full-page error only for total load failure of a route. No stack traces or technical detail in user-facing copy.

---

## 41. AI Process States — `AIStateBanner`

A single reusable banner component with these named states, each with icon + label + optional detail line:

```
ANALYZING CONVERSATION
EXTRACTING EVIDENCE
DECISION PENDING
REVIEW REQUIRED
AUTO-ACTION EXECUTED
OUTCOME PENDING
```

Plus the live-call subset (§ live call, MVP placeholder-level per product lock):
```
CALLING
CONNECTED
PROCESSING
COMPLETED
```
Visual treatment: `background.sunken`, colored left rule + icon matching the semantic mapping (pending/processing = `info`, review required = `warning`, executed = `success`, failed = `error`). The "Connected"/"Processing" live states may use the subtle pulse motion permitted in §16.

---

## 42. Lead Screens

**Leads (list)** — Route `/leads`. Table with columns: Name, Company, Status (badge, includes pipeline stage — Pipeline is folded into this status field, not a separate screen), Last activity, Confidence (if a decision exists), Owner. Filter bar: status, campaign, confidence tier, search. Primary CTA: "Add lead" (dropdown: manual / CSV import). CSV import opens as a drawer flow: upload → map columns → confirm → import summary toast.

**Lead Detail** — Route `/leads/:id`. Two-pane workspace. Left: identity block, key fields, call/activity history (Timeline). Right: latest `DecisionCard` + `DecisionTrace`, `ConversationStatePanel` if a call is in progress or was recent, recommended `ActionCard`(s). States: no decision yet (empty state: "No AI decision yet — schedule a call"), decision present, review required (banner at top of right pane), outcome resolved (OutcomeCard replaces/augments DecisionCard once an outcome exists).

---

## 43. Campaign Screens

**Campaigns (list)** — Route `/campaigns`. Table: Name, Status, Agent, Leads targeted, Qualification rate, Meetings booked. Primary CTA: "Create campaign."

**Create Campaign** — Guided flow, not a persistent nav destination: **Audience → Agent → Strategy → Threshold → Launch.** The Threshold step is a single global slider per the product lock: "Auto-act when confidence is above [X]%" — one control, plain-language framing, no per-action matrix in MVP. Strategy step is a simple selector (e.g. direct qualification vs. discovery-first) with a note that deeper strategy comparison lives in Strategies (Future).

**Campaign Detail** — Route `/campaigns/:id`. Overview KPIs (calls made, qualification rate, meetings booked), lead list scoped to campaign, agent + threshold summary with an edit link back into the relevant step.

---

## 44. Agent Screens

**Agents (list)** — Route `/agents`. Simple table/card list: name, objective, language, status.

**Agent Detail / Configuration** — Route `/agents/:id`. A structured form, not a visual flow builder (explicitly out of MVP scope): identity (name, voice/language), objective, qualification goal, permitted actions (checklist: book meeting, update lead status, send follow-up), basic autonomy note (references the campaign-level threshold rather than duplicating a control here).

---

## 45. Call Screens

**Calls (list)** — Route `/calls`. Table: Lead, Campaign, Agent, Duration, Status (includes the live states from §41 for in-progress calls), Decision outcome badge if resolved.

**Live call (placeholder-level, MVP)** — No dedicated route; represented as a state banner (`AIStateBanner`, live-call subset) inline wherever a call is in progress (Calls list row, Lead Detail). No live transcript streaming or real-time evidence UI in MVP — this is intentionally deferred per product lock.

**Call Detail** — Route `/calls/:id`. This is a flagship screen. Two-pane: left = `TranscriptViewer` with tabs for Transcript / Conversation State; right = resulting `DecisionCard` + `DecisionTrace` + evidence thread. This is where the core "conversation → evidence → decision" story is most concretely demonstrated.

---

## 46. Decision Screens

**Decisions (ledger)** — Route `/decisions`. Not a duplicate of the DecisionCard seen elsewhere — this is a review surface. Default filter: **Review Required**. Table/list of `ReviewQueueRow` items (compact: lead, decision, confidence, recommended action, Approve/Override inline buttons) with a filter bar (confidence tier, campaign, date range, status: all/review-required/auto-executed/overridden).

**Decision Detail** — Route `/decisions/:id`. Full `DecisionCard` + `DecisionTrace` + full evidence thread + resulting action + (once available) linked `OutcomeCard`.

---

## 47. Outcome Screens

**Outcomes** — Route `/outcomes`. Aggregate view, not a generic records table. Primary content: an outcome funnel (Decision → Meeting booked → Meeting attended → Opportunity → Conversion) shown as a horizontal stepper with counts/percentages at each stage, plus a simple "decision accuracy" figure (predicted-qualified vs. actually-converted) — the number that most directly proves the product's core promise. Below the funnel, a filterable list of individual `OutcomeCard`s for drill-down.

`OutcomeCard`: horizontal stepper of the same five stages, current stage highlighted, stalled/failed stage marked in `status.error` if applicable, linked back to its originating `DecisionCard`.

---

## 48. Strategy Screens (Future — muted teaser in MVP)

**Strategies** — Route `/strategies`. In MVP this renders as a real, reachable page (not a dead nav link) with: a one-paragraph explanation of what strategy comparison will do once enough outcome data exists, and — if any data exists — a simple read-only preview (e.g. qualification rate by strategy type, no comparison/experimentation controls yet). Visually consistent with the rest of the product, just clearly labeled "Coming later" near the page title, not faked as fully functional.

---

## 49. Dashboard

Route `/dashboard`. Top: KPI row (Calls made, Qualification rate, Meetings booked, Decision accuracy — the last one placed deliberately alongside the operational metrics, not buried in Outcomes, per the product lock). Below: two panels side by side — "Recent decisions" (compact `DecisionCard` list, review-required ones surfaced first) and "Campaign performance" (simple bar chart, top campaigns by qualification rate). No more than these regions in MVP — resist adding more charts than the product currently has real signal for.

---

## 50. Navigation / Routing Map

```
/dashboard
/leads
/leads/:id
/campaigns
/campaigns/new         (guided flow, not a persistent page)
/campaigns/:id
/agents
/agents/:id
/calls
/calls/:id
/decisions
/decisions/:id
/outcomes
/strategies            (muted/teaser)
/settings
```

---

## 51. Component Dependency Map

```
AIStateBanner        → used in: Calls list, Lead Detail, Call Detail
ConfidenceIndicator  → used in: DecisionCard, Decisions ledger, Lead Detail, Call Detail
EvidenceSnippet      → used in: DecisionCard, EvidenceThread, TranscriptViewer callouts
EvidenceThread       → used in: DecisionCard (expanded), Decision Detail
DecisionCard         → used in: Lead Detail, Call Detail, Decisions ledger/detail, Dashboard
DecisionTrace        → used in: DecisionCard (expandable), Decision Detail
ConversationStatePanel → used in: Lead Detail (active call), Call Detail
TranscriptViewer     → used in: Call Detail
Timeline             → used in: Lead Detail (activity), Outcomes (stage progression)
OutcomeCard          → used in: Outcomes, Lead Detail (once resolved), Decision Detail
ReviewQueueRow        → used in: Decisions ledger
ActionCard           → used in: Lead Detail, Decision Detail, Decisions ledger row actions
```

---

## 52. UX Interaction Rules

- Opening a transcript, trace, or evidence thread never navigates away from the current screen — it expands in place or opens a drawer.
- Approving or overriding a decision from the ledger updates the row in place with a toast confirmation; it does not force navigation to the detail page.
- Executing a recommended action always shows an in-progress state on the `ActionCard` itself before resolving to success/failure — never an instant silent state change.
- Filters persist within a session per screen (returning to Leads keeps the last filter set) but do not persist across screens.

---

## 53. Mock Data Requirements

Mock data lives under `mock/` mirroring the entity list in §54, and must be shaped exactly as the real Supabase response will be (same field names, same nesting) so swapping the data provider requires no component changes. Mock data must include realistic edge cases: a lead with no decision yet, a decision at exactly the confidence threshold boundary, a call with a failed/errored state, an outcome that stalled mid-funnel.

---

## 54. Backend Integration Contract

Conceptual entities the frontend expects, at minimum:

```
Organization, User, Lead, Campaign, Agent, Call, Transcript,
Evidence, Decision, Action, Outcome, Strategy
```

Data flow: `Page → Component → Hook (useLeads, useCampaigns, useAgents, useCalls, useDecisions, useOutcomes) → Service → Provider (mock today, Supabase later)`. No component or page calls a data provider directly. No Supabase client is instantiated outside the service layer. Suggested structure:

```
src/
  components/{ui, dashboard, leads, campaigns, agents, calls, decisions, outcomes, analytics}/
  pages/
  hooks/
  services/
  lib/
  routes/
  types/
  mock/
  utils/
  styles/
```

---

## 55. Future Extensibility

The architecture must not need to be rebuilt to add: SMS/WhatsApp channels, CRM/calendar integrations, live human takeover, multi-agent workflows, per-action confidence thresholds, live in-call transcript streaming, and full strategy experimentation. Each of these extends an existing hook/service/component rather than replacing one — e.g. per-action thresholds extend the existing campaign threshold step's data shape rather than requiring a new screen; live transcript streaming extends `TranscriptViewer` with a streaming data source rather than a new component.

---

## 56. Implementation Instructions for the AI Builder

1. Build Phase 1 (shell, tokens, routing, mock layer) completely before any screen — every subsequent phase depends on tokens and the hook/service pattern being correct.
2. Never hardcode a color, spacing, radius, or font value directly in a component — reference the token. If a needed value isn't listed above, add it to the token file first, then use it.
3. Never introduce a visual treatment (color, font, icon style) whose stated purpose is "to show this is AI-generated." Attribution to Resonology AI happens in copy, not in styling, per §2.
4. Reuse `DecisionCard`, `ConfidenceIndicator`, `EvidenceSnippet`/`EvidenceThread`, and `AIStateBanner` everywhere they fit (§51) rather than building screen-specific variants.
5. Every screen in §42–§49 must implement its full state set (loading, empty, populated, error, and the relevant AI process states) before being considered done — a screen with only the "happy path" populated state is incomplete.
6. When a phase is finished, confirm: existing routes still work, existing components are unchanged or extended (not duplicated), mock data still resolves through the hook/service layer, and the app is runnable end to end.
