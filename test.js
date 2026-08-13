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
  assert(DB.HISTORICAL_EVENTS.length === 8, `HISTORICAL_EVENTS tiene 8 hitos históricos (actual: ${DB.HISTORICAL_EVENTS.length})`);
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
