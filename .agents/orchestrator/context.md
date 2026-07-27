# Context — Torah Gematria Deciphering Tool

## Project Context
The Torah Gematria Deciphering Tool is an interactive client-side web application built with vanilla ES6+ JS, HTML5 Canvas, CSS glassmorphism, and Node.js unit testing.
It performs Gematria calculations (Standard, Gadol, Ordinal, Reduced, Atbash), ELS (Equidistant Letter Sequence) matrix searches over the Hebrew Torah text, Knowledge Graph matching, and Historical Timeline orbit comparisons.

## Target Enhancements (R1-R4)
1. **R1 (Analytical Engine)**:
   - Albam cipher (11-letter shift: א<->ל, ב<->מ...)
   - Avgad cipher (1-letter shift: א->ב, ב->ג...)
   - Roshei Teivot (word/verse initial acrostics) & Sofei Teivot (word/verse final acrostics)
   - ELS statistical expectation and p-value calculation
2. **R2 (Worker & Corpus)**:
   - Web Worker (`elsWorker.js`) for async non-blocking ELS searches
   - Corpus expansion in `torah_text.js`
3. **R3 (Export & Persistence)**:
   - Visual PNG download for ELS matrix & Gematria cards
   - LocalStorage favorites & saved search persistence
4. **R4 (UI Polish)**:
   - Cyber-mystic glassmorphism UI refinement, smooth animations, zero JS console errors across all modules.
