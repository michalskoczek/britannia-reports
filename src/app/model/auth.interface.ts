/**
 * Session and allowlist types.
 *
 * `SessionState` is what every consumer of the gate switches on — the guard,
 * the sign-in screen, and the header all read it and nothing else.
 */

/**
 * `director` is a scaffold: in the MVP it grants exactly what `teacher` grants.
 * It exists so the deferred admin features do not require retrofitting a role
 * system later. See `context/foundation/prd.md` → Access Control Changes.
 */
export type UserRole = 'teacher' | 'director';

/** A document in the `allowedUsers` collection. The id is the lowercased email. */
export interface AllowlistEntry {
  role: UserRole;
}

/**
 * Why access was refused.
 *
 * `not-allowlisted` — the lookup succeeded and the account is not on file.
 * `lookup-failed`   — the lookup itself failed (offline, rules, malformed record).
 *
 * The two are kept apart deliberately: without the distinction a network blip
 * is indistinguishable from revoked access, and the teacher cannot tell whether
 * to retry or to call someone.
 */
export type DenialReason = 'not-allowlisted' | 'lookup-failed';

export type SessionState =
  | { status: 'resolving' }
  | { status: 'anonymous' }
  | { status: 'authorized'; email: string; role: UserRole }
  | { status: 'denied'; reason: DenialReason };
