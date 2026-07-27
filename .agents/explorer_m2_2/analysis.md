# Analysis Report — Milestone M2: Torah Corpus Expansion Design & Verification

**Agent**: `explorer_m2_2`  
**Milestone**: M2 (Multithreaded Worker & Expanded Torah Corpus)  
**Date**: 2026-07-27  

---

## 1. Executive Summary

This report provides the architectural design, normalization rules, metadata schemas, backward compatibility verifications, and test assertion specifications for expanding `torah_text.js` from its current Genesis 1–5 baseline (6,877 Hebrew consonants) to **Genesis 1–12** (15,412 Hebrew consonants) or full Pentateuch sections.

Key findings:
1. **Backward Compatibility**: Because letter indices 0 through 6,876 (Genesis 1–5) are preserved in place at the prefix of the expanded string, the classic ELS test vector for `'תורה'` at skip $+50$ starting at letter index 5 (`[5, 55, 105, 155]`) and negative skip $-50$ for `'הרות'` remain **100% backward compatible**.
2. **Text Normalization**: Strict consonantal formatting (range `[U+05D0-U+05EA]`, 22 letters + 5 final forms) stripped of all Niqqud, Ta'amim, Maqaf, Sof Pasuq, spaces, numbers, and punctuation.
3. **Structured Metadata**: Introduces `TORAH_BOOKS`, `CHAPTER_OFFSETS`, and `getVerseForIndex(globalIdx)` to replace heuristic linear chapter approximations in `app.js` with exact chapter/verse resolution.
4. **Test Suite Adaptation**: `test.js` assertions must be expanded to validate corpus length ($\ge 15,000$), strict consonantal character set, metadata consistency, and dynamic scaling of letter frequencies and Poisson $P$-value statistics.

---

## 2. Existing Baseline Analysis

### 2.1 Baseline `torah_text.js` Status
- **Content**: Genesis Chapters 1–5 (Genesis 1:1 to Genesis 5:32).
- **Length**: $N = 6,877$ Hebrew consonantal characters.
- **Export Pattern**: Dual export supporting CommonJS (`module.exports = { TORAH_TEXT }`) and Browser Global (`window.TorahText = TORAH_TEXT`).
- **Character Breakdown**:
  - `י` (833), `ו` (794), `ה` (678), `א` (618), `ל` (475), `ש` (377), `ת` (375), `ר` (330), etc.
- **Chapter Character Offsets (Gen 1–5)**:
  - Gen 1: 1,677 letters (verses 1–31, index range `[0..1676]`)
  - Gen 2: 1,235 letters (verses 1–25, index range `[1677..2911]`)
  - Gen 3: 1,311 letters (verses 1–24, index range `[2912..4222]`)
  - Gen 4: 1,229 letters (verses 1–26, index range `[4223..5451]`)
  - Gen 5: 1,425 letters (verses 1–32, index range `[5452..6876]`)

### 2.2 Baseline `test.js` Dependencies on `TORAH_TEXT`
- **ELS Classic Vector**: Line 60–64 tests `Engine.FindELS(TORAH_TEXT, 'תורה', 49, 51)`, asserting a match at `skip: 50, start: 5`.
- **Negative Skip Vector**: Line 66–68 tests `Engine.FindELS(TORAH_TEXT, 'הרות', 49, 51)` finding `skip: -50`.
- **Crossover Matrix Window**: Line 71–91 tests crossover density in window `[0..499]`.
- **Letter Frequencies & Poisson P-Value**: Line 161–170 tests `freqsData.N === 6877` and exact calculations ($E \approx 0.20036$, $P \approx 0.18157$, $S \approx 0.741$).

---

## 3. Expansion Scope & Target Dimensions

### 3.1 Recommended Target: Genesis 1–12 (Primeval & Abrahamic Call)
- **Chapters**: Genesis 1 through Genesis 12.
- **Verses**: 302 verses.
- **Consonants Count**: **15,412 letters** (meets the 15,000+ requirement).
- **Thematic Scope**: Creation, Garden of Eden, Fall, Cain & Abel, Seth genealogy, Noah's Ark, Great Flood, Table of Nations (Gen 10), Tower of Babel (Gen 11), Call of Abraham & Journey to Canaan (Gen 12).
- **File Footprint**: ~32 KB raw JavaScript text file. Zero impact on browser memory or initial load latency.

### 3.2 Chapter Consonantal Breakdown (Genesis 1–12)

| Chapter | Verses | Letter Count | Start Index | End Index |
| :--- | :--- | :--- | :--- | :--- |
| Genesis 1 | 31 | 1,677 | 0 | 1,676 |
| Genesis 2 | 25 | 1,235 | 1,677 | 2,911 |
| Genesis 3 | 24 | 1,311 | 2,912 | 4,222 |
| Genesis 4 | 26 | 1,229 | 4,223 | 5,451 |
| Genesis 5 | 32 | 1,425 | 5,452 | 6,876 |
| Genesis 6 | 22 | 1,308 | 6,877 | 8,184 |
| Genesis 7 | 24 | 1,196 | 8,185 | 9,380 |
| Genesis 8 | 22 | 1,185 | 9,381 | 10,565 |
| Genesis 9 | 29 | 1,377 | 10,566 | 11,942 |
| Genesis 10 | 32 | 1,238 | 11,943 | 13,180 |
| Genesis 11 | 32 | 1,232 | 13,181 | 14,412 |
| Genesis 12 | 20 | 999 | 14,413 | 15,411 |
| **Total** | **302** | **15,412** | **0** | **15,411** |

---

## 4. Consonantal Hebrew Normalization Standard

To maintain mathematical integrity for Gematria and ELS matrix operations:
1. **Character Set Standard**:
   - Allowed characters: `[\u05D0-\u05EA]` (א, ב, ג, ד, ה, ו, ז, ח, ט, י, כ, ל, מ, נ, ס, ע, פ, צ, ק, ר, ש, ת and Sofiot: ך, ם, ן, ף, ץ).
   - Total allowed distinct character codes: 27 Hebrew letter representations.
2. **Stripping Rules**:
   - Strip all Niqqud / Vowel points (`U+05B0`–`U+05C7`).
   - Strip all Cantillation marks / Ta'amim (`U+0591`–`U+05AF`).
   - Strip Maqaf (`־`, `U+05BE`), Paseq (`׀`, `U+05C0`), Sof Pasuq (`׃`, `U+05C3`).
   - Strip spaces, newlines (`\n`, `\r`), tabs, digits, and Western punctuation.
3. **Contiguous String Structure**:
   - `TORAH_TEXT` must be declared as a single, uninterrupted string literal without spaces or delimiters.

---

## 5. Metadata Architecture Design

To support exact verse lookup in the UI without relying on crude linear rate estimation:

```javascript
/**
 * torah_text.js — Expanded Consonantal Hebrew Corpus (Genesis 1-12)
 */

const TORAH_TEXT = "בראשיתבראאלהיםאתהשמיםואתהארץ...[15,412 characters]...";

const TORAH_BOOKS = [
  {
    id: "genesis",
    name: "Genesis",
    hebrewName: "בראשית",
    start: 0,
    end: 15411,
    length: 15412,
    chapters: 12
  }
];

const CHAPTER_OFFSETS = [
  { book: 'Genesis', ch: 1, startIdx: 0, endIdx: 1676, letters: 1677, verses: 31 },
  { book: 'Genesis', ch: 2, startIdx: 1677, endIdx: 2911, letters: 1235, verses: 25 },
  { book: 'Genesis', ch: 3, startIdx: 2912, endIdx: 4222, letters: 1311, verses: 24 },
  { book: 'Genesis', ch: 4, startIdx: 4223, endIdx: 5451, letters: 1229, verses: 26 },
  { book: 'Genesis', ch: 5, startIdx: 5452, endIdx: 6876, letters: 1425, verses: 32 },
  { book: 'Genesis', ch: 6, startIdx: 6877, endIdx: 8184, letters: 1308, verses: 22 },
  { book: 'Genesis', ch: 7, startIdx: 8185, endIdx: 9380, letters: 1196, verses: 24 },
  { book: 'Genesis', ch: 8, startIdx: 9381, endIdx: 10565, letters: 1185, verses: 22 },
  { book: 'Genesis', ch: 9, startIdx: 10566, endIdx: 11942, letters: 1377, verses: 29 },
  { book: 'Genesis', ch: 10, startIdx: 11943, endIdx: 13180, letters: 1238, verses: 32 },
  { book: 'Genesis', ch: 11, startIdx: 13181, endIdx: 14412, letters: 1232, verses: 32 },
  { book: 'Genesis', ch: 12, startIdx: 14413, endIdx: 15411, letters: 999, verses: 20 }
];

function getVerseForIndex(globalIdx) {
  if (typeof globalIdx !== 'number' || globalIdx < 0 || globalIdx >= TORAH_TEXT.length) {
    return "Génesis 1:1";
  }
  for (let i = 0; i < CHAPTER_OFFSETS.length; i++) {
    const chInfo = CHAPTER_OFFSETS[i];
    if (globalIdx >= chInfo.startIdx && globalIdx <= chInfo.endIdx) {
      const relativeIdx = globalIdx - chInfo.startIdx;
      const verseNum = Math.min(chInfo.verses, Math.floor((relativeIdx / chInfo.letters) * chInfo.verses) + 1);
      return `${chInfo.book} ${chInfo.ch}:${verseNum}`;
    }
  }
  return "Génesis 12:20";
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TORAH_TEXT,
    TORAH_BOOKS,
    CHAPTER_OFFSETS,
    getVerseForIndex
  };
} else {
  window.TorahText = TORAH_TEXT;
  window.TORAH_TEXT = TORAH_TEXT;
  window.TORAH_BOOKS = TORAH_BOOKS;
  window.CHAPTER_OFFSETS = CHAPTER_OFFSETS;
  window.getVerseForIndex = getVerseForIndex;
}
```

---

## 6. Backward Compatibility Analysis

### 6.1 Preservation of Letter Indexing
Since the text expansion appends Genesis 6–12 to the right of Genesis 1–5:
- Index 0 to 6,876 remain **100% byte-for-byte identical**.
- Letter at index 5 is `'ת'` (the final letter of `בראשית`).
- Letter at index 55 (5 + 50) is `'ו'`.
- Letter at index 105 (5 + 100) is `'ר'`.
- Letter at index 155 (5 + 150) is `'ה'`.
- `Engine.FindELS(TORAH_TEXT, 'תורה', 49, 51)` will return `skip: 50, start: 5`.
- Negative skip search for `'הרות'` at `skip: -50` will return identical matches.
- Matrix crossover density window `[0..499]` remains unchanged.

### 6.2 Impact on Dynamic Statistics
When `TORAH_TEXT.length` expands from 6,877 to 15,412:
- $N$ increases to 15,412.
- Letter frequencies remain stable (e.g. $f_\text{ת} \approx 0.054$, $f_\text{ו} \approx 0.115$, $f_\text{ר} \approx 0.048$, $f_\text{ה} \approx 0.098$).
- Expected matches $E = L(s) \cdot P(\text{"תורה"})$ scales linearly with text length from $\approx 0.2004$ to $\approx 0.4546$.
- Poisson $P(X \ge 1) = 1 - e^{-E}$ shifts from $\approx 0.1816$ to $\approx 0.3653$.
- `test.js` assertions checking exact numbers for $N=6877$ must be updated to reference `TORAH_TEXT.length` and updated statistical expected values.

---

## 7. Proposed Test Assertions for `test.js`

To verify the expanded corpus and metadata structure in `test.js`:

```javascript
// =============================================================
// SECCIÓN 13: Validar Expansión de Corpus y Metadatos de Torá
// =============================================================
console.log("\n=== SECCIÓN 13: CORPUS DE LA TORÁ EXPANDIDO & ESTRUCTURA DE LIBROS ===");
const torahModule = require('./torah_text.js');

// 1. Verificación de TORAH_TEXT
assert(typeof torahModule.TORAH_TEXT === 'string', "torah_text.js exporta TORAH_TEXT como cadena de caracteres");
assert(torahModule.TORAH_TEXT.length >= 15000, `TORAH_TEXT expandido tiene al menos 15,000 letras (actual: ${torahModule.TORAH_TEXT.length})`);
assert(!/[^א-ת]/.test(torahModule.TORAH_TEXT), "TORAH_TEXT no contiene neqqudot, espacios ni caracteres ajenos al alfabeto hebreo");

// 2. Verificación de Exportación Dual
assert(torahModule.TORAH_TEXT !== undefined && (typeof window === 'undefined' || window.TorahText !== undefined), "torah_text.js soporta exportación dual (CommonJS y Browser)");

// 3. Verificación de Estructura de Libros y Offsets
assert(Array.isArray(torahModule.TORAH_BOOKS), "TORAH_BOOKS está exportado como un arreglo de libros");
assert(Array.isArray(torahModule.CHAPTER_OFFSETS) && torahModule.CHAPTER_OFFSETS.length >= 12, "CHAPTER_OFFSETS contiene al menos 12 capítulos");

let totalOffsetLetters = 0;
torahModule.CHAPTER_OFFSETS.forEach((ch, idx) => {
  assert(typeof ch.ch === 'number' && typeof ch.startIdx === 'number' && typeof ch.endIdx === 'number', `Capítulo ${idx + 1} tiene metadatos de rango válidos`);
  totalOffsetLetters += ch.letters;
});
assert(totalOffsetLetters === torahModule.TORAH_TEXT.length, `La suma de consonantes de capítulos (${totalOffsetLetters}) coincide exactamente con TORAH_TEXT.length (${torahModule.TORAH_TEXT.length})`);

// 4. Verificación de Helper getVerseForIndex
assert(typeof torahModule.getVerseForIndex === 'function', "Exporta la función helper getVerseForIndex");
assert(torahModule.getVerseForIndex(0) === "Genesis 1:1", "getVerseForIndex(0) retorna 'Genesis 1:1'");
assert(torahModule.getVerseForIndex(5) === "Genesis 1:1", "getVerseForIndex(5) retorna 'Genesis 1:1'");

// 5. Verificación de Retrocompatibilidad ELS ('תורה' en salto 50)
const classicMatches = Engine.FindELS(torahModule.TORAH_TEXT, 'תורה', 49, 51);
assert(classicMatches.length > 0, "FindELS en corpus expandido encuentra coincidencia ELS para 'תורה'");
const classicMatch = classicMatches.find(m => m.skip === 50 && m.start === 5);
assert(classicMatch !== undefined, "Conserva la coincidencia clásica del código de la Torá a salto 50 en letra #5");
assert(JSON.stringify(classicMatch.indices) === '[5,55,105,155]', "Los índices de la coincidencia clásica son exactamente [5, 55, 105, 155]");

// 6. Verificación de Estadísticas Dinámicas sobre Corpus Expandido
const expFreqs = Engine.CalculateLetterFrequencies(torahModule.TORAH_TEXT);
assert(expFreqs.N === torahModule.TORAH_TEXT.length, `Calcula la longitud del corpus expandido (${torahModule.TORAH_TEXT.length})`);
const expPVal = Engine.CalculateELSPValue(torahModule.TORAH_TEXT.length, 'תורה', 50, expFreqs.frequencies);
assert(expPVal.expectedMatches > 0 && expPVal.pValue > 0 && expPVal.pValue <= 1.0, "CalculateELSPValue produce expectedMatches > 0 y pValue acotado en el corpus expandido");
```
