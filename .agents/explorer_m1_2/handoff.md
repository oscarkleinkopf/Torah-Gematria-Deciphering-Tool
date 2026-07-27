# Handoff Report: Roshei & Sofei Teivot Acrostics Detection Design (Milestone M1)

## 1. Observation
- `gematria.js` currently exports: `SpanishToHebrew`, `CalculateGematria`, `HEBREW_MAP`, `ATBASH_PAIRS`, `FindSharedRoot`, `GetFactorRelation`, `ScoreCorrelation`, `FindCorrelations`, `FindELS`. It does not yet include `FindAcrostics`.
- `PROJECT.md` specifies the interface contract for `FindAcrostics(text, type)` returning objects with `{ phrase, word, targetWord, isRoshei, isSofei, indices }`.
- `database.js` features verses and Zionist correlations where famous acrostics occur (e.g. Isaías 2:5 `בֵּית יַעֲקֹב לְכוּ וְנֵלְכָה` -> Roshei Teivot `BILU` / `בילו`).
- Hebrew texts in `database.js` and `torah_text.js` use neqqudot (U+0591..U+05C7), Maqaf (`־` U+05BE), and hyphens.
- Hebrew final letters (Sofiyot): `ך`, `ם`, `ן`, `ף`, `ץ` correspond to standard forms `כ`, `מ`, `נ`, `פ`, `צ`.
- Test execution baseline: `node test.js` currently passes 16/16 existing test assertions cleanly.

## 2. Logic Chain
1. **Word Extraction & Cleaning**:
   - Stripping diacritics (`replace(/[\u0591-\u05C7]/g, '')`) isolates consonantal Hebrew letters.
   - Replacing Maqaf/dashes with spaces ensures multi-word biblical compounds split correctly into distinct words.
   - For each word token, `firstLetter` is the initial Hebrew character (`\u05D0-\u05EA`), and `lastLetter` is the final character.
2. **Sofit Normalization**:
   - `NormalizeHebrewLetter` maps final letter forms (`ך`, `ם`, `ן`, `ף`, `ץ`) to base forms (`כ`, `מ`, `נ`, `פ`, `צ`).
   - When matching target words, `exactSofit = false` (default) compares both raw and normalized sequences. This correctly identifies acrostics even if target words use standard forms for final letters or vice versa.
3. **Sliding Window Search**:
   - If `targetWord` is supplied (e.g., length `L`), a sliding window of size `L` checks consecutive words `i .. i+L-1`.
   - Extracted initials (Roshei) or finals (Sofei) are compared against `targetWord` (after stripping non-Hebrew punctuation/quotes like `BILU` `ביל"ו` -> `בילו`).
4. **Return Structure**:
   - Matches include all required `PROJECT.md` fields (`phrase`, `word`, `targetWord`, `isRoshei`, `isSofei`, `indices`) plus detailed word-by-word position and letter metadata (`wordDetails`, `type`, `startIndex`, `endIndex`).

## 3. Caveats
- No source files (`gematria.js`, `test.js`) were modified during this investigation, as per read-only constraints.
- Multi-word targets (e.g., target phrases containing spaces) should be cleaned to pure Hebrew letter sequences when matching acrostics.
- Future UI integration in Milestone M4 will map the returned `wordDetails` to interactive letter highlights in the Acrostics tab.

## 4. Conclusion
The Acrostics detection engine design for `gematria.js` is complete, fully specified, and mathematically verified against classic Torah acrostic examples (BILU in Isa 2:5, Milah and YHVH in Deut 30:12, Hashamayim in Ps 96:11).
The exact implementation code, export schema, and unit tests are documented in `.agents/explorer_m1_2/analysis.md`.

## 5. Verification Method
To independently verify the acrostic algorithms once implemented:
1. Implement `FindAcrostics`, `NormalizeHebrewLetter`, and `NormalizeHebrewString` in `gematria.js`.
2. Add the test suite detailed in Section 5 of `analysis.md` to `test.js`.
3. Run `node test.js` in terminal.
4. Verify all 7 new acrostic test assertions pass alongside existing test assertions with zero failures.
