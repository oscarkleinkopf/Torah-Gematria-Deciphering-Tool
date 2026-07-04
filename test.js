/**
 * Script de prueba para validar el motor de Gematria y correlaciones.
 * Ejecutar con: node test.js
 */

const Engine = require('./gematria.js');
const DB = require('./database.js');

let success = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    success = false;
  } else {
    console.log(`✅ PASÓ: ${message}`);
  }
}

console.log("=== INICIANDO PRUEBAS DE GEMATRIADECIPHER ===");

// 1. Validar cálculos de Gematria básicos
const calcAhava = Engine.CalculateGematria('אהבה'); // א=1, ה=5, ב=2, ה=5 -> 13
assert(calcAhava.absolute === 13, "Gematria absoluta de אהבה es 13");
assert(calcAhava.reduced === 4, "Gematria reducida de אהבה es 4 (1+3)");

const calcEchad = Engine.CalculateGematria('אחד'); // א=1, ח=8, ד=4 -> 13
assert(calcEchad.absolute === 13, "Gematria absoluta de אחד es 13");

// 2. Validar Cifrado Atbash
// א->ת (400), ה->צ (90), ב->ש (300), ה->צ (90) -> 880
assert(calcAhava.atbashText === 'תצשצ', "Texto Atbash de אהבה es 'תצשצ'");

// 3. Validar transliteración de español a hebreo
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
const { TORAH_TEXT } = require('./torah_text.js');
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

console.log("\n=== RESUMEN ===");
if (success) {
  console.log("🎉 ¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE!");
  process.exit(0);
} else {
  console.error("😭 ALGUNAS PRUEBAS FALLARON. Revisa los mensajes arriba.");
  process.exit(1);
}
