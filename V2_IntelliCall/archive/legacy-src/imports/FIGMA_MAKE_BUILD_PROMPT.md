# IntelliCall — Figma Make Build Prompt

Paste this into Figma Make along with the two attached files:

- `INTELLICALL_FRONTEND_DESIGN_SYSTEM.md`
- `intellicall_design_system_reference.html`

---

You are building the frontend for **IntelliCall**, a B2B AI conversation-operations and decision platform. The AI intelligence layer inside it is called **Resonology AI** — keep these two names distinct throughout; IntelliCall is the product, Resonology AI is the engine that powers it, and it should never take over the product's own branding or visual identity.

## Source of truth

Two attached files are the complete specification. Treat them as authoritative and do not deviate from them without a clear reason stated back to me:

1. **`INTELLICALL_FRONTEND_DESIGN_SYSTEM.md`** — the full specification: design tokens (color, type, spacing, radius, shadow, motion), every reusable component (buttons, tables, cards, `ConfidenceIndicator`, `EvidenceSnippet`, `EvidenceThread`, `DecisionCard`, `DecisionTrace`, `ConversationStatePanel`, `TranscriptViewer`, `OutcomeCard`, `ReviewQueueRow`, `ActionCard`, `AIStateBanner`), every screen (purpose, layout, states, interactions), the routing map, and the frontend architecture (`Pages → Components → Hooks → Services → Supabase`).
2. **`intellicall_design_system_reference.html`** — a working visual reference showing the token system, component styling, and light/dark themes applied together in one screen. Use it to confirm exact visual treatment (spacing, color values, component shape) whenever the `.md` file's description leaves any ambiguity.

If anything in this prompt conflicts with the two files, the files win.

## Non-negotiable rules

- Never hardcode a color, font, spacing, radius, or shadow value — always reference the design tokens defined in the `.md` file.
- Resonology AI gets no dedicated color, font, or layout treatment used to visually mark "this is AI-generated." It is named in copy at the moment a decision, evidence, or analysis is attributed to it — never as a persistent visual brand layer. The interface stays unified.
- In dark mode specifically: use `color.action.primary` (and equivalent tokens) for text/links/borders/active states, and the separate `.solid` variant for any solid-filled surface (buttons, chart bars, filled dots). Do not use the same token for both roles — the `.md` file explains why.
- All data flows through hooks and services (`useLeads`, `useCampaigns`, `useAgents`, `useCalls`, `useDecisions`, `useOutcomes`), backed by mock data now, structured so the real Supabase integration can replace the mock layer later without touching any component or page.
- Reuse shared components everywhere they apply (`DecisionCard`, `ConfidenceIndicator`, `EvidenceSnippet`/`EvidenceThread`, `AIStateBanner`, etc.) rather than building screen-specific one-offs.
- Every screen must implement its full state set — loading, empty, populated, error, and the relevant AI process states — not just the populated "happy path."
- Don't overbuild. This is an MVP for a small team, not an enterprise platform. Prioritize a complete, working, consistent product loop over volume of features.

## Build in exactly 4 phases

Each phase must end in a **fully working, runnable application state** — never a set of disconnected screens. At the end of each phase, confirm explicitly:

```
WHAT EXISTS
WHAT THIS PHASE ADDS
WHAT MUST NOT BREAK
WHAT COMES NEXT
```

---

### Phase 1 — Foundation

- Application shell: sidebar navigation, topbar, routing (per the routing map in the `.md` file)
- Full design token implementation (light + dark, with the toggle behavior described in the `.md` file)
- Base UI components: buttons, inputs, selects, tabs, tables, cards, badges, modals, drawers, toasts
- Mock data layer and service/hook architecture (Supabase-ready, not Supabase-connected yet)
- Responsive foundations and accessibility baseline (keyboard nav, focus states, contrast)

### Phase 2 — Core Operations & Conversation

- Dashboard (KPI row + recent decisions panel + campaign performance panel)
- Leads (list with pipeline status folded in, CSV import flow, Lead Detail two-pane workspace)
- Campaigns (list, guided Create Campaign flow ending in the single global confidence-threshold step, Campaign Detail)
- Agents (list, simple configuration form — no visual flow builder)
- Calls (list including live-call state banner placeholder, Call Detail with `TranscriptViewer` and `ConversationStatePanel`)

### Phase 3 — Intelligence

- `EvidenceSnippet` / `EvidenceThread` fully wired into Lead Detail, Call Detail, and Decision screens
- `DecisionCard` and expandable `DecisionTrace` fully wired everywhere they're used
- Decisions ledger, defaulting to the Review Required filter, with `ReviewQueueRow` approve/override actions
- Confidence-based autonomy behavior: decisions above the campaign threshold show as auto-executed, decisions below route to review
- `ActionCard` for recommended workflow actions (book meeting, send follow-up) with execute/dismiss states

### Phase 4 — Outcomes, Analytics & Polish

- Outcomes: the Decision → Meeting booked → Meeting attended → Opportunity → Conversion funnel, plus individual `OutcomeCard`s
- Decision-accuracy figure surfaced on the Dashboard (predicted-qualified vs. actually-converted)
- Strategies page as an honest, reachable "Coming later" teaser — never faked as fully functional
- Settings (workspace, users, integrations, voice/booking configuration — minimal, MVP-scoped)
- Full pass on every screen's state set (loading, empty, error, partial data, action in-progress/success/failure)
- Responsive, accessibility, and visual-consistency pass across the whole app end to end

---

Confirm you've reviewed both attached files before starting Phase 1, then begin.
