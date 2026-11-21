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

## Adapter boundary (Phase 01 proposal)

- **Where the core runs:** in a **same-origin iframe** created by the host-side adapter inside the player container. The iframe document is served with the same COOP/COEP/CORP headers and its own CSP (`frame-ancestors 'self'`).
- **How it talks to the host:** a typed `postMessage` protocol only. Host → iframe: `load`, `start`, `pause`, `resume`, `saveState`, `loadState`, `swapDisc`, `input`, `setMuted`, `destroy`. Iframe → host: `status`, `error`, `memoryCardChanged`, `readRange` requests. The iframe never receives raw file handles; it asks the host for byte ranges, and the host's User File Service answers.
- **Teardown:** `destroy` sends a shutdown message, then removes the iframe. Removing the browsing context is the reliable way to release the core's WASM memory, workers, and audio. SPIKE-001 A8 measures this.
- **Why an iframe rather than a worker only:** the EmulatorJS frontend expects a DOM and canvas. A worker-only design would need OffscreenCanvas and audio bridging work that isn't justified for the MVP.
- **Licence boundary:** the GPL core and its frontend stay separate files loaded at runtime, not bundled into the platform's source. With a GPL-3.0-or-later repository this is not needed to avoid copyleft, but it keeps each component's licence and source offer clear. The PS1 core's GPL-2.0 status still needs a licence review (ADR-0001).
- **Security note:** a same-origin iframe is not a security sandbox. Only pinned, SHA-256-verified, self-hosted cores are loaded.

## Consequences

- The whole app must be cross-origin isolated in every environment, including offline (SPIKE-001 A1/A2: verified in Chrome; Safari/Firefox pending).
- Hosting must support custom headers on every file (ADR-0001).
- The contract gains a user-file service, blob storage, analog input, host-owned audio, and optional `DiscSwappable` / `SaveStateCapable` extensions (contract v2).
- **Memory:** if the core loads disc images whole, memory use equals disc size. SPIKE-001 measured 649 MB held for a 648 MiB file in Chrome. This is acceptable for single PS1 discs on desktop but not for PS2. Streaming through `readRange` is the target for Phase 04B, subject to what the core supports (SPIKE-001 A4).
- Testing is harder: emulator adapters need iframe/worker teardown tests, capability-gating tests, and manual permission-prompt checks.
- If the core needs a CSP relaxation (for example `'unsafe-eval'`), it applies only to the iframe document and needs owner approval.

## Recommendation

Adopt option 3 (mixed adapter model) with emulator cores in a same-origin iframe behind the typed message protocol:
- `native-canvas` for the MVP's native games;
- `wasm-libretro` for the PS1 player (Phase 04B), using a pinned EmulatorJS build if SPIKE-001 A3/A7/A8 confirm it boots, performs, and tears down cleanly;
- `wasm-ps2` reserved for a post-MVP experiment.

The final recommendation depends on the remaining SPIKE-001 results.

## Spike plan and evidence

| Spike | Covers | Status |
|---|---|---|
| SPIKE-001 (`docs/spikes/SPIKE-001-PS1-BYOR.md`) | A1 isolation, A2 offline isolation, A3 core boot and CSP, A4 whole-file vs streaming, A5 handle/OPFS persistence, A6 storage durability, A7 performance, A8 teardown, A9 gamepad | In progress: A1, A2 and platform-side A4/A5/A6 done in Chrome; A3, A7, A8 wait for owner sign-off on the test image and core package channel; Safari/Firefox in the owner session |
| SPIKE-002 (`docs/spikes/SPIKE-002-PS2-DESK-PROBE.md`) | PS2 candidates, licences, requirements, maturity | Complete |

## Owner decision

- Decision: PENDING
- Selected approach:
- Evidence/spike link: To be completed in Phase 01 spike
- Approved by/date:
