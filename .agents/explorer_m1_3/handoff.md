# ELS Statistical Significance / P-Value Calculator - Handoff Report

## 1. Observation
- `gematria.js` (line 387): `FindELS(text, searchWord, minSkip, maxSkip)` currently returns match items containing only `{ word, start, skip, indices }` without statistical metrics.
- `torah_text.js` (line 6): `TORAH_TEXT` contains $N = 6877$ Hebrew consonantal characters (Genesis 1-5).
- `PROJECT.md` (lines 33-34): Specifies the interface contract for `CalculateELSPValue` returning `{ expectedMatches, pValue, statisticalSignificanceScore, logPValue }` and `FindELS` returning matches enhanced with `{ pValue, expectedCount }`.
- Direct execution of node analysis on `TORAH_TEXT` confirmed letter frequency distribution ($N=6877$ across 27 distinct letter forms), yielding $P(\text{"תורה"}) \approx 2.9785 \times 10^{-5}$, $E(s=50) \approx 0.200364$, $P(X \ge 1) \approx 0.181568$, and $S \approx 0.7410$.

## 2. Logic Chain
- Step 1: Pre-computing letter frequencies $f_c = \frac{\text{count}(c)}{N}$ once per text corpus enables efficient calculation of word occurrence probability $P(W) = \prod_{i=1}^k f_{c_i}$ under the null hypothesis of independent random letters.
- Step 2: The number of valid starting positions for an ELS of length $k$ at skip $s$ is $L(s) = \max(0, N - (k-1) \cdot |s|)$.
- Step 3: The expected number of random occurrences is $E(s) = L(s) \cdot P(W)$.
- Step 4: Under a Poisson model, the probability of observing at least 1 match by random chance is $P(X \ge 1) = 1 - e^{-E}$, evaluated numerically as `-Math.expm1(-E)` to prevent floating-point precision loss when $E \ll 1$.
- Step 5: The statistical significance score $S = -\log_{10}(P)$ provides an intuitive logarithmic metric (higher score = greater anomaly).
- Step 6: Integrating `CalculateLetterFrequencies` and `CalculateELSPValue` into `FindELS` enhances each match item with `{ expectedCount, pValue, significanceScore }` while keeping performance $O(N)$ and maintaining backward compatibility.

## 3. Caveats
- Corpus scope: Letter frequencies are calculated over the text supplied to `FindELS` (`TORAH_TEXT` Genesis 1-5, $N=6877$). If a full Torah corpus ($N=304805$) is used in future milestones, $N$ and $f_c$ will adjust automatically.
- Model assumptions: The Poisson independent letter model assumes letter independence. While Hebrew text has natural n-gram structure, independent letter Poisson expectation is the standard ELS baseline methodology.

## 4. Conclusion
- Designed the complete mathematical model and API specifications for `CalculateLetterFrequencies`, `CalculateELSPValue`, and `FindELS` integration.
- Documented full implementation details in `analysis.md` and specified comprehensive unit tests for `test.js`.

## 5. Verification Method
- **Command**: `node test.js`
- **Expected Result**: All tests pass with exit code 0, including new unit tests validating $E$, $P$, and $S$ values for `'תורה'` at skip 50 ($E \approx 0.2004$, $P \approx 0.1816$, $S \approx 0.741$) and verified metadata presence in `FindELS` results.
- **Files to inspect**:
  - `gematria.js` (addition of `CalculateLetterFrequencies`, `CalculateELSPValue`, export statements, and `FindELS` match object enhancement)
  - `test.js` (addition of Section 10 unit tests)
