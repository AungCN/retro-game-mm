# Mobile Expansion Strategy

- Status: Future direction; no native project should be created during the web MVP unless separately approved.

## Preferred direction to evaluate

Keep the product as a responsive web application/PWA, then evaluate Capacitor as a wrapper to package the existing web application for Android and iOS. This avoids maintaining two separate UI implementations, but it does not eliminate native-device testing or platform-specific work.

## Design constraints to observe during web development

- Responsive layout and touch-sized controls
- Safe-area awareness for notched devices
- Portrait/landscape behavior declared per game
- Audio start/unlock behavior that follows browser/mobile interaction policies
- Pause/resume when the app is backgrounded or foregrounded
- Storage availability and data preservation behavior
- Back navigation and accidental-exit handling
- No reliance on hover-only controls
- Network interruption and offline startup behavior

## Mobile-specific evaluation

Before choosing a wrapper or plugin, verify current support, maintenance, platform requirements, plugin licensing, and the target Android/iOS toolchain.

Test on actual devices where possible:

- app install and launch
- offline launch after initial setup
- touch control responsiveness
- display cutouts and safe areas
- orientation changes
- background/resume behavior
- audio behavior
- local save persistence
- app update and storage behavior
- performance and battery impact

## Native capabilities

Do not introduce native plugins unless a clear requirement exists. Each plugin adds maintenance, permissions, platform review, and security considerations. Document and approve each capability in an ADR.

## Release path

1. Accept web MVP.
2. Run mobile feasibility spike.
3. Approve mobile architecture and distribution plan.
4. Add Capacitor/native project and minimal required plugins.
5. Verify each supported game on Android and iOS.
6. Complete platform policy, privacy, signing, and store requirements before distribution.
