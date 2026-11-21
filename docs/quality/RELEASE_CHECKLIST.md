# Release Readiness Checklist

A release candidate must be reviewed by a human owner. Check applicable items and attach evidence.

## Product and scope

- [ ] All release features are in approved scope
- [ ] Required PRD acceptance criteria are met
- [ ] Known limitations are documented

## Functionality

- [ ] Catalogue and navigation work
- [ ] All included games launch and exit cleanly
- [ ] Controls are documented and verified
- [ ] Pause/resume works where supported
- [ ] Save/restore works where supported
- [ ] Error and recovery flows work

## Offline

- [ ] Application shell offline behavior verified
- [ ] Every game labelled offline-ready passed a no-network launch test
- [ ] Partial downloads are not marked ready
- [ ] Update/rollback and cache cleanup reviewed
- [ ] Storage failure behavior tested

## Quality

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] End-to-end tests pass
- [ ] Production build passes
- [ ] Lint/type checks pass where configured
- [ ] Browser/device matrix tested
- [ ] Accessibility review completed
- [ ] Performance reviewed against agreed targets

## Security and rights

- [ ] Dependencies reviewed
- [ ] No secrets committed
- [ ] Security review completed for relevant changes
- [ ] Game source/code/assets/licenses documented
- [ ] Attribution included as required
- [ ] No unapproved third-party executable code

## Operations

- [ ] Hosting and rollback approach documented
- [ ] Release notes prepared
- [ ] Support/issue-reporting route identified
- [ ] Backup/recovery expectations documented where relevant

## Human release decision

- Owner decision: PENDING
- Reviewer:
- Date:
- Comments:
- Release authorized: NO
