# IntelliCall / Resonology AI

**Autonomous Enterprise Voice AI & Conversational Intelligence Platform**

Welcome to the public-facing repository for IntelliCall (formerly Resonology AI). This repository hosts open-source artifacts, public release snapshots, benchmarks, and community documentation.

---

## Repository Structure

```
.
├── V2_IntelliCall/               ← Complete IntelliCall V2 Prototype & Architecture Snapshot
│   ├── frontend/                 ← React 19 + Vite + Tailwind CSS User Interface
│   ├── supabase/                 ← PostgreSQL Schema, Migrations & Core Backend Architecture
│   ├── docs/                     ← Technical Specifications, Architecture Guides & Protocols
│   ├── scripts/                  ← Deployment & Cloud Setup Utilities
│   └── work_log.md               ← Development Milestones & Comprehensive Changelog
├── LICENSE                       ← Open-Source Licensing
└── README.md                     ← Repository Overview & Showcase Documentation
```

---

## IntelliCall V2 Overview

The `V2_IntelliCall/` directory preserves the full V2 baseline architecture:
- **Real-Time Voice Streaming:** Sub-second speech-to-speech AI agent interaction via Google Gemini Live API.
- **Multimodal Calling Interface:** Integrated web phone simulator, live call monitoring, barge-in controls, and supervisor takeovers.
- **Enterprise CRM & Pipelines:** Campaign playbooks, dynamic qualification questions, live objection handling, and automated appointment scheduling.
- **Post-Call Intelligence:** Asynchronous conversational extraction (sentiment analysis, intent classification, action items, and compliance auditing).

---

## Releases & Roadmap

* **V2 Snapshot:** Located under [`V2_IntelliCall/`](./V2_IntelliCall/).
* **V3 Hardened Platform:** Core proprietary models, high-performance AudioWorklet DSP engines (`packages/engine`), and regulatory compliance packs are developed privately and exported here as public release snapshots.

---

## Author & Attribution

* **Author:** Anay Sharma <gamingxjanata@gmail.com>
* **Lead Organization:** Resonology AI / IntelliCall
