#!/usr/bin/env node
/**
 * Fetches the five Torah books from Sefaria (WLC-based Hebrew) and writes
 * torah_text.js: consonantal tape + verse map. Re-run when refreshing the corpus.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const BOOKS = [
  { key: 'genesis', sefaria: 'Genesis', label: 'Génesis' },
  { key: 'exodus', sefaria: 'Exodus', label: 'Éxodo' },
  { key: 'leviticus', sefaria: 'Leviticus', label: 'Levítico' },
  { key: 'numbers', sefaria: 'Numbers', label: 'Números' },
  { key: 'deuteronomy', sefaria: 'Deuteronomy', label: 'Deuteronomio' }
];

function consonants(text) {
  const raw = flatten(text).replace(/<[^>]+>/g, '');
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code === 0x0E1A) { out += 'ב'; continue; }
    if (code >= 0x05D0 && code <= 0x05EA) out += raw[i];
  }
  return out;
}

function flatten(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(flatten).join('');
  return String(v);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TorahGematriaTool/1.0 (corpus builder)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(url + ' → HTTP ' + res.statusCode));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function parseBook(payload) {
  const chapters = payload.he || [];
  const verses = [];
  let letters = '';
  chapters.forEach((ch, chIdx) => {
    const list = Array.isArray(ch) ? ch : [ch];
    list.forEach((v, vIdx) => {
      const cons = consonants(v);
      if (!cons) return;
      verses.push({
        chapter: chIdx + 1,
        verse: vIdx + 1,
        start: letters.length,
        length: cons.length
      });
      letters += cons;
    });
  });
  return { letters, verses, license: payload.heLicense || payload.license || '' };
}

function findEls(text, word, skip) {
  const hits = [];
  const k = word.length;
  if (!text || k < 2) return hits;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== word[0]) continue;
    let ok = true;
    const idx = [i];
    for (let c = 1; c < k; c++) {
      const j = i + c * skip;
      if (j < 0 || j >= text.length || text[j] !== word[c]) { ok = false; break; }
      idx.push(j);
    }
    if (ok) hits.push({ start: i, skip, indices: idx });
  }
  return hits;
}

async function main() {
  const books = {};
  const verseMap = [];
  let offset = 0;

  for (let b = 0; b < BOOKS.length; b++) {
    const meta = BOOKS[b];
    const url = 'https://www.sefaria.org/api/texts/' + meta.sefaria + '?context=0&pad=0&commentary=0';
    process.stderr.write('Fetching ' + meta.sefaria + '…\n');
    const json = await fetchJson(url);
    const parsed = parseBook(json);
    books[meta.key] = parsed.letters;
    parsed.verses.forEach((v) => {
      verseMap.push([v.start + offset, b, v.chapter, v.verse]);
    });
    process.stderr.write(
      '  ' + meta.label + ': ' + parsed.letters.length + ' letters, ' +
      parsed.verses.length + ' verses, license=' + (parsed.license || '?') + '\n'
    );
    offset += parsed.letters.length;
  }

  const genesis = books.genesis;
  const exodus = books.exodus;
  const genClassic = findEls(genesis, 'תורה', 50).find((h) => h.start === 5);
  if (!genClassic) {
    const near = findEls(genesis, 'תורה', 50).slice(0, 5);
    throw new Error('Classic Genesis תורה@50 start=5 missing. Nearby: ' + JSON.stringify(near));
  }
  const exoHits = findEls(exodus, 'תורה', 50);
  const firstTav = exodus.indexOf('ת');
  const exoFromFirstTav = exoHits.find((h) => h.start === firstTav);
  process.stderr.write('Genesis תורה@50 start=5: ok\n');
  process.stderr.write(
    'Exodus first ת at ' + firstTav + '; תורה@50 hits=' + exoHits.length +
    '; from first ת: ' + (exoFromFirstTav ? 'yes start=' + exoFromFirstTav.start : 'no') +
    (exoHits[0] ? '; earliest start=' + exoHits[0].start : '') + '\n'
  );

  const lookupSrc = fs.readFileSync(path.join(__dirname, '..', 'torah_text.js'), 'utf8');
  const lookupStart = lookupSrc.indexOf('function LookupTorahVerse');
  const lookupEnd = lookupSrc.indexOf('\nif (typeof module');
  if (lookupStart < 0 || lookupEnd < 0) {
    throw new Error('Could not locate LookupTorahVerse block in existing torah_text.js');
  }
  const lookupBlock = lookupSrc.slice(lookupStart, lookupEnd).trim();

  const rawObj = {
    genesis: books.genesis,
    exodus: books.exodus,
    leviticus: books.leviticus,
    numbers: books.numbers,
    deuteronomy: books.deuteronomy
  };

  const header = `/**
 * torah_text.js - Consonantal Hebrew Corpus of the 5 Books of the Torah
 * (Genesis, Exodus, Leviticus, Numbers, Deuteronomy)
 *
 * Corpus is consonantal only (U+05D0–U+05EA). SanitizeHebrewConsonants runs at
 * module load so spaces, niqqud, and foreign glyphs cannot enter TORAH_TEXT.
 * Complete five-book tape from Sefaria Hebrew Torah (WLC). Generated by
 * scripts/build_torah_corpus.js — do not hand-edit the letter strings.
 */

function SanitizeHebrewConsonantsLocal(text) {
  if (!text || typeof text !== 'string') return '';
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const code = c.charCodeAt(0);
    if (code === 0x0E1A) { out += 'ב'; continue; }
    if (code >= 0x05D0 && code <= 0x05EA) out += c;
  }
  return out;
}

const TORAH_CORPUS_META = {
  source: 'Sefaria Hebrew Torah (WLC)',
  sourceUrl: 'https://www.sefaria.org',
  complete: true,
  generated: '${new Date().toISOString().slice(0, 10)}',
  letterCount: ${offset}
};

const TORAH_BOOKS_RAW = ${JSON.stringify(rawObj, null, 0)};

const TORAH_BOOKS = {
  genesis: SanitizeHebrewConsonantsLocal(TORAH_BOOKS_RAW.genesis),
  exodus: SanitizeHebrewConsonantsLocal(TORAH_BOOKS_RAW.exodus),
  leviticus: SanitizeHebrewConsonantsLocal(TORAH_BOOKS_RAW.leviticus),
  numbers: SanitizeHebrewConsonantsLocal(TORAH_BOOKS_RAW.numbers),
  deuteronomy: SanitizeHebrewConsonantsLocal(TORAH_BOOKS_RAW.deuteronomy)
};

const TORAH_TEXT = TORAH_BOOKS.genesis + TORAH_BOOKS.exodus + TORAH_BOOKS.leviticus + TORAH_BOOKS.numbers + TORAH_BOOKS.deuteronomy;

const TORAH_BOOK_OFFSETS = (function () {
  const order = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy'];
  const labels = {
    genesis: 'Génesis',
    exodus: 'Éxodo',
    leviticus: 'Levítico',
    numbers: 'Números',
    deuteronomy: 'Deuteronomio'
  };
  let offset = 0;
  return order.map((key) => {
    const length = TORAH_BOOKS[key].length;
    const entry = { key, label: labels[key], offset, length };
    offset += length;
    return entry;
  });
})();

/**
 * Compact verse map: [startIndex, bookIdx, chapter, verse]
 * Covers every letter of TORAH_TEXT (contiguous ranges). Aligned to WLC
 * consonants via Sefaria chapter/verse boundaries.
 */
const TORAH_VERSE_MAP = ${JSON.stringify(verseMap)};

`;

  const footer = `

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TORAH_TEXT,
    TORAH_BOOKS,
    TORAH_BOOK_OFFSETS,
    TORAH_VERSE_MAP,
    TORAH_CORPUS_META,
    SanitizeHebrewConsonantsLocal,
    LookupTorahVerse,
    LookupTorahVerseSpan
  };
}
if (typeof window !== 'undefined') {
  window.TORAH_TEXT = TORAH_TEXT;
  window.TorahText = TORAH_TEXT;
  window.TORAH_BOOKS = TORAH_BOOKS;
  window.TORAH_BOOK_OFFSETS = TORAH_BOOK_OFFSETS;
  window.TORAH_VERSE_MAP = TORAH_VERSE_MAP;
  window.TORAH_CORPUS_META = TORAH_CORPUS_META;
  window.LookupTorahVerse = LookupTorahVerse;
  window.LookupTorahVerseSpan = LookupTorahVerseSpan;
}
`;

  const outPath = path.join(__dirname, '..', 'torah_text.js');
  fs.writeFileSync(outPath, header + lookupBlock + footer);
  process.stderr.write('Wrote ' + outPath + ' (' + offset + ' letters, ' + verseMap.length + ' verses)\n');
  console.log(JSON.stringify({
    letterCount: offset,
    verses: verseMap.length,
    genesis: books.genesis.length,
    exodus: books.exodus.length,
    leviticus: books.leviticus.length,
    numbers: books.numbers.length,
    deuteronomy: books.deuteronomy.length,
    genesisClassic: true,
    exodusTorah50: exoHits.map((h) => h.start).slice(0, 8),
    exodusFirstTav: firstTav,
    exodusFromFirstTav: !!exoFromFirstTav
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
