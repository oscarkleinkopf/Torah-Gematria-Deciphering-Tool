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
  { id: 'oslo', spanish: ['oslo', 'acuerdos de oslo'], hebrew: 'אוסלו', kind: 'concepto', note: 'Acuerdos de Oslo 1993' }
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

  // Pure number → inverse lookup
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
    // Also treat reductions as soft gematria candidates for small values
    meta.gematriaValues = dateInfo.reductions.filter(r => r >= 10);
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

  // Phonetic Spanish → Hebrew
  if (Engine && typeof Engine.SpanishToHebrew === 'function' && /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(original)) {
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
      // Prefer absolute values for historical matching; keep full set for KG scoring
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

  // Event title detection (soft): if query looks like event keywords
  const eventHints = ['oslo', 'balfour', 'templo', 'aliya', 'aliyá', 'basilea', 'independencia', 'seis dias', 'camp david', 'sinaí', 'sinai', 'betar', 'expulsion', 'españa'];
  if (eventHints.some(h => normalized.includes(h))) {
    meta.queryType = meta.queryType === 'text' ? 'event' : meta.queryType;
  }

  return meta;
}

/**
 * Main API: ExploreCorrelations(query, db, Engine, options?)
 */
function ExploreCorrelations(query, db, Engine, options) {
  const database = db || {};
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

  // Knowledge graph via FindCorrelations for each hebrew form
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
    // Also match KG by gematria value alone (inverse)
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

  // Soft event title search when queryType is event/text
  if ((meta.queryType === 'event' || meta.queryType === 'text') && database.HISTORICAL_EVENTS) {
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

  // Suggested ELS terms
  meta.hebrewForms.forEach(he => {
    const clean = he.replace(/[^א-ת]/g, '');
    if (clean.length >= 2) result.suggestedELS.push(clean);
  });
  result.events.slice(0, 3).forEach(h => {
    (h.event.searchTerms || []).forEach(t => {
      const clean = t.replace(/[^א-ת]/g, '');
      if (clean.length >= 2) result.suggestedELS.push(clean);
    });
  });
  result.suggestedELS = [...new Set(result.suggestedELS)].slice(0, 8);

  return result;
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
  ExploreCorrelations
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GematriaExplore;
}
if (typeof window !== 'undefined') {
  window.GematriaExplore = GematriaExplore;
  window.ExploreCorrelations = ExploreCorrelations;
  window.ParseDateQuery = ParseDateQuery;
  window.NAME_DICTIONARY = NAME_DICTIONARY;
}
