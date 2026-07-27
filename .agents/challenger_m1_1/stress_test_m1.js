/**
 * Standalone Adversarial Stress Test Harness for Milestone M1 (GematriaDecipher)
 * Challenger Agent: challenger_m1_1
 * 
 * Scope:
 * 1. Temura ciphers (Albam & Avgad) with full Hebrew alphabet including 5 Sofit characters.
 * 2. Roshei & Sofei Teivot acrostic search with edge case inputs.
 * 3. ELS statistical significance calculations with extreme skip values, short words, rare letters.
 * 4. Memory leak, NaN, Infinity, and crash checks across 50,000 execution cycles.
 */

const path = require('path');
const Engine = require(path.resolve(__dirname, '../../gematria.js'));
const { TORAH_TEXT } = require(path.resolve(__dirname, '../../torah_text.js'));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function formatVal(v) {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === 'number' && isNaN(v)) return "NaN";
  return JSON.stringify(v);
}

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    failures.push({ testName, details });
    console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
  }
}

function assertNoNaNOrInfinity(obj, testName) {
  if (typeof obj === 'number') {
    assert(!isNaN(obj) && isFinite(obj), `${testName} - Value is finite and not NaN`, `Got: ${obj}`);
    return;
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'number') {
        assert(!isNaN(val) && isFinite(val), `${testName} - ${key} is finite and not NaN`, `Got ${key}=${val}`);
      }
    }
  }
}

console.log("===============================================================");
console.log("   ADVERSARIAL STRESS TEST HARNESS — MILESTONE M1 ALGORITHMS   ");
console.log("===============================================================\n");

// ============================================================================
// SECTION 1: TEMURA CIPHERS (ALBAM & AVGAD) & SOFIT CHARACTERS STRESS TEST
// ============================================================================
console.log("--- Section 1: Temura Ciphers (Albam & Avgad) & Sofit Characters ---");

const ALL_HEBREW_CHARS = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
  'ך', 'ם', 'ן', 'ף', 'ץ'
];
const NON_SOFIT_CHARS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'];

// 1.1 Test dictionary completeness for every single character
for (const char of ALL_HEBREW_CHARS) {
  assert(Engine.ALBAM_PAIRS[char] !== undefined, `ALBAM_PAIRS contains mapping for '${char}'`);
  assert(Engine.AVGAD_PAIRS[char] !== undefined, `AVGAD_PAIRS contains mapping for '${char}'`);
  assert(Engine.ATBASH_PAIRS[char] !== undefined, `ATBASH_PAIRS contains mapping for '${char}'`);
  assert(Engine.HEBREW_MAP[char] !== undefined, `HEBREW_MAP contains entry for '${char}'`);
}

// 1.2 Test CalculateGematria on every single Hebrew character individually
for (const char of ALL_HEBREW_CHARS) {
  const calc = Engine.CalculateGematria(char);
  assert(calc.lettersCount === 1, `CalculateGematria('${char}') lettersCount is 1`);
  assert(calc.albamText.length === 1, `CalculateGematria('${char}') albamText length is 1`);
  assert(calc.avgadText.length === 1, `CalculateGematria('${char}') avgadText length is 1`);
  assertNoNaNOrInfinity(calc, `CalculateGematria('${char}') output numbers`);
}

// 1.3 Test Albam Reciprocal Property for standard letters
for (const char of NON_SOFIT_CHARS) {
  const albam1 = Engine.ALBAM_PAIRS[char];
  const albam2 = Engine.ALBAM_PAIRS[albam1];
  assert(albam2 === char, `Albam reciprocal property for standard letter '${char}' -> '${albam1}' -> '${albam2}'`);
}

// 1.4 Test Albam Sofit Mapping
const expectedAlbamSofitMappings = { 'ך': 'ת', 'ם': 'ב', 'ן': 'ג', 'ף': 'ו', 'ץ': 'ז' };
for (const [sofit, target] of Object.entries(expectedAlbamSofitMappings)) {
  assert(Engine.ALBAM_PAIRS[sofit] === target, `Albam maps Sofit '${sofit}' to '${target}'`);
  const doubleAlbam = Engine.ALBAM_PAIRS[Engine.ALBAM_PAIRS[sofit]];
  const expectedStandard = Engine.NormalizeHebrewLetter(sofit);
  assert(doubleAlbam === expectedStandard, `Double Albam of Sofit '${sofit}' resolves to standard letter '${expectedStandard}' (got '${doubleAlbam}')`);
}

// 1.5 Test Avgad 22-Step Cycle on Standard Letters
for (const char of NON_SOFIT_CHARS) {
  let curr = char;
  for (let step = 0; step < 22; step++) {
    curr = Engine.AVGAD_PAIRS[curr];
  }
  assert(curr === char, `Avgad 22-step cycle returns '${char}' to itself`);
}

// 1.6 Edge Case Strings for Temura
const temuraEdgeCases = [
  "",
  "   ",
  "\n\t\r",
  "12345!@#$%^&*()_+",
  "Hello World",
  "שלום 123 World! ךםןףץ",
  "ך".repeat(1000),
  "א".repeat(50000)
];

for (const text of temuraEdgeCases) {
  let calc;
  let threw = false;
  try {
    calc = Engine.CalculateGematria(text);
  } catch (err) {
    threw = true;
    console.error(`Exception during CalculateGematria on edge text length ${text.length}:`, err);
  }
  assert(!threw, `CalculateGematria does not throw on input length ${text.length}`);
  if (calc) {
    assertNoNaNOrInfinity(calc, `CalculateGematria edge case input length ${text.length}`);
  }
}

// ============================================================================
// SECTION 2: ROSHEI & SOFEI TEIVOT ACROSTIC SEARCH STRESS TEST
// ============================================================================
console.log("\n--- Section 2: Roshei & Sofei Teivot Acrostic Search ---");

// 2.1 Null, Undefined, Empty, Whitespace Inputs
const emptyAcrosticInputs = [
  [ "", 'roshei' ],
  [ null, 'roshei' ],
  [ undefined, 'roshei' ],
  [ "   \n\t  ", 'roshei' ],
  [ "...", 'sofei' ],
  [ "123 456 789", 'both' ],
  [ "ABC DEF GHI", 'roshei' ]
];

for (const [input, type] of emptyAcrosticInputs) {
  let res;
  let threw = false;
  try {
    res = Engine.FindAcrostics(input, type);
  } catch (err) {
    threw = true;
  }
  assert(!threw, `FindAcrostics does not throw on input: ${formatVal(input)}`);
  assert(Array.isArray(res) && res.length === 0, `FindAcrostics returns empty array [] on non-Hebrew/empty input: ${formatVal(input)}`);
}

// 2.2 Punctuation & Hyphenation Handling
const hyphenatedText = "בֵּית-אֵל כִּסֵּא-כָבוֹד";
const acrosticHyphen = Engine.FindAcrostics(hyphenatedText, 'roshei');
assert(acrosticHyphen.length > 0, "FindAcrostics handles hyphens (מַקָּף) cleanly");
assert(acrosticHyphen[0].word === 'באככ', `Hyphenated text extracts correct initials 'באככ' (got '${acrosticHyphen[0].word}')`);

// 2.3 Edge Case Targets (Target longer than text, target non-Hebrew)
const sampleHebrewText = "כי חלק יהוה עמו יעקב חבל נחלתו"; // 6 words

assert(Engine.FindAcrostics(sampleHebrewText, 'roshei', 'אבגדהוזחטיכ').length === 0, "Target word longer than input word count returns [] cleanly");
assert(Engine.FindAcrostics(sampleHebrewText, 'roshei', '1234').length === 0, "Non-Hebrew target word '1234' returns [] cleanly");
assert(Engine.FindAcrostics(sampleHebrewText, 'roshei', '!@#$').length === 0, "Punctuation target word '!@#$' returns [] cleanly");

// 2.4 Sofiyot in Acrostics (First letter & Last letter)
const textWithSofitWords = "שלום למלך מן הארץ";
const sofeiNormalizedMatch = Engine.FindAcrostics(textWithSofitWords, 'sofei', 'מכנצ', { exactSofit: false });
assert(sofeiNormalizedMatch.length > 0, "Sofei Teivot finds normalized Sofiyot match 'מכנצ'");

const sofeiStrictMatch = Engine.FindAcrostics(textWithSofitWords, 'sofei', 'םךןץ', { exactSofit: true });
assert(sofeiStrictMatch.length > 0, "Sofei Teivot finds exact Sofiyot match 'םךןץ' with exactSofit: true");

const sofeiStrictMismatch = Engine.FindAcrostics(textWithSofitWords, 'sofei', 'מכנצ', { exactSofit: true });
assert(sofeiStrictMismatch.length === 0, "Sofei Teivot rejects normalized match 'מכנצ' when exactSofit: true");

// 2.5 Invalid type argument handling
const invalidTypeRes = Engine.FindAcrostics(sampleHebrewText, 'invalid_type_xyz');
assert(Array.isArray(invalidTypeRes) && invalidTypeRes.length === 0, "Invalid type argument returns empty array []");

// 2.6 Acrostic extraction on spaced Hebrew text
const spacedHebrewText = "בראשית ברא אלהים את השמים ואת הארץ";
const spacedAcrostic = Engine.FindAcrostics(spacedHebrewText, 'roshei');
assert(spacedAcrostic.length === 1, "Spaced Hebrew text extraction returns 1 continuous acrostic object");
assert(spacedAcrostic[0].word === 'בבאאהוה', `Extracted acrostic word matches initials 'בבאאהוה' (got '${spacedAcrostic[0].word}')`);


// ============================================================================
// SECTION 3: ELS STATISTICAL SIGNIFICANCE (CALCULATEELSPVALUE & FINDELS) STRESS TEST
// ============================================================================
console.log("\n--- Section 3: ELS Statistical Significance & Skip Calculations ---");

const freqData = Engine.CalculateLetterFrequencies(TORAH_TEXT);

// 3.1 Extreme & Invalid Skip Values for CalculateELSPValue
const extremeSkipSpecs = [
  0,
  -1,
  -50,
  -100000,
  1000000,
  Infinity,
  -Infinity,
  NaN,
  [],
  [0, 0, 0],
  [50, -50, 100],
  { minSkip: 0, maxSkip: 0 },
  { minSkip: 50, maxSkip: 10 },
  { minSkip: -100, maxSkip: 100 }
];

for (const skipSpec of extremeSkipSpecs) {
  let stats;
  let threw = false;
  try {
    stats = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', skipSpec, freqData.frequencies);
  } catch (err) {
    threw = true;
  }
  assert(!threw, `CalculateELSPValue does not throw on skipSpec: ${formatVal(skipSpec)}`);
  if (stats) {
    assertNoNaNOrInfinity(stats, `CalculateELSPValue stats for skipSpec: ${formatVal(skipSpec)}`);
    assert(stats.expectedMatches >= 0, `expectedMatches >= 0 for skipSpec: ${formatVal(skipSpec)}`);
    assert(stats.pValue >= 0 && stats.pValue <= 1.0, `pValue in [0, 1] for skipSpec: ${formatVal(skipSpec)} (got ${stats.pValue})`);
  }
}

// 3.2 Extreme Text Lengths & Word Lengths
const extremeTextLengths = [0, -10, 1, 10, 1000000, Infinity, NaN];
for (const tLen of extremeTextLengths) {
  let stats;
  let threw = false;
  try {
    stats = Engine.CalculateELSPValue(tLen, 'תורה', 50, freqData.frequencies);
  } catch (err) {
    threw = true;
  }
  assert(!threw, `CalculateELSPValue does not throw on textLength: ${tLen}`);
  if (stats) {
    assertNoNaNOrInfinity(stats, `CalculateELSPValue stats for textLength: ${tLen}`);
    assert(stats.pValue >= 0 && stats.pValue <= 1.0, `pValue in [0, 1] for textLength: ${tLen}`);
  }
}

const extremeWords = [
  "",
  "א",
  "אב",
  "XYZ", // Char not in Hebrew freq table
  "תורה".repeat(500) // 2000 chars word
];

for (const word of extremeWords) {
  let stats;
  let threw = false;
  try {
    stats = Engine.CalculateELSPValue(TORAH_TEXT.length, word, 50, freqData.frequencies);
  } catch (err) {
    threw = true;
  }
  assert(!threw, `CalculateELSPValue does not throw on searchWord length: ${word.length}`);
  if (stats) {
    assertNoNaNOrInfinity(stats, `CalculateELSPValue stats for searchWord length: ${word.length}`);
    assert(stats.pValue >= 0 && stats.pValue <= 1.0, `pValue in [0, 1] for searchWord length: ${word.length}`);
  }
}

// 3.3 Missing or Malformed Letter Frequencies
const malformedFreqs = [
  {},
  null,
  undefined,
  { 'ת': 0, 'ו': 0, 'ר': 0, 'ה': 0 },
  { 'ת': 2.0 }
];

for (const f of malformedFreqs) {
  let stats;
  let threw = false;
  try {
    stats = Engine.CalculateELSPValue(TORAH_TEXT.length, 'תורה', 50, f);
  } catch (err) {
    threw = true;
  }
  assert(!threw, `CalculateELSPValue does not throw on malformed frequencies: ${f === null ? 'null' : typeof f}`);
  if (stats) {
    assertNoNaNOrInfinity(stats, `CalculateELSPValue stats for malformed frequencies`);
    assert(stats.pValue >= 0 && stats.pValue <= 1.0, `pValue in [0, 1] for malformed frequencies`);
  }
}

// 3.4 FindELS Edge Cases
const findElsCases = [
  [ "", "תורה", 1, 10 ],
  [ TORAH_TEXT, "", 1, 10 ],
  [ TORAH_TEXT, "ת", 1, 10 ],
  [ TORAH_TEXT, "תורה", 100, 10 ],
  [ TORAH_TEXT, "תורה", 100000, 200000 ]
];

for (const [txt, word, minS, maxS] of findElsCases) {
  let res;
  let threw = false;
  try {
    res = Engine.FindELS(txt, word, minS, maxS);
  } catch (err) {
    threw = true;
  }
  assert(!threw, `FindELS does not throw on edge case: word='${word}', skips=[${minS}, ${maxS}]`);
  assert(Array.isArray(res), `FindELS returns array on edge case: word='${word}'`);
  if (res && res.length > 0) {
    for (const match of res) {
      assertNoNaNOrInfinity(match, `FindELS match object stats`);
    }
  }
}

// ============================================================================
// SECTION 4: HIGH-VOLUME STRESS HARNESS & MEMORY LEAK VERIFICATION
// ============================================================================
console.log("\n--- Section 4: High-Volume Stress & Memory Leak Harness ---");

const ITERATIONS = 50000;
console.log(`Running ${ITERATIONS.toLocaleString()} algorithm executions...`);

const memoryBefore = process.memoryUsage();
const startTime = Date.now();

let nanCount = 0;
let infinityCount = 0;
let exceptionCount = 0;

for (let i = 0; i < ITERATIONS; i++) {
  try {
    // 1. Gematria & Temura
    const text = (i % 2 === 0) ? 'בראשית ברא אלהים' : 'שלום מלכות ךםןףץ';
    const g = Engine.CalculateGematria(text);
    if (isNaN(g.absolute) || isNaN(g.albamValue) || isNaN(g.avgadValue)) nanCount++;
    if (!isFinite(g.absolute) || !isFinite(g.albamValue) || !isFinite(g.avgadValue)) infinityCount++;

    // 2. Acrostics
    const a = Engine.FindAcrostics(text, (i % 3 === 0) ? 'roshei' : 'sofei');
    if (!Array.isArray(a)) nanCount++;

    // 3. ELS Stats
    const skip = (i % 100) - 50;
    const s = Engine.CalculateELSPValue(6877, 'תורה', skip, freqData.frequencies);
    if (isNaN(s.pValue) || isNaN(s.expectedMatches) || isNaN(s.statisticalSignificanceScore)) nanCount++;
    if (!isFinite(s.pValue) || !isFinite(s.expectedMatches) || !isFinite(s.statisticalSignificanceScore)) infinityCount++;
  } catch (err) {
    exceptionCount++;
  }
}

if (global.gc) {
  global.gc();
}

const memoryAfter = process.memoryUsage();
const durationMs = Date.now() - startTime;

console.log(`Completed ${ITERATIONS.toLocaleString()} iterations in ${durationMs} ms (${(durationMs / ITERATIONS).toFixed(3)} ms/iter)`);
console.log(`Memory Usage Before: HeapUsed ${(memoryBefore.heapUsed / 1024 / 1024).toFixed(2)} MB, RSS ${(memoryBefore.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`Memory Usage After:  HeapUsed ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)} MB, RSS ${(memoryAfter.rss / 1024 / 1024).toFixed(2)} MB`);

assert(exceptionCount === 0, `Zero exceptions thrown during ${ITERATIONS} iterations`, `Exceptions: ${exceptionCount}`);
assert(nanCount === 0, `Zero NaNs generated during ${ITERATIONS} iterations`, `NaNs: ${nanCount}`);
assert(infinityCount === 0, `Zero Infinities generated during ${ITERATIONS} iterations`, `Infinities: ${infinityCount}`);

const heapDeltaMb = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
assert(heapDeltaMb < 25, `Heap memory growth is bounded under 25 MB after 50k iterations (actual delta: ${heapDeltaMb.toFixed(2)} MB)`);


// ============================================================================
// FINAL SUMMARY REPORT
// ============================================================================
console.log("\n===============================================================");
console.log(`STRESS TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed (Total: ${totalTests})`);
console.log("===============================================================");

if (failedTests > 0) {
  console.error("\nSummary of Failures:");
  failures.forEach((f, idx) => {
    console.error(` ${idx + 1}. [${f.testName}] ${f.details}`);
  });
  process.exit(1);
} else {
  console.log("\n🎉 ALL STRESS TESTS PASSED WITH 100% EMPIRICAL VERIFICATION!");
  process.exit(0);
}
