# ADR-0002: Game Runtime and Module Boundary (Multi-Adapter & WASM Emulation)

- Status: PROPOSED — updated for PS1/PS2 & BYOR expansion

## Context

Multiple games need a consistent host lifecycle, input abstraction, save integration, and resource cleanup. While initial lightweight arcade games can run natively on HTML5 Canvas/WebGL, expanding the catalog to support PlayStation 1 (PS1) and PlayStation 2 (PS2) titles requires hardware emulation via WebAssembly (WASM) cores and user-supplied ROM/ISO binaries (Bring Your Own ROM / BYOR).

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
2. **`wasm-libretro` Adapter (PS1 & 8/16-bit consoles):** Wraps WebAssembly libretro cores (e.g., `pcsx_rearmed` / `mednafen_psx_hw` via EmulatorJS) in an isolated worker/iframe boundary, supporting user-provided BIOS files, `.chd`/`.bin+.cue`/`.m3u` multi-disc playlists, and virtual memory cards.
3. **`wasm-ps2` Adapter (Experimental PS2):** Wraps WebGPU-accelerated WASM PS2 cores (e.g., `Play!.js` / PCSX2-WASM ports) behind strict runtime feature detection (`navigator.gpu` and `crossOriginIsolated`), gracefully disabling or warning on unsupported mobile/Safari browsers.

## Owner decision

- Decision: PENDING
- Selected approach:
- Evidence/spike link: To be completed in Phase 01 spike
- Approved by/date:
