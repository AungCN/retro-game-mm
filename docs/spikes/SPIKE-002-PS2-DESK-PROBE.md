# SPIKE-002 — PS2 in the Browser: Desk Probe

- Phase: 01 (approved plan, owner decision O-1: PS2 is post-MVP; desk research only)
- Date: 2026-11-22
- Method: public project pages, licence files, and GitHub API metadata only. Nothing was downloaded, built, or run.
- Time box: ≤ 3 hours — met.
- Status: Complete — AWAITING_EVALUATION

## Questions

| ID | Question |
|---|---|
| B1 | Which browser PS2 emulators exist that could run a user's own disc? |
| B2 | What licence does each use, and does it fit the GPL-3.0-or-later direction? |
| B3 | What do they need from the browser (threads/COOP-COEP, WebGPU, Memory64) and which browsers do they support? |
| B4 | Do they need a BIOS? |
| B5 | How do they load multi-GB disc images (whole file or on demand)? |
| B6 | How mature and maintained are they? |
| B7 | Is a post-MVP PS2 experiment feasible, and what are the prerequisites? |

## Findings

| | TabStationToo | Play! web build | ps2-web-recomp |
|---|---|---|---|
| What it is (B1) | PCSX2 compiled to WebAssembly, with its own WebAssembly-generating JITs and a browser frontend | Experimental web port of the Play! emulator | Static recompilation of one specific game at a time into C++/WebAssembly; not a general emulator |
| Licence (B2) | GPL-3.0 (repository); the project site says GPL-3.0-or-later — sources disagree on "or later" | BSD two-clause text, "Copyright (c) 2006-2026, Jean-Philip Desjardins"; GitHub reports no SPDX ID | MIT; bundles BSD-2-clause tables from Play! |
| Browser needs (B3) | COOP/COEP required (shared-memory threads). WebGPU optional — software renderer on a 2D canvas without it. Desktop Chrome or Edge; Firefox works. Safari, macOS, Memory64: not stated | "Recent version of Chrome or Firefox" recommended. Thread/COOP/WebGPU needs: not stated | WebGPU required; COOP/COEP required; Chrome/Edge on Windows and macOS. Safari: not stated |
| BIOS (B4) | Required, user-supplied (usually 4 MB), kept in IndexedDB | Not required (built-in high-level BIOS) | Not mentioned |
| Disc loading (B5) | Worker reads only the parts the game requests from the user's local file; never copied. `.iso`, `.bin`, `.img`, `.chd`, `.cso`, `.zso`, `.gz`. Not yet: CHD with parent, multi-file BIN/CUE, phones | ISO, CSO, CHD, ISZ, BIN, ELF. Loading method and size limits: not stated | Disc read over HTTP Range requests from a local server after per-game pre-conversion |
| Maturity (B6) | "Early and experimental, but games play"; many scenes at or near full speed in Chrome, heaviest scenes below. Repository created 2026-10-16, last commit 2026-11-16 | "Only an experiment and is not meant to play all games". Repository last commit 2026-10-24 | About a dozen games tried; experimental |

## Assessment (B7)

- **ps2-web-recomp does not fit.** It needs per-game conversion, and its output "belongs to the game's owners" — incompatible with a generic BYOR player.
- **TabStationToo is the strongest candidate.**
  - GPL-3.0 fits the GPL-3.0-or-later direction.
  - Its on-demand disc reading already matches ADR-0003's streaming goal.
  - WebGPU is optional, which lowers the browser bar.
  - It needs a user BIOS (`biosMode: required`) and is only weeks old, so maintenance risk is high.
- **Play! is the no-BIOS alternative** (`biosMode: none`), with a permissive licence, but its web build is explicitly an experiment.
- **Safari support is unknown for all three**, which is why the schema limits `wasm-ps2` to Tier 1.

**Recommendation:** a post-MVP PS2 experiment is worth evaluating on Tier 1 (desktop Chromium) only, starting with TabStationToo and keeping Play! as the no-BIOS fallback. Nothing here changes the MVP.

**Prerequisites before any hands-on PS2 work (post-MVP, separate approval):**
1. Licence check of the exact TabStationToo revision ("or later" wording) and PCSX2 component licences.
2. A legal PS2 test fixture, which is harder than PS1: openly licensed PS2 homebrew must be identified.
3. Measurements on the owner's M4 in Chrome: memory, speed, and what happens without WebGPU.
4. A maintenance re-check: the project is new, so wait for a few months of activity.

## Sources

- https://github.com/TabStationToo/TabStationToo and https://tabstationtoo.github.io/TabStationToo/ (read 2026-11-22; GitHub API: created 2026-10-16, last commit 2026-11-16, licence GPL-3.0)
- https://github.com/jpd002/Play- and https://github.com/jpd002/Play-/blob/master/License.txt; https://playjs.purei.org/ (GitHub API: last commit 2026-10-24, licence NOASSERTION)
- https://raw.githubusercontent.com/snuri00/ps2-web-recomp/HEAD/README.md
- News coverage (context only): https://www.digitaltrends.com/gaming/claude-ps2-emulator-browser-tabstationtoo/

Not read: TabStationToo `docs/web-port/PERFORMANCE.md`, the Play! compatibility tracker, and ps2-web-recomp `docs/gt3.md`. Per-game performance numbers were not reviewed.
