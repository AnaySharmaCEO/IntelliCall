# 01: Design System and App Shell

## 1. Visual direction

Mature B2B SaaS that people use daily. References for *structure only*: Linear (density, status, keyboard), Attio (relational records, saved views), Gong (conversation as evidence). Not a generic AI demo.

- **Accent:** one restrained blue. Everything else neutral.
- **No** purple gradients, glows, sparkles, robot imagery, or decorative AI textures. The only "AI" visual is a small neutral `AI` badge beside AI-derived values.
- Flat surfaces, 1 px borders, soft shadows only on floating layers (menus, drawers, modals).
- Data density: comfortable by default, compact toggle for tables.

## 2. Tokens (`styles/tokens.css`, light and dark via CSS variables)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #FAFAFB | #0E1116 | App background |
| `--surface` | #FFFFFF | #151A21 | Cards, tables |
| `--surface-2` | #F3F4F6 | #1B222B | Subtle panels, zebra |
| `--border` | #E4E7EC | #2A323D | Borders |
| `--text` | #101828 | #E6E9EF | Primary text |
| `--text-muted` | #667085 | #98A2B3 | Secondary text |
| `--accent` | #2563EB | #5B8DEF | Primary actions, links, selection |
| `--accent-soft` | #EAF1FE | #172644 | Accent backgrounds |
| `--success` | #12805C | #3DBE8B | Success states |
| `--warning` | #B54708 | #F0A64B | Needs attention |
| `--danger` | #C0362C | #F2776E | Failures |
| `--info` | #175CD3 | #6AA3FF | Informational |
| `--pending` | #667085 | #98A2B3 | Pending/neutral |

Verify contrast ≥ 4.5:1 for text and ≥ 3:1 for UI components; adjust hex values if the validator fails. Do not rely on color alone: every status has a label and an icon.

Typography: system UI stack or Inter; Noto Sans Devanagari for Hindi text. Scale: 12 / 13 / 14 (base) / 16 / 20 / 24 / 30. Tabular numerals for all metrics and tables. Radius 8 px (cards), 6 px (inputs), 999 px (chips). Spacing scale 4 px base.

## 3. Status vocabulary (single source: `contracts/enums.ts` + `StatusChip`)

| Domain | Values → chip color |
|---|---|
| Lead stage | `new` (neutral), `contacted` (info), `qualifying` (info), `qualified` (success), `meeting_proposed` (warning), `meeting_booked` (success), `nurture` (neutral), `disqualified` (danger-muted), `do_not_call` (danger) |
| Qualification | `unknown`, `in_progress`, `qualified`, `not_qualified`, `needs_review` |
| Call status | `queued`, `dialing`, `ringing`, `in_progress`, `completed`, `no_answer`, `busy`, `voicemail`, `failed`, `blocked_compliance`, `cancelled` |
| Analysis status | `pending`, `analyzing`, `complete`, `failed` |
| Campaign | `draft`, `scheduled`, `running`, `paused`, `completed`, `stopped`, `failed_preflight` |
| Appointment | `proposed`, `confirmed`, `rescheduled`, `completed`, `no_show`, `cancelled`, `booking_failed` |
| Task | `open`, `due_soon`, `overdue`, `completed`, `cancelled` |
| Review item | `open`, `in_review`, `approved`, `corrected`, `rejected`, `auto_resolved` |
| Action attempt | `proposed`, `executing`, `succeeded`, `failed`, `retrying`, `skipped_by_policy` |
| Compliance | `clear`, `dnd`, `no_consent`, `outside_window`, `suppressed`, `unknown` |
| Provider/system | `operational`, `degraded`, `outage`, `not_configured` |

## 4. Pattern components (build all in P1, with stories/gallery at `/__kit`)

| Component | Behaviour |
|---|---|
| `KPICard` | Label, big number, delta vs previous period with direction and period label, sparkline, tooltip with formula, click → filtered list. Variants: outcome, attention (links to queue), neutral |
| `FunnelChart` | Stages with count and stage-to-stage %, hover tooltip, click stage → leads filtered |
| `InsightCard` | Statement ("18 calls raised pricing objections"), supporting stats, **evidence excerpts (max 3)**, "What this does / doesn't establish", CTA "Review these calls" |
| `ActionQueue` | Prioritized list with severity, age, owner, inline primary action, "View all" |
| `EvidencePanel` | Decision statement, model confidence meter (labelled uncalibrated), evidence quotes with speaker/time, "Play span", "Jump to transcript", policy outcome (auto-applied vs needs review and why) |
| `EvidenceChip` | Small chip `▶ 02:14` or `“…quote…”`; click scrolls transcript to the segment and highlights; hover shows quote |
| `ConfidenceMeter` | Segmented bar + number + tooltip "Model self-reported confidence; not a calibrated probability" |
| `StatusChip` | From §3 with icon + label |
| `DataTable` | TanStack Table, sticky header, column picker, density, multi-sort, row selection with bulk bar, saved views, virtualization, empty/error/loading, row click → drawer or page, keyboard nav, CSV export |
| `FilterBar` | Search, chips, "Add filter" with typed filters, saved view dropdown, "Clear" |
| `EntityDrawer` | Right side panel 480-720 px; header with prev/next record; tabs; keeps list context |
| `Timeline` | Vertical event list with actor (human/AI/system), icon, timestamp, expandable payload |
| `AuditTrail` | Timeline specialised for decisions and actions (who/what/why/result) |
| `EmptyState` | Illustration-free icon, one-line explanation, primary CTA, secondary link |
| `ErrorState` | Message from error code, Retry, "Copy request ID" |
| `PermissionGate` | Hide/disable/replace-with-lock based on permission |
| `Stepper/Wizard` | Left step list, validation per step, draft autosave, review step |
| `AudioPlayer` | Wavesurfer, speed 0.75-2×, segment markers for evidence, click-to-seek from transcript |
| `TranscriptView` | Speaker labels (Agent/Lead), timestamps, language tag, Devanagari ↔ Roman toggle, search with highlights, evidence-highlighted segments, follow-live mode |
| `CallStateBadge` | Live pulsing dot only for `in_progress` (respect reduced-motion) |
| `PhoneText` | Formats +91 numbers, copy button, masked variant by role |
| `CurrencyText` | ₹ en-IN formatting, compact option (₹1.2L, ₹3.4Cr) |
| `RelativeTime` | "3 min ago" with exact tooltip in org timezone |
| `ComplianceBadge` | DND/consent/window status with explanation tooltip |
| `ChannelBadge` | `Web demo` vs `PSTN` |

## 5. App shell

**Left sidebar (collapsible, 240 / 64 px)**
1. Org switcher (avatar, org name, plan tag; menu: switch org, create org, org settings)
2. Primary nav, in this order: **Dashboard · Leads · Campaigns · Calls · Review Queue (count badge) · AI Agents · Appointments · Follow-ups · Insights · Compliance**
3. Secondary: **Notifications (badge) · Audit Log · Settings**
4. Footer: usage meter (call minutes this month), help menu (docs link, keyboard shortcuts, send feedback), user menu (profile, theme, sign out)

Nav items are permission-gated. Counts: Review Queue open items, overdue follow-ups on Follow-ups.

**Top bar**
- Breadcrumbs (page title + parents)
- Global search field (opens ⌘K palette)
- Environment chip: `Demo data` (mock mode) or `Live` and a **Telephony mode chip** `Web demo` / `PSTN ready` / `Provider issue`
- **Live calls indicator** ("3 live") → `/calls/live`
- Notifications bell (dropdown of latest 8 + "View all")
- Help (?) and user avatar

**Global overlays**
- **Command palette (⌘K / Ctrl+K):** sections: *Navigate*, *Recent records*, *Create* (New lead, New campaign, New agent, Schedule follow-up, Import leads), *Actions* (Pause all campaigns, Toggle theme), *Search results* (leads, calls by transcript text, campaigns, agents, appointments). Shows shortcut hints.
- **Keyboard shortcuts sheet (`?`):** `g d` dashboard, `g l` leads, `g c` campaigns, `g a` calls, `g r` review, `c` create (context), `/` focus search, `j/k` move in lists, `Enter` open, `Esc` close, `[` `]` previous/next record in drawer.
- **Toasts** for success/failure; long-running tasks (import, launch, export) appear in a **Background Tasks tray** in the top bar with progress and retry.
- **Offline/connection banner** when realtime disconnects ("Live updates paused. Reconnecting…").
- **Session-expired modal**, **Maintenance banner** slot, **Demo Controls** (dev only).

## 6. Layout archetypes

1. **List page**: title + primary action, FilterBar, DataTable, optional right drawer.
2. **Record page**: header (title, status, key facts, actions), tab bar, two-column body (main + context rail).
3. **Workspace page** (Live calls, Review, Appointments): split panes with persistent selection.
4. **Wizard**: full-screen focus mode with stepper and sticky footer (Back / Save draft / Next).
5. **Settings**: left sub-nav + form sections with "Save" footer and dirty-state guard.

## 7. Formatting rules (`lib/format.ts`, only place formatting happens)

- Currency: `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'})`; compact for KPI cards.
- Dates: org timezone (default `Asia/Kolkata`), `dd MMM yyyy, hh:mm a`; relative in tables with absolute tooltip.
- Duration: `m:ss` under 1 h, `h:mm:ss` above.
- Phone: E.164 stored, displayed `+91 98765 43210`; masked `+91 98••• ••210` for roles without PII permission.
- Percentages: one decimal; always show numerator/denominator in tooltip.
- Large numbers: Indian grouping in tables.
- Hindi text: `lang="hi"` attribute, Noto Sans Devanagari, line-height ≥ 1.6.

## 8. Motion

150-200 ms ease-out for drawers/menus, none for data. No parallax or looping decoration. Live pulse only on active calls. Honour `prefers-reduced-motion`.

## 9. Copy tone

Plain, specific, neutral. Errors say what happened and what to do. Never anthropomorphize ("the AI thinks"); say "The model estimated".
