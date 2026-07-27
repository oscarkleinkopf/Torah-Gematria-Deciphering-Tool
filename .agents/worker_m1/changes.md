# Changes Summary Report — Milestone M1 Analytical Engine Expansion

## Executive Summary
This document summarizes all modifications made to `gematria.js` and `test.js` to complete Milestone M1 (Analytical Engine Expansion).

---

## 1. Files Modified

### `gematria.js`
- **Albam & Avgad Temura Ciphers**:
  - Added `ALBAM_PAIRS` dictionary mapping 1-11 $\leftrightarrow$ 12-22 with Sofit reduction.
  - Added `AVGAD_PAIRS` dictionary mapping $n \to n+1$ with cyclic Tav $\to$ Alef wrap-around and Sofit reduction.
  - Updated `CalculateGematria` to calculate `albamText`, `albamValue`, `avgadText`, `avgadValue`, and updated `breakdown` entries to include `albam`, `albamVal`, `avgad`, `avgadVal`.
  - Added `ALBAM_PAIRS` and `AVGAD_PAIRS` to `module.exports` and `window.GematriaEngine`.

- **Roshei & Sofei Teivot Acrostics Engine**:
  - Added helper functions `NormalizeHebrewLetter`, `NormalizeHebrewString`, and `ExtractWordsForAcrostics` to clean Neqqudot (`\u0591-\u05C7`), replace Maqaf (`־`) and hyphens (`-`) with spaces, tokenize, and extract first and last letters.
  - Implemented `FindAcrostics(text, type, targetWord, options)` supporting `type = 'roshei' | 'sofei' | 'both'`, target word search or full text extraction, and exact/normalized Sofit forms.
  - Added `NormalizeHebrewLetter`, `NormalizeHebrewString`, and `FindAcrostics` to `module.exports` and `window.GematriaEngine`.

- **ELS Statistical Significance / P-Value Calculation**:
  - Implemented `CalculateLetterFrequencies(text)` to compute letter counts and relative frequencies ($f_c$).
  - Implemented `CalculateELSPValue(textLength, searchWord, skipSpec, letterFrequencies)` to calculate expected occurrences $E$, Poisson p-values $P = 1 - \exp(-E)$, log-p-values, and statistical significance scores $S = -\log_{10}(P)$.
  - Enhanced `FindELS` to automatically calculate letter frequencies and attach `expectedCount`, `pValue`, and `significanceScore` to each match object.
  - Added `CalculateLetterFrequencies` and `CalculateELSPValue` to `module.exports` and `window.GematriaEngine`.

### `test.js`
- Added comprehensive unit tests (Sections 10, 11, 12) covering:
  - Export validation of `ALBAM_PAIRS` and `AVGAD_PAIRS`.
  - Albam calculations for 'אהבה' (לעמע / 210), 'תורה' (כפטע / 179), and 'שלום' (יאפב / 93).
  - Avgad calculations for 'אהבה' (בוגו / 17), 'תורה' (אזשו / 314), and 'שלום' (תמזנ / 497).
  - Roshei Teivot detection (BILU 'ביל"ו' in Isaías 2:5, 'מילה' in Deuteronomio 30:12).
  - Sofei Teivot detection (YHVH 'יהוה' in Deuteronomio 30:12).
  - Sofit normalization in acrostics (Mem Sofit 'ם' $\to$ 'מ' matching 'ומ') and strict Sofit mode (`exactSofit = true`).
  - Full text acrostic extraction without `targetWord` and dual search with `type = 'both'`.
  - Letter frequency calculations across `TORAH_TEXT` ($N = 6877$, total frequency sum = 1.0).
  - `CalculateELSPValue` validation for 'תורה' at skip 50 ($E \approx 0.20036$, $P \approx 0.18157$, $S \approx 0.741$).
  - Enhanced `FindELS` match object validation (`expectedCount`, `pValue`, `significanceScore`).

---

## 2. Verification Commands & Results

Command executed:
```bash
node test.js
```

Result:
```text
=== INICIANDO PRUEBAS DE GEMATRIADECIPHER ===
...
✅ PASÓ: Exporta diccionarios ALBAM_PAIRS y AVGAD_PAIRS
✅ PASÓ: Texto Albam de אהבה es 'לעמע' (obtenido: 'לעמע')
✅ PASÓ: Valor Albam de אהבה es 210 (obtenido: 210)
✅ PASÓ: Texto Albam de תורה es 'כפטע' (obtenido: 'כפטע')
✅ PASÓ: Valor Albam de תורה es 179 (obtenido: 179)
✅ PASÓ: Texto Avgad de אהבה es 'בוגו' (obtenido: 'בוגו')
✅ PASÓ: Valor Avgad de אהבה es 17 (obtenido: 17)
✅ PASÓ: Texto Avgad de תורה es 'אזשו' (obtenido: 'אזשו')
✅ PASÓ: Valor Avgad de תורה es 314 (obtenido: 314)
✅ PASÓ: Texto Albam de שלום es 'יאפב' (obtenido: 'יאפב')
✅ PASÓ: Valor Albam de שלום es 93 (obtenido: 93)
✅ PASÓ: Texto Avgad de שלום es 'תמזנ' (obtenido: 'תמזנ')
✅ PASÓ: Valor Avgad de שלום es 497 (obtenido: 497)
✅ PASÓ: Encuentra el acróstico Roshei Teivot BILU (ביל"ו)
✅ PASÓ: El acróstico Roshei Teivot extraído es exactamente 'בילו'
✅ PASÓ: Los índices de las palabras del acróstico BILU son [0,1,2,3]
✅ PASÓ: Encuentra el acróstico Roshei Teivot 'מילה' en Deuteronomio 30:12
✅ PASÓ: Encuentra el acróstico Sofei Teivot 'יהוה' en Deuteronomio 30:12
✅ PASÓ: El tipo de acróstico para 'יהוה' es Sofei Teivot
✅ PASÓ: Normaliza Mem Sofit 'ם' a 'מ' para encontrar 'ומ'
✅ PASÓ: Modo estricto exactSofit = true no coincide 'ומ' con 'ום'
✅ PASÓ: Modo estricto exactSofit = true coincide exactamente con 'ום'
✅ PASÓ: Extracción completa retorna 'בילו'
✅ PASÓ: Búsqueda con type='both' retorna 2 acrósticos (Roshei 'מילה' y Sofei 'יהוה')
✅ PASÓ: Calcula la longitud correcta del corpus (6877, obtenido: 6877)
✅ PASÓ: La suma de las frecuencias de letras es igual a 1.0
✅ PASÓ: Esperado para 'תורה' (s=50) ~0.2004 (obtenido: 0.20036)
✅ PASÓ: P-Value para 'תורה' (s=50) ~0.1816 (obtenido: 0.18157)
✅ PASÓ: Score de significancia para 'תורה' (s=50) ~0.741 (obtenido: 0.741)
✅ PASÓ: FindELS retorna resultados
✅ PASÓ: FindELS localiza el código clásico de la Torá
✅ PASÓ: El resultado ELS contiene expectedCount numérico
✅ PASÓ: El resultado ELS contiene pValue numérico
✅ PASÓ: El resultado ELS contiene significanceScore numérico

=== RESUMEN ===
🎉 ¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE!
```
