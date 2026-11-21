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
    host/                # lifecycle, mounting, pre-launch gating
    contracts/           # shared module interfaces (GAME_MODULE_CONTRACT.md)
    adapters/
      native-canvas/     # mounts native game modules
      wasm-libretro/     # host side of the PS1 adapter + iframe message protocol
      wasm-ps2/          # post-MVP experiment; empty in the MVP
  game-modules/
    <game-id>/            # one folder per native game
  platform/
    input/
    audio/
    storage/
    offline/
    files/               # User File Service: handles, OPFS, session files, range reads
    capabilities/        # tier and feature detection
public/
  cores/                 # fetched at build time, SHA-256 verified, gitignored — never committed
  shared/
    utils/
    errors/
```

## Dependency direction

- Presentation may call application use cases.
- Application use cases may depend on domain contracts and infrastructure abstractions.
- Game modules implement the game contract and use only the capabilities injected by the host.
- Domain types should not import React, browser UI components, or a specific renderer.
- Platform adapters implement interfaces; business/game rules should not be coupled to IndexedDB, Cache Storage, OPFS, or the File System Access API directly.
- Code inside the emulator iframe talks to the host only through the typed message protocol; it imports nothing from the platform shell.

## Game isolation

- **Native games** are compiled into the application, not loaded as remote plugins. A registry/manifest boundary keeps the catalogue and launcher unaware of internal game implementation details.
- **Emulator adapters** run the emulator core in a same-origin iframe (ADR-0002). The iframe is a lifecycle and licence boundary: removing it releases the core's memory, and the GPL core stays a separate program loaded from its own files. It is not a security sandbox, which is why only pinned, reviewed cores are loaded.
- The iframe document gets the same COOP/COEP/CORP headers and a CSP with `frame-ancestors 'self'` (SECURITY_GUIDELINES.md).

## Error boundaries

Provide distinct handling for:

- catalogue/manifest validation errors
- missing or incomplete offline assets
- game initialization failures
- runtime game exceptions
- save read/write/migration errors
- unsupported input/device capabilities
- unsupported browser tier or missing cross-origin isolation (`UNSUPPORTED`)
- disc permission lost or file moved (`NEEDS_PERMISSION`, `OFFLINE_UNAVAILABLE`)

Provide the user with a recoverable message and the maintainer with useful non-sensitive diagnostics.
