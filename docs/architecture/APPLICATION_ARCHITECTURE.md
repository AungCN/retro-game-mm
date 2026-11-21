# Application Architecture

## Proposed application layers

1. **Presentation layer:** pages, components, design tokens, navigation, responsive behavior.
2. **Application layer:** catalogue use cases, launch flow, settings, download/offline actions.
3. **Domain layer:** game descriptors, platform state, game lifecycle types, validation rules.
4. **Game host layer:** mounts/unmounts game modules and connects platform services.
5. **Infrastructure layer:** browser storage, Cache Storage, service worker integration, network state, audio, input adapters.

## Suggested source layout

```text
src/
  app/                  # route setup, app shell, providers
  pages/                # home, catalogue, details, player, settings
  components/           # reusable platform UI
  features/
    catalogue/           # catalogue search, filter, cards
    game-launch/         # launch/exit/loading/error flows
    offline/             # offline state and package actions
    settings/            # user preferences
  domain/
    games/               # IDs, metadata types, validation
    saves/               # save metadata and versioning types
  game-runtime/
    host/                # lifecycle and mounting
    contracts/           # shared module interfaces
    adapters/            # renderer/input/audio adapters
  game-modules/
    <game-id>/            # one folder per game
  platform/
    input/
    audio/
    storage/
    offline/
  shared/
    utils/
    errors/
```

## Dependency direction

- Presentation may call application use cases.
- Application use cases may depend on domain contracts and infrastructure abstractions.
- Game modules implement the game contract and use only the capabilities injected by the host.
- Domain types should not import React, browser UI components, or a specific renderer.
- Platform adapters implement interfaces; business/game rules should not be coupled to IndexedDB or Cache Storage directly.

## Game isolation

For the MVP, game modules may be compiled into the application rather than loaded as remote plugins. Keep a registry/manifest boundary so the catalogue and launcher do not need to know internal game implementation details. If stronger isolation is later required, evaluate iframe/worker or package boundaries in an ADR; do not add complexity without a concrete need.

## Error boundaries

Provide distinct handling for:

- catalogue/manifest validation errors
- missing or incomplete offline assets
- game initialization failures
- runtime game exceptions
- save read/write/migration errors
- unsupported input/device capabilities

Provide the user with a recoverable message and the maintainer with useful non-sensitive diagnostics.
