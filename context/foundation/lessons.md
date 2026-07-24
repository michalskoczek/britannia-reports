# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Updating a document includes the sections the new content contradicts

- **Context**: `context/foundation/infrastructure.md` (risk register) and `src/CLAUDE.md`, during the Phase 4 documentation sync of `identity-and-data-platform`.
- **Problem**: The phase contract named three specific edits — Current State bullets, Getting Started steps, and a `src/CLAUDE.md` entry. Executing only those would have left the risk register still prescribing `firebase init firestore`, the exact command the same plan spends a paragraph warning against, and left `src/CLAUDE.md` silent on the fact that local dev now talks to the production Firebase project. The document would have contradicted itself in a file future agents read first. The extra edits were disclosed at the time, but they were EXTRA relative to the contract, and a reviewer scoring scope discipline strictly has to flag them.
- **Rule**: When editing a document makes another of its sections contradictory or stale, that section is in scope for the same change. Disclose the scope expansion — but do not leave the document disagreeing with itself.
- **Applies to**: Any phase editing `context/foundation/*.md` or a conventions file (`CLAUDE.md`, `AGENTS.md`).
