# ADR-0001: Web Application Technology Stack

- Status: PROPOSED — owner decision required
- Date: To be completed
- Decision owner: To be completed

## Context

The project needs a maintainable browser-first application with a catalogue UI, 2D game modules, offline support, automated testing, and a later mobile packaging option.

## Candidate approach

- TypeScript as the primary language
- React for platform UI
- Vite as development/build tooling
- Phaser as the leading candidate for the 2D game runtime, pending a short proof of concept against Canvas 2D
- IndexedDB for structured local data
- Service Worker + Cache Storage for offline assets
- Vitest and Playwright for testing
- Capacitor to evaluate during the mobile phase

## Alternatives to compare

- Vue or another UI framework instead of React
- Plain TypeScript/Canvas instead of a game engine
- Another maintained browser game engine instead of Phaser
- A different PWA/service-worker integration

## Evaluation criteria

- Browser and mobile-browser support
- Offline and asset-loading behavior
- TypeScript support and developer experience
- Rendering performance for target games
- Bundle size and load time
- Accessibility integration for the platform shell
- Maintenance/community health and documentation
- License compatibility
- Ease of testing and future mobile packaging

## Recommendation

Use React + TypeScript + Vite for the platform UI as the default candidate. Run a small technical spike comparing Phaser with Canvas 2D for the intended first game and likely game genres. Do not finalize the game runtime until the spike and license/compatibility checks are reviewed.

## Consequences

To be completed after owner decision and technical spike.

## Owner decision

- Decision: PENDING
- Rationale/comments: To be completed
- Approved by: To be completed
- Date: To be completed
