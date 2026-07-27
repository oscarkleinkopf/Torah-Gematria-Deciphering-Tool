# Analysis Report: Roshei & Sofei Teivot Acrostics Detection Module (Milestone M1)

## Executive Summary
This document provides the complete architectural design, mathematical normalization rules, function signature contracts, algorithm design, and unit test specifications for the **Roshei & Sofei Teivot Acrostics Module** in `gematria.js` and `test.js`.

---

## 1. Context & Technical Background

### 1.1 What are Roshei Teivot (ראשי תיבות) & Sofei Teivot (סופי תיבות)?
- **Roshei Teivot** ("Head of Words" / Acronyms): The sequence formed by taking the **first letter** of each consecutive word in a Hebrew phrase or verse.
  - *Example (Isaías 2:5)*: `בֵּית יַעֲקֹב לְכוּ וְנֵלְכָה` -> First letters: `ב`, `י`, `ל`, `ו` -> **ביל"ו** (BILU, the historic pioneer movement).
  - *Example (Deuteronomio 30:12)*: `מִי יַעֲלֶה לָּנוּ הַשָּׁמַיְמָה` -> First letters: `מ`, `י`, `ל`, `ה` -> **מילה** (Milah / Circumcision).
- **Sofei Teivot** ("End of Words"): The sequence formed by taking the **last letter** of each consecutive word in a Hebrew phrase or verse.
  - *Example (Deuteronomio 30:12)*: `מִי יַעֲלֶה לָּנוּ הַשָּׁמַיְמָה` -> Last letters: `י` (מִי), `ה` (יַעֲלֶה), `ו` (לָּנוּ), `ה` (הַשָּׁמַיְמָה) -> **יהוה** (YHVH / The Tetragrammaton).

### 1.2 Hebrew Text Preprocessing & Cleaning
Hebrew biblical texts and user inputs contain cantillation marks, neqqudot (vowels `\u0591-\u05C7`), hyphens (`-` or Maqaf `־` `\u05BE`), and punctuation marks.
To accurately extract letters:
1. Strip all Neqqudot and cantillation marks (`text.replace(/[\u0591-\u05C7]/g, '')`).
2. Replace Maqaf (`־`) and dashes (`-`) with spaces so hyphenated compound words are treated as distinct words.
3. Tokenize by whitespace and filter characters to isolate pure Hebrew letters (`[\u05D0-\u05EA]`).

### 1.3 Sofit Forms (Final Letters) Normalization Rules
Hebrew features 5 letters with distinct final forms (Sofiyot) when occurring at the end of a word:
- Kaf: `כ` (standard) vs `ך` (Sofit)
- Mem: `מ` (standard) vs `ם` (Sofit)
- Nun: `נ` (standard) vs `ן` (Sofit)
- Pe: `פ` (standard) vs `ף` (Sofit)
- Tsadi: `צ` (standard) vs `ץ` (Sofit)

#### Normalization Strategy:
In rabbinic and kabbalistic acrostics analysis, final letters at word endings are often matched interchangeably with their standard forms (or matched strictly when exact Sofit mode is requested).
- **Default Mode (`exactSofit = false`)**: Maps all Sofit characters (`ך, ם, ן, ף, ץ`) to standard base characters (`כ, מ, נ, פ, צ`) during comparison.
- **Strict Mode (`exactSofit = true`)**: Requires verbatim character matching (e.g., `ם` only matches `ם`).

---

## 2. Function Interface & Signature

### 2.1 Function Signature
```javascript
/**
 * Detects Roshei Teivot (initials) and Sofei Teivot (finals) acrostics in a Hebrew text.
 * 
 * @param {string} text - Input Hebrew text (phrase, verse, or passage).
 * @param {string} [type='roshei'] - Acrostic type: 'roshei', 'sofei', or 'both'.
 * @param {string|null} [targetWord=null] - Target word/concept to search. If null, extracts acrostics for the full text.
 * @param {Object} [options={}] - Configuration options.
 * @param {boolean} [options.exactSofit=false] - If true, requires exact Sofit form match; if false, normalizes Sofiyot.
 * @param {Array} [options.database=null] - Optional array of concept entries to search when targetWord is null.
 * @returns {Array<Object>} List of match objects.
 */
function FindAcrostics(text, type = 'roshei', targetWord = null, options = {})
```

### 2.2 Return Object Schema
Every match item in the returned array adheres strictly to `PROJECT.md` interface specifications while providing rich analytical metadata:

```typescript
interface AcrosticMatch {
  phrase: string;              // Sub-phrase of cleaned words matching the acrostic (e.g., "בית יעקב לכו ונלכה")
  cleanPhrase: string;         // Cleaned words joined by spaces
  word: string;                // Extracted acrostic letter sequence (e.g., "בילו")
  targetWord: string;          // Target searched or matched concept
  isRoshei: boolean;           // True if Roshei Teivot (head of words)
  isSofei: boolean;            // True if Sofei Teivot (end of words)
  type: 'roshei' | 'sofei';    // Acrostic type
  startIndex: number;          // Index of first word in phrase (0-based)
  endIndex: number;            // Index of last word in phrase (0-based)
  indices: number[];           // Array of word indices [0, 1, 2, 3]
  wordDetails: Array<{         // Letter-by-letter breakdown per word
    word: string;              // Clean word string
    rawWord: string;           // Original raw token
    letter: string;            // Extracted raw letter
    normalizedLetter: string;  // Normalized letter (base form)
    position: 'first' | 'last' // Position in word
  }>;
}
```

---

## 3. Algorithm Implementation Specification

### 3.1 Helper Functions
```javascript
const SOFIT_MAP = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ'
};

function NormalizeHebrewLetter(char) {
  return SOFIT_MAP[char] || char;
}

function NormalizeHebrewString(str) {
  if (!str) return '';
  return str.split('').map(NormalizeHebrewLetter).join('');
}

function ExtractWordsForAcrostics(text) {
  if (!text) return [];
  const clean = text.replace(/[\u0591-\u05C7]/g, '');
  const normalizedText = clean.replace(/[\u05BE\-]/g, ' ');
  const rawTokens = normalizedText.split(/\s+/);
  const words = [];

  for (let token of rawTokens) {
    const hebrewLetters = token.replace(/[^\u05D0-\u05EA]/g, '');
    if (hebrewLetters.length > 0) {
      const firstChar = hebrewLetters[0];
      const lastChar = hebrewLetters[hebrewLetters.length - 1];
      words.push({
        rawWord: token,
        cleanWord: hebrewLetters,
        firstLetter: firstChar,
        firstLetterNormalized: NormalizeHebrewLetter(firstChar),
        lastLetter: lastChar,
        lastLetterNormalized: NormalizeHebrewLetter(lastChar)
      });
    }
  }
  return words;
}
```

### 3.2 Main Algorithm (`FindAcrostics`)
```javascript
function FindAcrostics(text, type = 'roshei', targetWord = null, options = {}) {
  const exactSofit = options.exactSofit === true;
  const words = ExtractWordsForAcrostics(text);
  if (words.length === 0) return [];

  const typesToCheck = [];
  if (type === 'roshei' || type === 'both') typesToCheck.push('roshei');
  if (type === 'sofei' || type === 'both') typesToCheck.push('sofei');

  const results = [];

  let cleanTarget = targetWord ? targetWord.replace(/[^\u05D0-\u05EA]/g, '') : null;
  let targetNorm = cleanTarget ? NormalizeHebrewString(cleanTarget) : null;

  for (let currentType of typesToCheck) {
    const isRoshei = currentType === 'roshei';
    const isSofei = currentType === 'sofei';

    if (cleanTarget) {
      const L = cleanTarget.length;
      if (L > words.length) continue;

      for (let i = 0; i <= words.length - L; i++) {
        const windowWords = words.slice(i, i + L);
        
        let extractedRaw = '';
        let extractedNorm = '';

        if (isRoshei) {
          extractedRaw = windowWords.map(w => w.firstLetter).join('');
          extractedNorm = windowWords.map(w => w.firstLetterNormalized).join('');
        } else {
          extractedRaw = windowWords.map(w => w.lastLetter).join('');
          extractedNorm = windowWords.map(w => w.lastLetterNormalized).join('');
        }

        let isMatch = false;
        if (exactSofit) {
          isMatch = (extractedRaw === cleanTarget);
        } else {
          isMatch = (extractedRaw === cleanTarget) || (extractedNorm === targetNorm);
        }

        if (isMatch) {
          const phraseWords = windowWords.map(w => w.cleanWord).join(' ');
          const indices = Array.from({ length: L }, (_, idx) => i + idx);
          
          results.push({
            phrase: phraseWords,
            cleanPhrase: phraseWords,
            word: extractedRaw,
            targetWord: cleanTarget,
            isRoshei,
            isSofei,
            type: currentType,
            startIndex: i,
            endIndex: i + L - 1,
            indices,
            wordDetails: windowWords.map(w => ({
              word: w.cleanWord,
              rawWord: w.rawWord,
              letter: isRoshei ? w.firstLetter : w.lastLetter,
              normalizedLetter: isRoshei ? w.firstLetterNormalized : w.lastLetterNormalized,
              position: isRoshei ? 'first' : 'last'
            }))
          });
        }
      }
    } else {
      // Extraer acróstico completo de la frase
      const extractedRaw = words.map(w => isRoshei ? w.firstLetter : w.lastLetter).join('');
      const phraseWords = words.map(w => w.cleanWord).join(' ');
      const indices = Array.from({ length: words.length }, (_, idx) => idx);

      results.push({
        phrase: phraseWords,
        cleanPhrase: phraseWords,
        word: extractedRaw,
        targetWord: extractedRaw,
        isRoshei,
        isSofei,
        type: currentType,
        startIndex: 0,
        endIndex: words.length - 1,
        indices,
        wordDetails: words.map(w => ({
          word: w.cleanWord,
          rawWord: w.rawWord,
          letter: isRoshei ? w.firstLetter : w.lastLetter,
          normalizedLetter: isRoshei ? w.firstLetterNormalized : w.lastLetterNormalized,
          position: isRoshei ? 'first' : 'last'
        }))
      });
    }
  }

  return results;
}
```

---

## 4. Module Export Specification
In `gematria.js`, update the exports at the bottom:

```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    SpanishToHebrew, 
    CalculateGematria, 
    HEBREW_MAP, 
    ATBASH_PAIRS,
    FindSharedRoot,
    GetFactorRelation,
    ScoreCorrelation,
    FindCorrelations,
    FindELS,
    NormalizeHebrewLetter,
    NormalizeHebrewString,
    FindAcrostics
  };
} else {
  window.GematriaEngine = { 
    SpanishToHebrew, 
    CalculateGematria, 
    HEBREW_MAP, 
    ATBASH_PAIRS,
    FindSharedRoot,
    GetFactorRelation,
    ScoreCorrelation,
    FindCorrelations,
    FindELS,
    NormalizeHebrewLetter,
    NormalizeHebrewString,
    FindAcrostics
  };
}
```

---

## 5. Required Unit Tests for `test.js`

Add the following block to `test.js`:

```javascript
// === PRUEBAS DE ACRÓSTICOS (ROSHEI Y SOFEI TEIVOT) ===
// A. Roshei Teivot - Acrónimo BILU (Isaías 2:5)
const biluText = 'בֵּית יַעֲקֹב לְכוּ וְנֵלְכָה בְּאוֹר יְהוָה';
const biluMatches = Engine.FindAcrostics(biluText, 'roshei', 'ביל"ו');
assert(biluMatches.length > 0, "Encuentra el acróstico Roshei Teivot BILU (ביל\"ו)");
assert(biluMatches[0].isRoshei === true && biluMatches[0].word === 'בילו', "El acróstico Roshei Teivot extraído es exactamente 'בילו'");
assert(JSON.stringify(biluMatches[0].indices) === '[0,1,2,3]', "Los índices de las palabras del acróstico BILU son [0,1,2,3]");

// B. Roshei Teivot - Milah (Deuteronomio 30:12)
const deutText = 'מִי יַעֲלֶה לָּנוּ הַשָּׁמַיְמָה';
const milahMatches = Engine.FindAcrostics(deutText, 'roshei', 'מילה');
assert(milahMatches.length > 0, "Encuentra el acróstico Roshei Teivot 'מילה' en Deuteronomio 30:12");

// C. Sofei Teivot - Nombre Divino YHVH (Deuteronomio 30:12)
const yhvhMatches = Engine.FindAcrostics(deutText, 'sofei', 'יהוה');
assert(yhvhMatches.length > 0, "Encuentra el acróstico Sofei Teivot 'יהוה' en Deuteronomio 30:12");
assert(yhvhMatches[0].isSofei === true, "El tipo de acróstico para 'יהוה' es Sofei Teivot");

// D. Sofei Teivot con normalización de Sofit (Mem Sofit ם -> מ)
const shamayimText = 'יִשְׂמְחוּ הַשָּׁמַיִם'; // ישמחו (ו), השמים (ם)
const sofitNormalizedMatches = Engine.FindAcrostics(shamayimText, 'sofei', 'ומ');
assert(sofitNormalizedMatches.length > 0, "Normaliza Mem Sofit 'ם' a 'מ' para encontrar 'ומ'");

// E. Sofei Teivot con modo estricto (exactSofit = true)
const strictFail = Engine.FindAcrostics(shamayimText, 'sofei', 'ומ', { exactSofit: true });
assert(strictFail.length === 0, "Modo estricto exactSofit = true no coincide 'ומ' con 'ום'");

const strictPass = Engine.FindAcrostics(shamayimText, 'sofei', 'ום', { exactSofit: true });
assert(strictPass.length > 0, "Modo estricto exactSofit = true coincide exactamente con 'ום'");

// F. Extracción completa de Acrósticos sin targetWord
const fullAcrostic = Engine.FindAcrostics('בית יעקב לכו ונלכה', 'roshei');
assert(fullAcrostic.length > 0 && fullAcrostic[0].word === 'בילו', "Extracción completa retorna 'בילו'");

// G. Búsqueda simultánea con type = 'both'
const bothMatches = Engine.FindAcrostics(deutText, 'both');
assert(bothMatches.length === 2, "Búsqueda con type='both' retorna 2 acrósticos (Roshei 'מילה' y Sofei 'יהוה')");
```

---
*Analysis completed by explorer_m1_2.*
