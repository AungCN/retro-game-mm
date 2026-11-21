# Game Catalogue, Asset Provenance, and Licensing Policy

## Purpose

Every game distributed by the platform must have documented provenance and permission for the intended forms of use and distribution, including offline caching and mobile packaging where applicable.

## Required game record

Each `docs/games/GAME_XXX.md` must record:

- Game ID, display title, short description, genre, and status
- Original creator/developer and source location, if applicable
- Source-code origin and license
- Game name/logo/trademark considerations
- Artwork, sprites, backgrounds, fonts, and animation provenance
- Music and sound-effect provenance
- Required attribution and notices
- Whether modification, redistribution, offline storage, and commercial use are permitted
- Any platform-specific restrictions
- Reviewer and evidence links

## Preferred content order

1. Original games and original assets created for this project
2. Public-domain works with provenance checked for the relevant jurisdiction
3. Openly licensed works whose license permits the intended modification and redistribution
4. Third-party games distributed under a written permission or suitable commercial license

## Do not assume

- An old game is automatically public domain.
- A game being playable on another website grants permission to copy or redistribute it.
- A source-code license also clears the art, music, name, or trademarks.
- A game ROM or executable may be redistributed because a user owns a physical copy.
- A license automatically permits bundling in a PWA or native mobile app.

## Release gate

A game with missing, unclear, incompatible, or disputed rights must not be included in a public release. Mark it `RIGHTS_REVIEW_REQUIRED` and keep it out of distributable builds until resolved.

## Suggested statuses

`IDEA`, `SPEC_DRAFT`, `RIGHTS_REVIEW_REQUIRED`, `RIGHTS_CLEARED`, `IN_DEVELOPMENT`, `QA`, `ACCEPTED`, `RETIRED`.

## Emulation and BYOR (added by SCR-001)

Scope change record: `docs/product/SCOPE_CHANGE_001_BYOR.md`.

### What the platform never distributes

- ROMs, disc images (`.iso`, `.chd`, `.bin`/`.cue`, `.pbp`, or similar), or BIOS files — not in the repository, builds, caches, or download links.
- Commercial game titles, box art, screenshots, logos, or other trade dress in the catalogue.
- Third-party title-metadata databases that list commercial titles.

The PS1 player is a generic catalogue entry. Disc names in a user's local disc list are entered by that user and stay on their device.

### User-supplied content

- Disc images, BIOS files, memory cards, and save states supplied by the user stay on the user's device and are never uploaded.
- The platform does not tell users where to obtain ROMs or BIOS files.

### Emulator cores

Every emulator core shipped with the app needs its own rights record containing:

- core name and version;
- licence (and compatibility with the repository licence and with other bundled cores);
- upstream source URL and how the corresponding source is made available;
- build provenance (who built it, from which commit, with which toolchain);
- SHA-256 of each shipped file;
- required notices and attribution.

Cores are self-hosted and pinned; they are not loaded from third-party CDNs at runtime.

### Repository licence direction

The owner has chosen GPL-3.0-or-later for the repository. The LICENSE file is added in its own separately approved step; until then this is a recorded direction, not an applied licence.

### Trademark wording (interim rule)

- Do not use console makers' logos, fonts, or trade dress.
- Do not imply affiliation or endorsement; include a non-affiliation notice where a console name appears.
- Final UI wording (for example "PS1" with a notice, or neutral wording such as "PS1-format discs") is pending owner decision D2.

### Test fixtures

- Use only openly licensed homebrew disc images whose licence permits the intended test use; record provenance like any other asset.
- Large binary fixtures are fetched by a script and verified by checksum, never committed.
- The size limit for committing small fixtures is pending owner decision D5 (proposed: 1 MB).

## Record keeping

Keep copies or stable references for license texts, permissions, attribution requirements, and source provenance. Do not store private correspondence or credentials in the repository unless approved and appropriately protected.
