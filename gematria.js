/**
 * Módulo de algoritmos de Gematria y transliteración de caracteres.
 * Soporta cálculo Estándar, Ordinal, Reducido y Atbash, además de traducción fonética del español al hebreo.
 */

// Mapeo básico de letras hebreas y sus valores
const HEBREW_MAP = {
  'א': { val: 1, ord: 1, red: 1, name: 'Alef' },
  'ב': { val: 2, ord: 2, red: 2, name: 'Bet' },
  'ג': { val: 3, ord: 3, red: 3, name: 'Gimel' },
  'ד': { val: 4, ord: 4, red: 4, name: 'Dalet' },
  'ה': { val: 5, ord: 5, red: 5, name: 'He' },
  'ו': { val: 6, ord: 6, red: 6, name: 'Vav' },
  'ז': { val: 7, ord: 7, red: 7, name: 'Zayin' },
  'ח': { val: 8, ord: 8, red: 8, name: 'Chet' },
  'ט': { val: 9, ord: 9, red: 9, name: 'Tet' },
  'י': { val: 10, ord: 10, red: 1, name: 'Yod' },
  'כ': { val: 20, ord: 11, red: 2, name: 'Kaf' },
  'ך': { val: 20, ord: 11, red: 2, name: 'Kaf Sofit', isSofit: true, gadolVal: 500 },
  'ל': { val: 30, ord: 12, red: 3, name: 'Lamed' },
  'מ': { val: 40, ord: 13, red: 4, name: 'Mem' },
  'ם': { val: 40, ord: 13, red: 4, name: 'Mem Sofit', isSofit: true, gadolVal: 600 },
  'נ': { val: 50, ord: 14, red: 5, name: 'Nun' },
  'ן': { val: 50, ord: 14, red: 5, name: 'Nun Sofit', isSofit: true, gadolVal: 700 },
  'ס': { val: 60, ord: 15, red: 6, name: 'Samekh' },
  'ע': { val: 70, ord: 16, red: 7, name: 'Ayin' },
  'פ': { val: 80, ord: 17, red: 8, name: 'Pe' },
  'ף': { val: 80, ord: 17, red: 8, name: 'Pe Sofit', isSofit: true, gadolVal: 800 },
  'צ': { val: 90, ord: 18, red: 9, name: 'Tsadi' },
  'ץ': { val: 90, ord: 18, red: 9, name: 'Tsadi Sofit', isSofit: true, gadolVal: 900 },
  'ק': { val: 100, ord: 19, red: 1, name: 'Qof' },
  'ר': { val: 200, ord: 20, red: 2, name: 'Resh' },
  'ש': { val: 300, ord: 21, red: 3, name: 'Shin' },
  'ת': { val: 400, ord: 22, red: 4, name: 'Tav' }
};

// Correspondencia Atbash (sustitución de extremos)
const ATBASH_PAIRS = {
  'א': 'ת', 'ב': 'ש', 'ג': 'ר', 'ד': 'ק', 'ה': 'צ',
  'ו': 'פ', 'ז': 'ע', 'ח': 'ס', 'ט': 'נ', 'י': 'מ',
  'כ': 'ל', 'ל': 'כ', 'מ': 'י', 'נ': 'ט', 'ס': 'ח',
  'ע': 'ז', 'פ': 'ו', 'צ': 'ה', 'ק': 'ד', 'ר': 'ג',
  'ש': 'ב', 'ת': 'א',
  // Manejo de Sofit en Atbash (típicamente se reducen a sus formas normales para Atbash)
  'ך': 'ל', 'ם': 'י', 'ן': 'ט', 'ף': 'ו', 'ץ': 'ה'
};

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

/**
 * Convierte texto en español a caracteres hebreos usando un mapeo fonético aproximado.
 * Esto permite a personas de habla hispana calcular la gematria de sus propios nombres o palabras.
 */
function SpanishToHebrew(text) {
  let cleanText = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-zñ\s]/g, ""); // Conservar solo letras y espacios

  const COMMON_WORDS = {
    'sion': 'ציון',
    'israel': 'ישראל',
    'torah': 'תורה',
    'tora': 'תורה',
    'jerusalen': 'ירושלים',
    'shalom': 'שלום',
    'paz': 'שלום',
    'amor': 'אהבה',
    'unidad': 'אחד',
    'dios': 'אלהيم',
    'jehova': 'יהוה',
    'mesias': 'משיח',
    'moises': 'משה',
    'abraham': 'אברהם',
    'isaac': 'יצחק',
    'jacob': 'יעקב',
    'jose': 'יוסף',
    'david': 'דוד',
    'salomon': 'שלמה',
    'sara': 'שרה'
  };

  let words = cleanText.split(/\s+/);
  let translatedWords = words.map(word => {
    if (COMMON_WORDS[word]) {
      return COMMON_WORDS[word];
    }
    
    let wordResult = '';
    let i = 0;
    while (i < word.length) {
      let char = word[i];
      let nextChar = word[i + 1] || '';

      if (char === 'c' && nextChar === 'h') {
        wordResult += 'צ';
        i += 2;
        continue;
      }
      if (char === 'l' && nextChar === 'l') {
        wordResult += 'י';
        i += 2;
        continue;
      }
      if (char === 'q' && nextChar === 'u') {
        wordResult += 'ק';
        i += 2;
        continue;
      }
      if (char === 'r' && nextChar === 'r') {
        wordResult += 'ר';
        i += 2;
        continue;
      }

      switch (char) {
        case 'a': wordResult += 'א'; break;
        case 'b':
        case 'v': wordResult += 'ב'; break;
        case 'c':
          if (nextChar === 'e' || nextChar === 'i') {
            wordResult += 'ס';
          } else {
            wordResult += 'ק';
          }
          break;
        case 'd': wordResult += 'ד'; break;
        case 'e': wordResult += 'ה'; break;
        case 'f': wordResult += 'פ'; break;
        case 'g':
          if (nextChar === 'e' || nextChar === 'i') {
            wordResult += 'ח';
          } else {
            wordResult += 'ג';
          }
          break;
        case 'h': wordResult += 'א'; break;
        case 'i':
        case 'y': wordResult += 'י'; break;
        case 'j': wordResult += 'ח'; break;
        case 'k': wordResult += 'ק'; break;
        case 'l': wordResult += 'ל'; break;
        case 'm': wordResult += 'מ'; break;
        case 'n':
        case 'ñ': wordResult += 'נ'; break;
        case 'o':
        case 'u':
        case 'w': wordResult += 'ו'; break;
        case 'p': wordResult += 'פ'; break;
        case 'r': wordResult += 'ר'; break;
        case 's':
        case 'z': wordResult += 'ס'; break;
        case 't': wordResult += 'ת'; break;
        case 'x': wordResult += 'ס'; break;
      }
      i++;
    }
    return wordResult;
  });

  return ApplySofitLetters(translatedWords.join(' '));
}

/**
 * Ajusta las letras que tienen forma final (Sofit) al final de cada palabra.
 * Letras aplicables: Kaf (כ->ך), Mem (מ->ם), Nun (נ->ן), Pe (פ->ף), Tsadi (צ->ץ)
 */
function ApplySofitLetters(hebrewText) {
  let words = hebrewText.split(' ');
  let processedWords = words.map(word => {
    if (word.length === 0) return word;
    let lastIndex = word.length - 1;
    let lastChar = word[lastIndex];

    switch (lastChar) {
      case 'כ': word = word.substring(0, lastIndex) + 'ך'; break;
      case 'מ': word = word.substring(0, lastIndex) + 'ם'; break;
      case 'נ': word = word.substring(0, lastIndex) + 'ן'; break;
      case 'פ': word = word.substring(0, lastIndex) + 'ף'; break;
      case 'צ': word = word.substring(0, lastIndex) + 'ץ'; break;
    }
    return word;
  });

  return processedWords.join(' ');
}

/**
 * Realiza el cálculo detallado de Gematria para un texto hebreo dado.
 */
function CalculateGematria(hebrewText) {
  // Limpiar el texto hebreo de signos diacríticos (Neqqudot/acentos) para quedarnos con las puras letras
  let cleanHebrew = hebrewText.replace(/[\u0591-\u05C7]/g, '');

  let results = {
    originalText: hebrewText,
    cleanText: cleanHebrew,
    lettersCount: 0,
    absolute: 0,  // Estándar (Sofit vale igual que normal, ej: Kaf Sofit = 20)
    absoluteGadol: 0, // Con valores Sofit elevados (500-900)
    ordinal: 0,
    reduced: 0,
    atbashText: '',
    atbashValue: 0,
    albamText: '',
    albamValue: 0,
    avgadText: '',
    avgadValue: 0,
    breakdown: [] // Detalles letra por letra
  };

  for (let char of cleanHebrew) {
    if (char === ' ' || char === '\n' || char === '\r') {
      results.atbashText += char;
      results.albamText += char;
      results.avgadText += char;
      continue;
    }

    let letterData = HEBREW_MAP[char];
    if (letterData) {
      results.lettersCount++;

      // Valores normales
      let val = letterData.val;
      let ord = letterData.ord;
      let red = letterData.red;
      let gadolVal = letterData.isSofit ? letterData.gadolVal : val;

      results.absolute += val;
      results.absoluteGadol += gadolVal;
      results.ordinal += ord;
      results.reduced += red;

      // Atbash
      let atbashChar = ATBASH_PAIRS[char] || char;
      results.atbashText += atbashChar;
      let atbashData = HEBREW_MAP[atbashChar];
      if (atbashData) {
        results.atbashValue += atbashData.val;
      }

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

      results.breakdown.push({
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
      });
    } else {
      // Si hay un carácter no hebreo, simplemente lo pasamos sin sumarlo
      results.atbashText += char;
      results.albamText += char;
      results.avgadText += char;
    }
  }

  // Reducir la suma reducida acumulada a un solo dígito (si es mayor a 9)
  results.reduced = ReduceNumber(results.reduced);

  return results;
}

/**
 * Reduce recursivamente un número sumando sus dígitos hasta obtener un valor entre 1 y 9.
 */
function ReduceNumber(num) {
  while (num > 9) {
    num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return num;
}

/**
 * Encuentra raíces o letras compartidas entre dos palabras.
 * Retorna las letras compartidas (como string) si son 2 o más.
 */
function FindSharedRoot(wordA, wordB) {
  let setA = new Set(wordA.replace(/\s/g, ''));
  let setB = new Set(wordB.replace(/\s/g, ''));
  let shared = [];
  for (let char of setA) {
    if (setB.has(char)) {
      shared.push(char);
    }
  }
  return shared.length >= 2 ? shared.join('') : null;
}

/**
 * Determina si hay una relación de múltiplos o divisores entre dos valores.
 * Retorna el factor si existe (ej: "A es el doble de B" -> factor 2)
 */
function GetFactorRelation(valA, valB) {
  if (valA <= 0 || valB <= 0 || valA === valB) return null;
  if (valA % valB === 0) {
    let factor = valA / valB;
    if (factor <= 10) return { factor, type: 'multiple' };
  }
  if (valB % valA === 0) {
    let factor = valB / valA;
    if (factor <= 10) return { factor, type: 'divisor' };
  }
  return null;
}

/**
 * Evalúa las 5 dimensiones de coincidencia entre dos palabras y calcula un puntaje (1-5 estrellas).
 */
function ScoreCorrelation(calcA, calcB) {
  let matches = [];
  let score = 0;

  // 1. Coincidencia Exacta
  if (calcA.absolute === calcB.absolute) {
    matches.push({ type: 'exact', desc: 'Coincidencia de Valor Absoluto' });
    score += 4;
  }

  // 2. Coincidencia Reducida
  if (calcA.reduced === calcB.reduced) {
    matches.push({ type: 'reduced', desc: 'Coincidencia de Valor Reducido (Esencia)' });
    score += 1;
  }

  // 3. Coincidencia Atbash
  if (calcA.absolute === calcB.atbashValue || calcB.absolute === calcA.atbashValue) {
    matches.push({ type: 'atbash', desc: 'Conexión por Cifrado Atbash' });
    score += 2;
  }

  // 4. Letras Compartidas
  let shared = FindSharedRoot(calcA.cleanText, calcB.cleanText);
  if (shared) {
    matches.push({ type: 'root', desc: `Letras compartidas: ${shared}`, details: shared });
    score += 1;
  }

  // 5. Relación por Factores
  let factorInfo = GetFactorRelation(calcA.absolute, calcB.absolute);
  if (factorInfo) {
    let desc = factorInfo.type === 'multiple' 
      ? `Valor es múltiplo (x${factorInfo.factor})` 
      : `Valor es divisor (1/${factorInfo.factor})`;
    matches.push({ type: 'factor', desc, details: factorInfo });
    score += 1.5;
  }

  // Limitar estrellas de 1 a 5
  let stars = Math.min(5, Math.max(1, Math.round(score)));
  
  return {
    score,
    stars,
    matches
  };
}

/**
 * Busca correlaciones para un texto hebreo en la base de datos de conocimiento
 */
function FindCorrelations(hebrewText, database) {
  let calcInput = CalculateGematria(hebrewText);
  if (calcInput.lettersCount === 0) return [];

  let correlations = [];

  database.forEach(entry => {
    // Si la palabra es exactamente la misma, no correlacionar
    if (entry.hebrew === calcInput.cleanText) return;

    let calcEntry = CalculateGematria(entry.hebrew);
    let scoreResult = ScoreCorrelation(calcInput, calcEntry);

    if (scoreResult.matches.length > 0) {
      correlations.push({
        entry,
        gematria: calcEntry,
        score: scoreResult.score,
        stars: scoreResult.stars,
        matches: scoreResult.matches
      });
    }
  });

  // Ordenar por score decreciente
  correlations.sort((a, b) => b.score - a.score);

  return correlations;
}

// === MÓDULO DE ACRÓSTICOS (ROSHEI Y SOFEI TEIVOT) ===

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

/**
 * Detecta acrósticos Roshei Teivot (iniciales) y Sofei Teivot (finales) en un texto hebreo.
 * 
 * @param {string} text - Texto hebreo de entrada.
 * @param {string} [type='roshei'] - Tipo de acróstico: 'roshei', 'sofei', o 'both'.
 * @param {string|null} [targetWord=null] - Palabra objetivo a buscar. Si es null, extrae acrósticos completos del texto.
 * @param {Object} [options={}] - Opciones de configuración.
 * @param {boolean} [options.exactSofit=false] - Si es true, requiere coincidencia exacta de Sofit; si es false, normaliza Sofiyot.
 * @returns {Array<Object>} Lista de acrósticos encontrados.
 */
function FindAcrostics(text, type = 'roshei', targetWord = null, options = {}) {
  const exactSofit = options.exactSofit === true;
  const words = ExtractWordsForAcrostics(text);
  if (words.length === 0) return [];

  let cleanTarget = null;
  let targetNorm = null;
  if (targetWord !== null && targetWord !== undefined) {
    cleanTarget = String(targetWord).replace(/[^\u05D0-\u05EA]/g, '');
    if (cleanTarget === '') return [];
    targetNorm = NormalizeHebrewString(cleanTarget);
  }

  const typesToCheck = [];
  if (type === 'roshei' || type === 'both') typesToCheck.push('roshei');
  if (type === 'sofei' || type === 'both') typesToCheck.push('sofei');

  const results = [];

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

// === MÓDULO DE ESTADÍSTICA ELS Y P-VALUE ===

/**
 * Calcula frecuencias relativas y conteo de letras en un texto hebreo.
 * @param {string} text - Corpus o texto hebreo.
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

/**
 * Calcula el valor p de Poisson, coincidencias esperadas y puntaje de significancia estadística para ELS.
 * @param {number} textLength - Longitud N del texto.
 * @param {string} searchWord - Palabra ELS buscada.
 * @param {number|number[]|{minSkip: number, maxSkip: number}} skipSpec - Salto entero, lista de saltos o rango.
 * @param {Object} letterFrequencies - Mapa de frecuencias { [char]: frequency } o resultado de CalculateLetterFrequencies.
 * @returns {Object} { expectedMatches: number, pValue: number, statisticalSignificanceScore: number, logPValue: number }
 */
function CalculateELSPValue(textLength, searchWord, skipSpec, letterFrequencies) {
  if (!Number.isFinite(textLength) || textLength <= 0) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
  }

  if (!searchWord || (typeof searchWord !== 'string' && !Array.isArray(searchWord))) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
  }

  const k = searchWord.length;
  if (k < 2 || !letterFrequencies) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
  }

  if (skipSpec === null || skipSpec === undefined) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
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
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
  }

  let totalL = 0;

  if (typeof skipSpec === 'number') {
    if (!Number.isFinite(skipSpec)) {
      return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
    }
    if (skipSpec !== 0) {
      totalL = Math.max(0, textLength - (k - 1) * Math.abs(skipSpec));
    }
  } else if (Array.isArray(skipSpec)) {
    for (const s of skipSpec) {
      if (typeof s === 'number' && Number.isFinite(s) && s !== 0) {
        totalL += Math.max(0, textLength - (k - 1) * Math.abs(s));
      }
    }
  } else if (typeof skipSpec === 'object') {
    const minS = typeof skipSpec.minSkip === 'number' && Number.isFinite(skipSpec.minSkip) ? skipSpec.minSkip : null;
    const maxS = typeof skipSpec.maxSkip === 'number' && Number.isFinite(skipSpec.maxSkip) ? skipSpec.maxSkip : null;

    if (minS === null && maxS === null) {
      return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
    }

    const effectiveMin = minS !== null ? minS : 1;
    const effectiveMax = maxS !== null ? maxS : effectiveMin;

    let absMin, absMax;
    if (effectiveMin <= 0 && effectiveMax >= 0) {
      absMin = 1;
      absMax = Math.max(Math.abs(effectiveMin), Math.abs(effectiveMax));
    } else {
      const a = Math.abs(effectiveMin);
      const b = Math.abs(effectiveMax);
      absMin = Math.min(a, b);
      absMax = Math.max(a, b);
      if (absMin === 0) absMin = 1;
    }

    const maxLimit = Math.min(textLength, Math.ceil(textLength / Math.max(1, k - 1)) + 1);
    absMax = Math.min(absMax, maxLimit);

    for (let s = absMin; s <= absMax; s++) {
      totalL += 2 * Math.max(0, textLength - (k - 1) * s);
    }
  } else {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
  }

  const E = totalL * pWord;
  if (E <= 0) {
    return { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0, significanceScore: 0, logPValue: 0 };
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
    significanceScore: statisticalSignificanceScore,
    logPValue: logPValue
  };
}

/**
 * Reduce arbitrary Hebrew (or mixed) text to consonantal letters only (U+05D0–U+05EA).
 * Strips spaces, niqqud, maqaf, punctuation, and foreign glyphs. Used to keep the
 * Torah corpus ELS-safe at load time and when ingesting new excerpts.
 */
function SanitizeHebrewConsonants(text) {
  if (!text || typeof text !== 'string') return '';
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const code = c.charCodeAt(0);
    // Common OCR corruption: Thai "บ" → Hebrew bet
    if (code === 0x0E1A) {
      out += 'ב';
      continue;
    }
    if (code >= 0x05D0 && code <= 0x05EA) out += c;
  }
  return out;
}

/**
 * Busca secuencias de letras equidistantes (ELS) para una palabra en un texto.
 * Soporta callback de progreso a través de options.onProgress o 5º argumento callback.
 * options.shouldCancel(): if returns true, aborts early and returns partial results.
 */
function FindELS(text, searchWord, minSkip, maxSkip, options = {}) {
  const results = [];
  const wordLen = searchWord ? searchWord.length : 0;
  if (!text || wordLen < 2) return results;

  const onProgress = typeof options === 'function' ? options : (options && typeof options.onProgress === 'function' ? options.onProgress : null);
  const shouldCancel = options && typeof options.shouldCancel === 'function' ? options.shouldCancel : null;

  const freqData = CalculateLetterFrequencies(text);
  const firstChar = searchWord[0];
  const textLen = text.length;

  const startIndices = [];
  for (let i = 0; i < textLen; i++) {
    if (text[i] === firstChar) {
      startIndices.push(i);
    }
  }

  const effectiveMin = Math.max(1, parseInt(minSkip, 10) || 1);
  const effectiveMax = Math.max(effectiveMin, parseInt(maxSkip, 10) || 1);
  const totalSkips = 2 * (effectiveMax - effectiveMin + 1);
  let processedSkips = 0;

  for (let skip = -effectiveMax; skip <= effectiveMax; skip++) {
    if (shouldCancel && shouldCancel()) {
      results.sort((a, b) => Math.abs(a.skip) - Math.abs(b.skip));
      return results;
    }

    const absSkip = Math.abs(skip);
    if (absSkip < effectiveMin) continue;

    processedSkips++;
    if (onProgress) {
      const percent = totalSkips > 0 ? Math.floor((processedSkips / totalSkips) * 100) : 100;
      onProgress({
        percent,
        currentSkip: skip,
        totalSkips,
        processedSkips,
        searchWord
      });
    }

    for (let startIdx of startIndices) {
      let match = true;
      const pathIndices = [startIdx];

      for (let charIdx = 1; charIdx < wordLen; charIdx++) {
        const nextIdx = startIdx + charIdx * skip;
        if (nextIdx < 0 || nextIdx >= textLen || text[nextIdx] !== searchWord[charIdx]) {
          match = false;
          break;
        }
        pathIndices.push(nextIdx);
      }

      if (match) {
        const stats = CalculateELSPValue(textLen, searchWord, skip, freqData.frequencies);
        results.push({
          word: searchWord,
          start: startIdx,
          skip: skip,
          indices: pathIndices,
          expectedCount: stats.expectedMatches,
          pValue: stats.pValue,
          significanceScore: stats.statisticalSignificanceScore
        });
      }
    }
  }

  results.sort((a, b) => Math.abs(a.skip) - Math.abs(b.skip));
  return results;
}

// Exportación compatible
const _globalScope = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    SpanishToHebrew, 
    CalculateGematria, 
    HEBREW_MAP, 
    ATBASH_PAIRS,
    ALBAM_PAIRS,
    AVGAD_PAIRS,
    FindSharedRoot,
    GetFactorRelation,
    ScoreCorrelation,
    FindCorrelations,
    FindELS,
    SanitizeHebrewConsonants,
    NormalizeHebrewLetter,
    NormalizeHebrewString,
    FindAcrostics,
    CalculateLetterFrequencies,
    CalculateELSPValue
  };
}

if (_globalScope) {
  _globalScope.GematriaEngine = { 
    SpanishToHebrew, 
    CalculateGematria, 
    HEBREW_MAP, 
    ATBASH_PAIRS,
    ALBAM_PAIRS,
    AVGAD_PAIRS,
    FindSharedRoot,
    GetFactorRelation,
    ScoreCorrelation,
    FindCorrelations,
    FindELS,
    SanitizeHebrewConsonants,
    NormalizeHebrewLetter,
    NormalizeHebrewString,
    FindAcrostics,
    CalculateLetterFrequencies,
    CalculateELSPValue
  };
  _globalScope.SanitizeHebrewConsonants = SanitizeHebrewConsonants;
}

