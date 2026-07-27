# Technical Analysis: Albam & Avgad Temura Ciphers

## Executive Summary
This document provides the complete, exact technical specification for integrating the **Albam (אלב"ם)** and **Avgad (אבג"ד)** Temura ciphers into `gematria.js` and expanding `test.js` for Milestone M1 (Analytical Engine Expansion).

---

## 1. Albam Cipher (אלב"ם) Specification

### 1.1 Concept & Rule
The Albam cipher splits the 22 letters of the standard Hebrew alphabet into two equal halves of 11 letters each:
- **Group 1 (Letters 1 to 11)**: א, ב, ג, ד, ה, ו, ז, ח, ט, י, כ
- **Group 2 (Letters 12 to 22)**: ל, מ, נ, ס, ע, פ, צ, ק, ר, ש, ת

Substitution is bidirectional with a fixed offset of 11 positions:
- Each letter in Group 1 maps to the letter 11 positions ahead in Group 2 (e.g., $1 \to 12$, i.e., Alef $\leftrightarrow$ Lamed).
- Each letter in Group 2 maps to the letter 11 positions behind in Group 1 (e.g., $12 \to 1$, i.e., Lamed $\leftrightarrow$ Alef).

### 1.2 Full Mapping Table (22 Base + 5 Sofit Forms)

| Index | Hebrew Letter | Letter Name | Albam Substitute | Substitute Name | Value |
|---|---|---|---|---|---|
| 1 | א | Alef | ל | Lamed | 30 |
| 2 | ב | Bet | מ | Mem | 40 |
| 3 | ג | Gimel | נ | Nun | 50 |
| 4 | ד | Dalet | ס | Samekh | 60 |
| 5 | ה | He | ע | Ayin | 70 |
| 6 | ו | Vav | פ | Pe | 80 |
| 7 | ז | Zayin | צ | Tsadi | 90 |
| 8 | ח | Chet | ק | Qof | 100 |
| 9 | ט | Tet | ר | Resh | 200 |
| 10 | י | Yod | ש | Shin | 300 |
| 11 | כ | Kaf | ת | Tav | 400 |
| 12 | ל | Lamed | א | Alef | 1 |
| 13 | מ | Mem | ב | Bet | 2 |
| 14 | נ | Nun | ג | Gimel | 3 |
| 15 | ס | Samekh | ד | Dalet | 4 |
| 16 | ע | Ayin | ה | He | 5 |
| 17 | פ | Pe | ו | Vav | 6 |
| 18 | צ | Tsadi | ז | Zayin | 7 |
| 19 | ק | Qof | ח | Chet | 8 |
| 20 | ר | Resh | ט | Tet | 9 |
| 21 | ש | Shin | י | Yod | 10 |
| 22 | ת | Tav | כ | Kaf | 20 |
| Sofit | ך | Kaf Sofit | ת | Tav | 400 |
| Sofit | ם | Mem Sofit | ב | Bet | 2 |
| Sofit | ן | Nun Sofit | ג | Gimel | 3 |
| Sofit | ף | Pe Sofit | ו | Vav | 6 |
| Sofit | ץ | Tsadi Sofit | ז | Zayin | 7 |

*Note on Sofits*: Consistent with `ATBASH_PAIRS` in `gematria.js` line 44, Sofit letters reduce to their base form before applying the cipher transformation.

### 1.3 `ALBAM_PAIRS` JavaScript Object
```javascript
// Correspondencia Albam (sustitución por mitad del alfabeto: 1-11 <-> 12-22)
const ALBAM_PAIRS = {
  'א': 'ל', 'ב': 'מ', 'ג': 'נ', 'ד': 'ס', 'ה': 'ע',
  'ו': 'פ', 'ז': 'צ', 'ח': 'ק', 'ט': 'ר', 'י': 'ש',
  'כ': 'ת', 'ל': 'א', 'מ': 'ב', 'נ': 'ג', 'ס': 'ד',
  'ע': 'ה', 'פ': 'ו', 'צ': 'ז', 'ק': 'ח', 'ר': 'ט',
  'ש': 'י', 'ת': 'כ',
  // Manejo de Sofit en Albam (se reducen a sus formas normales para Albam)
  'ך': 'ת', 'ם': 'ב', 'ן': 'ג', 'ף': 'ו', 'ץ': 'ז'
};
```

---

## 2. Avgad Cipher (אבג"ד) Specification

### 2.1 Concept & Rule
The Avgad cipher shifts each Hebrew letter to the next immediate letter in alphabetical order (+1 position):
- Letter $n$ maps to letter $n + 1$ for $1 \le n \le 21$.
- The 22nd letter (ת / Tav) wraps around cyclically to the 1st letter (א / Alef).

### 2.2 Full Mapping Table (22 Base + 5 Sofit Forms)

| Index | Hebrew Letter | Letter Name | Avgad Substitute | Substitute Name | Value |
|---|---|---|---|---|---|
| 1 | א | Alef | ב | Bet | 2 |
| 2 | ב | Bet | ג | Gimel | 3 |
| 3 | ג | Gimel | ד | Dalet | 4 |
| 4 | ד | Dalet | ה | He | 5 |
| 5 | ה | He | ו | Vav | 6 |
| 6 | ו | Vav | ז | Zayin | 7 |
| 7 | ז | Zayin | ח | Chet | 8 |
| 8 | ח | Chet | ט | Tet | 9 |
| 9 | ט | Tet | י | Yod | 10 |
| 10 | י | Yod | כ | Kaf | 20 |
| 11 | כ | Kaf | ל | Lamed | 30 |
| 12 | ל | Lamed | מ | Mem | 40 |
| 13 | מ | Mem | נ | Nun | 50 |
| 14 | נ | Nun | ס | Samekh | 60 |
| 15 | ס | Samekh | ע | Ayin | 70 |
| 16 | ע | Ayin | פ | Pe | 80 |
| 17 | פ | Pe | צ | Tsadi | 90 |
| 18 | צ | Tsadi | ק | Qof | 100 |
| 19 | ק | Qof | ר | Resh | 200 |
| 20 | ר | Resh | ש | Shin | 300 |
| 21 | ש | Shin | ת | Tav | 400 |
| 22 | ת | Tav | א | Alef | 1 |
| Sofit | ך | Kaf Sofit | ל | Lamed | 30 |
| Sofit | ם | Mem Sofit | נ | Nun | 50 |
| Sofit | ן | Nun Sofit | ס | Samekh | 60 |
| Sofit | ף | Pe Sofit | צ | Tsadi | 90 |
| Sofit | ץ | Tsadi Sofit | ק | Qof | 100 |

### 2.3 `AVGAD_PAIRS` JavaScript Object
```javascript
// Correspondencia Avgad (sustitución por letra siguiente: +1 cíclico)
const AVGAD_PAIRS = {
  'א': 'ב', 'ב': 'ג', 'ג': 'ד', 'ד': 'ה', 'ה': 'ו',
  'ו': 'ז', 'ז': 'ח', 'ח': 'ט', 'ט': 'י', 'י': 'כ',
  'כ': 'ל', 'ל': 'מ', 'מ': 'נ', 'נ': 'ס', 'ס': 'ע',
  'ע': 'פ', 'פ': 'צ', 'צ': 'ק', 'ק': 'ר', 'ר': 'ש',
  'ש': 'ת', 'ת': 'א',
  // Manejo de Sofit en Avgad (se reducen a sus formas normales para Avgad)
  'ך': 'ל', 'ם': 'נ', 'ן': 'ס', 'ף': 'צ', 'ץ': 'ק'
};
```

---

## 3. `CalculateGematria` Integration Details

### 3.1 Extended Return Object Structure
The `CalculateGematria(hebrewText)` function in `gematria.js` must return:
```javascript
{
  originalText: hebrewText,
  cleanText: cleanHebrew,
  lettersCount: 0,
  absolute: 0,
  absoluteGadol: 0,
  ordinal: 0,
  reduced: 0,
  atbashText: '',
  atbashValue: 0,
  albamText: '',
  albamValue: 0,
  avgadText: '',
  avgadValue: 0,
  breakdown: []
}
```

### 3.2 Extended Breakdown Chip Object Structure
Each element pushed to `results.breakdown` must include:
```javascript
{
  letter: char,
  name: letterData.name,
  absolute: val,
  absoluteGadol: gadolVal,
  ordinal: ord,
  reduced: red,
  atbash: atbashChar,
  atbashVal: atbashData ? atbashData.val : 0,
  albam: albamChar,
  albamVal: albamData ? albamData.val : 0,
  avgad: avgadChar,
  avgadVal: avgadData ? avgadData.val : 0
}
```

### 3.3 Complete Proposed Changes in `gematria.js`

1. **Top-level constants (after ATBASH_PAIRS around line 46)**:
   Define `ALBAM_PAIRS` and `AVGAD_PAIRS`.

2. **In `CalculateGematria` loop**:
   - Handle whitespace/non-hebrew pass-through for `albamText` and `avgadText`.
   - For valid Hebrew letters:
     ```javascript
     // Albam
     let albamChar = ALBAM_PAIRS[char] || char;
     results.albamText += albamChar;
     let albamData = HEBREW_MAP[albamChar];
     if (albamData) {
       results.albamValue += albamData.val;
     }

     // Avgad
     let avgadChar = AVGAD_PAIRS[char] || char;
     results.avgadText += avgadChar;
     let avgadData = HEBREW_MAP[avgadChar];
     if (avgadData) {
       results.avgadValue += avgadData.val;
     }
     ```

3. **Module Exports (line 434-459)**:
   Add `ALBAM_PAIRS` and `AVGAD_PAIRS` to `module.exports` and `window.GematriaEngine`.

---

## 4. Verification Test Plan (`test.js`)

### 4.1 Test Vector Calculations

#### Word 1: 'אהבה' (Ahava: א=1, ה=5, ב=2, ה=5)
- Standard Absolute Value: 13
- Atbash: ת (400) + צ (90) + ש (300) + צ (90) = `תצשצ` (880)
- Albam: ל (30) + ע (70) + מ (40) + ע (70) = `לעמע` (210)
- Avgad: ב (2) + ו (6) + ג (3) + ו (6) = `בוגו` (17)

#### Word 2: 'תורה' (Torah: ת=400, ו=6, ר=200, ה=5)
- Standard Absolute Value: 611
- Albam: כ (20) + פ (80) + ט (9) + ע (70) = `כפטע` (179)
- Avgad: א (1) + ז (7) + ש (300) + ו (6) = `אזשו` (314)

#### Word 3: 'שלום' (Shalom: ש=300, ל=30, ו=6, ם=40)
- Standard Absolute Value: 376
- Albam: י (10) + א (1) + פ (80) + ב (2) = `יאפב` (93)
- Avgad: ת (400) + מ (40) + ז (7) + נ (50) = `תמזנ` (497)

### 4.2 Required Assertions in `test.js`
```javascript
// Validar Cifrado Albam
assert(calcAhava.albamText === 'לעמע', "Texto Albam de אהבה es 'לעמע'");
assert(calcAhava.albamValue === 210, "Valor Albam de אהבה es 210");

// Validar Cifrado Avgad
assert(calcAhava.avgadText === 'בוגו', "Texto Avgad de אהבה es 'בוגו'");
assert(calcAhava.avgadValue === 17, "Valor Avgad de אהבה es 17");

// Validar Sofit en Albam y Avgad
const calcShalom = Engine.CalculateGematria('שלום');
assert(calcShalom.albamText === 'יאפב', "Texto Albam de שלום es 'יאפב'");
assert(calcShalom.albamValue === 93, "Valor Albam de שלום es 93");
assert(calcShalom.avgadText === 'תמזנ', "Texto Avgad de שלום es 'תמזנ'");
assert(calcShalom.avgadValue === 497, "Valor Avgad de שלום es 497");
```

---

## 5. Compatibility Analysis

1. **Existing Code Parity**: Existing fields (`absolute`, `reduced`, `atbashText`, etc.) in `CalculateGematria` remain untouched and unaffected.
2. **Breakdown Structure**: Adding `albam`, `albamVal`, `avgad`, `avgadVal` to `breakdown` objects is purely additive and fully backwards-compatible with `app.js` rendering chips.
3. **Performance Impact**: O(N) linear time per character, adding ~6 dictionary lookups per character. Execution overhead is negligible (<1 ms).
