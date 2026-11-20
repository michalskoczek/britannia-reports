# Plan automatyzacji – Britannia Reports

Wersja 3, 2026-11-20. Wersja 1 powstała w czacie bez dostępu do kodu, wersja 2 (2026-11-07)
poprawiła ją na podstawie repo. Ta wersja opisuje **to, co działa**, decyzje, które zapadły, i to,
co zostało do zrobienia.

## Jak to teraz działa

```
issue (szablon) ──/task──▶ branch od develop ──▶ PR do develop
                                                  │
              CI: Lint, types, build · Unit tests · Firestore rules · E2E   (wymagane checki)
              Claude review: komentarz agenta pr-reviewer po zielonym CI   (doradczo)
                                                  │ merge (tylko merge commit, robisz Ty)
                                                  ▼
                       develop ──Deploy staging──▶ https://britannia-reports-staging.web.app
                                                  │ klient sprawdza
                                                  │ PR release develop → master, merge
                                                  ▼
                       master ──Deploy production──▶ https://britannia-reports.web.app
```

| Element | Gdzie | Co robi |
|---|---|---|
| Ruleset `protect-master-develop` | GitHub → Settings → Rules | `master` i `develop`: tylko przez PR, 4 wymagane checki CI, tylko merge commit, zakaz force-push i usuwania, bez wyjątków |
| CI | `.github/workflows/ci.yml` | na każdy PR do `develop`/`master`: lint, `tsc`, buildy prod/dev/staging, kontrola, że bundle stagingu nie zawiera produkcji, testy hooka, unit (Karma), reguły (emulator), e2e (emulatory + sesja tworzona automatycznie przez `test/e2e/ci-session.mjs`) |
| Deploy staging | `.github/workflows/deploy-staging.yml` | push do `develop` → build `staging` → `test:rules` → reguły → hosting → smoke test |
| Deploy produkcji | `.github/workflows/deploy-production.yml` | push do `master` → to samo dla `britannia-reports`, w pełni automatycznie |
| Środowiska GitHub | `staging` (tylko z `develop`), `production` (tylko z `master`) | każde ma własny sekret `FIREBASE_SERVICE_ACCOUNT` (konto `github-deploy` z 5 rolami, bez Owner/Editor) |
| `@claude` | `.github/workflows/claude.yml` | komentarz z `@claude` w issue/PR — **tylko właściciel repo** (repo publiczne) |
| Automatyczny review | `.github/workflows/claude-review.yml` + `.claude/agents/pr-reviewer.md` | po zielonym CI, raz na commit, tylko PR-y właściciela z tego repo; czyta `src/CLAUDE.md` i `.github/instructions/` |
| Niezmienniki projektu | `.github/instructions/*.instructions.md` | PDF, reguły Firestore, i18n, e2e, environments, build i release — jedno źródło dla Claude (i Copilota, gdyby był włączony) |
| `/task <nr>` | `.claude/commands/task.md` | issue → branch od `develop` → `/10x-new` → `/10x-plan` (czeka na akceptację) → `/10x-implement` → bramki → review → PR z `Closes #nr` |
| Strażnik deployu | `.claude/hooks/guard-firebase-deploy.js` | blokuje agentowi `firebase deploy` na produkcję poza `master`; `--project staging` dozwolone; testy w CI |
| Szablony issue | `.github/ISSUE_TEMPLATE/` | feature i bug; puste issue wyłączone |

## Środowiska Firebase

| | Produkcja | Staging |
|---|---|---|
| Projekt | `britannia-reports` | `britannia-reports-staging` (alias `staging` w `.firebaserc`) |
| URL | https://britannia-reports.web.app | https://britannia-reports-staging.web.app |
| Dane | prawdziwi nauczyciele i uczniowie | tylko fikcyjni uczniowie |
| Build | `npm run build` | `npm run build -- --configuration staging` |
| App Check | reCAPTCHA **v3 (klasyczny, przestarzały)**, wymuszony na Firestore | reCAPTCHA **Enterprise**, **jeszcze niewymuszony** |
| Allowlista | `allowedUsers` w produkcji | `allowedUsers` w stagingu (2 konta właściciela) |

## Decyzje

- **Branche:** `master` = produkcja, `develop` = integracja i cel PR-ów. Release = PR `develop` → `master`,
  merge commitem. Po release nie synchronizujemy `develop` ręcznie (ruleset to blokuje i nie ma potrzeby).
- **Staging = drugi projekt Firebase** (testbed klienta), żeby klient nie pracował na danych dzieci.
- **Bez preview per PR** — wystarcza staging.
- **Produkcja wdraża się w pełni automatycznie** po merge do `master` (bez ręcznego zatwierdzania).
- **`/task` = cienka nakładka na flow 10x.**
- **Review robi Claude** (agent `pr-reviewer`); Copilot nie jest skonfigurowany. Merge zostaje
  w rękach właściciela — żaden workflow Claude nie dostaje uprawnień do merge.
- **Repo zostaje publiczne** — na planie Free prywatne repo wyłączyłoby ruleset i dało limit minut Actions.
- **Taski: GitHub Issues + Projects; Notion tylko dokumentacja.** Automat odpytujący Notion — odrzucony.
- **Tryb pracy (od 2026-11-20):** Claude wykonuje kroki i opisuje, co robi; bez trybu nauki.

## Co zostało do zrobienia

1. **Wymuszanie App Check na stagingu.** Po kilku dniach używania: konsola Firebase (staging) →
   App Check → APIs → Cloud Firestore → gdy widać zweryfikowane żądania → **Enforce**.
2. **Migracja produkcji z klasycznego reCAPTCHA v3 na Enterprise.** Klasyczny jest przestarzały
   (konsola Firebase nie pozwala już go rejestrować dla nowych aplikacji). Kolejność: klucz Enterprise
   w Google Cloud dla domen produkcji → rejestracja w App Check (produkcja) → `appCheckProvider:
   'recaptcha-enterprise'` + nowy klucz w `environment.prod.ts` → staging → produkcja → obserwacja
   metryk. Osobna zmiana przez flow 10x; wymuszanie na produkcji jest włączone, więc zła kolejność
   zablokuje logowanie.
3. **Tablica GitHub Projects.** Wymaga `gh auth refresh -h github.com -s project` (token nie ma tego
   uprawnienia), potem tablica ze statusami powiązana z repo.
4. **Workload Identity Federation zamiast kluczy JSON** (opcjonalnie) — logowanie CI do Google bez
   długoterminowego klucza.
5. **Claude Design `/design-sync`** — poza zakresem automatyzacji, przy pracy nad wyglądem.

## Znane pułapki

- **App Check w narzędziowej przeglądarce Claude zwraca 400** na produkcji (reCAPTCHA v3 odrzuca
  automatyzację). To nie awaria — sprawdzaj logowaniem we własnej przeglądarce.
- **Ostrzeżenie „Cross-Origin-Opener-Policy would block the window.closed call”** przy logowaniu —
  znane zachowanie Firebase Auth z okienkiem Google, nieszkodliwe.
- **Workflowy wyzwalane komentarzami i `workflow_run` działają z wersji na `master`.** Zmiana w
  `claude.yml` / `claude-review.yml` zaczyna działać dopiero po release.
- **Zmiana nazwy joba w `ci.yml` blokuje merge**, dopóki ruleset nie dostanie nowej nazwy checka.
- **`node --test <katalog>` nie działa na Node 22** — zawsze glob (`test/rules/*.test.mjs`).
- **`firebase-tools` jest instalowany globalnie** (lokalnie 15.26.0, w CI ta sama wersja), nie jest
  zależnością projektu.
- **Deploy z laptopa:** strażnik blokuje agenta, ale nie Ciebie — ręczny `firebase deploy` z
  niewłaściwego brancha nadal może cofnąć produkcję. Normalna droga to workflowy.

## Historia

- 2026-11-07 — porządek w repo, `master` przewinięty do `10xdevs`, `develop` utworzony, ruleset.
- 2026-11-20 — strażnik deployu (#68), CI z e2e (#69), szablony / `@claude` / review / niezmienniki
  (#70, #71), release (#72), staging (#73), workflowy deployu (#74), release i pierwszy automatyczny
  deploy produkcji (#75).
