# Plan automatyzacji – Britannia Reports

Wersja 2, zaktualizowana 2026-11-07 na podstawie kodu i dokumentów w repo. Pierwsza wersja powstała
w czacie, bez dostępu do kodu, i część jej założeń okazała się nieprawdziwa (zob. „Stan faktyczny”).
Przeczytaj całość przed rozpoczęciem pracy.

## Projekt

- Aplikacja webowa dla szkoły językowej: nauczyciel loguje się kontem Google, wypełnia formularz,
  aplikacja generuje raport PDF (pdfmake) dla ucznia.
- Angular 20 (standalone, `input()`, `inject()`, `@for`/`@if`), SCSS, Angular Material, ngx-translate.
- **Firebase: Hosting + Auth (Google, allowlista nauczycieli) + Firestore (`eur3`, dane uczniów –
  dzieci) + App Check (reCAPTCHA v3, wymuszony na Firestore).** Jeden projekt Firebase,
  `britannia-reports`, wspólny dla dev i prod; lokalnie pracujemy na emulatorach.
- Produkcja: https://britannia-reports.web.app, deploy ręcznie z terminala.
- Repo publiczne na GitHubie, laptop z Windows.

Źródła prawdy o infrastrukturze: `context/foundation/infrastructure.md`,
`context/deployment/deploy-plan.md`, `src/CLAUDE.md`.

## Zasady współpracy

- Pokazuj całe pliki ze zmienionym kodem.
- Nowe tłumaczenia pl i en podawaj jako płaski JSON.
- **Użytkownik chce się nauczyć całego procesu**, a nie tylko dostać gotowe pliki. Każdy krok:
  1. krótko: jaki problem rozwiązuje narzędzie i jak działa,
  2. użytkownik sam uruchamia komendy i tworzy pliki, Claude tłumaczy każdą linijkę,
  3. małe ćwiczenie do zrobienia samodzielnie, potem sprawdzenie,
  4. na koniec kroku coś realnie działa.
- Kroki, które zmieniają kod lub infrastrukturę (3, 4, 6), idą przez flow 10xDevs:
  `/10x-frame` → `/10x-new` → `/10x-research` → `/10x-plan` → `/10x-plan-review`. Flow daje plan
  i decyzje; implementację robi użytkownik, faza po fazie, z tłumaczeniem Claude.
- Po każdym kroku krótka notatka do dokumentacji (`docs/` albo Notion).

## Stan faktyczny (zweryfikowany 2026-11-07)

| Plan v1 zakładał | Jest naprawdę | Źródło |
|---|---|---|
| Sam frontend, bez bazy | Auth z allowlistą, Firestore z danymi uczniów, App Check wymuszony | `infrastructure.md`, `src/app/app.config.ts` |
| Główny branch `main` | `master`. Do 2026-11-07 deploy szedł z `10xdevs` (wcześniej z `dev`), a `master` był snapshotem z 2023 r. | `src/CLAUDE.md` |
| Playwright trzeba dodać | Jest: `test/e2e/`, 4 specy pobierania PDF, seed spec, fixture `test/e2e/fixtures/app.ts` | `playwright.config.ts`, `test-plan.md` faza 5 |
| Testy jednostkowe nie przechodzą | Zielone według health-check (lipiec 2026); do potwierdzenia przy pierwszym CI | `health-check.md` |
| CI do napisania | Brak `.github/` – potwierdzone. To jest faza 6 `test-plan.md` („Quality gates wired”, not started) | `test-plan.md` |
| — | Lokalne bramki już działają: lefthook `pre-commit` (typecheck + lint) i hook ESLint po każdej edycji agenta | `lefthook.yml`, `.claude/settings.json` |
| — | Testy reguł Firestore: `npm run test:rules` (36 scenariuszy), nic ich nie uruchamia automatycznie | `test/rules/`, `src/CLAUDE.md` |
| — | GitHub CLI (`gh`) zainstalowany i zalogowany 2026-11-07; wtyczka GitHub MCP w Claude nie łączy się (zły nagłówek autoryzacji) | sesja 2026-11-07 |

## Porządek w repo (zrobione 2026-11-07)

- `master` przewinięty (fast-forward) do `10xdevs`, wypchnięty. Utworzony `develop` od `master`.
- Usunięte 32 lokalne i 7 zdalnych branchy oraz stash. `10xdevs` zostaje do merge'a PR
  z tymi zmianami, potem do usunięcia.
- 9 zakończonych zmian przeniesionych do `context/archive/` przez `/10x-archive`, roadmapa zamknięta.
- `idea-notes.md` przeniesiony do `context/foundation/`; dokumenty mówiące „deploy z `dev`/`10xdevs`”
  poprawione na `master`.

## Decyzje

### Utrzymane

- **Taski: GitHub Issues + GitHub Projects** (tablica ze statusami i datami, wbudowane automatyzacje).
- **Notion: tylko dokumentacja i wiedza** (opisy funkcji, decyzje, instrukcje dla nauczycieli, notatki
  z nauki). Dokumentacja techniczna zmieniająca się z kodem → `docs/`, `context/`, `CLAUDE.md`.
- **Praca z Claude lokalnie w Claude Code** + Remote Control (pytania i zgody na telefonie).
  Drobne poprawki: `@claude` w issue/PR (GitHub Actions).
- Odrzucone: automat w GitHub Actions odpytujący Notion co 30 min (wolna komunikacja, brak dostępu
  do Claude Design, koszt minut Actions). Z paczki usuwamy `scripts/notion.mjs`,
  `notion-to-claude.yml` i kroki Notion z workflowów.

### Zmienione

- **Branche:** `master` = produkcja, `develop` = integracja. Feature branche od `develop`, **PR-y do
  `develop`**, wydanie = merge `develop` → `master`. (v1: bez `develop`.)
- **Środowiska: produkcja + staging z `develop`.** Staging to testbed dla klienta: przeklikuje nowe
  funkcje, zanim trafią na produkcję. (v1: tylko preview per PR, bez stagingu, „bo nie ma bazy” –
  baza jednak jest.)

### Otwarte – do rozstrzygnięcia we flow 10x przy krokach 3–4

- **D1. Czym jest staging?** Rekomendacja: **drugi projekt Firebase** (np. `britannia-reports-staging`)
  z własnym Auth, Firestore, App Check, allowlistą i fikcyjnymi uczniami. Bez tego klient klika na
  prawdziwych danych dzieci, bo dziś dev i prod to jeden projekt. Koszt: druga konfiguracja
  w `src/environments/`, osobna konfiguracja buildu w `angular.json`, alias w `.firebaserc`,
  ręczne włączenie Google Auth i App Check w konsoli, osobny seed allowlisty.
- **D2. Preview per PR – czy w ogóle?** Mając staging, preview każdego PR-a może być zbędne. Jeśli
  zostaje, musi korzystać ze stagingu, nie z produkcji. Pułapki: domeny kanałów preview
  (`britannia-reports--<kanał>-<hash>.web.app`) nie są na liście authorized domains w Auth, więc
  logowanie nie działa; do sprawdzenia, czy przepuszcza je też klucz reCAPTCHA z App Check.
- **D3. Skąd CI weźmie zalogowaną sesję i allowlistę?** Dzisiejsze e2e wymagają emulatorów (JDK),
  seedu z `.emulator-data/` (jest w `.gitignore`) i sesji złapanej ręcznie w okienku Google
  (`npm run e2e:auth:save`). W CI nic z tego nie ma. Kierunek do zbadania w `/10x-research`:
  skrypt seedujący allowlistę w repo + tworzenie użytkownika przez REST API emulatora Auth.
  Ostrzeżenie z `test-plan.md`: bramka, która po cichu się pomija, jest gorsza niż brak bramki.
- **D4. `/task <nr>` czy skille 10x?** `/task` miał czytać issue, robić branch, implementować
  i otwierać PR. To samo robi już `/10x-new` + `/10x-plan` + `/10x-implement`. Do decyzji: cienka
  komenda `/task`, która tylko czyta issue (`gh issue view`) i odpala flow 10x, albo rezygnacja z niej.
- **D5. Domyślny branch na GitHubie.** Dziś `master`. Jeśli PR-y idą do `develop`, ustawienie `develop`
  jako domyślnego oszczędza wybierania celu przy każdym PR. Wada: osoby z zewnątrz widzą
  na start kod nieprodukcyjny.
- **D6. Deploy `firestore.rules`.** Akcja `FirebaseExtended/action-hosting-deploy` wdraża tylko
  hosting. Reguły trzeba wdrażać osobno i **przed** hostingiem, po `npm run test:rules`.

## Flow docelowy

1. Issue z szablonu: cel, kryteria akceptacji, link do projektu Claude Design / strony Notion.
2. Lokalnie w Claude Code: issue → zmiana w `context/changes/` → plan → implementacja na branchu
   od `develop` → PR do `develop` z `Closes #<nr>` (forma komendy zależy od D4).
3. CI na PR: lint → typecheck (też szablony, czyli `ng build`) → testy jednostkowe → testy reguł →
   e2e (zależy od D3) → ewentualnie preview (D2).
4. Merge do `develop` → deploy na staging (D1) → klient sprawdza.
5. Merge `develop` → `master` → reguły Firestore → hosting na produkcję → smoke test → issue zamknięte,
   karta w Projects → Done.
6. Claude aktualizuje dokumentację (`docs/`, `context/`, Notion).

## Plan nauki (kolejność)

| # | Krok | Przez flow 10x? | Warunki wstępne / uwagi |
|---|---|---|---|
| 1 | Git i GitHub: branch, PR, merge, `develop` → `master` | nie | Porządek w repo już zrobiony – zostaje ćwiczenie na prawdziwym PR (np. ten z planem). |
| 2 | Playwright: lokatory (`getByRole` przed `getByTestId`), asercje, fixture, tryb `--ui` | nie (nowe testy: `/10x-e2e`) | Bazą jest istniejący `test/e2e/`, nie spec z paczki. Regresja wizualna dopiero gdy zdecydujemy, czego dotyczy. |
| 3 | GitHub Actions (CI): `on`/`jobs`/`steps`, `uses` vs `run`, sekrety vs zmienne, artefakty | **tak** – faza 6 `test-plan.md` | Najpierw bramki bez e2e (lint, build, unit, `test:rules`), e2e po rozwiązaniu D3. |
| 4 | Firebase w CI: konto serwisowe, staging, deploy live, ochrona branchy `master` i `develop` | **tak** | Wymaga D1, D2, D6. Uwaga: `firebase login:ci` / `--token` są przestarzałe – konto serwisowe. |
| 5 | GitHub Issues i Projects + szablon issue; Notion jako baza wiedzy | nie | `gh` gotowy. |
| 6 | Claude Code: `CLAUDE.md`, `/task` lub flow 10x, tryby uprawnień, Remote Control, `@claude` w PR | częściowo | Wymaga D4. `claude.yml` rozszerzyć o zdarzenia `issues`. |
| 7 | Claude Design: `/design-sync` i handoff do kodu | nie | — |

## Materiały z paczki `britannia-automation.zip`

| Plik | Decyzja | Powód |
|---|---|---|
| `.github/workflows/ci.yml` | przerobić | Dobra struktura (build → testy → artefakty). Do zmiany: e2e wymagają emulatorów i seedu (D3), preview tylko na stagingu (D2), usunąć kroki Notion, dodać `npm run test:rules`. |
| `.github/workflows/deploy.yml` | przerobić | Trigger `main` → `master`; dodać deploy reguł przed hostingiem (D6); smoke test szuka nieistniejącego testu „tabele są puste”; usunąć kroki Notion. Dojdzie osobny deploy stagingu z `develop`. |
| `.github/workflows/claude.yml` | przerobić | Dobra baza; dodać zdarzenia `issues` i `@claude` w issue. |
| `.github/workflows/update-screenshots.yml` | odłożyć | Ma sens dopiero, gdy będą testy wizualne. Wymaga `GH_PAT`. |
| `.github/workflows/notion-to-claude.yml`, `scripts/notion.mjs` | odrzucić | Decyzja o rezygnacji z automatu Notion. |
| `playwright.config.ts` | odrzucić | Nadpisałby obecny config (`testDir: ./e2e`, `webServer`, testy równoległe), który celowo nie ma `webServer` i działa sekwencyjnie. |
| `e2e/teddy-eddie-report.spec.ts` | odrzucić | Wchodzi na `/` bez logowania (trafia na `sign-in`), używa selektorów CSS wbrew regułom projektu. Istnieje lepszy `test/e2e/teddy-eddie-download.spec.ts`. |
| `CLAUDE.md` | odrzucić | Sprzeczny z obecnym `CLAUDE.md` i `src/CLAUDE.md` (np. selektory). |
| `docs/automation-setup.md` | wykorzystać fragmenty | Kroki Firebase/sekrety/ochrona branchy jako materiał do kroku 4; flow Notion nieaktualny. |

## Znane pułapki

- **Preview i Auth:** domeny kanałów preview nie są autoryzowane w Firebase Auth – logowanie Google
  na preview nie działa, dopóki nie doda się domeny ręcznie.
- **App Check:** zepsuta atestacja wygląda jak `permission-denied` na zapisie do Firestore, nie jak
  błąd logowania. Na emulatorach App Check jest wyłączony, więc lokalnie tego nie zobaczysz.
- **Pusty deploy:** `firebase deploy` publikuje cokolwiek jest w `dist/browser` i kończy się kodem 0.
  Bramka: `ls dist/browser/index.html` po buildzie. `outputPath` i `hosting.public` zmieniać razem.
- **Reguły przed hostingiem:** `npm run test:rules`, potem `firebase deploy --only firestore:rules`,
  potem hosting.
- **Typecheck:** `tsc --noEmit` (lefthook) nie sprawdza szablonów Angulara ani `environment.prod.ts`;
  w CI potrzebny `ng build` dla obu konfiguracji.
- **`context/deployment/deploy-plan.md` jest częściowo nieaktualny** (pisze, że Auth i Firestore nie
  istnieją). Branch deployu poprawiony 2026-11-07, reszta do odświeżenia przy kroku 4.

## Następny krok

1. Merge PR z tym planem do `develop` i z `develop` do `master` (ćwiczenie kroku 1), potem usunięcie
   brancha `10xdevs`.
2. Krok 3: `/10x-frame` na „CI dla Britannia Reports” – w tym rozstrzygnięcie D1–D3.
