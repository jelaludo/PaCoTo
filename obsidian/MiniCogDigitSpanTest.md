---
repo: MiniCogDigitSpanTest
path: C:\01_Projects\01a_Coding\02_CodingProjects\MiniCogDigitSpanTest
url: https://github.com/jelaludo/MiniCogDigitSpanTest
status: active
priority: P1
progress: 0.3
deployed: false
environment: github-pages
last_touched: 2026-03-06
next_action: Add references, longer tests, more test types (QDRS, SLUMS, SAGE)
blocker: false
tech_stack: [html, css, javascript]
area: tools
complexity: medium
tags: [cognitive-screening, open-source, healthcare, anti-scam]
launch:
  editor: code "C:\01_Projects\01a_Coding\02_CodingProjects\MiniCogDigitSpanTest"
  terminal: wt -d "C:\01_Projects\01a_Coding\02_CodingProjects\MiniCogDigitSpanTest"
  dev: start "" "C:\01_Projects\01a_Coding\02_CodingProjects\MiniCogDigitSpanTest\index.html"
---

## Goal

Open-source, transparent cognitive screening PoC that demonstrates how validated assessments (Mini-Cog, Digit Span) actually work — exposing the difference between legitimate tools and scam sites that monetize anxiety without clinical context.

## Scope

**Includes:**
- Mini-Cog Word Recall (Borson et al., 2000) — 3-word registration, arithmetic distractor, free recall
- Digit Span Forward & Backward (WAIS-IV component) — adaptive, ends after 2 consecutive failures
- Transparent scoring with normative context
- Clinical disclaimers and source attribution
- Future: QDRS (Quick Dementia Rating System), SLUMS, SAGE, AD8

**Excludes:**
- Clinical diagnosis claims
- Data storage / PHI
- Clock-drawing test (not feasible in digital format)

## Roadmap

- [x] Mini-Cog word recall with distractor task
- [x] Digit Span forward and backward
- [x] Scoring with normative interpretation
- [x] Anti-scam comparison panel
- [ ] Add proper academic references (Borson 2000, Wechsler WAIS-IV, Regenstrief)
- [ ] Longer / configurable test durations
- [ ] Additional assessments: QDRS, SLUMS, SAGE, AD8
- [ ] Multiple word sets (randomized)
- [ ] Deploy to GitHub Pages

## Current State

Working single-file HTML PoC. Both tests functional. No build step required.

## Decisions

- Single HTML file — no framework, no build tooling. Keeps it honest and auditable.
- Arithmetic distractor prevents phonological rehearsal (Baddeley's working memory model).
- Digit Span starts at 3 digits, adaptive increase, 2 consecutive failures = phase end.
- Fuzzy matching on recall (first 3 chars) — mirrors clinical lenience for spelling.

## Risks / Unknowns

- Clock-drawing (part of full Mini-Cog) omitted — reduces clinical validity but unavoidable in digital.
- QDRS is caregiver-reported — different UX pattern needed.
- Must maintain clear "not diagnostic" disclaimers.

## Links

- Repo: https://github.com/jelaludo/MiniCogDigitSpanTest
- Mini-Cog: https://mini-cog.com
- Regenstrief passive digital marker: open-source, no licensing fee
- QDRS: companion tool from JAMA trial
