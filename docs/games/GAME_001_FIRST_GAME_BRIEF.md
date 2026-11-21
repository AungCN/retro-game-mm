# GAME_001 — First Game Selection Brief

- Status: PROPOSED
- Game selection: PENDING OWNER DECISION
- Purpose: choose a small, original or rights-cleared game that validates the shared runtime end to end.

## Selection criteria

The first game should:

- Be small enough to build and test as a vertical slice.
- Have clear game rules and a short play session.
- Work with keyboard and touch controls if appropriate.
- Exercise rendering, input, pause/resume, and cleanup.
- Have simple original or rights-cleared visual/audio assets.
- Have meaningful state to save, or explicitly document why saving is unnecessary.
- Be suitable for offline asset packaging.

## Candidate concepts to discuss

| Candidate | Why it is useful | Main technical concern |
|---|---|---|
| Original paddle-and-ball game | Tests frame loop, collision, scoring, input, pause | Collision tuning and touch controls |
| Original grid-navigation/collect game | Tests grid logic, keyboard/touch, simple save state | Responsive grid and input repeat behavior |
| Original lane-dodging game | Tests animation, collision, difficulty progression | Timing, focus/background pause, touch input |

These are genre-level concepts, not permission to copy an existing game's title, art, music, level design, source code, or branding.

## Recommended selection method

1. Owner chooses one candidate or proposes another original concept.
2. AI prepares a one-page game design and a small technical spike proposal.
3. Owner approves the design and rights approach.
4. Complete `GAME_TEMPLATE.md` as `GAME_001_<NAME>.md`.
5. Implement only after Phase 03 planning approval.

## Decision

- Selected concept:
- Rationale:
- Owner approval:
- Date:
