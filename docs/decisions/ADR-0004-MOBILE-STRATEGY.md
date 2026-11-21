# ADR-0004: Future Mobile Packaging Strategy

- Status: PROPOSED — defer final decision until mobile phase

## Context

The web application is the primary product. Android and iOS may be required after the web MVP is stable.

## Candidate

Evaluate Capacitor to package the existing web application while adding only the native capabilities proven necessary.

## Alternatives

- Continue as PWA only
- Capacitor wrapper
- Separate native application (higher cost and duplicated presentation logic)

## Evaluation criteria

- Required native capabilities
- Offline and local data behavior
- App lifecycle and audio handling
- Performance on target devices
- Plugin maintenance/security
- Store distribution and policy requirements
- Build/release complexity

## Recommendation

Do not start native packaging until the web MVP is accepted. Run a feasibility spike and approve this ADR before creating production mobile projects.

## Owner decision

- Decision: DEFERRED
- Approved by/date: To be completed
