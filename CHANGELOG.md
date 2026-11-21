# Changelog

All notable project changes should be recorded here. This file tracks the project, not dependency-generated release notes.

## Unreleased

- Created the documentation-first project starter kit.
- Defined the browser-first, offline-capable, modular game-platform concept.
- Added human approval gates and phase-based AI workflow.
- Added proposed architecture, task briefs, review templates, and governance logs.
- No application source code or production dependency has been added.
- Board games: Chess, Checkers, Reversi (computer opponent in a worker, two-player mode, undo, autosave); library search/filter; keyboard fix for toolbar buttons; 101 unit and 9 e2e tests.
- Draft v0.1 (DEC-003 draft-first mode, branch `draft/v0.1-first-build`):
  - app shell, Comet Courier, the PS1 BYOR player in a two-layer sandbox;
  - offline service worker and emulator package; save backups;
  - security headers and CSP; threat model; GPL-3.0 LICENSE;
  - 77 unit tests and 5 e2e tests (Chrome).
- Phase 01 (accepted): manifest schema v1 with platform/adapter rules; ADR-0001/0002/0003 updates; contract v2; BYOR data model; Phase 04B roadmap; SPIKE-002 PS2 desk probe; SPIKE-001 interim Chrome results.
- SCR-001: aligned product docs with BYOR PS1 in MVP and experimental post-MVP PS2; reset pre-filled ADR-0002/0003 owner fields; added `docs/product/SCOPE_CHANGE_001_BYOR.md` and DEC-002.
