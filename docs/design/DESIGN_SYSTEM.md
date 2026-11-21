# Design System Starter

This document records design tokens and component behavior after the owner approves the visual direction.

## Token categories

- Color: page background, surface, text, muted text, primary action, accent, success, warning, error, focus ring
- Typography: display, heading, body, caption, monospace/game metadata
- Spacing: compact, small, medium, large, extra large
- Radius: cards, controls, dialogs, game viewport
- Elevation: surface levels and overlays
- Motion: duration, easing, reduced-motion alternatives
- Breakpoints: narrow/mobile, tablet, desktop (exact values to be set during implementation)

## Component inventory

- Button (primary, secondary, quiet, destructive)
- Game card
- Game status label
- Search/filter controls
- Offline/download progress indicator
- Loading skeleton/state
- Empty state
- Error and retry state
- Dialog/confirmation
- Game viewport container
- Touch-control cluster (only when needed by a game)
- Toast/announcement region

## Rules

- Tokens should be centralized rather than scattered as one-off values.
- Components must have documented states and accessible names.
- Avoid tiny text and low-contrast retro effects that impair readability.
- Pixel fonts may be used for short display text only if legibility remains acceptable; body text should prioritize readability.
- Avoid flashing effects and provide reduced-motion alternatives.
