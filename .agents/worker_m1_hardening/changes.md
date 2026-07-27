# Changes Report - M1 Edge-Case Hardening

## Overview
Edge-case hardening fixes were applied to `gematria.js` for `FindAcrostics` and `CalculateELSPValue`. Corresponding edge-case test assertions were added to `test.js`.

## Files Modified

### 1. `gematria.js`
- **FindAcrostics targetWord handling**:
  - Added early check for non-null/undefined `targetWord`.
  - Cleans `targetWord` of non-Hebrew characters using `String(targetWord).replace(/[^\u05D0-\u05EA]/g, '')`.
  - If `cleanTarget === ''` (e.g. `targetWord = '1234'`), immediately returns `[]` instead of falling through to full-phrase extraction.
- **CalculateELSPValue input validation & skip range handling**:
  - Added strict finite validation using `Number.isFinite` for `textLength`, `searchWord`, and `skipSpec`. Returns default `{ expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 }` if non-finite or invalid.
  - Implemented explicit nullish/type checks (`typeof minSkip === 'number'`) for `minSkip` and `maxSkip` on object `skipSpec` rather than `minSkip || 1` to handle 0 correctly.
  - Correctly calculates total valid skip offsets (`totalL`) for skip range `{ minSkip, maxSkip }` accounting for all positive skips (`minSkip` to `maxSkip`) and negative skips (`-maxSkip` to `-minSkip`).
  - Capped `absMax` to `Math.min(textLength, Math.ceil(textLength / Math.max(1, k - 1)) + 1)` to prevent infinite loops if `maxSkip` is `Infinity` or extremely large.

### 2. `test.js`
- Added edge-case test assertion for `FindAcrostics` with `targetWord = '1234'`, verifying it returns `[]` immediately.
- Added edge-case test assertion for `CalculateELSPValue` with skip range `{ minSkip: -50, maxSkip: 50 }`, verifying non-NaN `expectedMatches > 0` and valid `pValue`.
- Added edge-case test assertion for `CalculateELSPValue` with `textLength = NaN`, verifying it returns `{ expectedMatches: 0, pValue: 1.0 }`.

## Verification Command & Output
- Command: `node test.js`
- Result: 100% PASS (53 assertions passed)
- Command: `node adversarial_test.js`
- Result: 100% PASS (404 assertions passed)
