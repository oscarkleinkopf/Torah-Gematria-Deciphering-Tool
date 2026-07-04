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
    breakdown: [] // Detalles letra por letra
  };

  for (let char of cleanHebrew) {
    if (char === ' ' || char === '\n' || char === '\r') {
      results.atbashText += char;
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

      results.breakdown.push({
        letter: char,
        name: letterData.name,
        absolute: val,
        absoluteGadol: gadolVal,
        ordinal: ord,
        reduced: red,
        atbash: atbashChar,
        atbashVal: atbashData ? atbashData.val : 0
      });
    } else {
      // Si hay un carácter no hebreo, simplemente lo pasamos sin sumarlo
      results.atbashText += char;
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

/**
 * Busca secuencias de letras equidistantes (ELS) para una palabra en un texto.
 */
function FindELS(text, searchWord, minSkip, maxSkip) {
  const results = [];
  const wordLen = searchWord.length;
  if (wordLen < 2) return results;

  const firstChar = searchWord[0];
  const textLen = text.length;

  const startIndices = [];
  for (let i = 0; i < textLen; i++) {
    if (text[i] === firstChar) {
      startIndices.push(i);
    }
  }

  for (let skip = -maxSkip; skip <= maxSkip; skip++) {
    const absSkip = Math.abs(skip);
    if (absSkip < minSkip) continue;

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
        results.push({
          word: searchWord,
          start: startIdx,
          skip: skip,
          indices: pathIndices
        });
      }
    }
  }

  results.sort((a, b) => Math.abs(a.skip) - Math.abs(b.skip));
  return results;
}

// Exportación compatible
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
    FindELS
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
    FindELS
  };
}

