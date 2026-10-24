# docs_index.md

Start here. New files use lowercase snake_case; older files are uppercase. Names will be unified in a later clean-up PR; do not rename them in a feature PR.

| Document | Read it if you | Status |
|---|---|---|
| `../AGENTS.md` (repo root) | are an IDE agent (read first, every session) — **create this file if it doesn't exist** using §12 of `engineering_standards.md` | Binding |
| `engineering_standards.md` | write any code | Binding |
| `FRONTEND_SPEC.md` | build or review the frontend | Master spec |
| `frontend/01..06-*.md` | work on a specific screen, contract, or mock | Detail specs |
| `frontend/reference/` | need the visual target (`IntelliCall Screens.html` — open in browser; no PNGs yet) | Reference |
| `frontend_update.md` | migrate the old frontend to the new screens | Instruction, phases F0 to F5 |
| `backend_update.md` | build the Supabase backend | Instruction, phases B0 to B9 |
| `security_and_privacy.md` | touch auth, data, calls, AI, or secrets | Binding |
| `environment_and_secrets.md` | add or use configuration | Binding |
| `testing_strategy.md` | add a feature or change CI | Binding |
| `deployment_and_ci.md` | ship, release, or demo | Binding |
| `voice_and_ai_service.md` | work on the voice worker or AI service | Binding |
| `ai_llm_architecture.md` | connect LLM, select models, engineer low latency, or integrate voice | Binding |
| `implementation.md` | need the concrete execution roadmap, phase order, and checkpoints | Master Guide |
| `COMPETITIVE_BENCHMARK.md` | want context on why features exist | Context |
| `PHASE_PROMPTS.md` | want copy-paste prompts to hand to the IDE agent for each phase | Instruction |
| `frontend/DECISIONS.md` | want to know why a small choice was made | Log, append only |
| `frontend/MIGRATION_MAP.md` | are mid-migration (created in F0) | Working doc |
| `backend/AUDIT.md` | are starting backend work (created in B0) | Working doc |
| `adr/` | want the reasoning behind a major decision | Records |

## Precedence when documents disagree
1. `security_and_privacy.md`, `ai_llm_architecture.md`, and `AGENTS.md`
2. `engineering_standards.md`
3. `implementation.md`, `backend_update.md`, and `frontend_update.md` (newer than the specs)
4. `FRONTEND_SPEC.md` and `frontend/*.md`
5. Reference screens (visual only)

If two documents conflict, follow the higher one and fix the lower one in the same PR.

## Where to record things
- Small choice while building → `frontend/DECISIONS.md` (or a `backend/` equivalent).
- Major, hard-to-reverse choice → new file in `adr/` (copy the previous one's headings).
- Changed behavior → update the relevant spec in the same PR.
