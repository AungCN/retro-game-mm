# Phase 07 — Android and iOS Expansion

- Status: DEFERRED
- Dependencies: Phase 06 accepted and web release approved

## Objective

Evaluate and, if approved, package the accepted web application for Android and iOS while preserving gameplay, offline behavior, local data, and platform quality.

## Discovery gate

Before implementation, confirm:
- Which native capabilities are genuinely required?
- Is PWA delivery sufficient for any target users?
- Does Capacitor meet current platform and plugin requirements?
- What are the signing, store, privacy, and support requirements?
- Which physical devices and OS versions will be supported?

## Scope if authorized
- Mobile feasibility spike and ADR approval
- Capacitor integration or another owner-approved strategy
- Native app lifecycle/back navigation/safe-area adaptation
- Local data and offline behavior verification
- Touch/gamepad/audio validation
- Android and iOS build/test/release preparation

## Acceptance criteria
- [ ] Mobile strategy ADR approved.
- [ ] Android build installs and passes agreed tests.
- [ ] iOS build installs and passes agreed tests.
- [ ] Offline game behavior is verified after app restart.
- [ ] Background/foreground and interruption behavior is tested.
- [ ] Touch, orientation, audio, and safe-area behavior are acceptable.
- [ ] Privacy, permissions, signing, and store requirements are reviewed.
- [ ] Owner approves each platform release independently.

## Human evaluation — owner only
- Reviewer:
- Review date:
- Android decision: PENDING
- iOS decision: PENDING
- Comments:
- Distribution authorized: NO
