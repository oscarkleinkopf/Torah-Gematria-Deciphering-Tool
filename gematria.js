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
 * Busca secuencias de letras equidistantes (ELS) para una palabra en un texto.
 * Soporta callback de progreso a través de options.onProgress o 5º argumento callback.
 */
function FindELS(text, searchWord, minSkip, maxSkip, options = {}) {
  const results = [];
  const wordLen = searchWord ? searchWord.length : 0;
  if (!text || wordLen < 2) return results;

  const onProgress = typeof options === 'function' ? options : (options && typeof options.onProgress === 'function' ? options.onProgress : null);

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

// === MÓDULO DE FECHA Y CALENDARIO HEBREO ===

/**
 * Convierte un número en su representación tradicional de letras hebreas con gershayim.
 * Ej: 5786 -> תשפ״ו, 708 -> תש״ח, 15 -> ט״ו, 16 -> ט״ז, 13 -> י״ג
 */
function NumberToHebrewLetters(num) {
  if (!num || isNaN(num) || num <= 0) return '';
  let n = parseInt(num, 10);
  if (n >= 1000) {
    n = n % 1000;
  }

  const hundreds = [
    { val: 400, char: 'ת' },
    { val: 300, char: 'ש' },
    { val: 200, char: 'ר' },
    { val: 100, char: 'ק' }
  ];

  const tens = [
    { val: 90, char: 'צ' },
    { val: 80, char: 'פ' },
    { val: 70, char: 'ע' },
    { val: 60, char: 'ס' },
    { val: 50, char: 'נ' },
    { val: 40, char: 'מ' },
    { val: 30, char: 'ל' },
    { val: 20, char: 'כ' },
    { val: 10, char: 'י' }
  ];

  const units = [
    { val: 9, char: 'ט' },
    { val: 8, char: 'ח' },
    { val: 7, char: 'ז' },
    { val: 6, char: 'ו' },
    { val: 5, char: 'ה' },
    { val: 4, char: 'ד' },
    { val: 3, char: 'ג' },
    { val: 2, char: 'ב' },
    { val: 1, char: 'א' }
  ];

  let str = '';

  for (const h of hundreds) {
    while (n >= h.val) {
      str += h.char;
      n -= h.val;
    }
  }

  if (n === 15) {
    str += 'טו';
    n = 0;
  } else if (n === 16) {
    str += 'טז';
    n = 0;
  } else {
    for (const t of tens) {
      if (n >= t.val) {
        str += t.char;
        n -= t.val;
        break;
      }
    }
    for (const u of units) {
      if (n >= u.val) {
        str += u.char;
        n -= u.val;
        break;
      }
    }
  }

  if (str.length === 1) return str + '׳';
  if (str.length > 1) return str.slice(0, -1) + '״' + str.slice(-1);
  return str;
}

const HEBREW_MONTHS_MAP = {
  'Tishrei': { hebrew: 'תשרי', spanish: 'Tishrei', sefirah: 'Juicio / Creación', zodiac: 'Libra (Moznayim)' },
  'Cheshvan': { hebrew: 'חשוון', spanish: 'Jeshván', sefirah: 'Agua / Silencio', zodiac: 'Escorpio (Akrav)' },
  'Marcheshvan': { hebrew: 'מרחשוון', spanish: 'Marjeshván', sefirah: 'Agua / Silencio', zodiac: 'Escorpio (Akrav)' },
  'Kislev': { hebrew: 'כסלו', spanish: 'Kislev', sefirah: 'Luz / Milagros', zodiac: 'Sagitario (Kashat)' },
  'Tevet': { hebrew: 'טבת', spanish: 'Tevet', sefirah: 'Firmeza / Visión', zodiac: 'Capricornio (Gedi)' },
  'Shevat': { hebrew: 'שבט', spanish: 'Shevat', sefirah: 'Renovación de Árboles', zodiac: 'Acuario (Dli)' },
  'Adar': { hebrew: 'אדר', spanish: 'Adar', sefirah: 'Alegría / Ocultamiento', zodiac: 'Piscis (Dagim)' },
  'Adar I': { hebrew: 'אדר א׳', spanish: 'Adar I', sefirah: 'Alegría Primordial', zodiac: 'Piscis (Dagim)' },
  'Adar II': { hebrew: 'אדר ב׳', spanish: 'Adar II', sefirah: 'Alegría y Redención', zodiac: 'Piscis (Dagim)' },
  'Nisan': { hebrew: 'ניסן', spanish: 'Nisán', sefirah: 'Milagros y Primavera', zodiac: 'Aries (Taleh)' },
  'Iyyar': { hebrew: 'אייר', spanish: 'Iyar', sefirah: 'Sanación (Ani YHVH Rofeja)', zodiac: 'Tauro (Shor)' },
  'Sivan': { hebrew: 'סיוון', spanish: 'Siván', sefirah: 'Entrega de la Torá', zodiac: 'Géminis (Teomim)' },
  'Tammuz': { hebrew: 'תמוז', spanish: 'Tamuz', sefirah: 'Visión y Rectificación', zodiac: 'Cáncer (Sartan)' },
  'Av': { hebrew: 'אב', spanish: 'Av', sefirah: 'Consuelo y Fuego', zodiac: 'Leo (Arieh)' },
  'Elul': { hebrew: 'אלול', spanish: 'Elul', sefirah: 'Retorno y Amor (Ani Ledodi Vedodi Li)', zodiac: 'Virgo (Betulah)' }
};

/**
 * Convierte una fecha gregoriana a fecha del calendario hebreo con sus correspondencias numéricas y espirituales.
 */
function GregorianToHebrew(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let day = 1;
    let monthName = 'Tishrei';
    let year = 5786;

    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') monthName = part.value;
      if (part.type === 'year') year = parseInt(part.value, 10);
    }

    const monthInfo = HEBREW_MONTHS_MAP[monthName] || { hebrew: monthName, spanish: monthName, sefirah: 'Mística', zodiac: 'Cosmos' };
    const dayHebrewLetters = NumberToHebrewLetters(day);
    const yearHebrewLetters = NumberToHebrewLetters(year);
    const yearShortNumber = year % 1000;

    const monthGematria = CalculateGematria(monthInfo.hebrew).absolute;
    const dayGematria = day;
    const dailyCosmicNumber = yearShortNumber;
    const fullDailyFrequency = dayGematria + monthGematria + yearShortNumber;

    return {
      gregorianDate: date,
      day,
      dayHebrew: dayHebrewLetters,
      monthName,
      monthHebrew: monthInfo.hebrew,
      monthSpanish: monthInfo.spanish,
      monthInfo,
      year,
      yearHebrew: yearHebrewLetters,
      yearShortNumber,
      fullHebrewString: `${dayHebrewLetters} ב${monthInfo.hebrew} ${yearHebrewLetters}`,
      dailyCosmicNumber,
      fullDailyFrequency
    };
  } catch (e) {
    return {
      gregorianDate: date,
      day: 1,
      dayHebrew: 'א׳',
      monthName: 'Tishrei',
      monthHebrew: 'תשרי',
      monthSpanish: 'Tishrei',
      monthInfo: { hebrew: 'תשרי', spanish: 'Tishrei', sefirah: 'Creación', zodiac: 'Libra' },
      year: 5786,
      yearHebrew: 'תשפ״ו',
      yearShortNumber: 786,
      fullHebrewString: 'א׳ בתשרי תשפ״ו',
      dailyCosmicNumber: 786,
      fullDailyFrequency: 786
    };
  }
}

// === MÓDULO DE BÚSQUEDA INVERSA POR NÚMERO / VALOR ===

/**
 * Búsqueda Inversa de Gematria: Encuentra qué palabras, conceptos o versículos
 * coinciden con un número objetivo (en valor absoluto, con Colel, reducido, ordinal o cifrado).
 */
function FindReverseGematria(targetNumber, options = {}, database = []) {
  if (!targetNumber || isNaN(targetNumber) || targetNumber <= 0) return [];
  const target = parseInt(targetNumber, 10);
  const tolerance = parseInt(options.tolerance, 10) || 0;
  const system = options.system || 'all';

  const matches = [];
  const seenKeys = new Set();

  database.forEach(entry => {
    const hebrew = entry.hebrew;
    if (!hebrew) return;

    const calc = entry.gematria || CalculateGematria(hebrew);
    if (!calc || calc.lettersCount === 0) return;

    const checkDimensions = [];

    if (system === 'all' || system === 'absolute') {
      const deltaAbs = Math.abs(calc.absolute - target);
      if (deltaAbs <= tolerance) {
        let type = 'exact';
        let desc = 'Valor Absoluto Exacto';
        let score = 100 - deltaAbs * 5;
        if (deltaAbs === 1) {
          type = 'colel';
          desc = 'Colel Místico (±1)';
          score = 90;
        } else if (deltaAbs > 1) {
          type = 'approx';
          desc = `Aproximación (Δ = ${deltaAbs})`;
          score = Math.max(10, 80 - deltaAbs * 4);
        }
        checkDimensions.push({
          type,
          system: 'absolute',
          systemName: 'Valor Estándar',
          val: calc.absolute,
          target,
          delta: deltaAbs,
          desc,
          score
        });
      }
    }

    if (system === 'all' || system === 'ordinal') {
      const deltaOrd = Math.abs(calc.ordinal - target);
      if (deltaOrd <= (tolerance > 1 ? 2 : 0)) {
        checkDimensions.push({
          type: deltaOrd === 0 ? 'exact_ordinal' : 'approx_ordinal',
          system: 'ordinal',
          systemName: 'Valor Ordinal (Mispar Sidri)',
          val: calc.ordinal,
          target,
          delta: deltaOrd,
          desc: deltaOrd === 0 ? 'Ordinal Exacto' : `Ordinal Cercano (Δ = ${deltaOrd})`,
          score: 60 - deltaOrd * 10
        });
      }
    }

    if (system === 'all' || system === 'reduced') {
      if (calc.reduced === target) {
        checkDimensions.push({
          type: 'exact_reduced',
          system: 'reduced',
          systemName: 'Valor Reducido (Esencia)',
          val: calc.reduced,
          target,
          delta: 0,
          desc: 'Esencia Reducida (1-9)',
          score: 40
        });
      }
    }

    if (system === 'all' || system === 'atbash') {
      const deltaAtbash = Math.abs(calc.atbashValue - target);
      if (deltaAtbash <= tolerance) {
        checkDimensions.push({
          type: deltaAtbash === 0 ? 'exact_atbash' : 'approx_atbash',
          system: 'atbash',
          systemName: 'Cifrado Atbash',
          val: calc.atbashValue,
          target,
          delta: deltaAtbash,
          desc: deltaAtbash === 0 ? 'Atbash Exacto' : `Atbash Cercano (Δ = ${deltaAtbash})`,
          score: 75 - deltaAtbash * 5
        });
      }
    }

    if (system === 'all' || system === 'albam') {
      const deltaAlbam = Math.abs((calc.albamValue || 0) - target);
      if (deltaAlbam <= tolerance) {
        checkDimensions.push({
          type: deltaAlbam === 0 ? 'exact_albam' : 'approx_albam',
          system: 'albam',
          systemName: 'Cifrado Albam',
          val: calc.albamValue,
          target,
          delta: deltaAlbam,
          desc: deltaAlbam === 0 ? 'Albam Exacto' : `Albam Cercano (Δ = ${deltaAlbam})`,
          score: 70 - deltaAlbam * 5
        });
      }
    }

    if (checkDimensions.length > 0) {
      checkDimensions.sort((a, b) => b.score - a.score);
      const best = checkDimensions[0];
      const uniqueKey = `${entry.id || entry.hebrew}_${best.system}_${best.val}`;

      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        matches.push({
          entry,
          gematria: calc,
          bestMatch: best,
          allMatches: checkDimensions,
          score: best.score
        });
      }
    }
  });

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

// === MÓDULO DE ANÁLISIS DE COINCIDENCIAS CRUZADAS & DELTA ===

/**
 * Realiza un análisis exhaustivo de coincidencia cruzada entre dos palabras/conceptos,
 * calculando la diferencia (Delta), la suma cabalística, anagramas, raíces y la narrativa de puente.
 */
function AnalyzeCrossConnection(calcA, calcB, database = []) {
  if (!calcA || !calcB) return null;

  const scoreResult = ScoreCorrelation(calcA, calcB);
  const delta = Math.abs(calcA.absolute - calcB.absolute);
  const sum = calcA.absolute + calcB.absolute;

  // Anagrama
  const normA = NormalizeHebrewString(calcA.cleanText).split('').sort().join('');
  const normB = NormalizeHebrewString(calcB.cleanText).split('').sort().join('');
  const isAnagram = (normA === normB && calcA.cleanText !== calcB.cleanText);

  // Buscar si el Delta o la Suma coinciden con conceptos conocidos en la base de datos
  const deltaMatches = delta > 0 ? FindReverseGematria(delta, { tolerance: 0, system: 'absolute' }, database) : [];
  const sumMatches = FindReverseGematria(sum, { tolerance: 0, system: 'absolute' }, database);

  // Cifrados cruzados
  const isAtbashCross = (calcA.absolute === calcB.atbashValue || calcB.absolute === calcA.atbashValue);
  const isAlbamCross = (calcA.absolute === (calcB.albamValue || 0) || calcB.absolute === (calcA.albamValue || 0));

  let narrative = '';
  if (calcA.absolute === calcB.absolute) {
    narrative = `"${calcA.cleanText}" y "${calcB.cleanText}" comparten el mismo valor absoluto exacto (${calcA.absolute}). En la Cábala, esto se denomina "Equivalencia de Forma" (Mispar Shaveh), revelando que ambas expresiones vehiculan la misma emanación divina en niveles complementarios de la realidad.`;
  } else if (isAnagram) {
    narrative = `"${calcA.cleanText}" y "${calcB.cleanText}" son Anagramas Cabalísticos (Tzeruf Otiot). Están construidas con las mismas letras sagradas reorganizadas, mostrando dos aspectos de una misma fuerza creadora primordial.`;
  } else if (delta === 1) {
    narrative = `La diferencia entre ambos conceptos es exactamente de 1 unidad (Colel). En la exégesis rabínica, el Colel representa el principio de la Unidad Divina (Ejad) que enlaza y unifica ambos términos.`;
  } else if (deltaMatches.length > 0) {
    const bridgeConcept = deltaMatches[0].entry.spanish || deltaMatches[0].entry.concept || deltaMatches[0].entry.hebrew;
    narrative = `La distancia numérica entre ambos términos es de ${delta}. Este delta corresponde exactamente al valor de "${bridgeConcept}" (${deltaMatches[0].entry.hebrew}), actuando como el puente espiritual y catalizador que une a "${calcA.cleanText}" con "${calcB.cleanText}".`;
  } else if (isAtbashCross) {
    narrative = `Existe un puente por Cifrado Atbash: el valor de una palabra es idéntico a la contraparte cifrada de la otra, revelando una conexión de espejo y complementariedad mística.`;
  } else {
    narrative = `Ambos términos representan frecuencias diferenciadas (A=${calcA.absolute}, B=${calcB.absolute}) con una suma de ${sum}${sumMatches.length > 0 ? ` (equivalente a "${sumMatches[0].entry.spanish || sumMatches[0].entry.hebrew}")` : ''}, invitando a la contemplación de cómo interactúan en el orden cósmico.`;
  }

  return {
    calcA,
    calcB,
    scoreResult,
    delta,
    deltaMatches,
    sum,
    sumMatches,
    isAnagram,
    isAtbashCross,
    isAlbamCross,
    narrative
  };
}

// === MÓDULO DE BÚSQUEDA SEMÁNTICA EN ESPAÑOL ===

/**
 * Busca conceptos hebreos auténticos por coincidencia semántica en español,
 * usando el diccionario conceptual y el grafo de conocimiento.
 */
function SearchSpanishSemantic(query, dictionary = [], knowledgeGraph = [], limit = 8) {
  if (!query || typeof query !== 'string') return [];
  const rawQ = query.trim().toLowerCase();
  if (!rawQ) return [];

  const cleanQ = rawQ.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const results = [];
  const seenHebrew = new Set();

  // 1. Buscar en SPANISH_HEBREW_DICT
  dictionary.forEach(item => {
    const sp = item.spanish.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const translit = (item.transliteration || '').toLowerCase();
    let score = 0;

    if (sp === cleanQ) score = 100;
    else if (sp.startsWith(cleanQ)) score = 80;
    else if (sp.includes(cleanQ)) score = 60;
    else if (translit.includes(cleanQ)) score = 50;
    else if (item.tags && item.tags.some(t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(cleanQ))) score = 40;

    if (score > 0 && !seenHebrew.has(item.hebrew)) {
      seenHebrew.add(item.hebrew);
      results.push({
        hebrew: item.hebrew,
        spanish: item.spanish,
        transliteration: item.transliteration || item.hebrew,
        gematria: item.gematria || CalculateGematria(item.hebrew).absolute,
        category: item.category || 'concepto',
        score
      });
    }
  });

  // 2. Buscar en KNOWLEDGE_GRAPH
  knowledgeGraph.forEach(item => {
    if (seenHebrew.has(item.hebrew)) return;
    const sp = (item.spanish || item.concept || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let score = 0;

    if (sp === cleanQ) score = 95;
    else if (sp.startsWith(cleanQ)) score = 75;
    else if (sp.includes(cleanQ)) score = 55;
    else if (item.tags && item.tags.some(t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(cleanQ))) score = 35;
    else if (item.mysticalNote && item.mysticalNote.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(cleanQ)) score = 25;

    if (score > 0) {
      seenHebrew.add(item.hebrew);
      const calc = item.gematria || CalculateGematria(item.hebrew);
      results.push({
        hebrew: item.hebrew,
        spanish: item.spanish || item.concept,
        transliteration: item.spanish || item.hebrew,
        gematria: calc.absolute,
        category: item.category || 'concepto',
        mysticalNote: item.mysticalNote,
        score
      });
    }
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// === MÓDULO TOPOGRÁFICO MULTIPALABRA ELS ===

/**
 * Escanea simultáneamente una lista de palabras sagradas en una frecuencia/salto fijo
 * para revelar cohabitaciones de patrones en la misma matriz de la Torá.
 */
function ScanTopographicELS(corpusText, skip, wordsList = [], options = {}) {
  if (!corpusText || !skip || !wordsList || wordsList.length === 0) return [];
  const maxMatchesPerWord = options.maxMatchesPerWord || 3;
  const palette = [
    '#ffd700', // Oro
    '#00ced1', // Cian
    '#2ecc71', // Esmeralda / Verde
    '#9b59b6', // Amatista / Púrpura
    '#e74c3c', // Coral / Rojo
    '#e67e22', // Naranja
    '#1abc9c', // Turquesa
    '#fd79a8', // Rosa
    '#a29bfe', // Lavanda
    '#74b9ff'  // Azul cielo
  ];

  const foundWords = [];
  let colorIdx = 0;

  wordsList.forEach(wEntry => {
    const hebrewWord = typeof wEntry === 'string' ? wEntry : wEntry.hebrew;
    if (!hebrewWord || hebrewWord.length < 2) return;

    const matches = FindELS(corpusText, hebrewWord, Math.abs(skip), Math.abs(skip));
    if (matches.length > 0) {
      const selectedColor = palette[colorIdx % palette.length];
      colorIdx++;

      matches.slice(0, maxMatchesPerWord).forEach(m => {
        foundWords.push({
          word: hebrewWord,
          title: typeof wEntry === 'object' ? (wEntry.spanish || wEntry.concept || hebrewWord) : hebrewWord,
          category: typeof wEntry === 'object' ? (wEntry.category || 'concepto') : 'palabra',
          skip: m.skip,
          start: m.start,
          end: m.end,
          indices: m.indices,
          color: selectedColor,
          entry: typeof wEntry === 'object' ? wEntry : { hebrew: hebrewWord }
        });
      });
    }
  });

  return foundWords;
}

// Exportación compatible
const _globalScope = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis);

const _exportedEngine = { 
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
  NormalizeHebrewLetter,
  NormalizeHebrewString,
  FindAcrostics,
  CalculateLetterFrequencies,
  CalculateELSPValue,
  NumberToHebrewLetters,
  GregorianToHebrew,
  FindReverseGematria,
  AnalyzeCrossConnection,
  SearchSpanishSemantic,
  ScanTopographicELS
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = _exportedEngine;
}

if (_globalScope) {
  _globalScope.GematriaEngine = _exportedEngine;
}


