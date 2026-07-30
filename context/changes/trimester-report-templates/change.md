---
change_id: trimester-report-templates
title: Save, list, apply, and delete trimester/semester report templates
status: implementing
created: 2026-07-30
updated: 2026-07-30
archived_at: null
---

## Notes

Roadmap slice **S-02** — the north star — from `context/foundation/roadmap.md`.

Outcome: a teacher saves a filled-out trimester/semester report as a named template, sees a list of
their own templates, applies one to a new report (with a confirmation prompt before overwriting
non-empty fields), deletes templates they no longer want, and downloads the resulting PDF.

- PRD refs: US-01, FR-009, FR-010, FR-011, FR-012, FR-014, FR-018
- Prerequisites: S-01 (`google-sign-in-gate`) — merged 2026-07-29, not deployed
- Parallel with: S-03 (`student-roster`)
- **Inherited hard prerequisite:** the Firebase emulator suite + `@firebase/rules-unit-testing`
  harness, deferred by S-01. Build it *before* the first per-teacher Firestore rule
  (Open Roadmap Question #5; setup cost itemised in `infrastructure.md` → Getting Started step 4,
  including the still-missing JDK).
- Ownership keys on `request.auth.uid`, not the email the `allowedUsers` allowlist uses.
- Load-bearing risk: the FR-011 template-apply merge policy. Apply overwrites every
  template-controlled field, prompts before clobbering non-empty ones, and never touches the
  student-identity fields. Getting this field-domain boundary wrong quietly breaks S-04.
- Open unknown: an empty template must apply as a no-op (US-01), but "empty" is undefined for
  fields that carry defaults rather than blanks. Owner: implementer. Non-blocking.

## JDK setup — required for `npm run emulators` and `npm run test:rules`

The Firestore emulator runs on the JVM. `firebase-tools` shells out to whatever `java` is on `PATH`;
without it, `npm run emulators` and `npm run test:rules` both fail before running anything.

**Version: JDK 21 (LTS).** Any distribution works. `firebase-tools` needs 11 or newer; 21 is the
current LTS and is what the emulator suite is tested against. Do not install a JRE — a JDK is what
the tooling expects, and the difference is not always reported clearly.

Pick one:

| Method | Command | Notes |
| --- | --- | --- |
| winget (system-wide) | `winget install --id Microsoft.OpenJDK.21 --accept-package-agreements --accept-source-agreements` | The Microsoft MSI sets `JAVA_HOME` and appends to the system `PATH` itself. May prompt for elevation. |
| scoop (per-user) | `scoop bucket add java` then `scoop install java/openjdk21` | No elevation. Shims `java` onto the user `PATH`; does **not** set `JAVA_HOME`. |
| Manual | Adoptium Temurin 21 MSI from `adoptium.net` | In the installer, enable **"Set JAVA_HOME variable"** and **"Add to PATH"** — both are off by default. |

**What has to be set in the system:** only `java` on `PATH`. `JAVA_HOME` is not read by
`firebase-tools`, but several other JVM tools do read it, so setting it is worth the zero extra
effort when the installer offers it.

**After installing — the PATH refresh trap.** A running shell keeps the `PATH` it started with, and
so does a running Claude Code session. To verify without restarting anything, refresh `PATH` from the
registry inside the same PowerShell call, which also makes `java` visible to the `npm` process it
spawns:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path','User')
java -version
npm run test:rules
```

Record the installed version here once `java -version` answers, so the next machine can match it:

- **JDK version installed:** `21.0.12` (2026-07-21 LTS), Java HotSpot 64-Bit Server VM,
  build `21.0.12+7-LTS-205`. `JAVA_HOME` is not set and does not need to be.

**One operational wrinkle, found while verifying.** `firebase emulators:exec` stops the Firestore
emulator with `SIGKILL`, and the JVM does not always release port 8080 before the next run starts —
the second invocation then fails with `Could not start Firestore Emulator, port taken`. If that
happens, kill the leftover process and re-run:

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
