# Project: Torah Gematria Deciphering Tool — Suite Integral de Mejoras

## Architecture
Vanilla JavaScript ES6+ single-page application with modular architecture:
- `torah_text.js`: Expanded Hebrew biblical consonantal corpus (~27k letters across 5 books; curated post-Genesis excerpts including Decálogo, Shemá, Birkat Kohanim). Sanitized at load (`SanitizeHebrewConsonantsLocal`). Exports `TORAH_BOOK_OFFSETS`, `TORAH_VERSE_MAP`, `LookupTorahVerse(index)` (letter → Génesis 1:1, etc.).
- `database.js`: Knowledge graph (57 concepts) & historical timeline (13 events).
- `elsWorker.js`: Web Worker module for offloading heavy ELS search; supports progress + cooperative cancel via `shouldCancel`.
- `hebrew_calendar.js`: Gregorian ↔ Hebrew civil calendar (Dershowitz/Reingold), Hebrew year letters (ה׳תש״ח), parse `5 Iyar 5708`.
- `explore.js`: Unified correlation explorer — surname/name dictionary (builtin + live user entries from LocalStorage), date parser with real Hebrew calendar, `ExploreCorrelations()`, and `BuildPersonalProfile()` (given name + surname + birth date → unified dossier).
- `export.js`: PNG/Report export utility for ELS matrix and Gematria breakdown visuals.
- `storage.js`: LocalStorage manager for Favorites, Explore history, and the user name dictionary (`GetUserNameDictionary` / `SaveUserNameEntry` / `RemoveUserNameEntry`).
- `gematria.js`: Core Gematria calculations, Temura ciphers, Acrostics, ELS search & p-value; exports `SanitizeHebrewConsonants` and abortable `FindELS`.
- `app.js`: UI Controller, DOM event bindings, Cyber-Mystic navigation, visual animations, Canvas renderers, and Explore tab.
- `styles.css`: Cyber-mystic glassmorphism UI styles, CSS variables, responsiveness, animation effects.
- `index.html`: Responsive layout with navigation tabs for Explore, Calculator, Torah, ELS Code, Zionism, Comparator, Acrostics, Letter Mirror, Favorites.
- `test.js`: Automated unit test suite run via `node test.js`.
- `adversarial_test.js`: Stress / cipher / acrostic / ELS adversarial suite.

## Code Layout
- Root directory contains HTML, CSS, JS runtime files and automated test suites.
- `.agents/` is gitignored (local agent metadata only).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Analytical Engine Expansion (Temura & Acrostics & ELS Stats) | Add Albam & Avgad ciphers, Roshei & Sofei Teivot acrostic searcher, ELS expectation & p-value formula in `gematria.js` and `test.js` | None | DONE |
| M2 | Multithreaded Worker & Expanded Torah Corpus | Implement `elsWorker.js` for async non-blocking ELS searches and expand Torah text in `torah_text.js` | M1 | DONE |
| M3 | Export System & LocalStorage Favorites | Implement PNG visual export for matrix/breakdowns and LocalStorage persistence for favorites/searches | M1, M2 | DONE |
| M4 | Cyber-Mystic UI Polish & Module Integration | Integrate Acrostics UI, ELS P-Value indicators, Worker progress UI, Export buttons, Favorites tab, and CSS polish across all tabs | M1, M2, M3 | DONE |
| M5 | Final E2E Test Pass & Forensic Integrity Audit | Validate 100% test suite passing (`node test.js`), UI error-free execution, and full Forensic Integrity verification | M1, M2, M3, M4 | DONE |

## Interface Contracts
### `gematria.js`
- `CalculateGematria(hebrewText)`: Returns `{ originalText, cleanText, lettersCount, absolute, absoluteGadol, ordinal, reduced, atbashText, atbashValue, albamText, albamValue, avgadText, avgadValue, breakdown }`
- `FindAcrostics(text, type, targetWord, options)`: `type` is `'roshei'`, `'sofei'`, or `'both'`. Returns array of `{ phrase, cleanPhrase, word, targetWord, isRoshei, isSofei, indices, wordDetails }`
- `CalculateELSPValue(textLength, searchWord, skipSpec, letterFrequencies)`: Returns `{ expectedMatches, pValue, statisticalSignificanceScore, logPValue }`
- `FindELS(text, searchWord, minSkip, maxSkip)`: Returns array of matches enhanced with `{ pValue, expectedCount, significanceScore }`

### `elsWorker.js`
- Message payload: `{ action: 'searchELS', text, searchWord, minSkip, maxSkip }`
- Response payload: `{ action: 'elsResults', matches, status: 'complete', progress: 100 }` / `{ action: 'progress', percent: number }`

### `storage.js` / LocalStorage
- `SaveFavorite(item)`: Saves `{ id, type, title, data, timestamp }`
- `GetFavorites()`: Returns array of saved items
- `RemoveFavorite(id)`: Removes item by ID (or numeric index)
- `GetUserNameDictionary()`: Personal name entries `{ id, spanish[], hebrew, kind, note }`
- `SaveUserNameEntry(entry)` / `RemoveUserNameEntry(id)`: persist or delete a personal name; merged at lookup time with the builtin `NAME_DICTIONARY`

### Export Utility (`export.js`)
- `ExportMatrixAsPNG(canvasElement | containerId, filename, matchMeta?)`: Triggers PNG image download of ELS visual matrix or canvas element.

### `explore.js`
- `ExploreCorrelations(query, db, Engine)`: Unified search (surname / name / date / event / number / compound). Uses builtin + user name dictionary.
- `BuildPersonalProfile({ givenName, surname, birthDate, extra }, db, Engine)`: Personal dossier merging name, surname and birth date into one `queryType: 'profile'` report.
- `GetActiveNameDictionary()` / `BuildUserNameEntry()` / `SearchNameDictionary()`: live dictionary merge, validation and browse/filter.
- `FormatCorrelationReport(data)`: Plain-text correlation / profile report for download.

### `hebrew_calendar.js`
- `GregorianToHebrew(y, m, d)` / `HebrewToGregorian(hy, hm, hd)`: civil Hebrew calendar (1=Nisan … 7=Tishrei).
- `ParseHebrewDate("5 Iyar 5708")`: Latin Hebrew date → Gregorian.
- `NumberToHebrewLetters(n)`: 5708 → ה׳תש״ח.

### `torah_text.js`
- `LookupTorahVerse(index)`: letter offset in `TORAH_TEXT` → `{ reference, bookLabel, chapter, verse, start, end }`.
- `LookupTorahVerseSpan(indices)`: ELS letter list → `"Génesis 1:1 → Génesis 1:2"`.
- `TORAH_VERSE_MAP`: compact `[start, bookIdx, chapter, verse]` covering 100% of the corpus.

## Verification
```bash
make check
# or: node test.js && node adversarial_test.js
```
