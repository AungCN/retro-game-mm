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

## Browser/device coverage

Agree a support matrix in Phase 00. At minimum, include current stable versions of the selected desktop browsers and a representative Android/iOS mobile browser. Verify current device coverage when implementation begins; do not assume emulation replaces real-device checks.

## Test reporting

For every phase record command, environment, pass/fail/skip result, and known limitation. Never report a test as passed if it was not run. Keep flaky tests visible rather than hiding them through repeated retries.
