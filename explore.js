/**
 * explore.js — Unified correlation explorer
 * Search by surname / name / date / event / number → KG + history + Zionism + verses
 */

const NAME_DICTIONARY = [
  // Biblical / classic
  { id: 'cohen', spanish: ['cohen', 'coen', 'kohen', 'kohanim'], hebrew: 'כהן', kind: 'apellido', note: 'Sacerdocio — linaje aarónico' },
  { id: 'levy', spanish: ['levy', 'levi', 'levita', 'halevi'], hebrew: 'לוי', kind: 'apellido', note: 'Tribu de Leví' },
  { id: 'israel', spanish: ['israel', 'ysrael'], hebrew: 'ישראל', kind: 'nombre', note: 'Nombre nacional / patriarcal' },
  { id: 'abraham', spanish: ['abraham', 'avraam', 'avraham'], hebrew: 'אברהם', kind: 'nombre', note: 'Patriarca' },
  { id: 'isaac', spanish: ['isaac', 'itzhak', 'yitzhak'], hebrew: 'יצחק', kind: 'nombre', note: 'Patriarca' },
  { id: 'jacob', spanish: ['jacob', 'yaakov', 'yacov'], hebrew: 'יעקב', kind: 'nombre', note: 'Patriarca / Israel' },
  { id: 'joseph', spanish: ['jose', 'joseph', 'yosef'], hebrew: 'יוסף', kind: 'nombre', note: 'José — Sión (156)' },
  { id: 'moses', spanish: ['moises', 'moses', 'moshe'], hebrew: 'משה', kind: 'nombre', note: 'Moisés' },
  { id: 'david', spanish: ['david'], hebrew: 'דוד', kind: 'nombre', note: 'Rey David' },
  { id: 'sarah', spanish: ['sara', 'sarah'], hebrew: 'שרה', kind: 'nombre', note: 'Matriarca' },
  { id: 'miriam', spanish: ['miriam', 'maria'], hebrew: 'מרים', kind: 'nombre', note: 'Profetisa' },
  { id: 'aaron', spanish: ['aaron', 'aharon'], hebrew: 'אהרן', kind: 'nombre', note: 'Sumo sacerdote' },
  { id: 'solomon', spanish: ['salomon', 'solomon', 'shlomo'], hebrew: 'שלמה', kind: 'nombre', note: 'Rey Salomón' },
  { id: 'rachel', spanish: ['raquel', 'rachel'], hebrew: 'רחל', kind: 'nombre', note: 'Matriarca' },
  { id: 'leah', spanish: ['lea', 'leah'], hebrew: 'לאה', kind: 'nombre', note: 'Matriarca' },
  { id: 'esther', spanish: ['ester', 'esther'], hebrew: 'אסתר', kind: 'nombre', note: 'Reina Ester' },
  { id: 'ruth', spanish: ['rut', 'ruth'], hebrew: 'רות', kind: 'nombre', note: 'Rut' },
  { id: 'daniel', spanish: ['daniel'], hebrew: 'דניאל', kind: 'nombre', note: 'Daniel' },
  { id: 'michael', spanish: ['miguel', 'michael', 'mijael'], hebrew: 'מיכאל', kind: 'nombre', note: 'Miguel / Mijael' },
  { id: 'noah', spanish: ['noe', 'noah', 'noaj'], hebrew: 'נח', kind: 'nombre', note: 'Noé' },
  { id: 'elijah', spanish: ['elias', 'elijah', 'eliyahu'], hebrew: 'אליהו', kind: 'nombre', note: 'Elías' },
  { id: 'hanna', spanish: ['ana', 'hanna', 'chana'], hebrew: 'חנה', kind: 'nombre', note: 'Jana' },
  { id: 'oscar', spanish: ['oscar'], hebrew: 'אוסקר', kind: 'nombre', note: 'Nombre (fonética)' },
  // Modern / Zionist
  { id: 'herzl', spanish: ['herzl', 'theodor herzl'], hebrew: 'הרצל', kind: 'apellido', note: 'Fundador del sionismo político' },
  { id: 'bengurion', spanish: ['ben gurion', 'bengurion', 'ben-gurion'], hebrew: 'בן גוריון', kind: 'apellido', note: 'Primer primer ministro' },
  { id: 'weizmann', spanish: ['weizmann', 'jaim weizmann'], hebrew: 'ויצמן', kind: 'apellido', note: 'Primer presidente de Israel' },
  { id: 'meir', spanish: ['meir', 'golda meir'], hebrew: 'מאיר', kind: 'apellido', note: 'Primera ministra' },
  { id: 'dayan', spanish: ['dayan'], hebrew: 'דיין', kind: 'apellido', note: 'Moshe Dayan' },
  { id: 'sharon', spanish: ['sharon'], hebrew: 'שרון', kind: 'apellido', note: 'Nombre / apellido israelí' },
  { id: 'peres', spanish: ['peres', 'shimon peres'], hebrew: 'פרס', kind: 'apellido', note: 'Shimon Peres' },
  { id: 'rabin', spanish: ['rabin', 'yitzhak rabin'], hebrew: 'רבין', kind: 'apellido', note: 'Yitzhak Rabin' },
  // Common Sephardi / Ashkenazi surnames (phonetic HE)
  { id: 'klein', spanish: ['klein', 'kleinkopf'], hebrew: 'קליין', kind: 'apellido', note: 'Apellido asquenazí (pequeño)' },
  { id: 'weiss', spanish: ['weiss', 'weis'], hebrew: 'וייס', kind: 'apellido', note: 'Apellido asquenazí' },
  { id: 'goldberg', spanish: ['goldberg'], hebrew: 'גולדברג', kind: 'apellido', note: 'Apellido asquenazí' },
  { id: 'rosenberg', spanish: ['rosenberg'], hebrew: 'רוזנברג', kind: 'apellido', note: 'Apellido asquenazí' },
  { id: 'friedman', spanish: ['friedman', 'freedman'], hebrew: 'פרידמן', kind: 'apellido', note: 'Apellido asquenazí' },
  { id: 'katz', spanish: ['katz'], hebrew: 'כץ', kind: 'apellido', note: 'Acrónimo Kohen Tzedek' },
  { id: 'segal', spanish: ['segal', 'segel'], hebrew: 'סגל', kind: 'apellido', note: 'Segan Leviyah' },
  { id: 'azoulay', spanish: ['azoulay', 'azulay', 'azulai'], hebrew: 'אזולאי', kind: 'apellido', note: 'Apellido sefardí' },
  { id: 'toledano', spanish: ['toledano'], hebrew: 'טולדנו', kind: 'apellido', note: 'Apellido sefardí (Toledo)' },
  { id: 'navon', spanish: ['navon'], hebrew: 'נבון', kind: 'apellido', note: 'Apellido / “inteligente”' },
  { id: 'benami', spanish: ['ben ami', 'benami'], hebrew: 'בן עמי', kind: 'apellido', note: 'Hijo de mi pueblo' },
  { id: 'barak', spanish: ['barak'], hebrew: 'ברק', kind: 'nombre', note: 'Relámpago — resonancia con Herzl (325)' },
  { id: 'shalom', spanish: ['shalom', 'paz'], hebrew: 'שלום', kind: 'concepto', note: 'Paz' },
  { id: 'zion', spanish: ['sion', 'zion', 'tzion'], hebrew: 'ציון', kind: 'concepto', note: 'Sión' },
  { id: 'jerusalem', spanish: ['jerusalen', 'jerusalem', 'yerushalayim'], hebrew: 'ירושלים', kind: 'concepto', note: 'Jerusalén' },
  { id: 'torah', spanish: ['torah', 'tora'], hebrew: 'תורה', kind: 'concepto', note: 'Torá' },
  { id: 'balfour', spanish: ['balfour', 'declaracion balfour', 'declaración balfour'], hebrew: 'בלפור', kind: 'concepto', note: 'Declaración Balfour 1917' },
  { id: 'oslo', spanish: ['oslo', 'acuerdos de oslo'], hebrew: 'אוסלו', kind: 'concepto', note: 'Acuerdos de Oslo 1993' },
  { id: 'netanyahu', spanish: ['netanyahu', 'bibi'], hebrew: 'נתניהו', kind: 'apellido', note: 'Apellido político israelí' },
  { id: 'begin', spanish: ['begin', 'menachem begin'], hebrew: 'בגין', kind: 'apellido', note: 'Menachem Begin — Camp David' },
  { id: 'sadat', spanish: ['sadat', 'anwar sadat'], hebrew: 'סאדאת', kind: 'apellido', note: 'Anwar Sadat — paz Egipto–Israel' },
  { id: 'einstein', spanish: ['einstein'], hebrew: 'איינשטיין', kind: 'apellido', note: 'Albert Einstein' },
  { id: 'spinoza', spanish: ['spinoza', 'espinosa'], hebrew: 'שפינוזה', kind: 'apellido', note: 'Baruch Spinoza' },
  { id: 'mizrahi', spanish: ['mizrahi', 'mizrachi'], hebrew: 'מזרחי', kind: 'apellido', note: 'Oriental / sefardí' },
  { id: 'ashkenazi', spanish: ['ashkenazi', 'asquenazi'], hebrew: 'אשכנזי', kind: 'apellido', note: 'Tradición asquenazí' },
  { id: 'chai', spanish: ['chai', 'jai', 'vida'], hebrew: 'חי', kind: 'concepto', note: 'Vida — valor 18' },
  { id: 'campdavid', spanish: ['camp david', 'campdavid'], hebrew: 'קמפ דייוויד', kind: 'concepto', note: 'Paz Egipto–Israel 1979' }
];

function NormalizeExploreQuery(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Parse dates / years from free text.
 * Supports: 1948, 14/5/1948, 14-05-1948, 1948-05-14, 5 Iyar 5708 (partial)
 */
function ParseDateQuery(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  const result = {
    type: 'date',
    original: text,
    year: null,
    month: null,
    day: null,
    hebrewYearApprox: null,
    numbers: [],
    reductions: [],
    dayOfYear: null
  };

  // ISO or yyyy-mm-dd
  let m = text.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (m) {
    result.year = parseInt(m[1], 10);
    result.month = parseInt(m[2], 10);
    result.day = parseInt(m[3], 10);
  }

  // dd/mm/yyyy or dd-mm-yyyy
  if (!result.year) {
    m = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) {
      result.day = parseInt(m[1], 10);
      result.month = parseInt(m[2], 10);
      result.year = parseInt(m[3], 10);
    }
  }

  // Bare year 3–4 digits (allow negative BCE via leading -)
  if (!result.year) {
    m = text.match(/^(-?\d{3,4})$/);
    if (m) result.year = parseInt(m[1], 10);
  }

  // "año 1948" / "year 1948"
  if (!result.year) {
    m = text.match(/(?:ano|año|year)\s*(-?\d{3,4})/i);
    if (m) result.year = parseInt(m[1], 10);
  }

  if (result.year == null || Number.isNaN(result.year)) return null;

  result.numbers.push(Math.abs(result.year));
  if (result.day) result.numbers.push(result.day);
  if (result.month) result.numbers.push(result.month);

  // Digit reduction of absolute year (1948 → 22 → 4)
  let n = Math.abs(result.year);
  const reductions = [n];
  while (n >= 10) {
    n = String(n).split('').reduce((a, d) => a + parseInt(d, 10), 0);
    reductions.push(n);
  }
  result.reductions = reductions;

  // Approximate Hebrew year for CE dates (Gregorian + 3760/3761 heuristic)
  if (result.year > 0) {
    result.hebrewYearApprox = result.year + 3760;
    result.numbers.push(result.hebrewYearApprox);
    // Also last 3 digits often used in shorthand (5708 → 708)
    result.numbers.push(result.hebrewYearApprox % 1000);
  }

  if (result.year > 0 && result.month && result.day) {
    try {
      const dt = new Date(Date.UTC(result.year, result.month - 1, result.day));
      if (!Number.isNaN(dt.getTime())) {
        const start = Date.UTC(result.year, 0, 0);
        result.dayOfYear = Math.floor((dt - start) / 86400000);
        if (result.dayOfYear > 0) result.numbers.push(result.dayOfYear);
      }
    } catch (e) {}
  }

  result.numbers = [...new Set(result.numbers.filter(x => x > 0))];
  return result;
}

function LookupNameDictionary(raw, dictionary) {
  const dict = dictionary || NAME_DICTIONARY;
  const q = NormalizeExploreQuery(raw);
  if (!q) return null;

  // Exact alias match
  for (const entry of dict) {
    for (const alias of entry.spanish) {
      if (NormalizeExploreQuery(alias) === q) return entry;
    }
  }

  // Contains / starts-with (e.g. "familia cohen")
  for (const entry of dict) {
    for (const alias of entry.spanish) {
      const a = NormalizeExploreQuery(alias);
      if (a.length >= 3 && (q.includes(a) || a.includes(q))) return entry;
    }
  }

  return null;
}

function MatchHistoricalEvents(queryMeta, events) {
  const list = events || [];
  const hits = [];

  list.forEach(ev => {
    let reasons = [];
    let score = 0;

    if (queryMeta.year != null && ev.year === queryMeta.year) {
      reasons.push('Año exacto');
      score += 5;
    }
    if (queryMeta.dateInfo && queryMeta.dateInfo.year != null && ev.year === queryMeta.dateInfo.year) {
      if (!reasons.includes('Año exacto')) {
        reasons.push('Año exacto');
        score += 5;
      }
    }

    // Strong numeric candidates for event gematria: year-scale values only
    const dateNums = [];
    if (queryMeta.dateInfo) {
      dateNums.push(Math.abs(queryMeta.dateInfo.year));
      if (queryMeta.dateInfo.hebrewYearApprox) {
        dateNums.push(queryMeta.dateInfo.hebrewYearApprox);
        dateNums.push(queryMeta.dateInfo.hebrewYearApprox % 1000);
      }
    }
    const gemStrong = [
      ...(queryMeta.gematriaValues || []),
      ...dateNums,
      ...(queryMeta.queryType === 'number' ? (queryMeta.numbers || []) : [])
    ];
    // Free-text event queries: rely on title/terms, not phonetic gematria noise
    const useGemForEvents = queryMeta.queryType === 'date' || queryMeta.queryType === 'number' || queryMeta.queryType === 'surname' || queryMeta.queryType === 'name' || queryMeta.queryType === 'hebrew';
    const strongSet = new Set((useGemForEvents ? gemStrong : dateNums).filter(n => n >= 48));

    (ev.gematriaMatches || []).forEach(g => {
      if (strongSet.has(g)) {
        reasons.push(`Gematria ${g}`);
        score += 3;
      }
    });

    const qText = NormalizeExploreQuery(queryMeta.original || queryMeta.query || '');
    const title = NormalizeExploreQuery(ev.title || '');
    const label = NormalizeExploreQuery(ev.label || '');
    if (qText && title && (title.includes(qText) || qText.includes(title.split(' ')[0]))) {
      reasons.push('Título');
      score += 4;
    }
    if (qText && label && label.includes(qText)) {
      reasons.push('Etiqueta');
      score += 2;
    }

    // searchTerms overlap with hebrew forms
    const heForms = (queryMeta.hebrewForms || []).map(h => h.replace(/[^א-ת]/g, ''));
    (ev.searchTerms || []).forEach(term => {
      const clean = term.replace(/[^א-ת]/g, '');
      if (clean && heForms.some(h => h === clean || h.includes(clean) || clean.includes(h))) {
        reasons.push(`Término ELS «${term}»`);
        score += 2;
      }
    });

    if (score > 0) {
      hits.push({ event: ev, score, reasons: [...new Set(reasons)] });
    }
  });

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

function MatchZionistCards(queryMeta, cards) {
  const list = cards || [];
  const hits = [];
  const nums = new Set([...(queryMeta.numbers || []), ...(queryMeta.gematriaValues || [])]);
  const heForms = (queryMeta.hebrewForms || []).map(h => h.replace(/[^א-ת\s]/g, ''));
  const qText = NormalizeExploreQuery(queryMeta.original || '');

  list.forEach(card => {
    let score = 0;
    const reasons = [];
    if (nums.has(card.gematria)) {
      score += 4;
      reasons.push(`Gematria ${card.gematria}`);
    }
    const he = (card.hebrew || '').replace(/[^א-ת]/g, '');
    if (he && heForms.some(h => h.replace(/[^א-ת]/g, '') === he)) {
      score += 5;
      reasons.push('Hebreo exacto');
    }
    const concept = NormalizeExploreQuery(card.concept || '');
    if (qText && concept && (concept.includes(qText) || qText.includes(concept.split(' ')[0]))) {
      score += 3;
      reasons.push('Concepto');
    }
    if (score > 0) hits.push({ card, score, reasons });
  });

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

function MatchTorahVerses(queryMeta, verses) {
  const list = verses || [];
  const values = new Set([...(queryMeta.gematriaValues || []), ...(queryMeta.numbers || [])]);
  return list
    .filter(v => values.has(v.gematria))
    .map(v => ({
      verse: v,
      score: 3,
      reasons: [`Gematria ${v.gematria}`]
    }));
}

/**
 * Resolve a free-text query into typed metadata + Hebrew forms + numbers.
 */
function ResolveExploreQuery(raw, Engine, options) {
  const opts = options || {};
  const dictionary = opts.nameDictionary || NAME_DICTIONARY;
  const original = String(raw || '').trim();
  const normalized = NormalizeExploreQuery(original);

  const meta = {
    original,
    normalized,
    queryType: 'text',
    nameEntry: null,
    dateInfo: null,
    hebrewForms: [],
    gematriaValues: [],
    numbers: [],
    primaryHebrew: '',
    primaryGematria: null
  };

  if (!original) return meta;

  // Year-like numbers (plausible historical / modern years) → date
  if (/^-?\d{3,4}$/.test(original.trim())) {
    const n = parseInt(original.trim(), 10);
    const abs = Math.abs(n);
    const plausibleYear = (n < 0 && abs >= 100) || (n >= 1000 && n <= 2100) || (n >= 70 && n <= 999 && abs >= 70);
    // Prefer classic gematria shortcuts (13, 18, 26, 48, 156, 325, 582, 708…) as numbers when < 1000
    // unless it's a known timeline year in HISTORICAL_EVENTS (handled below via number path + events).
    const knownGematriaShortcuts = [48, 70, 135, 156, 252, 325, 376, 582, 642, 657, 678, 708, 727, 739, 753];
    if (plausibleYear && !(n > 0 && n < 1000 && knownGematriaShortcuts.includes(n))) {
      const asDate = ParseDateQuery(original.trim());
      if (asDate && asDate.year != null) {
        meta.queryType = 'date';
        meta.dateInfo = asDate;
        meta.numbers = asDate.numbers.slice();
        meta.gematriaValues = [Math.abs(asDate.year)];
        if (asDate.hebrewYearApprox) {
          meta.gematriaValues.push(asDate.hebrewYearApprox % 1000);
        }
        return meta;
      }
    }
  }

  // Pure small number → inverse lookup (e.g. 13, 18, 708 with 1–3 digits already handled if year-like)
  if (/^-?\d{1,5}$/.test(original.trim())) {
    const n = parseInt(original.trim(), 10);
    meta.queryType = 'number';
    meta.numbers = [Math.abs(n)];
    meta.gematriaValues = [Math.abs(n)];
    return meta;
  }

  const dateInfo = ParseDateQuery(original);
  if (dateInfo) {
    meta.queryType = 'date';
    meta.dateInfo = dateInfo;
    meta.numbers = dateInfo.numbers.slice();
    meta.gematriaValues = [Math.abs(dateInfo.year)];
    if (dateInfo.hebrewYearApprox) meta.gematriaValues.push(dateInfo.hebrewYearApprox % 1000);
    return meta;
  }

  const nameEntry = LookupNameDictionary(original, dictionary);
  if (nameEntry) {
    meta.queryType = nameEntry.kind === 'apellido' ? 'surname' : nameEntry.kind === 'concepto' ? 'concept' : 'name';
    meta.nameEntry = nameEntry;
    meta.hebrewForms.push(nameEntry.hebrew);
    meta.primaryHebrew = nameEntry.hebrew.replace(/[^א-ת]/g, '');
  }

  // Hebrew already?
  if (/[\u05D0-\u05EA]/.test(original)) {
    const he = original.replace(/[^\u05D0-\u05EA\s]/g, '').trim();
    if (he) {
      meta.hebrewForms.push(he);
      if (!meta.primaryHebrew) meta.primaryHebrew = he.replace(/[^א-ת]/g, '');
      if (!nameEntry) meta.queryType = 'hebrew';
    }
  }

  // Phonetic Spanish → Hebrew (skip when dictionary already resolved the term)
  if (!nameEntry && Engine && typeof Engine.SpanishToHebrew === 'function' && /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(original)) {
    const phonetic = Engine.SpanishToHebrew(original);
    if (phonetic && phonetic.replace(/[^א-ת]/g, '').length >= 2) {
      meta.hebrewForms.push(phonetic);
      if (!meta.primaryHebrew) meta.primaryHebrew = phonetic.replace(/[^א-ת]/g, '');
    }
  }

  meta.hebrewForms = [...new Set(meta.hebrewForms.filter(Boolean))];

  if (Engine && typeof Engine.CalculateGematria === 'function' && meta.primaryHebrew) {
    meta.primaryGematria = Engine.CalculateGematria(meta.primaryHebrew);
    if (meta.primaryGematria && meta.primaryGematria.lettersCount > 0) {
      meta.gematriaValues = [meta.primaryGematria.absolute];
      if (meta.primaryGematria.absoluteGadol !== meta.primaryGematria.absolute) {
        meta.gematriaValues.push(meta.primaryGematria.absoluteGadol);
      }
      meta.gematriaValuesSoft = [
        meta.primaryGematria.ordinal,
        meta.primaryGematria.reduced,
        meta.primaryGematria.atbashValue
      ].filter(v => typeof v === 'number');
      meta.numbers = [...new Set([...(meta.numbers || []), ...meta.gematriaValues])];
    }
  }

  const eventHints = ['oslo', 'balfour', 'templo', 'aliya', 'aliya', 'basilea', 'independencia', 'seis dias', 'camp david', 'sinai', 'betar', 'expulsion', 'espana'];
  if (eventHints.some(h => normalized.includes(h))) {
    meta.queryType = meta.queryType === 'text' ? 'event' : meta.queryType;
  }

  return meta;
}

function SplitCompoundExploreQuery(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  // "Herzl + 1897", "Cohen y 1948", "Oslo; Israel"
  const parts = text.split(/\s*(?:\+| y |;|\|\|)\s*/i).map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length <= 1) return [text];
  return parts;
}

function MergeExploreResults(parts, originalQuery) {
  const merged = {
    query: originalQuery,
    queryType: 'compound',
    meta: {
      original: originalQuery,
      normalized: NormalizeExploreQuery(originalQuery),
      queryType: 'compound',
      parts: parts.map(p => ({ query: p.query, queryType: p.queryType, primaryHebrew: p.meta && p.meta.primaryHebrew })),
      hebrewForms: [],
      gematriaValues: [],
      numbers: [],
      primaryHebrew: '',
      primaryGematria: null,
      nameEntry: null,
      dateInfo: null
    },
    knowledge: [],
    events: [],
    zionist: [],
    verses: [],
    suggestedELS: [],
    compoundParts: parts
  };

  const seenKg = new Set();
  const seenEv = new Set();
  const seenZ = new Set();
  const seenV = new Set();

  parts.forEach(p => {
    (p.meta.hebrewForms || []).forEach(h => merged.meta.hebrewForms.push(h));
    (p.meta.gematriaValues || []).forEach(n => merged.meta.gematriaValues.push(n));
    (p.meta.numbers || []).forEach(n => merged.meta.numbers.push(n));
    if (!merged.meta.primaryHebrew && p.meta.primaryHebrew) merged.meta.primaryHebrew = p.meta.primaryHebrew;
    if (!merged.meta.primaryGematria && p.meta.primaryGematria) merged.meta.primaryGematria = p.meta.primaryGematria;
    if (!merged.meta.nameEntry && p.meta.nameEntry) merged.meta.nameEntry = p.meta.nameEntry;
    if (!merged.meta.dateInfo && p.meta.dateInfo) merged.meta.dateInfo = p.meta.dateInfo;

    (p.knowledge || []).forEach(c => {
      const id = c.entry && c.entry.id;
      if (id && seenKg.has(id)) return;
      if (id) seenKg.add(id);
      merged.knowledge.push(c);
    });
    (p.events || []).forEach(h => {
      const key = h.event && (h.event.year + '|' + h.event.title);
      if (seenEv.has(key)) return;
      seenEv.add(key);
      merged.events.push(h);
    });
    (p.zionist || []).forEach(h => {
      const key = h.card && h.card.concept;
      if (seenZ.has(key)) return;
      seenZ.add(key);
      merged.zionist.push(h);
    });
    (p.verses || []).forEach(h => {
      const key = h.verse && h.verse.reference;
      if (seenV.has(key)) return;
      seenV.add(key);
      merged.verses.push(h);
    });
    (p.suggestedELS || []).forEach(t => merged.suggestedELS.push(t));
  });

  merged.meta.hebrewForms = [...new Set(merged.meta.hebrewForms)];
  merged.meta.gematriaValues = [...new Set(merged.meta.gematriaValues)];
  merged.meta.numbers = [...new Set(merged.meta.numbers)];
  merged.knowledge.sort((a, b) => b.score - a.score);
  merged.events.sort((a, b) => b.score - a.score);
  merged.zionist.sort((a, b) => b.score - a.score);
  merged.suggestedELS = [...new Set(merged.suggestedELS)].slice(0, 10);
  return merged;
}

function ExploreCorrelationsSingle(query, database, Engine, options) {
  const meta = ResolveExploreQuery(query, Engine, options);

  const result = {
    query: meta.original,
    queryType: meta.queryType,
    meta,
    knowledge: [],
    events: [],
    zionist: [],
    verses: [],
    suggestedELS: []
  };

  if (!meta.original) return result;

  if (Engine && typeof Engine.FindCorrelations === 'function' && Array.isArray(database.KNOWLEDGE_GRAPH)) {
    const seen = new Set();
    meta.hebrewForms.forEach(he => {
      const clean = he.replace(/[^א-ת]/g, '');
      if (clean.length < 2) return;
      Engine.FindCorrelations(clean, database.KNOWLEDGE_GRAPH).forEach(corr => {
        const id = corr.entry && corr.entry.id;
        if (id && seen.has(id)) return;
        if (id) seen.add(id);
        result.knowledge.push(corr);
      });
    });
    if (meta.gematriaValues.length && meta.hebrewForms.length === 0) {
      database.KNOWLEDGE_GRAPH.forEach(entry => {
        const g = Engine.CalculateGematria(entry.hebrew);
        if (meta.gematriaValues.includes(g.absolute) || meta.numbers.includes(g.absolute)) {
          if (!seen.has(entry.id)) {
            seen.add(entry.id);
            result.knowledge.push({
              entry,
              gematria: g,
              score: 4,
              stars: 4,
              matches: [{ type: 'exact', desc: `Coincidencia de valor ${g.absolute}` }]
            });
          }
        }
      });
    }
    result.knowledge.sort((a, b) => b.score - a.score);
  }

  result.events = MatchHistoricalEvents(meta, database.HISTORICAL_EVENTS);
  result.zionist = MatchZionistCards(meta, database.ZIONIST_CORRELATIONS);
  result.verses = MatchTorahVerses(meta, database.TORAH_VERSES);

  if ((meta.queryType === 'event' || meta.queryType === 'text' || meta.queryType === 'concept') && database.HISTORICAL_EVENTS) {
    const q = meta.normalized;
    database.HISTORICAL_EVENTS.forEach(ev => {
      const title = NormalizeExploreQuery(ev.title);
      const desc = NormalizeExploreQuery(ev.desc);
      if (q.length >= 3 && (title.includes(q) || desc.includes(q) || q.split(' ').some(w => w.length >= 4 && title.includes(w)))) {
        const already = result.events.find(h => h.event === ev);
        if (!already) {
          result.events.push({ event: ev, score: 3, reasons: ['Búsqueda textual'] });
        }
      }
    });
    result.events.sort((a, b) => b.score - a.score);
  }

  // Prefer dictionary / primary hebrew for ELS suggestions
  if (meta.primaryHebrew && meta.primaryHebrew.length >= 2) {
    result.suggestedELS.push(meta.primaryHebrew);
  } else {
    meta.hebrewForms.forEach(he => {
      const clean = he.replace(/[^א-ת]/g, '');
      if (clean.length >= 2) result.suggestedELS.push(clean);
    });
  }
  result.events.slice(0, 3).forEach(h => {
    (h.event.searchTerms || []).forEach(t => {
      const clean = t.replace(/[^א-ת]/g, '');
      if (clean.length >= 2) result.suggestedELS.push(clean);
    });
  });
  result.suggestedELS = [...new Set(result.suggestedELS)].slice(0, 8);

  return result;
}

/**
 * Main API: ExploreCorrelations(query, db, Engine, options?)
 * Supports compound queries: "Herzl + 1897", "Cohen y 1948"
 */
function ExploreCorrelations(query, db, Engine, options) {
  const database = db || {};
  const original = String(query || '').trim();
  const parts = SplitCompoundExploreQuery(original);

  if (parts.length > 1) {
    const resolved = parts.map(p => ExploreCorrelationsSingle(p, database, Engine, options));
    return MergeExploreResults(resolved, original);
  }

  return ExploreCorrelationsSingle(original, database, Engine, options);
}

function ResolveNameToHebrew(raw, Engine, options) {
  const text = String(raw || '').trim();
  if (!text) return { hebrew: '', entry: null, gematria: null };
  const meta = ResolveExploreQuery(text, Engine, options);
  const hebrew = (meta.primaryHebrew || '').replace(/[^א-ת]/g, '');
  const gematria = hebrew && Engine && typeof Engine.CalculateGematria === 'function'
    ? Engine.CalculateGematria(hebrew)
    : null;
  return { hebrew, entry: meta.nameEntry || null, gematria, meta };
}

/**
 * Personal profile: given name + surname + birth date (+ optional extra term)
 * → unified correlation dossier.
 */
function BuildPersonalProfile(input, db, Engine, options) {
  const givenName = String((input && input.givenName) || '').trim();
  const surname = String((input && input.surname) || '').trim();
  const birthDate = String((input && input.birthDate) || '').trim();
  const extra = String((input && input.extra) || '').trim();

  const given = ResolveNameToHebrew(givenName, Engine, options);
  const family = ResolveNameToHebrew(surname, Engine, options);
  const fullHebrew = [given.hebrew, family.hebrew].filter(Boolean).join('');
  const fullGematria = fullHebrew && Engine && typeof Engine.CalculateGematria === 'function'
    ? Engine.CalculateGematria(fullHebrew)
    : null;
  const dateInfo = birthDate ? ParseDateQuery(birthDate) : null;

  const labelParts = [];
  if (givenName) labelParts.push(givenName);
  if (surname) labelParts.push(surname);
  const displayName = labelParts.join(' ') || 'Perfil';
  const queryLabel = birthDate ? `${displayName} · ${birthDate}` : displayName;

  const mergeParts = [];
  if (givenName) mergeParts.push(ExploreCorrelationsSingle(givenName, db || {}, Engine, options));
  if (surname) mergeParts.push(ExploreCorrelationsSingle(surname, db || {}, Engine, options));
  if (birthDate) mergeParts.push(ExploreCorrelationsSingle(birthDate, db || {}, Engine, options));
  if (extra) mergeParts.push(ExploreCorrelationsSingle(extra, db || {}, Engine, options));
  if (fullHebrew && fullHebrew.length >= 2) {
    mergeParts.push(ExploreCorrelationsSingle(fullHebrew, db || {}, Engine, options));
  }

  const merged = mergeParts.length
    ? MergeExploreResults(mergeParts, queryLabel)
    : {
        query: queryLabel,
        queryType: 'profile',
        meta: { original: queryLabel, hebrewForms: [], gematriaValues: [], numbers: [] },
        knowledge: [],
        events: [],
        zionist: [],
        verses: [],
        suggestedELS: []
      };

  merged.queryType = 'profile';
  merged.query = queryLabel;
  merged.profile = {
    givenName,
    surname,
    birthDate,
    extra,
    displayName,
    givenHebrew: given.hebrew,
    surnameHebrew: family.hebrew,
    fullHebrew,
    givenGematria: given.gematria,
    surnameGematria: family.gematria,
    fullGematria,
    dateInfo,
    givenEntry: given.entry,
    surnameEntry: family.entry
  };
  merged.meta = merged.meta || {};
  merged.meta.queryType = 'profile';
  merged.meta.primaryHebrew = fullHebrew || given.hebrew || family.hebrew || '';
  merged.meta.primaryGematria = fullGematria || given.gematria || family.gematria || null;
  merged.meta.dateInfo = dateInfo || merged.meta.dateInfo || null;
  merged.meta.nameEntry = family.entry || given.entry || merged.meta.nameEntry || null;

  if (fullHebrew && fullHebrew.length >= 2) {
    merged.suggestedELS = [fullHebrew, given.hebrew, family.hebrew]
      .concat(merged.suggestedELS || [])
      .filter(Boolean);
    merged.suggestedELS = [...new Set(merged.suggestedELS)].slice(0, 8);
  }

  return merged;
}

/**
 * Build a plain-text correlation report for download / sharing.
 */
function FormatCorrelationReport(data) {
  if (!data) return '';
  const lines = [];
  lines.push('═══════════════════════════════════════════');
  lines.push('  INFORME DE CORRELACIONES — GematriaDecipher');
  lines.push('═══════════════════════════════════════════');
  lines.push(`Consulta: ${data.query}`);
  lines.push(`Tipo: ${data.queryType}`);
  if (data.profile) {
    const p = data.profile;
    lines.push(`Nombre: ${p.displayName || [p.givenName, p.surname].filter(Boolean).join(' ')}`);
    if (p.givenHebrew) lines.push(`Nombre hebreo: ${p.givenHebrew}` + (p.givenGematria ? ` (Abs ${p.givenGematria.absolute})` : ''));
    if (p.surnameHebrew) lines.push(`Apellido hebreo: ${p.surnameHebrew}` + (p.surnameGematria ? ` (Abs ${p.surnameGematria.absolute})` : ''));
    if (p.fullHebrew && p.fullGematria) lines.push(`Nombre completo: ${p.fullHebrew} (Abs ${p.fullGematria.absolute} | Ord ${p.fullGematria.ordinal} | Red ${p.fullGematria.reduced})`);
    if (p.birthDate) {
      let fecha = `Nacimiento: ${p.birthDate}`;
      if (p.dateInfo && p.dateInfo.hebrewYearApprox) fecha += ` ≈ HE ~${p.dateInfo.hebrewYearApprox}`;
      lines.push(fecha);
    }
    if (p.extra) lines.push(`Término extra: ${p.extra}`);
  }
  if (data.meta && data.meta.primaryHebrew && !data.profile) lines.push(`Hebreo: ${data.meta.primaryHebrew}`);
  if (data.meta && data.meta.primaryGematria) {
    const g = data.meta.primaryGematria;
    lines.push(`Gematria: Abs ${g.absolute} | Ord ${g.ordinal} | Red ${g.reduced}`);
  }
  if (data.meta && data.meta.dateInfo) {
    lines.push(`Fecha: año ${data.meta.dateInfo.year}` + (data.meta.dateInfo.hebrewYearApprox ? ` ≈ HE ~${data.meta.dateInfo.hebrewYearApprox}` : ''));
  }
  lines.push('');

  if (data.events && data.events.length) {
    lines.push('— LÍNEA DE TIEMPO —');
    data.events.slice(0, 8).forEach(h => {
      lines.push(`• ${h.event.title} (${h.event.label})`);
      lines.push(`  ${h.event.desc}`);
      lines.push(`  Motivo: ${(h.reasons || []).join(', ')}`);
    });
    lines.push('');
  }

  if (data.knowledge && data.knowledge.length) {
    lines.push('— GRAFO DE CONOCIMIENTO —');
    data.knowledge.slice(0, 10).forEach(c => {
      lines.push(`• ${c.entry.hebrew} — ${c.entry.spanish} (${'★'.repeat(c.stars || 1)})`);
      const md = (c.matches || []).map(m => m.desc).join('; ');
      if (md) lines.push(`  ${md}`);
    });
    lines.push('');
  }

  if (data.zionist && data.zionist.length) {
    lines.push('— CORRELACIONES SIONISTAS —');
    data.zionist.slice(0, 6).forEach(h => {
      lines.push(`• ${h.card.concept} (${h.card.hebrew}) = ${h.card.gematria}`);
    });
    lines.push('');
  }

  if (data.verses && data.verses.length) {
    lines.push('— VERSÍCULOS —');
    data.verses.forEach(h => {
      lines.push(`• ${h.verse.reference} [gematria ${h.verse.gematria}]`);
      lines.push(`  ${h.verse.translation}`);
    });
    lines.push('');
  }

  if (data.suggestedELS && data.suggestedELS.length) {
    lines.push('— TÉRMINOS ELS SUGERIDOS —');
    lines.push(data.suggestedELS.join(', '));
    lines.push('');
  }

  lines.push(`Generado: ${new Date().toISOString()}`);
  lines.push('Torah Gematria Deciphering Tool');
  return lines.join('\n');
}

const GematriaExplore = {
  NAME_DICTIONARY,
  NormalizeExploreQuery,
  ParseDateQuery,
  LookupNameDictionary,
  MatchHistoricalEvents,
  MatchZionistCards,
  MatchTorahVerses,
  ResolveExploreQuery,
  SplitCompoundExploreQuery,
  MergeExploreResults,
  ExploreCorrelations,
  ExploreCorrelationsSingle,
  ResolveNameToHebrew,
  BuildPersonalProfile,
  FormatCorrelationReport
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GematriaExplore;
}
if (typeof window !== 'undefined') {
  window.GematriaExplore = GematriaExplore;
  window.ExploreCorrelations = ExploreCorrelations;
  window.ParseDateQuery = ParseDateQuery;
  window.FormatCorrelationReport = FormatCorrelationReport;
  window.BuildPersonalProfile = BuildPersonalProfile;
  window.NAME_DICTIONARY = NAME_DICTIONARY;
}
