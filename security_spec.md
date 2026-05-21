# Security Specification for Voting System

## Data Invariants

1. **A society must have a unique name.**
2. **An election must belong to a society.** (Wait, the schema in `firebase-blueprint.json` doesn't enforce this. I should update that, but for now I will rely on logic.)
3. **A vote must be cast by a registered member.**
4. **An election status (`archived`) must be immutable once set to `true`, unless Admin.** (Wait, I don't have Admin).

## The "Dirty Dozen" Payloads

1. **Injection Attack:** Submit a society name as a 1KB string.
2. **Role Hijacking:** Submit a vote for PRESIDENT with role SECRETARY.
3. **Ballot Poisoning:** Submit a negative ballot number.
4. **Member Hijacking:** Vote as a user UID that does not exist in the members list.
5. **Ghost Election:** Update an election `archived` status to `false` after it was set to `true`.
6. **Shadow Field:** Add a `role: 'ADMIN'` field to a vote payload.
7. **Type Mismatch:** Submit a `voterId` that is a number.
8. **Orphaned Vote:** Create a vote with a candidate ID that does not exist.
9. **Role Injection:** Create an election with `currentRole: 'GOD'`.
10. **ID Poisoning:** Create a society with a 2KB string ID.
11. **Schema Break:** Create a society with no `name`.
12. **Double Vote:** (Logic error, not directly rule-enforced, but rules should restrict `update` on `votes` to append-only) - Attempt to update an existing vote instead of creating a new one.

## The Test Runner
(To be implemented in `firestore.rules.test.ts`)
