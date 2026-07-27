# ELS Statistical Significance / P-Value Calculator Architecture Analysis

## Executive Summary
This report presents the mathematical model, API specification, and unit test requirements for the ELS Statistical Significance & P-Value Calculator in `gematria.js`. By pre-computing letter frequencies across the consonantal Torah text ($N = 6877$), the engine computes exact expected match counts $E$, Poisson p-values $P(X \ge 1) = 1 - \exp(-E)$, and logarithmic significance scores $S = -\log_{10}(P)$ for each ELS match in `FindELS`.

---

## 1. Mathematical Statistical Model

### 1.1 Letter Frequencies ($f_c$)
The consonantal corpus $T$ (`TORAH_TEXT` in `torah_text.js`) has a total length $N = 6877$ characters spanning Genesis chapters 1 to 5.

For any character $c \in T$, its frequency is defined as:
$$f_c = \frac{\text{count}(c)}{N}$$

**Properties & Implementation Notes:**
- Total frequency sum constraint: $\sum_{c \in \Sigma} f_c = 1.0$, where $\Sigma$ is the alphabet present in $T$.
- 27 unique Hebrew letter characters are present in `TORAH_TEXT` (including both standard and final Sofit forms, e.g. `ם`, `ן`, `ץ`, `ף`, `ך`).
- Frequency computation is pre-calculated once via `CalculateLetterFrequencies(text)` to avoid $O(N)$ re-scans during search loop iterations.

Top frequency values in `TORAH_TEXT` ($N=6877$):
- `י` (Yod): 833 occurrences, $f_י = 833 / 6877 \approx 0.121128$
- `ו` (Vav): 794 occurrences, $f_ו = 794 / 6877 \approx 0.115457$
- `ה` (He): 678 occurrences, $f_ה = 678 / 6877 \approx 0.098589$
- `א` (Alef): 618 occurrences, $f_א = 618 / 6877 \approx 0.089865$
- `ל` (Lamed): 475 occurrences, $f_ל = 475 / 6877 \approx 0.069071$
- `ש` (Shin): 377 occurrences, $f_ש = 377 / 6877 \approx 0.054820$
- `ת` (Tav): 375 occurrences, $f_ת = 375 / 6877 \approx 0.054529$
- `ר` (Resh): 330 occurrences, $f_ר = 330 / 6877 \approx 0.047986$

### 1.2 Random Occurrence Probability $P(W)$
For a search word $W = c_1 c_2 \dots c_k$ of length $k = |W|$, assuming independent letter occurrences under the null hypothesis:
$$P(W) = \prod_{i=1}^k f_{c_i}$$

**Edge cases:**
- If $k < 2$, $P(W) = 0$.
- If any character $c_i \notin \Sigma$ (or $f_{c_i} = 0$), $P(W) = 0$.

**Sample Calculation for $W = \text{"תורה"}$ ($k=4$):**
- $f_ת = 375 / 6877 \approx 0.054529$
- $f_ו = 794 / 6877 \approx 0.115457$
- $f_ר = 330 / 6877 \approx 0.047986$
- $f_ה = 678 / 6877 \approx 0.098589$
- $P(\text{"תורה"}) = 0.054529 \times 0.115457 \times 0.047986 \times 0.098589 \approx 2.97851 \times 10^{-5}$

### 1.3 Number of Valid Starting Positions $L(s)$
For a non-zero skip $s \in \mathbb{Z} \setminus \{0\}$:
An ELS path of length $k$ at skip $s$ spans $(k-1) \cdot |s|$ character positions.
The number of valid start indices in a text of length $N$ is:
$$L(s) = \max(0, N - (k-1) \cdot |s|)$$

**Properties:**
- Symmetric for positive and negative skips: $L(s) = L(-s)$.
- If $|s| \ge \frac{N}{k-1}$, $L(s) = 0$.

**Sample Calculation for $N=6877$, $k=4$, $s=50$:**
$$L(50) = 6877 - (4-1) \cdot 50 = 6877 - 150 = 6727$$

### 1.4 Expected Occurrences $E$
- For a specific skip $s$:
  $$E(s) = L(s) \cdot P(W)$$
- For $W = \text{"תורה"}$ at $s=50$:
  $$E(50) = 6727 \times (2.97851 \times 10^{-5}) \approx 0.200364$$
- For a skip range $[\text{minSkip}, \text{maxSkip}]$:
  $$E_{\text{range}} = \sum_{s \in \text{skips}} L(s) \cdot P(W) = P(W) \cdot \sum_{s \in \text{skips}} L(s)$$

### 1.5 Poisson P-Value & Significance Score $S$
Assuming random ELS matches follow a Poisson distribution with mean parameter $E$:

1. **P-Value ($P(X \ge 1)$)**:
   Probability of observing 1 or more occurrences by random chance:
   $$P = 1 - \exp(-E)$$
   To avoid floating-point underflow when $E \ll 1$, use standard double precision `Math.expm1`:
   ```javascript
   let pValue = -Math.expm1(-E);
   if (pValue <= 0 || isNaN(pValue)) pValue = E;
   ```

2. **Log-P-Value ($\text{logPValue}$)**:
   $$\text{logPValue} = \log_{10}(P)$$

3. **Statistical Significance Score ($S$)**:
   Defined as the negative log-10 p-value:
   $$S = -\log_{10}(P) = -\text{logPValue}$$

**Numerical Reference Examples ($N=6877$):**
| Word $W$ | Skip $s$ | $P(W)$ | $L(s)$ | Expected $E$ | P-Value $P$ | Significance Score $S$ |
|---|---|---|---|---|---|---|
| תורה | 50 | $2.9785 \times 10^{-5}$ | 6727 | 0.200364 | 0.181568 | 0.7410 |
| בראשית | 100 | $5.8125 \times 10^{-8}$ | 6377 | 0.000371 | 0.000371 | 3.4311 |
| אלהים | 50 | $7.6742 \times 10^{-6}$ | 6677 | 0.051241 | 0.049950 | 1.3015 |

---

## 2. API Design & Function Specifications

### 2.1 New Functions to Export from `gematria.js`

#### `CalculateLetterFrequencies(text)`
```javascript
/**
 * Calculates letter counts and relative frequencies across a text string.
 * @param {string} text - Clean Hebrew text corpus.
 * @returns {Object} { counts: Object, frequencies: Object, N: number }
 */
function CalculateLetterFrequencies(text) {
  const counts = {};
  const N = text ? text.length : 0;
  if (N === 0) return { counts: {}, frequencies: {}, N: 0 };

  for (let i = 0; i < N; i++) {
    const char = text[i];
    counts[char] = (counts[char] || 0) + 1;
  }

  const frequencies = {};
  for (const char in counts) {
    frequencies[char] = counts[char] / N;
  }

  return { counts, frequencies, N };
}
```

#### `CalculateELSPValue(textLength, searchWord, skipSpec, letterFrequencies)`
```javascript
/**
 * Calculates ELS expected count, p-value, log-p-value, and significance score.
 * @param {number} textLength - Corpus length N.
 * @param {string} searchWord - Target ELS word.
 * @param {number|number[]|{minSkip: number, maxSkip: number}} skipSpec - Skip integer, skip list, or skip range object.
 * @param {Object} letterFrequencies - Frequency map { [char]: frequency }.
 * @returns {Object} { expectedMatches: number, pValue: number, statisticalSignificanceScore: number, logPValue: number }
 */
function CalculateELSPValue(textLength, searchWord, skipSpec, letterFrequencies) {
  const k = searchWord ? searchWord.length : 0;
  if (k < 2 || textLength <= 0 || !letterFrequencies) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, logPValue: 0 };
  }

  const freqs = letterFrequencies.frequencies || letterFrequencies;
  let pWord = 1.0;
  for (let i = 0; i < k; i++) {
    const char = searchWord[i];
    const freq = freqs[char] || 0;
    if (freq === 0) {
      pWord = 0;
      break;
    }
    pWord *= freq;
  }

  if (pWord === 0) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, logPValue: 0 };
  }

  let totalL = 0;
  if (typeof skipSpec === 'number') {
    if (skipSpec !== 0) {
      totalL = Math.max(0, textLength - (k - 1) * Math.abs(skipSpec));
    }
  } else if (Array.isArray(skipSpec)) {
    for (const s of skipSpec) {
      if (s !== 0) {
        totalL += Math.max(0, textLength - (k - 1) * Math.abs(s));
      }
    }
  } else if (typeof skipSpec === 'object' && skipSpec !== null) {
    const minS = Math.abs(skipSpec.minSkip || 1);
    const maxS = Math.abs(skipSpec.maxSkip || minS);
    for (let s = minS; s <= maxS; s++) {
      totalL += 2 * Math.max(0, textLength - (k - 1) * s);
    }
  }

  const E = totalL * pWord;
  if (E <= 0) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, logPValue: 0 };
  }

  let pValue = -Math.expm1(-E);
  if (pValue <= 0 || isNaN(pValue)) {
    pValue = E;
  }

  let logPValue = Math.log10(pValue);
  if (!isFinite(logPValue)) {
    logPValue = Math.log10(E);
  }

  const statisticalSignificanceScore = -logPValue;

  return {
    expectedMatches: E,
    pValue: pValue,
    statisticalSignificanceScore: statisticalSignificanceScore,
    logPValue: logPValue
  };
}
```

### 2.2 Integration into `FindELS`
Modify `FindELS(text, searchWord, minSkip, maxSkip)` in `gematria.js`:
- Compute `freqData = CalculateLetterFrequencies(text)` at the start of `FindELS`.
- For each match created, call `CalculateELSPValue(text.length, searchWord, skip, freqData.frequencies)`.
- Attach `expectedCount`, `pValue`, and `significanceScore` to each returned match item:

```javascript
// Match object structure in FindELS output:
{
  word: searchWord,
  start: startIdx,
  skip: skip,
  indices: pathIndices,
  expectedCount: stats.expectedMatches,
  pValue: stats.pValue,
  significanceScore: stats.statisticalSignificanceScore
}
```

---

## 3. Unit Test Specifications for `test.js`

Add a dedicated test section in `test.js`:

```javascript
// 10. Validar Cálculo de Frecuencias de Letras y P-Value Estadístico ELS
const freqsData = Engine.CalculateLetterFrequencies(TORAH_TEXT);
assert(freqsData.N === 6877, `Calcula la longitud correcta del corpus (6877, obtenido: ${freqsData.N})`);
const totalFreq = Object.values(freqsData.frequencies).reduce((a, b) => a + b, 0);
assert(Math.abs(totalFreq - 1.0) < 1e-6, "La suma de las frecuencias de letras es igual a 1.0");

// Validar CalculateELSPValue para 'תורה' en salto 50
const pValStats = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', 50, freqsData.frequencies);
assert(Math.abs(pValStats.expectedMatches - 0.20036) < 1e-3, `Esperado para 'תורה' (s=50) ~0.2004 (obtenido: ${pValStats.expectedMatches.toFixed(5)})`);
assert(Math.abs(pValStats.pValue - 0.18157) < 1e-3, `P-Value para 'תורה' (s=50) ~0.1816 (obtenido: ${pValStats.pValue.toFixed(5)})`);
assert(Math.abs(pValStats.statisticalSignificanceScore - 0.741) < 1e-2, `Score de significancia para 'תורה' (s=50) ~0.741 (obtenido: ${pValStats.statisticalSignificanceScore.toFixed(3)})`);

// Validar integración de metadata en resultados de FindELS
const enhancedMatches = Engine.FindELS(TORAH_TEXT, 'תורה', 49, 51);
assert(enhancedMatches.length > 0, "FindELS retorna resultados");
const targetMatch = enhancedMatches.find(m => m.skip === 50 && m.start === 5);
assert(targetMatch !== undefined, "FindELS localiza el código clásico de la Torá");
assert(typeof targetMatch.expectedCount === 'number', "El resultado ELS contiene expectedCount numérico");
assert(typeof targetMatch.pValue === 'number', "El resultado ELS contiene pValue numérico");
assert(typeof targetMatch.significanceScore === 'number', "El resultado ELS contiene significanceScore numérico");
```
