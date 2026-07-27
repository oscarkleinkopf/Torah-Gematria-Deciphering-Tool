# Master Plan — Torah Gematria Deciphering Tool Enhancements

## Objective
Deliver a complete, high-quality, fully tested enhancement suite for the Torah Gematria Deciphering Tool web platform in accordance with requirements R1-R4.

## Milestones Overview

### Milestone M1: Analytical Engine Expansion (Temura, Acrostics, ELS P-Value)
- **Goal**: Expand `gematria.js` engine and `test.js` to include Albam & Avgad ciphers, Roshei & Sofei Teivot acrostic searcher, and ELS expectation & p-value statistical significance.
- **Tasks**:
  1. Add Albam and Avgad mapping dictionaries and calculation logic to `CalculateGematria` and letter breakdowns in `gematria.js`.
  2. Implement `FindAcrostics(text, type)` for Roshei Teivot (initials) and Sofei Teivot (finals) of words/verses.
  3. Implement `CalculateELSPValue(textLength, searchWord, skip, letterFrequencies)` and integrate into `FindELS` matches.
  4. Expand `test.js` to assert correctness of Albam, Avgad, Acrostics, and ELS statistical calculations.
- **Verification**: `node test.js` passes with 100% success.

### Milestone M2: Multithreaded Worker & Corpus Expansion
- **Goal**: Offload heavy ELS search and matrix computations to Web Worker thread (`elsWorker.js`), and expand Torah corpus in `torah_text.js`.
- **Tasks**:
  1. Create `elsWorker.js` to handle ELS search messages asynchronously without blocking UI main thread.
  2. Expand biblical consonantal text in `torah_text.js` (e.g. additional Genesis chapters or full Pentateuch sections).
  3. Update `test.js` to verify worker search compatibility and expanded corpus integrity.
- **Verification**: `node test.js` passes with expanded corpus and worker logic.

### Milestone M3: Export System & Storage Persistence
- **Goal**: Implement visual PNG/Report export for ELS matrix & Gematria breakdown cards, and LocalStorage favorites/saved searches.
- **Tasks**:
  1. Create visual Canvas / HTML export routines for ELS Matrix grid and Gematria cards.
  2. Implement `storage.js` for LocalStorage favorites management (Add, Remove, List, Persist across sessions).
  3. Update `test.js` with mock/node tests for storage & export utility functions.
- **Verification**: `node test.js` passes with storage tests.

### Milestone M4: Cyber-Mystic UI Polish & Module Integration
- **Goal**: Update `index.html`, `app.js`, and `styles.css` to integrate all new analytical tools, worker progress indicators, export controls, favorites tab, and acrostics search tab under the cyber-mystic aesthetic.
- **Tasks**:
  1. Add Acrostics search tab, Temura cipher selector/card displays (Albam, Avgad), ELS P-Value badge displays, Favorites drawer/tab, and PNG export buttons.
  2. Wire `app.js` to use `elsWorker.js` with progress animations, fallback to inline execution if worker unavailable.
  3. Polish `styles.css` with responsive glassmorphism, golden/purple/olive glow, smooth transitions, clean console output.
- **Verification**: Manual & UI verification, JS syntax check, zero console errors.

### Milestone M5: Final E2E Test Pass & Forensic Integrity Audit
- **Goal**: Validate complete application functionality, 100% unit test pass rate, and conduct rigorous Forensic Integrity Audit.
- **Tasks**:
  1. Run `teamwork_preview_reviewer` and `teamwork_preview_challenger` to test end-to-end functionality.
  2. Run `teamwork_preview_auditor` for static & runtime integrity verification (no hardcoding, no facade implementations).
- **Verification**: Forensic Auditor CLEAN verdict + 100% test pass.
