# Handoff Report: Albam & Avgad Cipher Design (Milestone M1)

## 1. Observation

1. **`gematria.js` Structure (lines 7-46, 188-254, 434-459)**:
   - `HEBREW_MAP` (lines 7-35) maps 22 standard letters and 5 Sofit variants (`ך`, `ם`, `ן`, `ף`, `ץ`).
   - `ATBASH_PAIRS` (lines 38-46) defines Atbash mappings for all 22 standard letters + 5 Sofit variants:
     ```javascript
     const ATBASH_PAIRS = {
       'א': 'ת', 'ב': 'ש', 'ג': 'ר', 'ד': 'ק', 'ה': 'צ',
       'ו': 'פ', 'ז': 'ע', 'ח': 'ס', 'ט': 'נ', 'י': 'מ',
       'כ': 'ל', 'ל': 'כ', 'מ': 'י', 'נ': 'ט', 'ס': 'ח',
       'ע': 'ז', 'פ': 'ו', 'צ': 'ה', 'ק': 'ד', 'ר': 'ג',
       'ש': 'ב', 'ת': 'א',
       // Manejo de Sofit en Atbash (típicamente se reducen a sus formas normales para Atbash)
       'ך': 'ל', 'ם': 'י', 'ן': 'ט', 'ף': 'ו', 'ץ': 'ה'
     };
     ```
   - `CalculateGematria` (lines 188-254) initializes `results` containing `atbashText` and `atbashValue`, computes them during iteration, and pushes `atbash` and `atbashVal` into `results.breakdown`.
   - Exports (lines 434-459) expose `CalculateGematria`, `HEBREW_MAP`, and `ATBASH_PAIRS`.

2. **`test.js` Structure (lines 23-33)**:
   - Contains tests for basic Gematria and Atbash cipher:
     ```javascript
     const calcAhava = Engine.CalculateGematria('אהבה');
     assert(calcAhava.atbashText === 'תצשצ', "Texto Atbash de אהבה es 'תצשצ'");
     ```

3. **`PROJECT.md` Guidelines (lines 5, 31)**:
   - Standard specification requires `CalculateGematria` to return:
     `{ originalText, cleanText, lettersCount, absolute, absoluteGadol, ordinal, reduced, atbashText, atbashValue, albamText, albamValue, avgadText, avgadValue, breakdown }`.

---

## 2. Logic Chain

1. **Rule Derivation for Albam**:
   - *Observation*: Standard Albam splits the 22-letter alphabet into two 11-letter groups ($1..11 \leftrightarrow 12..22$).
   - *Reasoning*:
     - Letters 1-11 (`א` to `כ`) swap with letters 12-22 (`ל` to `ת`).
     - Sofit variants (`ך`, `ם`, `ן`, `ף`, `ץ`) reduce to their base letters (`כ`, `מ`, `נ`, `פ`, `צ`) prior to substitution, yielding:
       - `ך` (base `כ`) $\to$ `ת`
       - `ם` (base `מ`) $\to$ `ב`
       - `ן` (base `נ`) $\to$ `ג`
       - `ף` (base `פ`) $\to$ `ו`
       - `ץ` (base `צ`) $\to$ `ז`
   - *Conclusion*: `ALBAM_PAIRS` dictionary mapped for all 27 keys.

2. **Rule Derivation for Avgad**:
   - *Observation*: Avgad substitutes each letter with the next alphabetical letter ($n \to n+1$), cyclic at $22 \to 1$.
   - *Reasoning*:
     - `א` $\to$ `ב`, `ב` $\to$ `ג`, ..., `ש` $\to$ `ת`, `ת` $\to$ `א`.
     - Sofit variants reduce to base letter prior to $+1$ shift:
       - `ך` (base `כ`) $\to$ `ל`
       - `ם` (base `מ`) $\to$ `נ`
       - `ן` (base `נ`) $\to$ `ס`
       - `ף` (base `פ`) $\to$ `צ`
       - `ץ` (base `צ`) $\to$ `ק`
   - *Conclusion*: `AVGAD_PAIRS` dictionary mapped for all 27 keys.

3. **Engine Integration**:
   - Adding `albamText`, `albamValue`, `avgadText`, `avgadValue` to `CalculateGematria` results object and `albam`, `albamVal`, `avgad`, `avgadVal` to `breakdown` items mirrors the existing Atbash implementation pattern without altering existing keys or behavior.

---

## 3. Caveats

- **Sofit Letter Values**: In standard Temura ciphers, cipher values (`albamValue`, `avgadValue`) sum the standard absolute value (`val`) of the substituted letters (e.g. `ת` = 400).
- **UI Integration Scope**: UI rendering of Albam/Avgad cards in `index.html` and `app.js` is part of subsequent tasks (or handled by implementer); this report provides the exact underlying data model contract.

---

## 4. Conclusion

The exact implementation details for Albam and Avgad Temura ciphers are fully specified and tested against test vectors (`אהבה`, `תורה`, `שלום`).
Implementing `ALBAM_PAIRS`, `AVGAD_PAIRS`, and extending `CalculateGematria` in `gematria.js` will enable seamless Temura cipher support with zero regression risk.

---

## 5. Verification Method

1. **Independent Test Execution**:
   Run unit tests via command shell:
   ```bash
   node test.js
   ```
2. **Key Assertions to Verify**:
   - `calcAhava.albamText === 'לעמע'`
   - `calcAhava.albamValue === 210`
   - `calcAhava.avgadText === 'בוגו'`
   - `calcAhava.avgadValue === 17`
   - `calcShalom.albamText === 'יאפב'` (Sofit test)
   - `calcShalom.avgadText === 'תמזנ'` (Sofit test)
3. **Invalidation Conditions**:
   - Any failure in existing test suite.
   - Discrepancies in letter breakdown arrays or missing property keys in return object.
