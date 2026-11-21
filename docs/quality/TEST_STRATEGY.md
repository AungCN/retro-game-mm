# Test Strategy

## Testing layers

### Unit tests

Test domain types, manifest validation, lifecycle transitions, game rules, save serialization/migration, input mapping, and utility functions.

### Integration tests

Test game registry to launcher flow, host-to-game contract, IndexedDB adapter, cache/install-state adapter, and error handling.

### End-to-end tests

Test catalogue navigation, game launch/exit, settings, responsive behavior, and key user journeys in agreed browsers using Playwright or an approved equivalent.

### Manual exploratory tests

Human reviewer plays the game, tests keyboard/touch, checks visual behavior, restarts the app, tests offline mode, and verifies recovery flows.

## Required scenarios for every game

- first launch
- repeated launch/exit
- pause/resume
- resize/orientation behavior
- supported input types
- unsupported input handling
- save/restore if supported
- storage failure if save is supported
- offline launch if offline is supported
- destroy/cleanup with no continuing timers or listeners

## Offline test matrix

| Scenario | Expected result |
|---|---|
| First visit, online | App loads; game can be prepared |
| First visit, offline | Explain that initial setup is required |
| App cached, game not cached | App opens; game is marked unavailable offline |
| Game fully cached, offline | Game launches without network |
| Partial install | Game is not marked offline-ready |
| Offline after browser restart | App and installed game still launch |
| Storage quota/error | Clear message; existing data is preserved where possible |
| New game version | Existing working package is not destroyed before update succeeds |
| Any page served offline by the service worker | `crossOriginIsolated` is still `true` |

## BYOR (PS1 player) tests — added in Phase 01

### Test fixtures (owner decision D5)

- Only openly licensed homebrew or project-generated files, with provenance recorded in the relevant spec or spike report.
- Committed fixtures must be ≤ 1 MB each. Larger files are fetched by a script and verified by SHA-256, or generated locally (for example a random-data file for memory and throughput tests), into the gitignored `test-fixtures/local/`.
- Never ROMs, commercial disc images, or BIOS files.

### Tier matrix

| Scenario | Tier 1 (desktop Chromium) | Tier 2 (desktop Safari, Firefox) | Mobile |
|---|---|---|---|
| Capability report and gating | Supported | Supported, limited | `UNSUPPORTED` message |
| `crossOriginIsolated` (dev, preview, offline) | Asserted | Asserted | — |
| Link disc | File System Access handle | D3 mechanism (OPFS copy or session file) | — |
| Relaunch after browser restart | `NEEDS_PERMISSION` → re-grant → play | OPFS copy present, or re-select session file | — |
| File moved/renamed | `OFFLINE_UNAVAILABLE` + re-link | n/a for OPFS copy | — |
| Memory card persistence | Asserted | Asserted | — |
| Save export/import `.zip` | Should | **Must** (FR-022) | — |
| Performance vs PS1 target | Gated | Measured and reported | — |

### Automation limits

- File pickers (`showOpenFilePicker`) and permission prompts need a real user gesture and cannot be driven reliably by test automation. These are manual checklist items. A file *input* can be filled through the DevTools protocol (as SPIKE-001 did) for OPFS and session-file tests.
- Playwright's WebKit build is not Safari. Safari-specific behavior (storage eviction, permission prompts, WebGPU) needs a manual Safari pass.
- Memory measurement: `performance.measureUserAgentSpecificMemory()` is available only in Chromium and only on cross-origin isolated pages. Elsewhere, record "not measured".

### Required BYOR scenarios

- Unsupported browser/tier shows the capability message and never loads the core
- Disc linked, launched, paused, resumed, exited; iframe and workers removed afterwards
- Range reads used for disc access; whole-file loading measured and documented if the core requires it
- Save state from another core version is rejected
- `.m3u` multi-disc swap
- No network request carries user data (verified with network logging and `connect-src 'self'`)

## Browser/device coverage

The BYOR tier matrix above is the agreed starting point (SCR-001). At minimum, include current stable versions of the selected desktop browsers and a representative Android/iOS mobile browser. Verify current device coverage when implementation begins; do not assume emulation replaces real-device checks.

## Test reporting

For every phase record command, environment, pass/fail/skip result, and known limitation. Never report a test as passed if it was not run. Keep flaky tests visible rather than hiding them through repeated retries.
