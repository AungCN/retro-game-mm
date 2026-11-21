# ADR-0002: Game Runtime and Module Boundary (Multi-Adapter & WASM Emulation)

- Status: PROPOSED — updated for PS1/PS2 & BYOR expansion; Phase 01 adds the boundary design, consequences, and spike evidence

## Context

Multiple games need a consistent host lifecycle, input abstraction, save integration, and resource cleanup. While initial lightweight arcade games can run natively on HTML5 Canvas/WebGL, expanding the catalog to support PlayStation 1 (PS1) and PlayStation 2 (PS2) titles requires hardware emulation via WebAssembly (WASM) cores and user-supplied ROM/ISO binaries (Bring Your Own ROM / BYOR).

Scope after SCR-001: native games and a generic PS1 BYOR player are in the MVP; PS2 is an experimental post-MVP item.

## Options

1. Canvas 2D with a project-owned lightweight runtime only (blocks PS1/PS2 expansion)
2. Phaser as a shared 2D engine only (blocks PS1/PS2 expansion)
3. **A Mixed Adapter Model behind a unified `GameModule` contract (Proposed direction, pending Phase 01 spike)**
4. Separate isolated runtime per game without a shared contract (high maintenance)

## Evaluation criteria

- TypeScript integration and strict module boundaries
- Support for native web games alongside WASM libretro (PS1) and WebGPU/WASM (PS2) cores
- Mobile vs. desktop browser capability gating (`SharedArrayBuffer`, WebGPU)
- Pause/resume, disc-swapping, and lifecycle handling
- Offline packaging of WASM cores without bloating repo or Service Worker caches with multi-GB ISOs
- Open-source license isolation (isolating GPLv3 emulator cores from the MIT/Apache host shell)
- Testing complexity and resource disposal

## Proposed direction

Maintain one common platform-facing `GameModule` contract (`load`, `start`, `pause`, `resume`, `save`, `restore`, `destroy`) regardless of underlying execution engine, implemented via **Runtime Adapters**:

1. **`native-canvas` Adapter:** For lightweight TypeScript/HTML5 Canvas or WebGL retro games bundled in the repository.
2. **`wasm-libretro` Adapter (PS1):** Wraps a WebAssembly libretro core in an isolated boundary, supporting user-provided BIOS files (or HLE/no-BIOS where the core allows), `.chd`/`.bin+.cue`/`.m3u` multi-disc playlists, and virtual memory cards. Candidate: EmulatorJS 4.2.3 with the `pcsx_rearmed` core (SPIKE-001).
3. **`wasm-ps2` Adapter (Experimental PS2, post-MVP):** Wraps a WASM PS2 core behind strict runtime feature detection (`crossOriginIsolated`, and `navigator.gpu` where the core needs it), Tier 1 only. Candidates from SPIKE-002: TabStationToo (PCSX2-based, GPL-3.0, needs a user BIOS) and Play! (BSD-style licence, no BIOS needed).

`docs/architecture/GAME_MODULE_CONTRACT.md` (v2) defines the interfaces.

## Adapter boundary (as built in draft v0.1)

- **Two layers.**
  - The host creates a same-origin **outer frame** (`/emulator/frame.html`, emulator CSP, served offline by the service worker).
  - The outer frame fetches the emulator files and creates an **inner sandboxed `srcdoc` frame** (`sandbox="allow-scripts"`, opaque origin) that runs EmulatorJS from `blob:` URLs it creates itself. Its single inline bootstrap is allowed by SHA-256 hash.
  - Reason: a sandboxed frame cannot be controlled by the service worker, so a single sandboxed frame could not work offline. A single same-origin frame would give emulator code full access to the app's storage.
- **Earlier proposal (Phase 01):** a single same-origin iframe. It was replaced because the e2e test now proves the sandbox cannot reach the app's DOM, top location, IndexedDB or the network.
- **How it talks to the host:** a typed `postMessage` protocol only. Host → iframe: `load`, `start`, `pause`, `resume`, `saveState`, `loadState`, `swapDisc`, `input`, `setMuted`, `destroy`. Iframe → host: `status`, `error`, `memoryCardChanged`, `readRange` requests. The iframe never receives raw file handles; it asks the host for byte ranges, and the host's User File Service answers.
- **Teardown:** `destroy` sends a shutdown message, then removes the iframe. Removing the browsing context is the reliable way to release the core's WASM memory, workers, and audio. SPIKE-001 A8 measures this.
- **Why an iframe rather than a worker only:** the EmulatorJS frontend expects a DOM and canvas. A worker-only design would need OffscreenCanvas and audio bridging work that isn't justified for the MVP.
- **Licence boundary:** the GPL core and its frontend stay separate files loaded at runtime, not bundled into the platform's source. With a GPL-3.0-or-later repository this is not needed to avoid copyleft, but it keeps each component's licence and source offer clear. The PS1 core's GPL-2.0 status still needs a licence review (ADR-0001).
- **Security note:** the outer frame is same-origin (small, first-party relay code). Emulator code and untrusted disc data run only in the inner sandbox. See `docs/quality/THREAT_MODEL.md`.
- **Sandbox compatibility shims (inner bootstrap):**
  - in-memory `localStorage`/`sessionStorage`, because EmulatorJS reads storage even when disabled;
  - the emulator frame's Permissions-Policy delegates gamepad, fullscreen and screen-wake-lock to the sandbox only.

## Consequences

- The whole app must be cross-origin isolated in every environment, including offline (SPIKE-001 A1/A2: verified in Chrome; Safari/Firefox pending).
- Hosting must support custom headers on every file (ADR-0001).
- The contract gains a user-file service, blob storage, analog input, host-owned audio, and optional `DiscSwappable` / `SaveStateCapable` extensions (contract v2).
- **Memory:** EmulatorJS 4.2.3 loads the whole game file into the emulator's in-memory filesystem; it has no range-read path. SPIKE-001 measured 657 MB with a 648 MiB file. This is acceptable for single PS1 discs on a 16 GB desktop but not for PS2. Streaming through `readRange` would need a custom loader or a core-level virtual file system; that is a Phase 04B decision.
- Testing is harder: emulator adapters need iframe/worker teardown tests, capability-gating tests, and manual permission-prompt checks.
- **CSP:** EmulatorJS 4.2.3 needs `script-src 'unsafe-eval' blob:` and `connect-src blob:` in the iframe document (SPIKE-001 A3: `eval` in its 7-Zip core extractor; core script and WASM loaded from `blob:` URLs). The relaxation applies only to the iframe and needs owner approval. `connect-src` otherwise stays `'self'`, which blocks EmulatorJS's update check and its CDN core fallback.
- **EmulatorJS configuration is part of the boundary:**
  - `EJS_disableDatabases = true` always, or EmulatorJS copies every game file into its own IndexedDB.
  - The non-threaded core: full speed at about 10 MB, versus about 1.5 GB of shared memory for the threaded core, whose teardown could not be confirmed.
  - The host hides EmulatorJS's own menu and provides the player controls.
- **Saves:** the core persists saves in an IndexedDB database named `/data/saves` in the app's origin. Phase 04B must route memory cards and save states through the platform's blob storage so they follow the namespacing, export, and deletion rules.
- **Packaging:** EmulatorJS's npm packages declare unpinned `latest` dependencies (including every other core), so the build fetches the exact package tarballs and verifies their integrity instead of running `npm install`.

## Recommendation

Adopt option 3 (mixed adapter model) with emulator cores in a same-origin iframe behind the typed message protocol:
- `native-canvas` for the MVP's native games;
- `wasm-libretro` for the PS1 player (Phase 04B), using pinned EmulatorJS 4.2.3 with the non-threaded `pcsx_rearmed` core. In Chrome it booted without a BIOS, ran the test programs at 60 fps, and freed its memory when the iframe was removed (SPIKE-001). This depends on the iframe CSP relaxation being approved;
- `wasm-ps2` reserved for a post-MVP experiment.

Safari and Firefox confirmation comes from the owner browser session.

## Spike plan and evidence

| Spike | Covers | Status |
|---|---|---|
| SPIKE-001 (`docs/spikes/SPIKE-001-PS1-BYOR.md`) | A1 isolation, A2 offline isolation, A3 core boot and CSP, A4 whole-file vs streaming, A5 handle/OPFS persistence, A6 storage durability, A7 performance, A8 teardown, A9 gamepad | In progress: A1–A8 done in Chrome; Safari/Firefox and the file-permission flow wait for the owner session; A9 optional |
| SPIKE-002 (`docs/spikes/SPIKE-002-PS2-DESK-PROBE.md`) | PS2 candidates, licences, requirements, maturity | Complete |

## Owner decision

- Decision: PENDING
- Selected approach:
- Evidence/spike link: To be completed in Phase 01 spike
- Approved by/date:
