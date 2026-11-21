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

## Record keeping

Keep copies or stable references for license texts, permissions, attribution requirements, and source provenance. Do not store private correspondence or credentials in the repository unless approved and appropriately protected.
