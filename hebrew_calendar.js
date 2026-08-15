/**
 * hebrew_calendar.js — Calendario hebreo civil (computacional).
 * Conversión gregoriano ↔ hebreo sin dependencias.
 * Algoritmo: Calendrical Calculations (Dershowitz & Reingold) / Fourmilab.
 * Meses eclesiásticos: 1=Nisán … 7=Tishrei … 12=Adar (13=Adar II en año embolismal).
 */

const GREGORIAN_EPOCH = 1721425.5;
const HEBREW_EPOCH = 347995.5;
const GERESH = '׳';
const GERSHAYIM = '״';

const HEBREW_MONTHS = [
  null,
  { n: 1, id: 'nisan', es: 'Nisán', en: 'Nisan', he: 'ניסן', aliases: ['nisan', 'nisán', 'nissan'] },
  { n: 2, id: 'iyar', es: 'Iyar', en: 'Iyar', he: 'אייר', aliases: ['iyar', 'iyyar', 'iiar', 'iyiar'] },
  { n: 3, id: 'sivan', es: 'Siván', en: 'Sivan', he: 'סיון', aliases: ['sivan', 'siván'] },
  { n: 4, id: 'tammuz', es: 'Tamuz', en: 'Tammuz', he: 'תמוז', aliases: ['tammuz', 'tamuz', 'tamuz'] },
  { n: 5, id: 'av', es: 'Av', en: 'Av', he: 'אב', aliases: ['av', 'ab', 'menajem av', 'menachem av'] },
  { n: 6, id: 'elul', es: 'Elul', en: 'Elul', he: 'אלול', aliases: ['elul', 'elul'] },
  { n: 7, id: 'tishrei', es: 'Tishrei', en: 'Tishrei', he: 'תשרי', aliases: ['tishrei', 'tishri', 'tishré', 'tishre'] },
  { n: 8, id: 'cheshvan', es: 'Jeshván', en: 'Cheshvan', he: 'חשון', aliases: ['cheshvan', 'heshvan', 'jeshvan', 'marcheshvan', 'marheshvan'] },
  { n: 9, id: 'kislev', es: 'Kislev', en: 'Kislev', he: 'כסלו', aliases: ['kislev', 'kislev'] },
  { n: 10, id: 'tevet', es: 'Tevet', en: 'Tevet', he: 'טבת', aliases: ['tevet', 'tebeth', 'tevet'] },
  { n: 11, id: 'shevat', es: 'Shevat', en: 'Shevat', he: 'שבט', aliases: ['shevat', 'shvat', 'shevat'] },
  { n: 12, id: 'adar', es: 'Adar', en: 'Adar', he: 'אדר', aliases: ['adar'] },
  { n: 13, id: 'adar2', es: 'Adar II', en: 'Adar II', he: 'אדר ב׳', aliases: ['adar ii', 'adar 2', 'adar bet', 'adar b', 'adar sheni'] }
];

function IsGregorianLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function Mod(a, b) {
  return ((a % b) + b) % b;
}

function GregorianToJD(year, month, day) {
  return (GREGORIAN_EPOCH - 1) +
    365 * (year - 1) +
    Math.floor((year - 1) / 4) -
    Math.floor((year - 1) / 100) +
    Math.floor((year - 1) / 400) +
    Math.floor((((367 * month) - 362) / 12) +
      (month <= 2 ? 0 : (IsGregorianLeap(year) ? -1 : -2)) +
      day);
}

function JDToGregorian(jd) {
  const wjd = Math.floor(jd - 0.5) + 0.5;
  const depoch = wjd - GREGORIAN_EPOCH;
  const quadricent = Math.floor(depoch / 146097);
  const dqc = Mod(depoch, 146097);
  const cent = Math.floor(dqc / 36524);
  const dcent = Mod(dqc, 36524);
  const quad = Math.floor(dcent / 1461);
  const dquad = Mod(dcent, 1461);
  const yindex = Math.floor(dquad / 365);
  let year = (quadricent * 400) + (cent * 100) + (quad * 4) + yindex;
  if (!(cent === 4 || yindex === 4)) year++;
  const yearday = wjd - GregorianToJD(year, 1, 1);
  const leapadj = (wjd < GregorianToJD(year, 3, 1)) ? 0 : (IsGregorianLeap(year) ? 1 : 2);
  const month = Math.floor((((yearday + leapadj) * 12) + 373) / 367);
  const day = (wjd - GregorianToJD(year, month, 1)) + 1;
  return { year, month, day };
}

function HebrewLeap(year) {
  return ((year * 7) + 1) % 19 < 7;
}

function HebrewYearMonths(year) {
  return HebrewLeap(year) ? 13 : 12;
}

function HebrewDelay1(year) {
  const months = Math.floor(((235 * year) - 234) / 19);
  const parts = 12084 + (13753 * months);
  let day = (months * 29) + Math.floor(parts / 25920);
  if ((3 * (day + 1)) % 7 < 3) day++;
  return day;
}

function HebrewDelay2(year) {
  const last = HebrewDelay1(year - 1);
  const present = HebrewDelay1(year);
  const next = HebrewDelay1(year + 1);
  if (next - present === 356) return 2;
  if (present - last === 382) return 1;
  return 0;
}

function HebrewToJD(year, month, day) {
  const months = HebrewYearMonths(year);
  let jd = HEBREW_EPOCH + HebrewDelay1(year) + HebrewDelay2(year) + day + 1;
  if (month < 7) {
    for (let mon = 7; mon <= months; mon++) jd += HebrewMonthDays(year, mon);
    for (let mon = 1; mon < month; mon++) jd += HebrewMonthDays(year, mon);
  } else {
    for (let mon = 7; mon < month; mon++) jd += HebrewMonthDays(year, mon);
  }
  return jd;
}

function HebrewYearDays(year) {
  return HebrewToJD(year + 1, 7, 1) - HebrewToJD(year, 7, 1);
}

function HebrewMonthDays(year, month) {
  if (month === 2 || month === 4 || month === 6 || month === 10 || month === 13) return 29;
  if (month === 12 && !HebrewLeap(year)) return 29;
  if (month === 8 && (HebrewYearDays(year) % 10 !== 5)) return 29;
  if (month === 9 && (HebrewYearDays(year) % 10 === 3)) return 29;
  return 30;
}

function JDToHebrew(jd) {
  jd = Math.floor(jd) + 0.5;
  const count = Math.floor(((jd - HEBREW_EPOCH) * 98496.0) / 35975351.0);
  let year = count - 1;
  for (let i = count; i < count + 6 && jd >= HebrewToJD(i, 7, 1); i++) {
    year = i;
  }
  const first = (jd < HebrewToJD(year, 1, 1)) ? 7 : 1;
  const lastMonth = HebrewYearMonths(year);
  let month = first;
  while (month < lastMonth && jd > HebrewToJD(year, month, HebrewMonthDays(year, month))) {
    month++;
  }
  const day = jd - HebrewToJD(year, month, 1) + 1;
  return { year, month, day };
}

function NormalizeMonthKey(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[׳״'"''`]/g, '')
    .replace(/\s+/g, ' ');
}

function LookupHebrewMonth(raw, hebrewYear) {
  const q = NormalizeMonthKey(raw);
  if (!q) return null;
  if (q === 'adar i' || q === 'adar 1' || q === 'adar alef' || q === 'adar a' || q === 'adar rishon') {
    return HEBREW_MONTHS[12];
  }
  if (q === 'adar ii' || q === 'adar 2' || q === 'adar bet' || q === 'adar b' || q === 'adar sheni') {
    return HEBREW_MONTHS[13];
  }
  for (let i = 1; i <= 13; i++) {
    const m = HEBREW_MONTHS[i];
    if (NormalizeMonthKey(m.es) === q || NormalizeMonthKey(m.en) === q || m.he.replace(/[׳״\s]/g, '') === raw.replace(/[׳״\s]/g, '')) {
      return monthRecord(m, hebrewYear);
    }
    for (const alias of m.aliases) {
      if (NormalizeMonthKey(alias) === q) return monthRecord(m, hebrewYear);
    }
  }
  return null;
}

function monthRecord(m, hebrewYear) {
  if (m.n === 12 && hebrewYear && HebrewLeap(hebrewYear)) {
    return Object.assign({}, m, { es: 'Adar I', en: 'Adar I', he: 'אדר א׳' });
  }
  if (m.n === 13 && hebrewYear && !HebrewLeap(hebrewYear)) {
    return HEBREW_MONTHS[12];
  }
  return m;
}

function NumberToHebrewLetters(n, options) {
  n = Math.abs(Math.floor(Number(n) || 0));
  if (!n) return '';
  const omitThousands = options && options.omitThousands;
  const noMarks = options && options.noMarks;
  const thousands = Math.floor(n / 1000);
  let rest = n % 1000;
  let prefix = '';
  if (thousands && !omitThousands) {
    prefix = NumberToHebrewLetters(thousands, { omitThousands: true, noMarks: true }) + GERESH;
  }
  const vals = [
    [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'],
    [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'],
    [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'],
    [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']
  ];
  let letters = '';
  for (let i = 0; i < vals.length; i++) {
    while (rest >= vals[i][0]) {
      letters += vals[i][1];
      rest -= vals[i][0];
    }
  }
  letters = letters.replace(/יה$/, 'טו').replace(/יו$/, 'טז');
  if (!noMarks) {
    if (letters.length >= 2) {
      letters = letters.slice(0, -1) + GERSHAYIM + letters.slice(-1);
    } else if (letters.length === 1) {
      letters += GERESH;
    }
  }
  return prefix + letters;
}

function MonthMeta(month, hebrewYear) {
  const base = HEBREW_MONTHS[month] || HEBREW_MONTHS[1];
  if (month === 12 && hebrewYear && HebrewLeap(hebrewYear)) {
    return { n: 12, id: 'adar1', es: 'Adar I', en: 'Adar I', he: 'אדר א׳' };
  }
  return base;
}

function BuildHebrewDate(year, month, day) {
  const meta = MonthMeta(month, year);
  const yearLettersShort = NumberToHebrewLetters(year % 1000);
  const yearLetters = NumberToHebrewLetters(year);
  const dayLetters = NumberToHebrewLetters(day);
  const formatted = `${day} de ${meta.es} de ${year}`;
  const formattedHe = `${dayLetters} ב${meta.he} ${yearLetters}`;
  return {
    year,
    month,
    day,
    monthId: meta.id,
    monthName: meta.en,
    monthNameEs: meta.es,
    monthNameHe: meta.he,
    isLeap: HebrewLeap(year),
    yearLetters,
    yearLettersShort,
    dayLetters,
    formatted,
    formattedHe
  };
}

function GregorianToHebrew(year, month, day) {
  year = parseInt(year, 10);
  month = parseInt(month, 10);
  day = parseInt(day, 10);
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const jd = GregorianToJD(year, month, day);
  if (!isFinite(jd)) return null;
  const h = JDToHebrew(jd);
  return BuildHebrewDate(h.year, h.month, Math.round(h.day));
}

function HebrewToGregorian(year, month, day) {
  year = parseInt(year, 10);
  month = parseInt(month, 10);
  day = parseInt(day, 10);
  if (!year || !month || !day) return null;
  if (month < 1 || month > 13) return null;
  const last = HebrewMonthDays(year, month);
  if (day < 1 || day > last) return null;
  return JDToGregorian(HebrewToJD(year, month, day));
}

function HebrewYearRangeForCivilYear(civilYear) {
  civilYear = parseInt(civilYear, 10);
  if (!civilYear || civilYear <= 0) return null;
  const start = GregorianToHebrew(civilYear, 1, 1);
  const end = GregorianToHebrew(civilYear, 12, 31);
  if (!start || !end) return null;
  return {
    yearStart: start.year,
    yearEnd: end.year,
    start,
    end,
    formatted: start.year === end.year ? String(start.year) : `${start.year}–${end.year}`
  };
}

function FormatHebrewDate(h) {
  if (!h) return '';
  if (h.formatted && h.formattedHe) return `${h.formatted} · ${h.formattedHe}`;
  if (h.formatted) return h.formatted;
  if (h.yearStart && h.yearEnd) {
    return h.yearStart === h.yearEnd ? String(h.yearStart) : `${h.yearStart}–${h.yearEnd}`;
  }
  return h.year ? String(h.year) : '';
}

/**
 * Parse a Hebrew date in Latin script, e.g. "5 Iyar 5708", "5 de Iyar, 5708".
 */
function ParseHebrewDate(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  let m = text.match(/^(\d{1,2})\s+(?:de\s+)?([A-Za-zÁÉÍÓÚáéíóúÑñüÜ׳״'" ]+?)\s*,?\s*(\d{3,4})$/);
  if (!m) m = text.match(/^(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\s+(\d{3,4})$/);
  if (!m) return null;

  const day = parseInt(m[1], 10);
  const hy = parseInt(m[3], 10);
  const monthInfo = LookupHebrewMonth(m[2], hy);
  if (!monthInfo) return null;

  let month = monthInfo.n;
  if (month === 13 && !HebrewLeap(hy)) month = 12;
  if (month === 12 && HebrewLeap(hy) && !/ii|2|bet|sheni/i.test(m[2]) && !/i\b|1|alef|rishon/i.test(NormalizeMonthKey(m[2]))) {
    month = 13;
  }

  const greg = HebrewToGregorian(hy, month, day);
  if (!greg) return null;
  const hebrew = BuildHebrewDate(hy, month, day);
  return { gregorian: greg, hebrew };
}

const GematriaHebrewCalendar = {
  HEBREW_MONTHS,
  IsGregorianLeap,
  HebrewLeap,
  GregorianToJD,
  JDToGregorian,
  HebrewToJD,
  JDToHebrew,
  GregorianToHebrew,
  HebrewToGregorian,
  HebrewYearRangeForCivilYear,
  NumberToHebrewLetters,
  LookupHebrewMonth,
  ParseHebrewDate,
  FormatHebrewDate,
  BuildHebrewDate
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GematriaHebrewCalendar;
}
if (typeof window !== 'undefined') {
  window.GematriaHebrewCalendar = GematriaHebrewCalendar;
}
