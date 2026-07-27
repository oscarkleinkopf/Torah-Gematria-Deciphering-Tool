# Project: Torah Gematria Deciphering Tool — Suite Integral de Mejoras

## Architecture
Vanilla JavaScript ES6+ single-page application with modular architecture:
- `gematria.js`: Core Gematria calculations, Temura ciphers (Atbash, Albam, Avgad), Acrostics (Roshei/Sofei Teivot), ELS search & statistical p-value calculator.
- `torah_text.js`: Expanded Hebrew biblical consonantal corpus.
- `database.js`: Knowledge graph (50+ concepts) & historical timeline data.
- `elsWorker.js`: Web Worker module for offloading heavy ELS search and matrix computations to background thread.
- `export.js` / Canvas exporter: PNG/Report export utility for ELS matrix and Gematria breakdown visuals.
- `storage.js`: LocalStorage manager for Favorites and Saved Searches.
- `app.js`: UI Controller, DOM event bindings, Cyber-Mystic navigation, visual animations, and Canvas renderers.
- `styles.css`: Cyber-mystic glassmorphism UI styles, CSS variables, responsiveness, animation effects.
- `index.html`: Responsive layout with navigation tabs for Calculator, Torah, ELS Code, Zionism, Comparator, Acrostics, Letter Mirror, Favorites.
- `test.js`: Automated unit test suite run via `node test.js`.

## Code Layout
- Root directory contains HTML, CSS, JS runtime files and `test.js` automated test suite.
- `.agents/` metadata directory for agent coordination plans, progress tracking, and audit logs.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Analytical Engine Expansion (Temura & Acrostics & ELS Stats) | Add Albam & Avgad ciphers, Roshei & Sofei Teivot acrostic searcher, ELS expectation & p-value formula in `gematria.js` and `test.js` | None | DONE |
| M2 | Multithreaded Worker & Expanded Torah Corpus | Implement `elsWorker.js` for async non-blocking ELS searches and expand Torah text in `torah_text.js` | M1 | PLANNED |
| M3 | Export System & LocalStorage Favorites | Implement PNG visual export for matrix/breakdowns and LocalStorage persistence for favorites/searches | M1, M2 | PLANNED |
| M4 | Cyber-Mystic UI Polish & Module Integration | Integrate Acrostics UI, ELS P-Value indicators, Worker progress UI, Export buttons, Favorites tab, and CSS polish across all tabs | M1, M2, M3 | PLANNED |
| M5 | Final E2E Test Pass & Forensic Integrity Audit | Validate 100% test suite passing (`node test.js`), UI error-free execution, and full Forensic Integrity verification | M1, M2, M3, M4 | PLANNED |

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
- `RemoveFavorite(id)`: Removes item by ID

### Export Utility (`app.js` / `export.js`)
- `ExportMatrixAsPNG(canvasElement | containerId, filename)`: Triggers PNG image download of ELS visual matrix or Gematria card.
