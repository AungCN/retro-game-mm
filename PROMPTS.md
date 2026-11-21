# Reusable AI Development Prompts

Use these as starting prompts in your coding agent. Replace bracketed fields. The repository's `AGENTS.md` remains authoritative.

## 1. Repository orientation / discovery prompt

```text
Act as a senior product analyst and software architect for this repository.

Read README.md, AGENTS.md, GOALS.md, PLANS.md, and the requested phase file. Read all relevant product and architecture documents and inspect the current repository/Git state.

Task: [DESCRIBE THE QUESTION OR PHASE]

Do not modify application source code, install packages, or change owner approval fields.

Return:
1. Your understanding of the goal and current state
2. Applicable requirements and decisions
3. Missing information and explicit assumptions
4. Risks, dependencies, and open questions
5. Recommended next action
6. Any proposed documentation changes

Do not proceed to implementation.
```

## 2. Phase planning prompt

```text
Prepare an implementation proposal for [PHASE/TASK FILE].

Follow AGENTS.md. Inspect the current code before proposing changes.

Return a reviewable plan containing:
- objective and in-scope/out-of-scope items
- requirement-to-file mapping
- files to create, modify, or delete
- implementation steps in dependency order
- dependency choices and licensing implications
- security, privacy, accessibility, and offline implications
- risks and rollback considerations
- automated and manual test plan
- measurable acceptance criteria

Do not edit files or install dependencies. Do not alter owner-only fields. Wait for explicit owner approval.
```

## 3. Approved implementation prompt

```text
Implement only the plan explicitly approved by the project owner for [PHASE/TASK].

First verify that the relevant phase file records owner approval. If approval is absent or ambiguous, stop and report that implementation is not authorized.

Follow AGENTS.md and the accepted ADRs. Keep changes focused. Do not expand scope or silently alter architecture. Add or update tests. Update documentation affected by actual behavior.

After implementation, run the relevant checks and report their actual results. Do not mark the phase accepted. Set implementation status to AWAITING_EVALUATION and provide evidence for human review.
```

## 4. Independent code review prompt

```text
Review the changes for [PHASE/TASK] as an independent reviewer. Do not modify files unless separately instructed.

Compare the diff with the approved plan, acceptance criteria, AGENTS.md, and accepted ADRs.

Look for:
- functional defects and edge cases
- regressions and lifecycle/resource leaks
- accessibility and responsive behavior issues
- offline/cache/save-data problems
- security, privacy, dependency, and licensing concerns
- missing or weak tests
- undocumented behavior or scope creep

Prioritize findings by severity. For each finding, include file/line reference, impact, reproduction or reasoning, and a concrete correction. State what you could not verify. Do not approve the phase on behalf of the owner.
```

## 5. Human feedback correction prompt

```text
Address only the following human review findings for [PHASE/TASK]:
[PASTE REVIEW FINDINGS]

Before editing, map each finding to affected files and propose a concise correction plan. Do not change unrelated behavior. After explicit approval, implement the corrections, run relevant regression tests, and report each finding as fixed, not fixed, or blocked with evidence. Leave final acceptance to the human reviewer.
```

## 6. Documentation synchronization prompt

```text
Inspect the completed implementation for [FEATURE]. Identify documentation that is now inaccurate, missing, or inconsistent. Propose precise updates to product, architecture, game specification, task, and changelog documents as appropriate. Do not invent behavior or change owner decisions. Keep docs aligned with implemented and tested behavior, and identify any unresolved difference between design and implementation.
```

## 7. Release-readiness review prompt

```text
Evaluate release readiness against docs/quality/RELEASE_CHECKLIST.md and the accepted scope. Do not deploy or publish anything. Verify available automated evidence, list manual checks still required, review known issues and licensing, and provide a go/no-go recommendation with reasons. The project owner makes the release decision.
```
