# System Overview

- Status: Proposed architecture for Phase 01 review
- Scope: Browser-first single-player MVP, offline-ready, mobile-expandable

## Context

The product has a platform shell (catalogue, navigation, settings, offline status) and multiple independent games. The platform should own shared concerns while each game owns its own rules, rendering, and game-specific state.

## High-level architecture

```mermaid
flowchart TB
    USER[Player] --> WEB[Web App / PWA]
    WEB --> CATALOG[Game Catalogue]
    WEB --> LAUNCHER[Game Launcher]
    WEB --> SETTINGS[Settings and Local Profile]
    LAUNCHER --> HOST[Shared Game Host / Runtime Adapter]
    HOST --> G1[Game Module A]
    HOST --> G2[Game Module B]
    HOST --> GN[Additional Game Modules]
    HOST --> INPUT[Input Manager]
    HOST --> AUDIO[Audio Manager]
    HOST --> SAVE[Save Data Service]
    SAVE --> IDB[(IndexedDB)]
    WEB --> SW[Service Worker]
    SW --> CACHE[(Cache Storage)]
    WEB -. future .-> API[Optional Backend API]
    API -. future .-> CLOUD[(Cloud Saves / Accounts)]
    WEB -. future .-> CAP[Capacitor Native Shell]
    CAP -. future .-> AND[Android]
    CAP -. future .-> IOS[iOS]
```

## Responsibilities

### Web application shell

Owns navigation, catalogue views, preferences, connection state, accessibility shell, and the game-player container.

### Catalogue and game registry

Loads validated metadata and determines whether a game is enabled, supported, rights-cleared, and available offline.

### Game launcher / host

Creates the game environment, injects approved platform services, handles lifecycle, catches/report errors, and cleans up resources when a game closes.

### Game modules

Own game rules, rendering, game-specific assets, state transitions, and their own unit tests. They must not manipulate unrelated platform UI directly.

### Shared platform services

Provide input abstraction, audio lifecycle, local save operations, offline package status, and diagnostics through typed interfaces.

### Offline layer

Uses a service worker and Cache Storage for application/game assets, and IndexedDB for structured metadata, preferences, and save data. Exact implementation is subject to ADR approval.

### Optional future backend

May later support accounts, remote saves, leaderboards, or multiplayer. It is not required for the MVP and must not be introduced by assumption.

## Key architecture constraints

- No arbitrary execution of remote JavaScript game bundles.
- A game must be loaded from the trusted application build or a separately reviewed and integrity-checked package mechanism approved by ADR.
- Games must declare capabilities and required assets.
- The platform must not call a game offline-ready until all required files are available locally.
- Saves must be namespaced by game ID and schema version.
- A game must release timers, listeners, audio nodes, and rendering resources when destroyed.
- Shared services must be testable independently of the visual UI.

## Future architecture evolution

The initial architecture should leave seams for backend services and mobile adapters without implementing them prematurely. Any move to remote distribution, accounts, multiplayer, or server-side services requires its own requirements and ADR.
