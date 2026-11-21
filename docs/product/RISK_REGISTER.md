# Initial Product and Technical Risk Register

This is a starter register, not a completed risk assessment. Review and score risks during Phase 00 and whenever material architecture or scope changes occur.

## Scoring guide

- Likelihood: Low / Medium / High
- Impact: Low / Medium / High
- Priority: derive from likelihood and impact; owner confirms prioritization.

| ID | Risk | Likelihood | Impact | Mitigation / response | Owner | Status |
|---|---|---|---|---|---|---|
| R-001 | Retro game code, ROMs, artwork, sound, fonts, or trademarks are not licensed for redistribution | Medium | High | Use original or rights-cleared content; maintain per-game provenance; block release if rights are unclear | TBD | Open |
| R-002 | Offline-ready label is shown even though some assets still require network access | Medium | High | Verify required asset list and test launch with network disabled | TBD | Open |
| R-003 | Browser storage is cleared, unavailable, or reaches quota | Medium | Medium | Handle storage errors, provide clear UI, avoid treating local storage as a guaranteed backup | TBD | Open |
| R-004 | Game modules leak timers, event listeners, audio, or rendering resources when exited | Medium | High | Define lifecycle contract and automated cleanup tests | TBD | Open |
| R-005 | AI coding agent changes scope or architecture without approval | Medium | High | Enforce AGENTS.md, explicit approval gates, protected main branch, and owner-only fields | TBD | Open |
| R-006 | Target games perform poorly on lower-powered mobile browsers | Medium | Medium | Choose target devices early; profile representative games; optimize only against measured evidence | TBD | Open |
| R-007 | First-game scope becomes too large and delays the platform foundation | Medium | Medium | Choose a small vertical slice and freeze its acceptance criteria | TBD | Open |
| R-008 | Mobile wrapper introduces behavior differences from browser/PWA | Medium | Medium | Defer mobile implementation; test real devices and native lifecycle separately | TBD | Open |
| R-009 | Dependency or game-engine maintenance/licensing changes create project risk | Low | High | Review current status/license before adoption and at release checkpoints | TBD | Open |

## Risk review record

- Review date:
- Reviewed by:
- New risks:
- Changed risks:
- Owner decisions:
