# Retro Arcade — AI-Assisted, Human-Governed Project Starter Kit

A documentation-first starter kit for building a modular retro-style game collection that runs in modern web browsers, supports offline play, and can later be packaged for Android and iOS.

> **What this bundle is:** a product, architecture, AI workflow, task-planning, and evaluation blueprint.
>
> **What this bundle is not:** a finished game application. The source folders are intentionally scaffolding only. Technology choices are proposals until the project owner accepts the relevant architecture decision records (ADRs).

## Product concept

Build a browser-first arcade hub containing independently maintained game modules. Users can discover a game, open its details, launch it, play with keyboard/touch/controller input where supported, and retain local progress. The platform should clearly show which games are installed and playable offline. A later release may add accounts, cloud synchronization, leaderboards, multiplayer, and native mobile packaging.

**Initial assumption:** online/offline refers to single-player games being playable with or without an internet connection. Online multiplayer is explicitly out of the initial MVP unless the owner changes the scope.

## Core principles

1. **Browser-first:** the web application is the primary product, not a thin mobile-app prototype.
2. **Offline by design:** offline requirements shape the architecture from the beginning; implementation is delivered in a dedicated phase.
3. **Modular games:** each game has a manifest, a documented contract, isolated assets, and its own tests.
4. **Human approval gates:** the AI may propose, implement, and test, but it cannot approve its own plan, accept a phase, merge to the protected branch, or release.
5. **Rights-cleared content:** only original, public-domain, or appropriately licensed code, game names, art, sound, and other assets may be distributed.
6. **Small changes:** implement one approved task at a time, with reviewable commits and evidence.

## Start here

1. Read `GOALS.md` and `AGENTS.md`.
2. Review the assumptions in `docs/product/PRODUCT_REQUIREMENTS.md`.
3. Work through `tasks/phase-00-project-discovery.md` without writing application code.
4. Record decisions in `docs/decisions/` and have the owner approve them.
5. Only then begin Phase 01 and subsequent implementation phases.

## Repository map

- `AGENTS.md` — rules for AI coding agents.
- `GOALS.md` — product vision, boundaries, and success outcomes.
- `PLANS.md` — master roadmap and human-controlled phase status.
- `PROMPTS.md` — reusable prompts for discovery, planning, implementation, review, and correction.
- `docs/product/` — product requirements, MVP scope, user flows, and content policy.
- `docs/architecture/` — system, game-module, offline, data, and mobile architecture.
- `docs/design/` — UI and design-system guidance.
- `docs/decisions/` — Architecture Decision Records (ADRs).
- `docs/quality/` — testing, security, accessibility, and release expectations.
- `docs/games/` — reusable per-game specification template and first-game decision brief.
- `tasks/` — phase-specific implementation briefs and acceptance criteria.
- `evaluations/` — human review guidance and forms.
- `harness/` — build, decision, and review logs for AI-assisted work.
- `src/`, `public/`, and `tests/` — suggested future application folders, not a working application yet.

## Status and approval policy

Use the status vocabulary in `PLANS.md`. The project owner is the only person who may set a human approval decision to `APPROVED` or a phase to `ACCEPTED`. AI agents must not edit owner-only approval fields. Approval must be explicit in the relevant phase file or a recorded review, not inferred from silence or from successful automated tests.

## Suggested initial technical direction

Candidate stack for evaluation in Phase 01:

- React + TypeScript + Vite for the web application shell.
- A 2D browser game runtime such as Phaser, subject to a small technical spike and ADR approval.
- IndexedDB for structured local saves and metadata.
- Cache Storage + a service worker for offline application/game assets.
- Vitest for unit tests and Playwright for browser/end-to-end tests.
- Capacitor as a candidate packaging route for a later Android/iOS phase.

Do not install or commit dependencies solely because they appear in this list. Confirm current compatibility, maintenance status, licensing, and project fit before selection.

## First milestone

The first milestone is a reviewed and approved product/technical plan—not a playable game. Once Phase 00 and Phase 01 are accepted, build the smallest end-to-end vertical slice: one rights-cleared game launched from the catalogue, with input, pause/resume, local save/restore where meaningful, and a documented offline test.
