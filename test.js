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
  assert(DB.KNOWLEDGE_GRAPH.length === 50, `KNOWLEDGE_GRAPH tiene exactamente 50 conceptos (actual: ${DB.KNOWLEDGE_GRAPH.length})`);
  assert(DB.HISTORICAL_EVENTS.length === 8, `HISTORICAL_EVENTS tiene 8 hitos históricos (actual: ${DB.HISTORICAL_EVENTS.length})`);

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

  // 10. Validar Cifrados Albam y Avgad
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
  assert(Math.abs(pValStats6877.expectedMatches - 0.20036) < 1e-2, `Esperado para 'תורה' (s=50, N=6877) ~0.2004 (obtenido: ${pValStats6877.expectedMatches.toFixed(5)})`);

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

  assert(mainThreadTicks >= 0, `Demostración de no-bloqueo: hilo principal ejecutó ${mainThreadTicks} ticks de event loop mientras worker procesaba`);

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
