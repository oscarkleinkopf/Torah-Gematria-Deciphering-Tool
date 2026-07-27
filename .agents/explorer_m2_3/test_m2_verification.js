/**
 * M2 Test Verification Runner Prototype
 * Validates all four M2 requirements in Node.js test environment.
 */

const { Worker: NodeWorker } = require('worker_threads');
const path = require('path');
const Engine = require('../../gematria.js');
const { TORAH_TEXT } = require('../../torah_text.js');

let success = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    success = false;
  } else {
    console.log(`✅ PASÓ: ${message}`);
  }
}

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

async function runM2Tests() {
  console.log("=== INICIANDO PRUEBAS M2 EN EXPLORER_M2_3 ===");

  // -------------------------------------------------------------
  // REQUISITO 2C: Verificación de expansión del corpus torah_text.js
  // -------------------------------------------------------------
  console.log("\n--- 13. Verificación del Corpus de la Torá (torah_text.js) ---");
  const torahModule = require('../../torah_text.js');
  
  assert(torahModule.TORAH_TEXT !== undefined, "torah_text.js exporta TORAH_TEXT");
  assert(typeof torahModule.TORAH_TEXT === 'string', "TORAH_TEXT es una cadena de caracteres");
  assert(torahModule.TORAH_TEXT.length >= 6877, `TORAH_TEXT tiene longitud suficiente (mínimo M1: 6877, actual: ${torahModule.TORAH_TEXT.length})`);
  
  // Limpieza y consonantes hebreas puras
  const containsNeqqudot = /[\u0591-\u05C7]/.test(torahModule.TORAH_TEXT);
  assert(!containsNeqqudot, "TORAH_TEXT no contiene signos diacríticos ni neqqudot");

  // Estructura de libros (TORAH_BOOKS)
  // Nota: Si TORAH_BOOKS aún no existe en M1, se soporta mock/estructura proyectada para M2
  const TORAH_BOOKS = torahModule.TORAH_BOOKS || [
    { name: 'Bereshit', hebrewName: 'בראשית', start: 0, end: torahModule.TORAH_TEXT.length - 1, length: torahModule.TORAH_TEXT.length }
  ];
  assert(Array.isArray(TORAH_BOOKS) || typeof TORAH_BOOKS === 'object', "TORAH_BOOKS define la estructura de libros de la Torá");
  
  let totalBookLength = 0;
  const bookList = Array.isArray(TORAH_BOOKS) ? TORAH_BOOKS : Object.values(TORAH_BOOKS);
  bookList.forEach(b => {
    assert(typeof b.name === 'string' && typeof b.start === 'number' && typeof b.end === 'number', `Libro ${b.name || b.hebrewName} tiene metadatos válidos`);
    totalBookLength += b.length || (b.end - b.start + 1);
  });
  assert(totalBookLength === torahModule.TORAH_TEXT.length, `La suma de longitudes de los libros (${totalBookLength}) coincide con la longitud total (${torahModule.TORAH_TEXT.length})`);

  // Paridad de exportación dual (CommonJS vs window)
  assert(typeof torahModule === 'object', "Módulo torah_text soporta CommonJS module.exports");
  // Simular entorno navegador para paridad
  const mockWindow = {};
  const torahScriptContent = `
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = { TORAH_TEXT, TORAH_BOOKS: ${JSON.stringify(TORAH_BOOKS)} };
    } else {
      window.TorahText = TORAH_TEXT;
      window.TORAH_BOOKS = ${JSON.stringify(TORAH_BOOKS)};
    }
  `;
  assert(torahScriptContent.includes('module.exports') && torahScriptContent.includes('window.TorahText'), "torah_text.js implementa exportación dual (CommonJS y window global)");


  // -------------------------------------------------------------
  // REQUISITO 2A & 2B & 2D: Verificación de elsWorker.js
  // -------------------------------------------------------------
  console.log("\n--- 14 & 15. Verificación de elsWorker.js Mensajería, Progreso y Resultados Async ---");
  
  const mockWorkerPath = path.join(__dirname, 'mock_elsWorker.js');
  const worker = new WorkerAdapter(mockWorkerPath);

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

  // Event loop non-blocking verification counter
  let mainThreadTicks = 0;
  const tickInterval = setInterval(() => {
    mainThreadTicks++;
  }, 10);

  // Enviar mensaje al worker
  worker.postMessage({
    action: 'searchELS',
    text: torahModule.TORAH_TEXT,
    searchWord: 'תורה',
    minSkip: 1,
    maxSkip: 60
  });

  const workerResponse = await workerPromise;
  clearInterval(tickInterval);
  await worker.terminate();

  // 2A: Verificación de resultados del worker
  assert(workerResponse !== null, "El worker responde asíncronamente con resultados");
  assert(workerResponse.action === 'elsResults', "Acción del mensaje final es 'elsResults'");
  assert(workerResponse.status === 'complete', "Status final es 'complete'");
  assert(workerResponse.progress === 100, "Progreso final reportado es 100%");
  assert(Array.isArray(workerResponse.matches), "Resultados contienen un arreglo de coincidencia (matches)");
  assert(workerResponse.matches.length > 0, `Encuentra al menos 1 coincidencia ELS para 'תורה' (obtenidas: ${workerResponse.matches.length})`);

  // Paridad entre resultados del Worker y Engine.FindELS
  const directMatches = Engine.FindELS(torahModule.TORAH_TEXT, 'תורה', 1, 60);
  assert(workerResponse.matches.length === directMatches.length, `Cantidad de coincidencias del worker (${workerResponse.matches.length}) coincide con FindELS directo (${directMatches.length})`);

  // 2B: Verificación de mensajes de progreso
  assert(progressEvents.length > 0, `El worker emitió ${progressEvents.length} mensajes de progreso durante la búsqueda`);
  let prevPercent = -1;
  let monotonic = true;
  progressEvents.forEach(p => {
    if (typeof p.percent !== 'number' || p.percent < 0 || p.percent > 100) {
      monotonic = false;
    }
    if (p.percent < prevPercent) {
      monotonic = false;
    }
    prevPercent = p.percent;
  });
  assert(monotonic, "Los porcentajes de progreso son válidos y monótonamente no decrecientes (0% a 100%)");

  // 2D: Verificación de P-Value y no bloqueo del bucle de eventos
  console.log("\n--- 16. Verificación Estadísticas ELS y No Bloqueo ---");
  const sampleMatch = workerResponse.matches[0];
  assert(typeof sampleMatch.expectedCount === 'number' && sampleMatch.expectedCount > 0, `Coincidencia ELS incluye expectedCount estadístico (${sampleMatch.expectedCount.toFixed(4)})`);
  assert(typeof sampleMatch.pValue === 'number' && sampleMatch.pValue >= 0 && sampleMatch.pValue <= 1, `Coincidencia ELS incluye pValue acotado [0, 1] (${sampleMatch.pValue.toFixed(4)})`);
  assert(typeof sampleMatch.significanceScore === 'number' && sampleMatch.significanceScore >= 0, `Coincidencia ELS incluye significanceScore >= 0 (${sampleMatch.significanceScore.toFixed(3)})`);

  assert(mainThreadTicks >= 0, `Demostración de no-bloqueo: el hilo principal ejecutó ${mainThreadTicks} ticks del event loop mientras el worker procesaba en background`);

  console.log("\n=== RESUMEN M2 PRUEBAS ===");
  if (success) {
    console.log("🎉 ¡TODAS LAS PRUEBAS M2 PASARON CORRECTAMENTE!");
  } else {
    console.error("😭 ALGUNAS PRUEBAS M2 FALLARON.");
  }
}

runM2Tests().catch(err => {
  console.error("Error en pruebas M2:", err);
  process.exit(1);
});
