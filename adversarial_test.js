/**
 * Detailed Adversarial Test Harness for gematria.js
 * Challenger: challenger_m1_2
 */

const Engine = require('./gematria.js');
const { TORAH_TEXT } = require('./torah_text.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    const msg = `FAILED: ${testName} ${details ? '-> ' + details : ''}`;
    failures.push(msg);
    console.error(`❌ ${msg}`);
  }
}

console.log("=================================================");
console.log("   DETAILED ADVERSARIAL EXPANDED TEST SUITE      ");
console.log("=================================================\n");

const freqData = Engine.CalculateLetterFrequencies(TORAH_TEXT);

// -------------------------------------------------------------
// SECTION 1: TEMURA CIPHERS & GEMATRIA CALCULATIONS
// -------------------------------------------------------------
console.log("--- 1. Testing Temura Ciphers & Gematria Stability ---");

const hebrewLetters = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת','ך','ם','ן','ף','ץ'];

hebrewLetters.forEach(char => {
  const calc = Engine.CalculateGematria(char);
  assert(!isNaN(calc.absolute), `CalculateGematria('${char}').absolute is not NaN`);
  assert(!isNaN(calc.absoluteGadol), `CalculateGematria('${char}').absoluteGadol is not NaN`);
  assert(!isNaN(calc.ordinal), `CalculateGematria('${char}').ordinal is not NaN`);
  assert(!isNaN(calc.reduced), `CalculateGematria('${char}').reduced is not NaN`);
  assert(calc.reduced >= 1 && calc.reduced <= 9, `CalculateGematria('${char}').reduced (${calc.reduced}) is in [1, 9]`);
  assert(calc.atbashText.length === 1, `Atbash text for '${char}' has length 1`);
  assert(calc.albamText.length === 1, `Albam text for '${char}' has length 1`);
  assert(calc.avgadText.length === 1, `Avgad text for '${char}' has length 1`);
  assert(!isNaN(calc.atbashValue), `Atbash value for '${char}' is numeric`);
  assert(!isNaN(calc.albamValue), `Albam value for '${char}' is numeric`);
  assert(!isNaN(calc.avgadValue), `Avgad value for '${char}' is numeric`);
});

const standardLetters = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];
standardLetters.forEach(char => {
  const atbash1 = Engine.ATBASH_PAIRS[char];
  const atbash2 = Engine.ATBASH_PAIRS[atbash1];
  assert(atbash2 === char, `Atbash symmetry for '${char}': Atbash(Atbash('${char}')) === '${char}'`);

  const albam1 = Engine.ALBAM_PAIRS[char];
  const albam2 = Engine.ALBAM_PAIRS[albam1];
  assert(albam2 === char, `Albam symmetry for '${char}': Albam(Albam('${char}')) === '${char}'`);
});

// Avgad cycle
standardLetters.forEach(char => {
  let curr = char;
  for (let i = 0; i < 22; i++) {
    curr = Engine.AVGAD_PAIRS[curr];
  }
  assert(curr === char, `Avgad 22-cycle for '${char}': Avgad^22('${char}') === '${char}'`);
});

// -------------------------------------------------------------
// SECTION 2: ACROSTICS (FindAcrostics)
// -------------------------------------------------------------
console.log("\n--- 2. Testing Acrostics (FindAcrostics) ---");

const testPhrase = 'בראשית ברא אלהים את השמים';
const rosheiRes = Engine.FindAcrostics(testPhrase, 'roshei');
assert(rosheiRes.length === 1 && rosheiRes[0].word === 'בבאאה', `Full Roshei extraction correctly produces 'בבאאה'`);

const sofeiRes = Engine.FindAcrostics(testPhrase, 'sofei');
assert(sofeiRes.length === 1 && sofeiRes[0].word === 'תאםתם', `Full Sofei extraction produces 'תאםתם'`);

// Adversarial Target Words (non-Hebrew, empty, numbers, symbols)
const nonHebrewTarget1 = Engine.FindAcrostics(testPhrase, 'roshei', '12345');
assert(nonHebrewTarget1.length === 0, `FindAcrostics with non-Hebrew targetWord '12345' MUST return [] (got length ${nonHebrewTarget1.length})`);

const nonHebrewTarget2 = Engine.FindAcrostics(testPhrase, 'roshei', '!!!');
assert(nonHebrewTarget2.length === 0, `FindAcrostics with targetWord '!!!' MUST return [] (got length ${nonHebrewTarget2.length})`);

const validTarget = Engine.FindAcrostics(testPhrase, 'roshei', 'בבא');
assert(validTarget.length === 1, `FindAcrostics with valid Hebrew targetWord 'בבא' returns 1 match`);

// Diacritics and Maqaf
const diacriticPhrase = 'בְּרֵאשִׁית-בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם';
const rosheiDiacritic = Engine.FindAcrostics(diacriticPhrase, 'roshei');
assert(rosheiDiacritic.length === 1 && rosheiDiacritic[0].word === 'בבאאה', `Handles diacritics and maqaf correctly in Roshei Teivot`);

const DB = require('./database.js');
assert(Engine.FindAcrosticsInPhrases([], 'בילו', 'roshei').length === 0, `FindAcrosticsInPhrases on empty corpus returns []`);
assert(Engine.FindAcrosticsInPhrases(Engine.GetAcrosticPhraseCorpus(DB), 'א', 'roshei').length === 0, `FindAcrosticsInPhrases rejects 1-letter targets`);
const phraseBilu = Engine.FindAcrosticsInPhrases(Engine.GetAcrosticPhraseCorpus(DB), 'בילו', 'roshei');
assert(phraseBilu.some(h => /2:5/.test(h.reference)), `FindAcrosticsInPhrases finds BILU in Isaías 2:5`);

// -------------------------------------------------------------
// SECTION 3: STATISTICAL ELS & P-VALUE (CalculateELSPValue)
// -------------------------------------------------------------
console.log("\n--- 3. Testing Statistical ELS & P-Value (CalculateELSPValue) ---");

// Test 3.1: NaN and invalid parameter handling in CalculateELSPValue
const nanSkipStats = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', NaN, freqData);
assert(!isNaN(nanSkipStats.expectedMatches) && !isNaN(nanSkipStats.pValue) && !isNaN(nanSkipStats.statisticalSignificanceScore), 
  `CalculateELSPValue with skipSpec=NaN does not return NaN (got expectedMatches=${nanSkipStats.expectedMatches}, pValue=${nanSkipStats.pValue})`);

const nanTextLenStats = Engine.CalculateELSPValue(NaN, 'תורה', 50, freqData);
assert(!isNaN(nanTextLenStats.expectedMatches) && !isNaN(nanTextLenStats.pValue), 
  `CalculateELSPValue with textLength=NaN does not return NaN (got pValue=${nanTextLenStats.pValue})`);

// Test 3.2: Object skipSpec behavior
const range1_50 = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', { minSkip: 1, maxSkip: 50 }, freqData);
const rangeNeg50_50 = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', { minSkip: -50, maxSkip: 50 }, freqData);

console.log(`  [Inspect] expectedMatches for {minSkip: 1, maxSkip: 50}: ${range1_50.expectedMatches}`);
console.log(`  [Inspect] expectedMatches for {minSkip: -50, maxSkip: 50}: ${rangeNeg50_50.expectedMatches}`);

assert(rangeNeg50_50.expectedMatches >= range1_50.expectedMatches, 
  `skipSpec {minSkip:-50, maxSkip:50} should have expectedMatches >= {minSkip:1, maxSkip:50} (got neg50=${rangeNeg50_50.expectedMatches}, pos50=${range1_50.expectedMatches})`);

// -------------------------------------------------------------
// SECTION 4: EQUIDISTANT LETTER SEQUENCES (FindELS)
// -------------------------------------------------------------
console.log("\n--- 4. Testing Equidistant Letter Sequences (FindELS) ---");

const zeroSkipMatches = Engine.FindELS(TORAH_TEXT, 'תורה', 0, 5);
const hasSkipZero = zeroSkipMatches.some(m => m.skip === 0);
assert(!hasSkipZero, `FindELS with minSkip=0 MUST NOT produce matches with skip=0`);

// Check numeric limits and bounds
const elsResults = Engine.FindELS(TORAH_TEXT, 'תורה', 1, 100);
assert(elsResults.length > 0, `FindELS returns matches for 'תורה' in range [1, 100]`);

elsResults.forEach((res, idx) => {
  if (idx < 10) {
    assert(!isNaN(res.expectedCount) && isFinite(res.expectedCount) && res.expectedCount >= 0, `Match ${idx}: expectedCount valid`);
    assert(!isNaN(res.pValue) && isFinite(res.pValue) && res.pValue >= 0 && res.pValue <= 1.0, `Match ${idx}: pValue valid in [0, 1]`);
    assert(!isNaN(res.significanceScore) && isFinite(res.significanceScore) && res.significanceScore >= 0, `Match ${idx}: significanceScore valid >= 0`);
  }
});

// -------------------------------------------------------------
// SECTION 5: SPEED & STRESS HARNESS
// -------------------------------------------------------------
console.log("\n--- 5. Execution Speed & Stress Harness ---");

const t0 = Date.now();
for (let i = 0; i < 10000; i++) {
  Engine.CalculateGematria('בראשית ברא אלהים את השמים ואת הארץ');
}
const gematriaTime = Date.now() - t0;
console.log(`⏱️ 10,000 CalculateGematria operations: ${gematriaTime} ms`);

const t1 = Date.now();
const stressEls = Engine.FindELS(TORAH_TEXT, 'תורה', 1, 500);
const elsTime = Date.now() - t1;
console.log(`⏱️ FindELS (TORAH_TEXT, maxSkip=500): ${elsTime} ms (${stressEls.length} matches)`);

// -------------------------------------------------------------
// SUMMARY & VERDICT
// -------------------------------------------------------------
console.log("\n=================================================");
console.log(`   ADVERSARIAL SUITE SUMMARY: ${passedTests}/${totalTests} PASSED`);
console.log("=================================================");

if (failedTests > 0) {
  console.log(`\n❌ ${failedTests} FAILURE(S) DETECTED:`);
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log("\n🎉 ALL ADVERSARIAL CHECKS PASSED PERFECTLY!");
  process.exit(0);
}
