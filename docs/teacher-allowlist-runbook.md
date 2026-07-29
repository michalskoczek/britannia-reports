# Teacher allowlist runbook

Adding, checking, and removing a person's access to Britannia Reports.

Signing in with Google is not enough to use the app: the address must also be listed in the
`allowedUsers` collection in Firestore. FR-003 makes that a developer action in the Firebase Console —
the MVP ships no invite UI, and the security rules close writing to *everyone*, so there is no way to do
this from inside the app. This document is the whole onboarding path.

## The shape

| | |
| --- | --- |
| Collection | `allowedUsers` |
| Document id | the person's Google address, **lowercased** |
| Field | `role` — string, either `teacher` or `director` |

Nothing else. No display name, no timestamps — the app reads `role` and nothing more.

**Why lowercase matters.** The security rule compares `request.auth.token.email.lower()` against the
document id. The rule lowercases the address it gets from Google, but it cannot lowercase the document
id — so a document stored as `Anna.Kowalska@britannia.pl` will never match anything, and the person will
be told they have no access with no error to explain it. Type the id in lowercase, always.

**Why the address and not the user id.** A Firebase UID does not exist until the person signs in for the
first time, which would mean every teacher has to be rejected once before they can be added. The address
is known in advance, so seeding works before their first visit.

> Note for later slices: this allowlist keys on the address, but per-teacher data (students, templates)
> keys on `request.auth.uid`. They are two different identifiers for the same person. Do not use the
> address as an ownership key.

## Adding a person

1. Open the [Firebase Console](https://console.firebase.google.com/) → project **britannia-reports** →
   **Firestore Database**.
2. If the `allowedUsers` collection does not exist yet, use **Start collection** and name it
   `allowedUsers`. Otherwise select it and use **Add document**.
3. **Document ID**: the person's Google address in lowercase — e.g. `anna.kowalska@britannia.pl`.
   Do not use the auto-ID button.
4. Add one field:
   - Field: `role`
   - Type: `string`
   - Value: `teacher` (or `director`)
5. Save.

Access is live immediately. The person does not need to be told anything beyond the app's URL — they
sign in with Google and land on the report forms.

### Which role

`director` is a scaffold. In the MVP it grants exactly what `teacher` grants; it exists so that the
later admin features (invite UI, central report view, editable form content) do not require retrofitting
a role system. Use `director` for the school director, `teacher` for everyone else.

## Checking that it worked

Sign in to the app with that account. Reaching the report tabs means the document is correct.

If the sign-in screen comes back saying the account has no access, check, in this order:

1. **Case.** Is the document id all lowercase?
2. **Typos.** Compare the document id character by character against the address shown on the Google
   account chooser — not against what you were told over the phone.
3. **The right account.** Google account choosers pre-select the last used account. The person may have
   signed in with a personal address. The app shows the signed-in address in the header once access is
   granted; before that, the account chooser is the only place to check.
4. **The collection name.** `allowedUsers`, camelCase, plural.

A message saying access could not be *verified* (rather than that it was denied) usually means something
else went wrong — no network, or the rules were changed. That is normally not an allowlist problem.

**The one exception is a typo in `role`.** The app refuses any value other than `teacher` or `director`
rather than guessing, and that refusal surfaces as "could not be verified" — deliberately, because the
account *is* on the list and it is the record that is wrong. So if one specific person gets this message
while everyone else signs in fine, open their document and check the `role` field before looking at the
network.

## Removing a person

Delete their document from `allowedUsers`.

The check runs when the session is established, not continuously, so someone already signed in keeps
their session until they sign out or their session expires. If access must end immediately, delete the
document and then disable or delete the user in **Firebase Console → Authentication → Users**, which
terminates the session at the next token refresh.

Deleting the document does not remove anything else — this collection holds no reports, and the MVP
stores no report history at all.

## Changing someone's role

Edit the `role` field in place. It takes effect at their next sign-in.
