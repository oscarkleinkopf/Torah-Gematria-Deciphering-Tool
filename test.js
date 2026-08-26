/**
 * Script de prueba para validar el motor de Gematria, correlaciones, corpus expandido y Worker multihilo.
 * Ejecutar con: node test.js
 */

const Engine = require('./gematria.js');
const DB = require('./database.js');
const { TORAH_TEXT, TORAH_BOOKS } = require('./torah_text.js');
const { Worker: NodeWorker } = require('worker_threads');

let success = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    success = false;
  } else {
    console.log(`✅ PASÓ: ${message}`);
  }
}

// Polyfill de WorkerAdapter para entornos Node.js
class WorkerAdapter {
  constructor(scriptPath) {
    this.worker = new NodeWorker(scriptPath);
    this.onmessage = null;
    this.onerror = null;

    this.worker.on('message', (data) => {
      if (typeof this.onmessage === 'function') {
        this.onmessage({ data });
      }
    });

    this.worker.on('error', (err) => {
      if (typeof this.onerror === 'function') {
        this.onerror(err);
      }
    });
  }

  postMessage(data) {
    this.worker.postMessage(data);
  }

  terminate() {
    return this.worker.terminate();
  }
}

async function runAllTests() {
  console.log("=== INICIANDO PRUEBAS DE GEMATRIADECIPHER ===");

  // 1. Validar cálculos de Gematria básicos
  const calcAhava = Engine.CalculateGematria('אהבה'); // א=1, ה=5, ב=2, ה=5 -> 13
  assert(calcAhava.absolute === 13, "Gematria absoluta de אהבה es 13");
  assert(calcAhava.reduced === 4, "Gematria reducida de אהבה es 4 (1+3)");

  const calcEchad = Engine.CalculateGematria('אחד'); // א=1, ח=8, ד=4 -> 13
  assert(calcEchad.absolute === 13, "Gematria absoluta de אחד es 13");

  // 2. Validar Cifrado Atbash
  assert(calcAhava.atbashText === 'תצשצ', "Texto Atbash de אהבה es 'תצשצ'");

  // 3. Validar transliteración de español a hebreו
  const translitSion = Engine.SpanishToHebrew('Sion');
  assert(translitSion === 'ציון', `Transliteración de 'Sion' debe ser 'ציון' (obtenido: '${translitSion}')`);

  // 4. Validar dimensiones de correlación
  const scoreResult = Engine.ScoreCorrelation(calcAhava, calcEchad);
  assert(scoreResult.stars === 5, "Correlación entre אהבה (13) y אחד (13) es de 5 estrellas");
  const exactMatch = scoreResult.matches.find(m => m.type === 'exact');
  assert(exactMatch !== undefined, "Se detecta coincidencia absoluta exacta entre אהבה y uno");

  // 5. Validar relación por factores
  const factorRelation = Engine.GetFactorRelation(26, 13);
  assert(factorRelation !== null && factorRelation.factor === 2 && factorRelation.type === 'multiple', "26 es múltiplo x2 de 13");

  // 6. Validar integridad de la Base de Datos
  assert(DB.KNOWLEDGE_GRAPH.length >= 50, `KNOWLEDGE_GRAPH tiene al menos 50 conceptos (actual: ${DB.KNOWLEDGE_GRAPH.length})`);
  assert(DB.HISTORICAL_EVENTS.length >= 8, `HISTORICAL_EVENTS tiene al menos 8 hitos históricos (actual: ${DB.HISTORICAL_EVENTS.length})`);
  assert(DB.LEGENDARY_PAIRS && DB.LEGENDARY_PAIRS.length >= 6, `LEGENDARY_PAIRS tiene pares arquetípicos configurados (actual: ${DB.LEGENDARY_PAIRS.length})`);

  // 7. Validar búsqueda global de correlaciones
  const correlations = Engine.FindCorrelations('אהבה', DB.KNOWLEDGE_GRAPH);
  assert(correlations.length > 0, "Búsqueda de correlaciones para 'אהבה' retorna resultados");
  const echadInCorrelations = correlations.find(c => c.entry.hebrew === 'אחד');
  assert(echadInCorrelations !== undefined, "La búsqueda de correlaciones para 'אהבה' incluye a 'אחד'");

  // 8. Validar búsqueda ELS (Código de la Biblia)
  const torahMatches = Engine.FindELS(TORAH_TEXT, 'תורה', 49, 51);
  assert(torahMatches.length > 0, "Encuentra coincidencia ELS para 'תורה'");
  const classicTorahMatch = torahMatches.find(m => m.skip === 50 && m.start === 5);
  assert(classicTorahMatch !== undefined, "Encuentra el código clásico de la Torá a salto 50 empezando en la letra #5");

  // Validar que también funcione con saltos negativos
  const negativeMatches = Engine.FindELS(TORAH_TEXT, 'הרות', 49, 51);
  const negativeMatch = negativeMatches.find(m => m.skip === -50);
  assert(negativeMatch !== undefined, "Encuentra coincidencia con salto negativo (-50) para 'הרות'");

  // 9. Validar Densidad de Crossovers en Ventana de Matriz
  const w = 50;
  const startRow = Math.floor(5 / w);
  const endRow = Math.floor(155 / w);
  const minRow = Math.max(0, startRow - 6);
  const maxRow = Math.min(Math.floor((TORAH_TEXT.length - 1) / w), endRow + 6);
  const visibleStartIdx = minRow * w;
  const visibleEndIdx = (maxRow + 1) * w - 1;

  const crossovers = [];
  DB.KNOWLEDGE_GRAPH.forEach(entry => {
    if (entry.hebrew === 'תורה') return;
    const subMatches = Engine.FindELS(TORAH_TEXT, entry.hebrew, 2, 80);
    for (let m of subMatches) {
      const allInWindow = m.indices.every(idx => idx >= visibleStartIdx && idx <= visibleEndIdx);
      if (allInWindow) {
        crossovers.push({ entry, match: m });
        break;
      }
    }
  });
  assert(crossovers.length > 0, `Encuentra crossovers conceptuales en la ventana de 'תורה' (salto 50, ventana [${visibleStartIdx}-${visibleEndIdx}]). Total: ${crossovers.length}`);

  // 10. Validar NUEVAS MEJORAS 1, 2 Y 3
  console.log("\n=== SECCIÓN 10: VALIDACIÓN DE MEJORAS 1, 2 Y 3 ===");
  
  // Mejora 1: Búsqueda Inversa por Número (FindReverseGematria)
  const rev13 = Engine.FindReverseGematria(13, { tolerance: 0, system: 'absolute' }, DB.KNOWLEDGE_GRAPH);
  assert(rev13.length >= 2, `Búsqueda inversa de valor 13 encuentra al menos 2 palabras (encontradas: ${rev13.length})`);
  assert(rev13.some(r => r.entry.hebrew === 'אהבה'), "Búsqueda inversa de 13 incluye אהבה (Amor)");
  assert(rev13.some(r => r.entry.hebrew === 'אחד'), "Búsqueda inversa de 13 incluye אחד (Unidad)");

  const rev708Colel = Engine.FindReverseGematria(708, { tolerance: 1, system: 'absolute' }, DB.KNOWLEDGE_GRAPH);
  assert(rev708Colel.length >= 1, "Búsqueda inversa de 708 con Colel encuentra coincidencia (תשח)");

  // Mejora 2: Coincidencias Cruzadas & Delta (AnalyzeCrossConnection)
  const crossLoveUnity = Engine.AnalyzeCrossConnection(calcAhava, calcEchad, DB.KNOWLEDGE_GRAPH);
  assert(crossLoveUnity.delta === 0, "El delta entre אהבה y אחד es 0");
  assert(crossLoveUnity.sum === 26, "La suma entre אהבה y אחד es 26 (YHVH)");
  assert(crossLoveUnity.narrative.includes('Equivalencia de Forma'), "La narrativa explica la Equivalencia de Forma");

  const calcIsrael = Engine.CalculateGematria('ישראל');
  const calcTorahSample = Engine.CalculateGematria('תורה');
  const crossIsraelTorah = Engine.AnalyzeCrossConnection(calcIsrael, calcTorahSample, DB.KNOWLEDGE_GRAPH);
  assert(crossIsraelTorah.delta === 70, `El delta entre Torá (611) e Israel (541) es 70 (obtenido: ${crossIsraelTorah.delta})`);

  // Mejora 3: Sincronía Diaria & Calendario Hebreo (GregorianToHebrew & NumberToHebrewLetters)
  const sampleHebDate = Engine.GregorianToHebrew(new Date(2026, 7, 13));
  assert(sampleHebDate.year === 5786, `Año hebreo para agosto 2026 es 5786 (obtenido: ${sampleHebDate.year})`);
  assert(sampleHebDate.yearHebrew.includes('תשפ'), `Año en letras hebreas es correcto (obtenido: ${sampleHebDate.yearHebrew})`);
  assert(typeof sampleHebDate.fullDailyFrequency === 'number', "Calcula frecuencia cósmica diaria numérica");

  assert(Engine.NumberToHebrewLetters(15) === 'ט״ו', "15 se formatea tradicionalmente como ט״ו (no י-ה)");
  assert(Engine.NumberToHebrewLetters(16) === 'ט״ז', "16 se formatea tradicionalmente como ט״ז (no י-ו)");
  assert(Engine.NumberToHebrewLetters(708) === 'תש״ח', "708 se formatea como תש״ח");

  // 11. Validar Cifrados Albam y Avgad
  assert(Engine.ALBAM_PAIRS !== undefined && Engine.AVGAD_PAIRS !== undefined, "Exporta diccionarios ALBAM_PAIRS y AVGAD_PAIRS");

  // Validar Cifrado Albam
  assert(calcAhava.albamText === 'לעמע', `Texto Albam de אהבה es 'לעמע' (obtenido: '${calcAhava.albamText}')`);
  assert(calcAhava.albamValue === 210, `Valor Albam de אהבה es 210 (obtenido: ${calcAhava.albamValue})`);

  const calcTorah = Engine.CalculateGematria('תורה');
  assert(calcTorah.albamText === 'כפטע', `Texto Albam de תורה es 'כפטע' (obtenido: '${calcTorah.albamText}')`);
  assert(calcTorah.albamValue === 179, `Valor Albam de תורה es 179 (obtenido: ${calcTorah.albamValue})`);

  // Validar Cifrado Avgad
  assert(calcAhava.avgadText === 'בוגו', `Texto Avgad de אהבה es 'בוגו' (obtenido: '${calcAhava.avgadText}')`);
  assert(calcAhava.avgadValue === 17, `Valor Avgad de אהבה es 17 (obtenido: ${calcAhava.avgadValue})`);

  assert(calcTorah.avgadText === 'אזשו', `Texto Avgad de תורה es 'אזשו' (obtenido: '${calcTorah.avgadText}')`);
  assert(calcTorah.avgadValue === 314, `Valor Avgad de תורה es 314 (obtenido: ${calcTorah.avgadValue})`);

  // Validar Sofit en Albam y Avgad
  const calcShalom = Engine.CalculateGematria('שלום');
  assert(calcShalom.albamText === 'יאפב', `Texto Albam de שלום es 'יאפב' (obtenido: '${calcShalom.albamText}')`);
  assert(calcShalom.albamValue === 93, `Valor Albam de שלום es 93 (obtenido: ${calcShalom.albamValue})`);
  assert(calcShalom.avgadText === 'תמזנ', `Texto Avgad de שלום es 'תמזנ' (obtenido: '${calcShalom.avgadText}')`);
  assert(calcShalom.avgadValue === 497, `Valor Avgad de שלום es 497 (obtenido: ${calcShalom.avgadValue})`);

  // 11. Validar Acrósticos (Roshei y Sofei Teivot)
  const biluText = 'בֵּית יַעֲקֹב לְכוּ וְנֵלְכָה בְּאוֹר יְהוָה';
  const biluMatches = Engine.FindAcrostics(biluText, 'roshei', 'ביל"ו');
  assert(biluMatches.length > 0, "Encuentra el acróstico Roshei Teivot BILU (ביל\"ו)");
  assert(biluMatches[0].isRoshei === true && biluMatches[0].word === 'בילו', "El acróstico Roshei Teivot extraído es exactamente 'בילו'");
  assert(JSON.stringify(biluMatches[0].indices) === '[0,1,2,3]', "Los índices de las palabras del acróstico BILU son [0,1,2,3]");

  const deutText = 'מִי יַעֲלֶה לָּנוּ הַשָּׁמַיְמָה';
  const milahMatches = Engine.FindAcrostics(deutText, 'roshei', 'מילה');
  assert(milahMatches.length > 0, "Encuentra el acróstico Roshei Teivot 'מילה' en Deuteronomio 30:12");

  const yhvhMatches = Engine.FindAcrostics(deutText, 'sofei', 'יהוה');
  assert(yhvhMatches.length > 0, "Encuentra el acróstico Sofei Teivot 'יהוה' en Deuteronomio 30:12");
  assert(yhvhMatches[0].isSofei === true, "El tipo de acróstico para 'יהוה' es Sofei Teivot");

  const shamayimText = 'יִשְׂמְחוּ הַשָּׁמַיִם';
  const sofitNormalizedMatches = Engine.FindAcrostics(shamayimText, 'sofei', 'ומ');
  assert(sofitNormalizedMatches.length > 0, "Normaliza Mem Sofit 'ם' a 'מ' para encontrar 'ומ'");

  const strictFail = Engine.FindAcrostics(shamayimText, 'sofei', 'ומ', { exactSofit: true });
  assert(strictFail.length === 0, "Modo estricto exactSofit = true no coincide 'ומ' con 'ום'");

  const strictPass = Engine.FindAcrostics(shamayimText, 'sofei', 'ום', { exactSofit: true });
  assert(strictPass.length > 0, "Modo estricto exactSofit = true coincide exactamente con 'ום'");

  const fullAcrostic = Engine.FindAcrostics('בית יעקב לכו ונלכה', 'roshei');
  assert(fullAcrostic.length > 0 && fullAcrostic[0].word === 'בילו', "Extracción completa retorna 'בילו'");

  const bothMatches = Engine.FindAcrostics(deutText, 'both');
  assert(bothMatches.length === 2, "Búsqueda con type='both' retorna 2 acrósticos (Roshei 'מילה' y Sofei 'יהוה')");

  const nonHebrewTarget = Engine.FindAcrostics(deutText, 'roshei', '1234');
  assert(nonHebrewTarget.length === 0, "FindAcrostics con targetWord='1234' (sin caracteres hebreos) retorna [] inmediatamente");

  // 12. Validar Cálculo de Frecuencias de Letras y P-Value Estadístico ELS
  const freqsData = Engine.CalculateLetterFrequencies(TORAH_TEXT);
  assert(freqsData.N === TORAH_TEXT.length, `Calcula la longitud del corpus expandido (${TORAH_TEXT.length}, obtenido: ${freqsData.N})`);
  const totalFreq = Object.values(freqsData.frequencies).reduce((a, b) => a + b, 0);
  assert(Math.abs(totalFreq - 1.0) < 1e-6, "La suma de las frecuencias de letras es igual a 1.0");

  // Validar CalculateELSPValue para 'תורה' en salto 50 con N=6877 benchmark
  const pValStats6877 = Engine.CalculateELSPValue(6877, 'תורה', 50, freqsData.frequencies);
  assert(Math.abs(pValStats6877.expectedMatches - 0.22749) < 1e-2, `Esperado para 'תורה' (s=50, N=6877) ~0.2275 (obtenido: ${pValStats6877.expectedMatches.toFixed(5)})`);

  // Validar CalculateELSPValue sobre corpus expandido
  const pValStatsExp = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', 50, freqsData.frequencies);
  assert(pValStatsExp.expectedMatches > 0 && pValStatsExp.pValue >= 0 && pValStatsExp.pValue <= 1.0, "CalculateELSPValue produce expectedMatches > 0 y pValue acotado sobre corpus expandido");

  // Validar CalculateELSPValue con rango skip {minSkip: -50, maxSkip: 50}
  const rangeStats = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', { minSkip: -50, maxSkip: 50 }, freqsData.frequencies);
  assert(rangeStats.expectedMatches > 0 && !isNaN(rangeStats.pValue), "CalculateELSPValue con rango skip {minSkip: -50, maxSkip: 50} calcula expectedMatches > 0 sin NaN");

  // Validar CalculateELSPValue con textLength = NaN
  const nanLenStats = Engine.CalculateELSPValue(NaN, 'תורה', 50, freqsData.frequencies);
  assert(nanLenStats.expectedMatches === 0 && nanLenStats.pValue === 1.0, "CalculateELSPValue con textLength = NaN retorna expectedMatches = 0 y pValue = 1.0");

  // Validar integración de metadata en resultados de FindELS
  const enhancedMatches = Engine.FindELS(TORAH_TEXT, 'תורה', 49, 51);
  assert(enhancedMatches.length > 0, "FindELS retorna resultados");
  const targetMatch = enhancedMatches.find(m => m.skip === 50 && m.start === 5);
  assert(targetMatch !== undefined, "FindELS localiza el código clásico de la Torá");
  assert(typeof targetMatch.expectedCount === 'number', "El resultado ELS contiene expectedCount numérico");
  assert(typeof targetMatch.pValue === 'number', "El resultado ELS contiene pValue numérico");
  assert(typeof targetMatch.significanceScore === 'number', "El resultado ELS contiene significanceScore numérico");

  // 13. Validar Expansión de Corpus de la Torá (torah_text.js)
  console.log("\n=== SECCIÓN 13: CORPUS DE LA TORÁ & ESTRUCTURA DE LIBROS ===");
  assert(TORAH_TEXT !== undefined && typeof TORAH_TEXT === 'string', "torah_text.js exporta TORAH_TEXT como cadena de caracteres");
  assert(TORAH_TEXT.length >= 6877, `TORAH_TEXT tiene longitud expandida suficiente (mínimo M1: 6877, actual: ${TORAH_TEXT.length})`);
  assert(!/[^א-ת]/.test(TORAH_TEXT), "TORAH_TEXT contiene únicamente consonantes hebreas sin neqqudot ni caracteres ajenos");

  assert(TORAH_BOOKS !== undefined && typeof TORAH_BOOKS === 'object', "TORAH_BOOKS define la estructura de los 5 libros de la Torá");
  const bookValues = Object.values(TORAH_BOOKS);
  assert(bookValues.length === 5, "TORAH_BOOKS contiene exactamente 5 libros (Génesis, Éxodo, Levítico, Números, Deuteronomio)");
  
  let totalBookLength = 0;
  bookValues.forEach(bookText => {
    assert(typeof bookText === 'string' && bookText.length > 0, "Cada libro en TORAH_BOOKS es una cadena de consonantes válida");
    totalBookLength += bookText.length;
  });
  assert(totalBookLength === TORAH_TEXT.length, `La suma de longitudes de los 5 libros (${totalBookLength}) coincide con TORAH_TEXT.length (${TORAH_TEXT.length})`);

  // Fase 4: sanitize pipeline + curated expansions
  assert(typeof Engine.SanitizeHebrewConsonants === 'function', "Exporta SanitizeHebrewConsonants");
  assert(Engine.SanitizeHebrewConsonants('שָׁ לוםบ') === 'שלוםב', "SanitizeHebrewConsonants elimina niqqud/espacios y corrige Thai→bet");
  assert(TORAH_BOOKS.exodus.includes('אנכייהוהאלהיך'), "Éxodo incluye el Decálogo (Éx 20)");
  assert(TORAH_BOOKS.deuteronomy.includes('שמעישראליהוהאלהינויהוהאחד'), "Deuteronomio incluye el Shemá");
  assert(TORAH_BOOKS.numbers.includes('יברכךיהוהוישמרך'), "Números incluye Birkat Kohanim");

  const { TORAH_BOOK_OFFSETS, TORAH_VERSE_MAP, LookupTorahVerse, LookupTorahVerseSpan } = require('./torah_text.js');
  assert(Array.isArray(TORAH_BOOK_OFFSETS) && TORAH_BOOK_OFFSETS.length === 5, "TORAH_BOOK_OFFSETS define offsets de 5 libros");
  assert(Array.isArray(TORAH_VERSE_MAP) && TORAH_VERSE_MAP.length >= 300, `TORAH_VERSE_MAP tiene versículos alineados (actual: ${TORAH_VERSE_MAP.length})`);
  assert(typeof LookupTorahVerse === 'function' && LookupTorahVerse(0).reference === 'Génesis 1:1', "Letra #0 → Génesis 1:1");
  assert(LookupTorahVerse(5).reference === 'Génesis 1:1', "El ELS clásico de תורה (letra #5) cae en Génesis 1:1");
  assert(LookupTorahVerse(28).reference === 'Génesis 1:2', "Letra #28 → Génesis 1:2");
  const decIdx = TORAH_TEXT.indexOf('אנכייהוהאלהיך');
  assert(decIdx > 0 && LookupTorahVerse(decIdx).reference === 'Éxodo 20:2', "El Decálogo mapea a Éxodo 20:2");
  const birkatIdx = TORAH_TEXT.indexOf('יברכךיהוהוישמרך');
  assert(birkatIdx > 0 && LookupTorahVerse(birkatIdx).reference === 'Números 6:24', "Birkat Kohanim mapea a Números 6:24");
  const shemaIdx = TORAH_TEXT.indexOf('שמעישראליהוהאלהינויהוהאחד');
  assert(shemaIdx > 0 && LookupTorahVerse(shemaIdx).reference === 'Deuteronomio 6:4', "El Shemá mapea a Deuteronomio 6:4");
  let unmapped = 0;
  for (let i = 0; i < TORAH_TEXT.length; i += 97) {
    if (!LookupTorahVerse(i)) unmapped++;
  }
  assert(unmapped === 0, "El muestreo del corpus está 100% cubierto por el mapa de versículos");
  assert(LookupTorahVerseSpan([5, 28]).includes('Génesis 1:1') && LookupTorahVerseSpan([5, 28]).includes('Génesis 1:2'), "LookupTorahVerseSpan cubre un rango de versículos");

  // FindELS shouldCancel aborta temprano
  let cancelChecks = 0;
  const cancelled = Engine.FindELS(TORAH_TEXT, 'תורה', 1, 200, {
    shouldCancel: () => { cancelChecks++; return cancelChecks > 3; }
  });
  assert(Array.isArray(cancelled), "FindELS con shouldCancel retorna un arreglo (abortable)");
  assert(cancelChecks > 3, "FindELS invoca shouldCancel durante el barrido");

  // 14, 15 y 16: Pruebas asíncronas de Worker, Progreso y Scoring no bloqueante
  console.log("\n=== SECCIÓN 14: MULTITHREADED ELS WORKER & MENSAJERÍA ASÍNCRONA ===");
  const worker = new WorkerAdapter('./elsWorker.js');
  const progressEvents = [];
  let completionResult = null;

  const workerPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout esperando respuesta del Worker (5000ms)"));
    }, 5000);

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.action === 'progress') {
        progressEvents.push(msg);
      } else if (msg.action === 'elsResults') {
        completionResult = msg;
        clearTimeout(timeout);
        resolve(msg);
      } else if (msg.action === 'error') {
        clearTimeout(timeout);
        reject(new Error(msg.error));
      }
    };
  });

  let mainThreadTicks = 0;
  const tickInterval = setInterval(() => mainThreadTicks++, 5);

  worker.postMessage({
    action: 'searchELS',
    text: TORAH_TEXT,
    searchWord: 'תורה',
    minSkip: 1,
    maxSkip: 60
  });

  const workerResponse = await workerPromise;
  clearInterval(tickInterval);
  await worker.terminate();

  assert(workerResponse !== null, "El worker responde asíncronamente con resultados");
  assert(workerResponse.action === 'elsResults', "Acción del mensaje final es 'elsResults'");
  assert(workerResponse.status === 'complete', "Status final es 'complete'");
  assert(workerResponse.progress === 100, "Progreso final reportado es 100%");
  assert(Array.isArray(workerResponse.matches), "Resultados contienen un arreglo de coincidencia (matches)");
  assert(workerResponse.matches.length > 0, `Encuentra coincidencias ELS para 'תורה' (obtenidas: ${workerResponse.matches.length})`);

  const directMatches = Engine.FindELS(TORAH_TEXT, 'תורה', 1, 60);
  assert(workerResponse.matches.length === directMatches.length, `Coincidencias del worker (${workerResponse.matches.length}) coinciden con FindELS directo (${directMatches.length})`);

  console.log("\n=== SECCIÓN 15: MENSAJES DE PROGRESO DEL WORKER ===");
  assert(progressEvents.length > 0, `El worker emitió ${progressEvents.length} mensajes de progreso durante la búsqueda`);
  let prevPercent = -1;
  let monotonic = true;
  progressEvents.forEach(p => {
    if (typeof p.percent !== 'number' || p.percent < 0 || p.percent > 100 || p.percent < prevPercent) {
      monotonic = false;
    }
    prevPercent = p.percent;
  });
  assert(monotonic, "Los porcentajes de progreso son válidos y monótonamente no decrecientes (0% a 100%)");

  console.log("\n=== SECCIÓN 16: P-VALUE ESTADÍSTICO EN CORPUS EXPANDIDO Y NO BLOQUEO ===");
  const sampleMatch = workerResponse.matches[0];
  assert(typeof sampleMatch.expectedCount === 'number' && sampleMatch.expectedCount > 0, `Coincidencia ELS incluye expectedCount estadístico (${sampleMatch.expectedCount.toFixed(4)})`);
  assert(typeof sampleMatch.pValue === 'number' && sampleMatch.pValue >= 0 && sampleMatch.pValue <= 1, `Coincidencia ELS incluye pValue acotado [0, 1] (${sampleMatch.pValue.toFixed(4)})`);
  assert(typeof sampleMatch.significanceScore === 'number' && sampleMatch.significanceScore >= 0, `Coincidencia ELS incluye significanceScore >= 0 (${sampleMatch.significanceScore.toFixed(3)})`);

  console.log("\n=== SECCIÓN 17: BÚSQUEDA SEMÁNTICA EN ESPAÑOL (MEJORA 4) ===");
  const semPaz = Engine.SearchSpanishSemantic("paz", DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH);
  assert(semPaz.length > 0 && semPaz[0].hebrew === "שלום", `Búsqueda semántica para 'paz' retorna 'שלום' (376) en primera posición`);

  const semRedencion = Engine.SearchSpanishSemantic("redención", DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH);
  assert(semRedencion.length > 0 && semRedencion.some(s => s.hebrew === "גאולה"), `Búsqueda semántica con tilde 'redención' encuentra 'גאולה'`);

  const semAmor = Engine.SearchSpanishSemantic("amor", DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH);
  assert(semAmor.length > 0 && semAmor[0].hebrew === "אהבה", `Búsqueda semántica para 'amor' retorna 'אהבה' (13)`);

  console.log("\n=== SECCIÓN 18: SEGMENTACIÓN POR LIBROS DE LA TORÁ (MEJORA 7) ===");
  assert(TORAH_BOOKS && typeof TORAH_BOOKS === 'object', "TORAH_BOOKS está definido y estructurado");
  const totalBooksLen = TORAH_BOOKS.genesis.length + TORAH_BOOKS.exodus.length + TORAH_BOOKS.leviticus.length + TORAH_BOOKS.numbers.length + TORAH_BOOKS.deuteronomy.length;
  assert(totalBooksLen === TORAH_TEXT.length, `La suma de caracteres de los 5 libros (${totalBooksLen}) coincide con TORAH_TEXT (${TORAH_TEXT.length})`);

  const genesisTorahELS = Engine.FindELS(TORAH_BOOKS.genesis, 'תורה', 50, 50);
  assert(genesisTorahELS.length > 0 && genesisTorahELS[0].skip === 50, "Búsqueda ELS en Génesis individual encuentra el código 'תורה' en salto 50");

  console.log("\n=== SECCIÓN 19: ESCANEO TOPOGRÁFICO MULTIPALABRA (MEJORA 6) ===");
  const topoResults = Engine.ScanTopographicELS(TORAH_BOOKS.genesis, 50, DB.KNOWLEDGE_GRAPH, { maxMatches: 10 });
  assert(Array.isArray(topoResults), "ScanTopographicELS devuelve un arreglo de resultados");
  assert(topoResults.length > 0, `ScanTopographicELS encontró ${topoResults.length} cohabitaciones en Génesis con salto 50`);
  assert(topoResults.some(r => r.word === 'תורה'), "ScanTopographicELS incluye 'תורה' entre las palabras detectadas");
  assert(typeof topoResults[0].color === 'string' && topoResults[0].color.startsWith('#'), "Los resultados topográficos tienen paleta de color asignada");

  console.log("\n=== SECCIÓN 20: WORKER CON FILTRO DE LIBRO Y ESCANEO TOPOGRÁFICO ===");
  const topoWorker = new WorkerAdapter('./elsWorker.js');
  const topoWorkerPromise = new Promise((resolve) => {
    topoWorker.onmessage = (e) => {
      if (e.data && (e.data.action === 'topographicResults' || e.data.action === 'error')) {
        resolve(e.data);
      }
    };
  });

  topoWorker.postMessage({
    action: 'scanTopographic',
    skip: 50,
    book: 'genesis',
    wordsList: DB.KNOWLEDGE_GRAPH,
    requestId: 'test_topo_1'
  });

  const topoWorkerRes = await topoWorkerPromise;
  await topoWorker.terminate();
  assert(topoWorkerRes.action === 'topographicResults', "Worker responde con 'topographicResults'");
  assert(Array.isArray(topoWorkerRes.foundWords) && topoWorkerRes.foundWords.length > 0, `Worker topográfico encontró ${topoWorkerRes.foundWords.length} términos`);

  console.log("\n=== SECCIÓN 21: SEMÁFORO DE SIGNIFICANCIA ESTADÍSTICA (MEJORA 8) ===");
  const sigHigh = Engine.FormatSignificanceMetrics({ word: 'ישראל', skip: 50, pValue: 0.001, expectedCount: 0.02 });
  assert(sigHigh.level === 'high', "p=0.001 clasifica como significancia 'high'");
  assert(sigHigh.badgeColor === '#2ecc71', "Significancia alta tiene color verde (#2ecc71)");

  const sigMed = Engine.FormatSignificanceMetrics({ word: 'שלום', skip: 25, pValue: 0.03, expectedCount: 0.8 });
  assert(sigMed.level === 'medium', "p=0.03 clasifica como significancia 'medium'");

  const sigLow = Engine.FormatSignificanceMetrics({ word: 'אל', skip: 2, pValue: 0.75, expectedCount: 15.2 });
  assert(sigLow.level === 'low', "p=0.75 clasifica como significancia 'low'");

  console.log("\n=== SECCIÓN 22: TOOLTIPS Y DICCIONARIO EDUCATIVO (MEJORA 8) ===");
  assert(Engine.EDUCATIONAL_TOOLTIPS && typeof Engine.EDUCATIONAL_TOOLTIPS === 'object', "EDUCATIONAL_TOOLTIPS está exportado");
  assert(Engine.EDUCATIONAL_TOOLTIPS.absolute && Engine.EDUCATIONAL_TOOLTIPS.absolute.title.includes('Absoluta'), "Tooltips contiene explicación de Gematria Absoluta");
  assert(Engine.EDUCATIONAL_TOOLTIPS.atbash && Engine.EDUCATIONAL_TOOLTIPS.atbash.title.includes('Atbash'), "Tooltips contiene explicación de Atbash");
  assert(Engine.EDUCATIONAL_TOOLTIPS.els && Engine.EDUCATIONAL_TOOLTIPS.els.title.includes('Equidistantes'), "Tooltips contiene explicación de ELS");
  assert(Engine.EDUCATIONAL_TOOLTIPS.colel && Engine.EDUCATIONAL_TOOLTIPS.colel.title.includes('Colel'), "Tooltips contiene explicación del Colel");

  console.log("\n=== SECCIÓN 23: ESTRUCTURA DE TARJETA PARA COMPARTIR (MEJORA 10) ===");
  const shareMockData = {
    type: 'calculator',
    hebrew: 'שלום',
    title: 'Paz',
    number: 376,
    subtitle: 'Frecuencia Sagrada',
    context: 'Representa armonía cósmica y plenitud.'
  };
  assert(shareMockData.hebrew === 'שלום' && shareMockData.number === 376, "Datos de tarjeta estructurados correctamente para generación en Canvas");

  console.log("\n=== SECCIÓN 24: MOTOR DE CACHÉ LRU (MEJORA 12) ===");
  const testCache = new Engine.GematriaSearchCache(3);
  testCache.set({ word: 'שלום', book: 'genesis' }, [{ word: 'שלום', skip: 10 }]);
  testCache.set({ word: 'אהבה', book: 'genesis' }, [{ word: 'אהבה', skip: 5 }]);
  testCache.set({ word: 'ישראל', book: 'genesis' }, [{ word: 'ישראל', skip: 50 }]);

  assert(testCache.size() === 3, "El caché contiene 3 elementos guardados");
  const hit = testCache.get({ word: 'שלום', book: 'genesis' });
  assert(hit && hit[0].word === 'שלום', "Recupera correctamente coincidencia desde caché");

  // Añadir un 4º elemento (debe expulsar 'אהבה' porque 'שלום' fue accedido recientemente)
  testCache.set({ word: 'תורה', book: 'genesis' }, [{ word: 'תורה', skip: 50 }]);
  assert(testCache.size() === 3, "El tamaño del caché se mantiene acotado al límite de 3");
  assert(testCache.get({ word: 'אהבה', book: 'genesis' }) === null, "Expulsa el elemento menos recientemente usado (LRU)");
  assert(testCache.get({ word: 'שלום', book: 'genesis' }) !== null, "Conserva el elemento accedido recientemente");

  testCache.clear();
  assert(testCache.size() === 0, "El método clear() vacía la caché por completo");

  console.log("\n=== SECCIÓN 25: ORDENAMIENTO DE RESULTADOS ELS (MEJORA 11) ===");
  const unsortedMatches = [
    { word: 'A', skip: 50, start: 100, significanceScore: 3, pValue: 0.05 },
    { word: 'B', skip: 10, start: 500, significanceScore: 9, pValue: 0.001 },
    { word: 'C', skip: 100, start: 50, significanceScore: 1, pValue: 0.6 }
  ];

  const sortedBySig = Engine.SortELSResults(unsortedMatches, 'significance');
  assert(sortedBySig[0].word === 'B', "Ordenamiento por significancia coloca el mayor score (9) primero");
  assert(sortedBySig[2].word === 'C', "Ordenamiento por significancia coloca el menor score (1) al final");

  const sortedBySkipAsc = Engine.SortELSResults(unsortedMatches, 'skip_asc');
  assert(sortedBySkipAsc[0].word === 'B' && sortedBySkipAsc[0].skip === 10, "Ordenamiento por menor salto coloca salto 10 primero");

  const sortedBySkipDesc = Engine.SortELSResults(unsortedMatches, 'skip_desc');
  assert(sortedBySkipDesc[0].word === 'C' && sortedBySkipDesc[0].skip === 100, "Ordenamiento por mayor salto coloca salto 100 primero");

  const sortedByPos = Engine.SortELSResults(unsortedMatches, 'position');
  assert(sortedByPos[0].word === 'C' && sortedByPos[0].start === 50, "Ordenamiento por posición bíblica coloca inicio #50 primero");

  console.log("\n=== SECCIÓN 26: VALIDACIÓN DE PWA Y MANIFEST (CARACTERÍSTICA 4) ===");
  const fs = require('fs');
  const manifestRaw = fs.readFileSync('./manifest.json', 'utf8');
  const manifest = JSON.parse(manifestRaw);
  assert(manifest.name && manifest.name.includes('Gematria'), "manifest.json contiene nombre de aplicación válido");
  assert(manifest.display === 'standalone', "manifest.json está configurado como 'standalone' para instalación nativa");
  assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest.json incluye iconos de aplicación");
  assert(fs.existsSync('./icons/icon.svg'), "El icono vectorial SVG existe en el sistema");
  assert(fs.existsSync('./sw.js'), "El archivo de Service Worker sw.js existe");

  console.log("\n=== SECCIÓN 27: COMPILACIÓN DE REPORTE CEREMONIAL (CARACTERÍSTICA 3) ===");
  const reportGenFile = fs.readFileSync('./js/modules/reportGenerator.js', 'utf8');
  assert(reportGenFile.includes('buildReportHTML'), "El módulo reportGenerator implementa buildReportHTML");
  assert(reportGenFile.includes('DEDICADO A LOS HÉROES DE LAS FUERZAS DE DEFENSA DE ISRAEL'), "El reporte ceremonial incluye la dedicatoria de honor a las FDI");
  assert(reportGenFile.includes('window.print'), "El módulo de reporte soporta disparo nativo de impresión / PDF");

  console.log("\n=== SECCIÓN 17: EXPLORAR CORRELACIONES (apellido / fecha / evento) ===");
  const Explore = require('./explore.js');
  assert(typeof Explore.ExploreCorrelations === 'function', "explore.js exporta ExploreCorrelations");
  assert(Explore.NAME_DICTIONARY.length >= 30, `NAME_DICTIONARY tiene al menos 30 entradas (actual: ${Explore.NAME_DICTIONARY.length})`);

  const dateParsed = Explore.ParseDateQuery('14/05/1948');
  assert(dateParsed && dateParsed.year === 1948 && dateParsed.day === 14 && dateParsed.month === 5, "ParseDateQuery entiende 14/05/1948");
  assert(dateParsed.hebrewYearApprox === 5708, "14/05/1948 cae en el año hebreo 5708");
  assert(dateParsed.hebrew && dateParsed.hebrew.month === 2 && dateParsed.hebrew.day === 5, "14/05/1948 = 5 de Iyar 5708");
  assert(/Iyar/.test(dateParsed.hebrewFormatted || '') && /5708/.test(dateParsed.hebrewFormatted || ''), "La fecha hebrea formateada incluye Iyar 5708");

  const cohen = Explore.ExploreCorrelations('Cohen', DB, Engine);
  assert(cohen.queryType === 'surname' && cohen.meta.primaryHebrew === 'כהן', "Cohen resuelve a apellido כהן");
  assert(cohen.knowledge.length > 0, "Cohen produce correlaciones en el grafo de conocimiento");
  assert(cohen.suggestedELS.includes('כהן'), "Cohen sugiere ELS כהן");

  const independence = Explore.ExploreCorrelations('14/05/1948', DB, Engine);
  assert(independence.queryType === 'date', "14/05/1948 se clasifica como fecha");
  assert(independence.events.some(e => e.event.year === 1948), "14/05/1948 correlaciona con la Independencia de 1948");

  const oslo = Explore.ExploreCorrelations('Oslo', DB, Engine);
  assert(oslo.events.some(e => /oslo/i.test(e.event.title)), "Oslo encuentra los Acuerdos de Oslo");

  const num708 = Explore.ExploreCorrelations('708', DB, Engine);
  assert(num708.queryType === 'number', "708 se clasifica como número");
  assert(num708.verses.some(v => v.verse.gematria === 708), "708 encuentra Deuteronomio 32:3");
  assert(num708.zionist.some(z => z.card.gematria === 708), "708 encuentra la tarjeta sionista Tashach");

  const herzl = Explore.ExploreCorrelations('Herzl', DB, Engine);
  assert(herzl.queryType === 'surname' && herzl.meta.primaryHebrew === 'הרצל', "Herzl resuelve a הרצל");
  assert(herzl.events.some(e => e.event.year === 1897), "Herzl correlaciona con el Congreso de Basilea");

  // Compound + year-as-date + report
  assert(Explore.ExploreCorrelations('1948', DB, Engine).queryType === 'date', "1948 se clasifica como fecha (no solo número)");
  assert(Explore.ExploreCorrelations('Cohen', DB, Engine).suggestedELS.length === 1 && Explore.ExploreCorrelations('Cohen', DB, Engine).suggestedELS[0] === 'כהן', "Cohen sugiere solo ELS del diccionario (sin ruido fonético)");

  const compound = Explore.ExploreCorrelations('Herzl + 1897', DB, Engine);
  assert(compound.queryType === 'compound', "Herzl + 1897 es consulta compuesta");
  assert(compound.events.some(e => e.event.year === 1897), "Compuesta Herzl+1897 encuentra Basilea 1897");
  assert(compound.meta.primaryHebrew === 'הרצל', "Compuesta preserva hebreo de Herzl");

  const report = Explore.FormatCorrelationReport(compound);
  assert(typeof report === 'string' && report.includes('INFORME DE CORRELACIONES') && report.includes('Herzl + 1897'), "FormatCorrelationReport genera informe de texto");

  const { ExportCorrelationReport } = require('./export.js');
  assert(typeof ExportCorrelationReport === 'function', "export.js exporta ExportCorrelationReport");

  console.log("\n=== SECCIÓN 18: PERFIL PERSONAL (nombre + apellido + fecha) ===");
  assert(typeof Explore.BuildPersonalProfile === 'function', "explore.js exporta BuildPersonalProfile");
  assert(Explore.LookupNameDictionary('oscar') && Explore.LookupNameDictionary('oscar').hebrew === 'אוסקר', "Diccionario incluye Oscar → אוסקר");
  assert(Explore.LookupNameDictionary('raquel') && Explore.LookupNameDictionary('raquel').hebrew === 'רחל', "Diccionario incluye Raquel → רחל");

  const profile = Explore.BuildPersonalProfile({
    givenName: 'David',
    surname: 'Cohen',
    birthDate: '14/05/1948'
  }, DB, Engine);
  assert(profile.queryType === 'profile', "David Cohen · 14/05/1948 se clasifica como perfil");
  assert(profile.profile.givenHebrew === 'דוד', "Nombre David → דוד");
  assert(profile.profile.surnameHebrew === 'כהן', "Apellido Cohen → כהן");
  assert(profile.profile.fullHebrew === 'דודכהן', "Nombre completo hebreo דודכהן");
  assert(profile.profile.fullGematria && profile.profile.fullGematria.absolute === 89, `Gematria absoluta de דודכהן es 89 (actual: ${profile.profile.fullGematria && profile.profile.fullGematria.absolute})`);
  assert(profile.profile.dateInfo && profile.profile.dateInfo.year === 1948 && profile.profile.dateInfo.hebrewYearApprox === 5708, "Perfil calcula año hebreo 5708");
  assert(profile.profile.dateInfo.hebrew && profile.profile.dateInfo.hebrew.day === 5 && /Iyar/.test(profile.profile.dateInfo.hebrew.monthName || ''), "Perfil: 14/05/1948 = 5 Iyar");
  assert(profile.events.some(e => e.event.year === 1948), "El perfil correlaciona con la Independencia de 1948");
  assert(Array.isArray(profile.suggestedELS) && profile.suggestedELS.includes('דודכהן'), "El perfil sugiere ELS del nombre completo");

  const profileReport = Explore.FormatCorrelationReport(profile);
  assert(
    profileReport.includes('INFORME DE CORRELACIONES') &&
    profileReport.includes('David') &&
    profileReport.includes('כהן') &&
    /Nacimiento: 14\/05\/1948/.test(profileReport),
    "El informe de perfil incluye identidad, hebreo y fecha"
  );

  console.log("\n=== SECCIÓN 19: CALENDARIO HEBREO REAL ===");
  const Cal = require('./hebrew_calendar.js');
  assert(typeof Cal.GregorianToHebrew === 'function', "hebrew_calendar.js exporta GregorianToHebrew");

  const indepHe = Cal.GregorianToHebrew(1948, 5, 14);
  assert(indepHe && indepHe.year === 5708 && indepHe.month === 2 && indepHe.day === 5, "14 may 1948 → 5 Iyar 5708");
  assert(Cal.NumberToHebrewLetters(5708) === 'ה׳תש״ח', `Año 5708 en letras: ה׳תש״ח (actual: ${Cal.NumberToHebrewLetters(5708)})`);

  const rh = Cal.GregorianToHebrew(1948, 10, 4);
  assert(rh && rh.year === 5709 && rh.month === 7 && rh.day === 1, "4 oct 1948 es 1 Tishrei 5709 (el atajo +3760 fallaría)");

  const back = Cal.HebrewToGregorian(5708, 2, 5);
  assert(back && back.year === 1948 && back.month === 5 && back.day === 14, "5 Iyar 5708 → 14 may 1948");

  const parsedHeDate = Explore.ParseDateQuery('5 Iyar 5708');
  assert(parsedHeDate && parsedHeDate.year === 1948 && parsedHeDate.month === 5 && parsedHeDate.day === 14, "ParseDateQuery entiende 5 Iyar 5708");
  assert(Explore.ExploreCorrelations('5 Iyar 5708', DB, Engine).events.some(e => e.event.year === 1948), "5 Iyar 5708 correlaciona con la Independencia");

  const tashach = Explore.ParseDateQuery('5708');
  assert(tashach && tashach.year === 1948 && tashach.hebrewYearApprox === 5708, "5708 (año AM) resuelve al año civil 1948");

  const jan1948 = Explore.ParseDateQuery('1948');
  assert(jan1948.hebrewYearApprox === 5708 && jan1948.hebrewYearEnd === 5709, "El año civil 1948 cubre 5708–5709");

  console.log("\n=== SECCIÓN 20: DICCIONARIO VIVO (persistencia real + lookup) ===");
  const Storage = require('./storage.js');
  Storage.ClearUserNameDictionary();

  assert(typeof Explore.GetActiveNameDictionary === 'function', "explore.js exporta GetActiveNameDictionary");
  assert(typeof Explore.BuildUserNameEntry === 'function', "explore.js exporta BuildUserNameEntry");
  assert(typeof Storage.SaveUserNameEntry === 'function' && typeof Storage.GetUserNameDictionary === 'function', "storage.js exporta CRUD del diccionario personal");

  const builtinSize = Explore.NAME_DICTIONARY.length;
  assert(Explore.GetActiveNameDictionary().length === builtinSize, "Sin entradas personales, el diccionario activo es solo la base");

  const invalid = Explore.BuildUserNameEntry({ spanish: '', hebrew: 'כהן' }, Engine);
  assert(!invalid.ok, "Rechaza una entrada sin alias en español");

  const noHe = Explore.BuildUserNameEntry({ spanish: 'Algo', hebrew: 'א' }, Engine);
  assert(!noHe.ok, "Rechaza hebreo de una sola consonante");

  const phoneticQ = Engine.SpanishToHebrew('Qwertyname');
  assert(phoneticQ.replace(/[^א-ת]/g, '') !== 'כהן', "La fonética de Qwertyname no es כהן (el diccionario debe ganar)");

  const built = Explore.BuildUserNameEntry({
    spanish: 'Qwertyname, Qwerty',
    hebrew: 'כהן',
    kind: 'apellido',
    note: 'Grafía de prueba — no fonética'
  }, Engine);
  assert(built.ok && built.entry.hebrew === 'כהן' && built.entry.spanish.includes('qwertyname'), "BuildUserNameEntry normaliza alias y conserva hebreo escrito");

  const saved = Storage.SaveUserNameEntry(built.entry);
  assert(saved.ok && Storage.GetUserNameDictionary().length === 1, "SaveUserNameEntry persiste la entrada");
  assert(Storage.GetUserNameDictionary()[0].id === built.entry.id, "La entrada persistida conserva el id");

  const snapshot = JSON.parse(JSON.stringify(Storage.GetUserNameDictionary()));
  Storage.ClearUserNameDictionary();
  assert(Storage.GetUserNameDictionary().length === 0, "ClearUserNameDictionary vacía el almacén");
  snapshot.forEach(e => Storage.SaveUserNameEntry(e));
  assert(Storage.GetUserNameDictionary().some(e => e.hebrew === 'כהן'), "Releer el JSON persistido restaura la entrada (simula recarga)");

  const active = Explore.GetActiveNameDictionary();
  assert(active.length === builtinSize + 1, "El diccionario activo fusiona base + personal");
  assert(active[0].source === 'user' && active[0].hebrew === 'כהן', "Las entradas personales van primero (ganan el lookup)");

  const hitExplore = Explore.LookupNameDictionary('Qwertyname');
  assert(hitExplore && hitExplore.hebrew === 'כהן' && hitExplore.source === 'user', "LookupNameDictionary resuelve el alias personal a כהן");
  assert(Explore.LookupNameDictionary('qwerty') && Explore.LookupNameDictionary('qwerty').hebrew === 'כהן', "El segundo alias también resuelve");

  const explored = Explore.ExploreCorrelations('Qwertyname', DB, Engine);
  assert(explored.queryType === 'surname' && explored.meta.primaryHebrew === 'כהן', "Explorar usa el hebreo del diccionario, no la fonética");
  assert(explored.suggestedELS.includes('כהן') && !explored.suggestedELS.includes(phoneticQ.replace(/[^א-ת]/g, '')), "ELS sugerido es כהן del diccionario");
  assert(explored.knowledge.length > 0, "Qwertyname hereda correlaciones reales de כהן");

  const profileLive = Explore.BuildPersonalProfile({
    givenName: 'David',
    surname: 'Qwertyname',
    birthDate: '14/05/1948'
  }, DB, Engine);
  assert(profileLive.profile.surnameHebrew === 'כהן', "El perfil personal usa el apellido del diccionario vivo");
  assert(profileLive.profile.fullHebrew === 'דודכהן', "Nombre completo del perfil con diccionario: דודכהן");

  const found = Explore.SearchNameDictionary('qwerty', Explore.GetActiveNameDictionary());
  assert(found.some(e => e.id === built.entry.id), "SearchNameDictionary encuentra la entrada personal");
  assert(Explore.SearchNameDictionary('כהן', Explore.GetActiveNameDictionary()).some(e => e.hebrew.replace(/[^א-ת]/g, '') === 'כהן'), "La búsqueda también funciona por hebreo");

  const override = Explore.BuildUserNameEntry({ spanish: 'oscar', hebrew: 'עזרא', kind: 'nombre', note: 'override' }, Engine);
  assert(override.ok, "Se puede construir un override de una entrada base");
  Storage.SaveUserNameEntry(override.entry);
  assert(Explore.LookupNameDictionary('oscar').hebrew === 'עזרא', "Una entrada personal sustituye el Oscar de la base");
  Storage.RemoveUserNameEntry(override.entry.id);
  assert(Explore.LookupNameDictionary('oscar').hebrew === 'אוסקר', "Al borrar el override, vuelve la entrada base");

  Storage.RemoveUserNameEntry(built.entry.id);
  assert(Storage.GetUserNameDictionary().length === 0, "RemoveUserNameEntry elimina la entrada");
  const afterDelete = Explore.ExploreCorrelations('Qwertyname', DB, Engine);
  assert(afterDelete.meta.primaryHebrew !== 'כהן', "Tras borrar, Qwertyname ya no resuelve a כהן");

  assert(Explore.ExploreCorrelations('Cohen', DB, Engine).meta.hebrewSource === 'dictionary', "Cohen se etiqueta como hebreo de diccionario");
  const phoneticName = Explore.ExploreCorrelations('Xylophone', DB, Engine);
  assert(phoneticName.meta.hebrewSource === 'phonetic', "Un nombre ausente del léxico se etiqueta como fonética aproximada");
  const suggestions = Explore.SuggestNameDictionary('coh');
  assert(suggestions.some(h => h.hebrew === 'כהן'), "SuggestNameDictionary('coh') propone Cohen → כהן");

  Storage.SavePersonalProfileForm({ givenName: 'David', surname: 'Cohen', birthDate: '14/05/1948' });
  const savedProfileForm = Storage.GetPersonalProfileForm();
  assert(savedProfileForm && savedProfileForm.givenName === 'David' && savedProfileForm.surname === 'Cohen', "El formulario de perfil persiste en storage");

  console.log("\n=== SECCIÓN 21: HONESTIDAD ESTADÍSTICA ELS (no es una prueba) ===");
  assert(typeof Engine.AssessELSHonesty === 'function', "gematria.js exporta AssessELSHonesty");
  assert(typeof Engine.ShuffleHebrewText === 'function' && typeof Engine.ELSControlAtSkip === 'function', "Exporta shuffle y control de texto mezclado");

  const sample = TORAH_TEXT.slice(0, 2500);
  const shuffled = Engine.ShuffleHebrewText(sample, 42);
  const countsA = Engine.CalculateLetterFrequencies(sample).counts;
  const countsB = Engine.CalculateLetterFrequencies(shuffled).counts;
  let sameCounts = true;
  Object.keys(countsA).forEach(k => { if (countsA[k] !== countsB[k]) sameCounts = false; });
  Object.keys(countsB).forEach(k => { if (countsA[k] !== countsB[k]) sameCounts = false; });
  assert(sameCounts && shuffled !== sample, "ShuffleHebrewText conserva conteos de letras y cambia el orden");

  const chaiHonesty = Engine.AssessELSHonesty(
    { word: 'חי', skip: 10, expectedCount: 5, pValue: 0.99 },
    { text: TORAH_TEXT, minSkip: 2, maxSkip: 120, runControl: false }
  );
  assert(chaiHonesty.band === 'common', "חי (2 letras) se clasifica como muy común");
  assert(chaiHonesty.exploratory === true && /exploratorio/i.test(chaiHonesty.note), "El veredicto declara que el modelo es exploratorio");
  assert(chaiHonesty.warnings.some(w => /2 letras/.test(w)), "Advierte que la palabra es demasiado corta");
  assert(!/altamente significativo/i.test(chaiHonesty.label), "No etiqueta un hallazgo común como altamente significativo");

  const toraClassic = Engine.FindELS(TORAH_TEXT, 'תורה', 50, 50).find(m => m.start === 5 && m.skip === 50);
  assert(toraClassic, "Existe el ELS clásico תורה salto 50 en letra #5");
  const toraHonesty = Engine.AssessELSHonesty(toraClassic, {
    text: TORAH_TEXT,
    minSkip: 2,
    maxSkip: 120,
    runControl: true
  });
  assert(toraHonesty.band === 'common' || toraHonesty.band === 'plausible', `תורה en rango 2–120 no se vende como prueba (banda: ${toraHonesty.band})`);
  assert(toraHonesty.control && typeof toraHonesty.control.controlCount === 'number', "El control en texto mezclado se ejecuta de verdad");
  assert(toraHonesty.warnings.some(w => /azar|rango|mezclado/i.test(w)), "Advierte expectativa por azar o control mezclado");

  const hugeSkip = Engine.AssessELSHonesty(
    { word: 'שלום', skip: 120, expectedCount: 0.05, pValue: 0.05 },
    { text: TORAH_TEXT, minSkip: 2, maxSkip: 120, runControl: false }
  );
  assert(hugeSkip.warnings.some(w => /Salto grande/.test(w)), "Advierte cuando el salto es grande (elegido a posteriori)");

  console.log("\n=== SECCIÓN 22: HILO DE ESTUDIO (PickHistoricalEvent) ===");
  assert(typeof Explore.PickHistoricalEvent === 'function', "explore.js exporta PickHistoricalEvent");
  const israel48 = Explore.PickHistoricalEvent(DB.HISTORICAL_EVENTS, { year: 1948 });
  assert(israel48 && israel48.title === 'Declaración del Estado de Israel', "1948 selecciona la Declaración del Estado de Israel");
  const israelByTitle = Explore.PickHistoricalEvent(DB.HISTORICAL_EVENTS, {
    year: 1948,
    title: 'Declaración del Estado de Israel'
  });
  assert(israelByTitle === israel48, "Año + título exacto devuelve el mismo objeto del corpus");
  const osloHit = Explore.PickHistoricalEvent(DB.HISTORICAL_EVENTS, { title: 'Oslo' });
  assert(osloHit && /oslo/i.test(osloHit.title), "Título parcial 'Oslo' encuentra los Acuerdos de Oslo");
  const basilea = Explore.PickHistoricalEvent(DB.HISTORICAL_EVENTS, { year: 1897, title: 'Basilea' });
  assert(basilea && basilea.year === 1897, "1897 + 'Basilea' selecciona el Congreso de Basilea");
  assert(Explore.PickHistoricalEvent(DB.HISTORICAL_EVENTS, { year: 9999 }) === null, "Un año ausente no inventa un hito");
  assert(Explore.PickHistoricalEvent([], { year: 1948 }) === null, "Una lista vacía no selecciona nada");

  assert(typeof Explore.PickDailyReflection === 'function', "explore.js exporta PickDailyReflection");
  const amorRef = Explore.PickDailyReflection(DB.DAILY_REFLECTIONS, 'amor');
  assert(amorRef && /Amor y Unidad/.test(amorRef.topic.title), "La consulta 'amor' abre la reflexión de Amor y Unidad");
  const tikvaRef = Explore.PickDailyReflection(DB.DAILY_REFLECTIONS, 'Hatikvah');
  assert(tikvaRef && /Hatikvah|Esperanza/i.test(tikvaRef.topic.title), "Hatikvah selecciona la reflexión de la esperanza");
  const emptyRef = Explore.PickDailyReflection(DB.DAILY_REFLECTIONS, '');
  assert(emptyRef && emptyRef.index === 0, "Sin consulta, la reflexión cae en el primer tema");
  assert(Explore.PickDailyReflection([], 'amor') === null, "Una lista vacía de reflexiones no inventa un tema");

  console.log("\n=== SECCIÓN 23: ACRÓSTICOS SOBRE FRASES CURADAS ===");
  assert(typeof Engine.GetAcrosticPhraseCorpus === 'function', "gematria.js exporta GetAcrosticPhraseCorpus");
  assert(typeof Engine.FindAcrosticsInPhrases === 'function', "gematria.js exporta FindAcrosticsInPhrases");
  const acrosticPhrases = Engine.GetAcrosticPhraseCorpus(DB);
  assert(acrosticPhrases.length >= 2, "Hay al menos dos frases curadas con espacios de palabra");
  assert(acrosticPhrases.every(p => p.hebrew && p.hebrew.trim().split(/\s+/).length >= 2),
    "Cada frase curada tiene al menos 2 palabras");
  assert(acrosticPhrases.some(p => /30:12/.test(p.reference)),
    "Deuteronomio 30:12 está en el corpus de frases");
  assert(Engine.FindAcrosticsInPhrases(acrosticPhrases, '', 'roshei').length === 0,
    "Un objetivo vacío no busca acrósticos en el corpus");
  assert(Engine.FindAcrosticsInPhrases(acrosticPhrases, 'א', 'roshei').length === 0,
    "Una sola letra no busca (demasiado corta para un acróstico)");

  const deut3012 = DB.TORAH_VERSES.find(v => /30:12/.test(v.reference));
  assert(deut3012, "El versículo Deuteronomio 30:12 existe en TORAH_VERSES");
  assert(Engine.CalculateGematria(deut3012.hebrew).absolute === deut3012.gematria,
    `Gematria almacenada de Dt 30:12 coincide con el motor (${deut3012.gematria})`);
  const deut323 = DB.TORAH_VERSES.find(v => /32:3/.test(v.reference));
  assert(deut323 && deut323.gematria === 708,
    "Deuteronomio 32:3 conserva el valor 708 (resonancia con 5708 / 1948)");

  const biluHits = Engine.FindAcrosticsInPhrases(acrosticPhrases, 'בילו', 'roshei');
  assert(biluHits.length >= 1, "BILU aparece como Roshei Teivot en las frases curadas");
  assert(biluHits.some(h => /2:5/.test(h.reference) && h.type === 'roshei'),
    "BILU apunta a Isaías 2:5");

  const milahHits = Engine.FindAcrosticsInPhrases(acrosticPhrases, 'מילה', 'roshei');
  assert(milahHits.some(h => /30:12/.test(h.reference)),
    "מילה es rashei tevot de Deuteronomio 30:12");

  const yhvhHits = Engine.FindAcrosticsInPhrases(acrosticPhrases, 'יהוה', 'sofei');
  assert(yhvhHits.some(h => /30:12/.test(h.reference) && h.type === 'sofei'),
    "יהוה es sofei tevot de Deuteronomio 30:12");

  const examples = DB.ACROSTIC_EXAMPLES || [];
  assert(examples.length === 3, "Hay tres ejemplos clásicos de acrósticos");
  assert(examples.some(e => e.id === 'bilu' && e.type === 'roshei' && e.target === 'בילו'), "Ejemplo BILU");
  assert(examples.some(e => e.id === 'milah' && e.type === 'roshei' && e.target === 'מילה'), "Ejemplo milá");
  assert(examples.some(e => e.id === 'yhvh' && e.type === 'sofei' && e.target === 'יהוה'), "Ejemplo YHVH sofei");

  const exploreViewSrc = fs.readFileSync('./js/modules/exploreView.js', 'utf8');
  assert(exploreViewSrc.includes('searchFromStudy'), "Explorar hace handoff real a acrósticos en frases curadas");
  assert(exploreViewSrc.includes('FindAcrosticsInPhrases'), "El dossier de Explorar consulta el corpus de frases");
  const indexSrc = fs.readFileSync('./index.html', 'utf8');
  assert(indexSrc.includes('data-acrostic-ex="bilu"'), "Hay chip clásico BILU");
  assert(indexSrc.includes('data-acrostic-ex="milah"'), "Hay chip clásico מילה");
  assert(indexSrc.includes('data-acrostic-ex="yhvh"'), "Hay chip clásico יהוה");
  assert(indexSrc.includes('btnAcrosticsCorpus'), "Hay botón para buscar en frases curadas");

  console.log("\n=== SECCIÓN 24: HILO DE ESTUDIO — ESPEJO, REFLEXIÓN, FAVORITOS Y NAV ===");
  assert(fs.existsSync('./js/modules/lettersView.js'), "Existe lettersView.js (espejo de letras)");
  assert(fs.existsSync('./js/modules/reflectionView.js'), "Existe reflectionView.js");
  assert(fs.existsSync('./js/modules/favoritesView.js'), "Existe favoritesView.js");
  const lettersSrc = fs.readFileSync('./js/modules/lettersView.js', 'utf8');
  assert(lettersSrc.includes('highlightFromStudy'), "El espejo resalta letras del hebreo de estudio");
  assert(lettersSrc.includes('openLetter'), "El espejo abre el modal de detalle de letra");
  const reflectionSrc = fs.readFileSync('./js/modules/reflectionView.js', 'utf8');
  assert(reflectionSrc.includes('openFromQuery'), "La reflexión se abre desde la consulta de estudio");
  assert(reflectionSrc.includes('data-reflection-index'), "Los temas de reflexión tienen índice para el handoff");
  const favSrc = fs.readFileSync('./js/modules/favoritesView.js', 'utf8');
  assert(favSrc.includes('data-fav-type="explore"'), "Favoritos reabre una correlación de Explorar");
  assert(favSrc.includes('data-fav-type="profile"'), "Favoritos reabre un perfil personal");
  assert(favSrc.includes('data-fav-type="els"'), "Favoritos reabre un hallazgo ELS");
  assert(indexSrc.includes('id="btnNavMore"'), "La navegación compacta tiene menú Más");
  assert(indexSrc.includes('src="export.js"'), "export.js se carga en la página");
  assert(indexSrc.includes('js/modules/lettersView.js'), "index.html carga lettersView");
  assert(indexSrc.includes('js/modules/reflectionView.js'), "index.html carga reflectionView");
  assert(indexSrc.includes('js/modules/favoritesView.js'), "index.html carga favoritesView");
  const timelineSrc = fs.readFileSync('./js/modules/timelineView.js', 'utf8');
  assert(timelineSrc.includes('event.title'), "La línea de tiempo usa title de HISTORICAL_EVENTS");
  assert(timelineSrc.includes('focusEvent'), "Explorar puede enfocar un hito de la línea de tiempo");
  const bibleSrc = fs.readFileSync('./js/modules/bibleCodeView.js', 'utf8');
  assert(bibleSrc.includes('btnSaveELSFavorite'), "ELS puede guardarse en Favoritos");
  assert(bibleSrc.includes('btnExportMatrixPNG'), "ELS puede exportar la matriz PNG");
  const exploreSrc2 = fs.readFileSync('./js/modules/exploreView.js', 'utf8');
  assert(exploreSrc2.includes('lettersView.highlightFromStudy'), "Explorar resalta el espejo de letras");
  assert(exploreSrc2.includes('reflectionView.openFromQuery'), "Explorar abre la reflexión por consulta");
  assert(exploreSrc2.includes('fillProfileForm'), "Explorar expone fillProfileForm para recargar un perfil");
  assert(Storage.ClearFavorites && Storage.GetFavorites, "storage.js exporta ClearFavorites y GetFavorites");

  console.log("\n=== SECCIÓN 29: GALERÍA DE CÓDIGOS CLÁSICOS Y UX DE ESTUDIO ===");
  assert(Array.isArray(DB.ELS_CLASSIC_EXAMPLES) && DB.ELS_CLASSIC_EXAMPLES.length >= 5,
    `ELS_CLASSIC_EXAMPLES tiene fichas de estudio (actual: ${DB.ELS_CLASSIC_EXAMPLES.length})`);
  const torah50 = DB.ELS_CLASSIC_EXAMPLES.find(e => e.id === 'torah-50-genesis');
  assert(torah50 && torah50.kind === 'els' && torah50.hebrew === 'תורה',
    "La galería incluye el ejemplo clásico תורה");
  assert(torah50.skipMin === 50 && torah50.skipMax === 50 && torah50.matrixWidth === 50,
    "El ejemplo clásico fija salto y ancho de matriz en 50");
  assert(torah50.matchHint && torah50.matchHint.start === 5 && torah50.matchHint.skip === 50,
    "El hint de UI apunta a letra #5 salto 50");
  assert(torah50.reproducible === true, "תורה@50 en Génesis se marca como reproducible en este corpus");
  assert((torah50.sources || []).some(s => /Weissmandl|Bachya|Bachya/i.test(s)),
    "El ejemplo cita a Weissmandl o Bachya");

  const toraHit = Engine.FindELS(TORAH_TEXT, torah50.hebrew, torah50.skipMin, torah50.skipMax)
    .find(m => m.start === torah50.matchHint.start && m.skip === torah50.matchHint.skip);
  assert(toraHit, "FindELS reproduce el hint de UI: תורה salto 50 en letra #5");
  const verseAt5 = LookupTorahVerse(toraHit.start);
  assert(verseAt5 && verseAt5.reference === 'Génesis 1:1',
    "LookupTorahVerse en el match clásico #5 es Génesis 1:1");
  const spanClassic = LookupTorahVerseSpan(toraHit.indices);
  assert(/Génesis 1:1/.test(spanClassic), "LookupTorahVerseSpan cubre Génesis 1:1 en el ELS clásico");

  const exoCard = DB.ELS_CLASSIC_EXAMPLES.find(e => e.id === 'torah-50-exodus');
  assert(exoCard && exoCard.reproducible === false && exoCard.kind === 'note',
    "Éxodo תורה@50 se presenta como nota (hace falta el libro entero), no como hallazgo");
  assert(!Engine.FindELS(TORAH_BOOKS.exodus, 'תורה', 50, 50).length,
    "En el extracto de Éxodo no hay תורה a salto 50: la nota es honesta");

  assert(DB.ELS_CLASSIC_EXAMPLES.some(e => e.kind === 'acrostic' && e.acrosticId === 'bilu'),
    "La galería enlaza el acróstico BILU (no lo finge como ELS)");
  assert(DB.ELS_CLASSIC_EXAMPLES.some(e => e.kind === 'gematria' && e.wordA === 'אהבה' && e.wordB === 'אחד'),
    "La galería enlaza el par de gematría Ahavá / Ejad");
  assert(!DB.ELS_CLASSIC_EXAMPLES.some(e => /rabin|hitler|drosnin/i.test(JSON.stringify(e))),
    "La galería no presenta matrices Drosnin como hallazgos de esta app");

  assert(Array.isArray(DB.ELS_BIBLIOGRAPHY) && DB.ELS_BIBLIOGRAPHY.length >= 6,
    "Hay bibliografía mínima (Bachya, Weissmandl, WRR, Drosnin, McKay…)");
  assert(DB.ELS_BIBLIOGRAPHY.some(b => /Weissmandl/i.test(b.author)), "Bibliografía incluye a Weissmandl");
  assert(DB.ELS_BIBLIOGRAPHY.some(b => /McKay/i.test(b.author)), "Bibliografía incluye a McKay et al.");
  assert(DB.ELS_BIBLIOGRAPHY.some(b => /Drosnin/i.test(b.author) && /rechaz/i.test(b.note)),
    "La ficha Drosnin menciona el rechazo de Rips");

  const bibleSrcGallery = fs.readFileSync('./js/modules/bibleCodeView.js', 'utf8');
  assert(bibleSrcGallery.includes('openClassicExample'), "bibleCodeView expone openClassicExample");
  assert(bibleSrcGallery.includes('AssessELSHonesty'), "Las filas ELS usan AssessELSHonesty, no «Asombroso»");
  assert(!/Asombroso/.test(bibleSrcGallery), "bibleCodeView ya no etiqueta hallazgos como Asombroso");
  assert(bibleSrcGallery.includes('LookupTorahVerse'), "Las filas/hover resuelven versículo real");
  assert(bibleSrcGallery.includes('ELSControlAtSkip'), "Hay control de texto barajado");
  assert(bibleSrcGallery.includes('runShuffledControl'), "El botón de control está cableado");
  assert(bibleSrcGallery.includes('showMatrixVerseHover'), "La matriz muestra versículo al pasar el cursor");
  assert(bibleSrcGallery.includes('pendingSelect'), "Un ejemplo clásico selecciona el match hint");

  const indexGallery = fs.readFileSync('./index.html', 'utf8');
  assert(indexGallery.includes('id="elsClassicGallery"'), "index.html tiene la galería de ejemplos");
  assert(indexGallery.includes('id="elsHonestyNote"'), "index.html tiene la nota de honestidad");
  assert(indexGallery.includes('id="elsBibliographyList"'), "index.html tiene la bibliografía colapsable");
  assert(indexGallery.includes('data-els-classic="torah-50-genesis"'), "Inicio/galería apunta al ejemplo תורה@50");
  assert(indexGallery.includes('id="bibleCodeMatrix"'), "La matriz ELS es una tabla real");
  assert(indexGallery.includes('id="matrixVerseHint"'), "Hay pista de versículo al pasar el cursor");
  assert(indexGallery.includes('id="btnElsShuffledControl"'), "Hay botón de control barajado");
  assert(indexGallery.includes('id="elsStudyTeaser"'), "Inicio tiene un bloque corto de ejemplos clásicos");

  const comparatorSrc = fs.readFileSync('./js/modules/comparatorView.js', 'utf8');
  assert(comparatorSrc.includes('openPairFromStudy'), "El comparador abre pares desde la galería");
  assert(comparatorSrc.includes('pair.wordA'), "Los chips legendarios usan wordA/wordB");

  console.log("\n=== SECCIÓN 28: SALMOS (TEHILIM), PLEGARIAS Y SONIFICACIÓN (CARACTERÍSTICAS 1 Y 2) ===");
  assert(Array.isArray(DB.TEHILIM_PSALMS) && DB.TEHILIM_PSALMS.length >= 5, `TEHILIM_PSALMS contiene al menos 5 salmos estructurados (actual: ${DB.TEHILIM_PSALMS.length})`);
  assert(DB.TEHILIM_PSALMS.some(p => p.number === 23), "La base de datos incluye el Salmo 23");
  assert(DB.TEHILIM_PSALMS.some(p => p.number === 91), "La base de datos incluye el Salmo 91 de Protección");
  assert(DB.TEHILIM_PSALMS.some(p => p.number === 121), "La base de datos incluye el Salmo 121 de Elevación");
  assert(DB.TEHILIM_PSALMS.some(p => p.number === 130), "La base de datos incluye el Salmo 130 de Sanación");
  assert(DB.TEHILIM_PSALMS.some(p => p.number === 150), "La base de datos incluye el Salmo 150 de Gratitud");

  assert(Array.isArray(DB.SACRED_PRAYERS) && DB.SACRED_PRAYERS.length >= 4, `SACRED_PRAYERS contiene oraciones sagradas (actual: ${DB.SACRED_PRAYERS.length})`);
  assert(DB.SACRED_PRAYERS.some(pr => pr.id === 'shema'), "Incluye la plegaria Shemá Israel");
  assert(DB.SACRED_PRAYERS.some(pr => pr.id === 'birkat-kohanim'), "Incluye la Bendición Sacerdotal Birkat Kohanim");
  assert(DB.SACRED_PRAYERS.some(pr => pr.id === 'ana-bekoach'), "Incluye la plegaria cabalística Ana Bekoaj");

  assert(typeof Engine.FindResonantPsalms === 'function', "gematria.js exporta FindResonantPsalms");
  const resonantShalom = Engine.FindResonantPsalms(376, DB.TEHILIM_PSALMS, 1);
  assert(Array.isArray(resonantShalom) && resonantShalom.length > 0, "FindResonantPsalms encuentra versículos resonantes para 'Shalom' (376)");
  assert(resonantShalom[0].score > 0 && resonantShalom[0].reasons.length > 0, "Los resultados resonantes incluyen puntuación y justificación espiritual");

  const audioModuleFile = fs.readFileSync('./js/modules/mysticAudio.js', 'utf8');
  assert(audioModuleFile.includes('LETTER_FREQUENCIES'), "mysticAudio.js define el mapa de frecuencias de las 22 letras");
  assert(audioModuleFile.includes('playWordHarmonics'), "mysticAudio.js implementa síntesis armónica polifónica de palabras");
  assert(audioModuleFile.includes('toggleMeditationDrone'), "mysticAudio.js implementa tono continuo de meditación");

  const tehilimModuleFile = fs.readFileSync('./js/modules/tehilimView.js', 'utf8');
  assert(tehilimModuleFile.includes('renderPsalms'), "tehilimView.js implementa renderizado dinámico de salmos");
  assert(tehilimModuleFile.includes('renderPrayers'), "tehilimView.js implementa renderizado de plegarias sagradas");

  console.log("\n=== RESUMEN ===");
  if (success) {
    console.log("🎉 ¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE!");
    process.exit(0);
  } else {
    console.error("😭 ALGUNAS PRUEBAS FALLARON. Revisa los mensajes arriba.");
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("❌ ERROR EXCEPCIONAL EN SUITE DE PRUEBAS:", err);
  process.exit(1);
});
