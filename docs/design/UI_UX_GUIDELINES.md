# UI/UX Guidelines

## Experience principles

- Nostalgic visual language with modern readability and navigation.
- Put the game catalogue and primary Play action first.
- Avoid clutter, excessive animation, and unnecessary gamification in the MVP.
- Make connection and offline status visible but unobtrusive.
- Provide clear loading, empty, unavailable, error, and success states.
- Use consistent controls and navigation across games.

## Core screens

1. Home / catalogue
2. Game detail
3. Game player
4. Settings
5. Offline downloads / installed games (may initially be a section of the catalogue)

## Catalogue card content

- Game title
- Original thumbnail/artwork
- Short genre or description
- Offline-ready state where relevant
- Accessible action to open details/play

## Player screen

- Game canvas/viewport with sensible scaling
- Pause/resume control
- Sound control where appropriate
- Exit/back action
- Optional touch controls when declared by the game
- Clear focus and input handling

## Responsive behavior

- Design for narrow mobile widths and larger desktop layouts.
- Do not depend on hover.
- Avoid accidental page scrolling while touch gameplay is active, but do not block browser navigation globally.
- Ensure controls remain reachable and do not obscure critical game content.
- Respect device orientation declared by the game; explain when rotation is recommended.

## Accessibility expectations

- Semantic HTML for platform controls.
- Keyboard navigation for platform UI.
- Visible focus indicators.
- Sufficient text/control contrast.
- Text labels or accessible names for icon-only controls.
- Do not use color alone to convey installation or error state.
- Respect reduced-motion preferences for platform UI.
- Provide pause functionality for games where continuous motion would otherwise be unavoidable, where feasible.

## Visual design direction

Explore and approve a small number of visual directions during Phase 00/02. Potential directions include: understated pixel-art arcade, warm CRT-inspired palette, or clean modern arcade with restrained retro accents. Avoid imitating a specific commercial game's branding or artwork without permission.
