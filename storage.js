/**
 * storage.js — LocalStorage manager for Favorites, search history, and the live name dictionary.
 * Contract (PROJECT.md): SaveFavorite / GetFavorites / RemoveFavorite
 * In Node (no localStorage) uses an in-memory store so persistence logic is the same as in the browser.
 */

const FAVORITES_KEY = 'els_favorites';
const ELS_HISTORY_KEY = 'els_search_history';
const EXPLORE_HISTORY_KEY = 'explore_search_history';
const USER_NAME_DICTIONARY_KEY = 'name_dictionary_user';
const MAX_FAVORITES = 50;
const MAX_HISTORY = 8;
const MAX_EXPLORE_HISTORY = 10;
const MAX_USER_NAMES = 200;

const memoryStore = Object.create(null);

function getStore() {
  if (typeof localStorage !== 'undefined') return localStorage;
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    },
    setItem(key, value) {
      memoryStore[key] = String(value);
    },
    removeItem(key) {
      delete memoryStore[key];
    }
  };
}

function readJsonArray(key) {
  try {
    const raw = getStore().getItem(key);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeJson(key, value) {
  try {
    getStore().setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function GetFavorites() {
  return readJsonArray(FAVORITES_KEY);
}

function SaveFavorite(item) {
  if (!item || typeof item !== 'object') return GetFavorites();
  const favs = GetFavorites();
  const id = item.id || `${item.word || ''}|${item.skip}|${item.start}`;
  const already = favs.find(f =>
    (f.id && f.id === id) ||
    (f.word === item.word && f.skip === item.skip && f.start === item.start)
  );
  if (already) return favs;

  const entry = {
    id,
    type: item.type || 'els',
    title: item.title || item.word || 'ELS',
    data: item.data || item,
    timestamp: item.timestamp || item.savedAt || new Date().toISOString(),
    // Flat ELS fields kept for existing UI consumers
    word: item.word,
    skip: item.skip,
    start: item.start,
    indices: item.indices,
    pValue: item.pValue,
    significanceScore: item.significanceScore,
    verse: item.verse,
    savedAt: item.savedAt || new Date().toISOString()
  };
  favs.unshift(entry);
  while (favs.length > MAX_FAVORITES) favs.pop();
  writeJson(FAVORITES_KEY, favs);
  return favs;
}

function RemoveFavorite(id) {
  let favs = GetFavorites();
  if (typeof id === 'number') {
    favs.splice(id, 1);
  } else {
    favs = favs.filter(f => f.id !== id && `${f.word}|${f.skip}|${f.start}` !== id);
  }
  writeJson(FAVORITES_KEY, favs);
  return favs;
}

function ClearFavorites() {
  try {
    getStore().removeItem(FAVORITES_KEY);
  } catch (e) {}
}

function GetELSSearchHistory() {
  return readJsonArray(ELS_HISTORY_KEY);
}

function SaveELSSearchHistory(query) {
  if (!query || query.trim().length === 0) return GetELSSearchHistory();
  let history = GetELSSearchHistory();
  history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  writeJson(ELS_HISTORY_KEY, history);
  return history;
}

function ClearELSSearchHistory() {
  try {
    getStore().removeItem(ELS_HISTORY_KEY);
  } catch (e) {}
}

function GetExploreHistory() {
  return readJsonArray(EXPLORE_HISTORY_KEY);
}

function SaveExploreHistory(query) {
  if (!query || String(query).trim().length === 0) return GetExploreHistory();
  let history = GetExploreHistory();
  const q = String(query).trim();
  history = history.filter(item => item.toLowerCase() !== q.toLowerCase());
  history.unshift(q);
  if (history.length > MAX_EXPLORE_HISTORY) history = history.slice(0, MAX_EXPLORE_HISTORY);
  writeJson(EXPLORE_HISTORY_KEY, history);
  return history;
}

function ClearExploreHistory() {
  try {
    getStore().removeItem(EXPLORE_HISTORY_KEY);
  } catch (e) {}
}

function sanitizeUserNameEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const spanish = Array.isArray(raw.spanish)
    ? raw.spanish.map(a => String(a || '').trim()).filter(Boolean)
    : String(raw.spanish || '').split(/[,;/]/).map(a => a.trim()).filter(Boolean);
  const hebrew = String(raw.hebrew || '').replace(/[^\u05D0-\u05EA\s]/g, '').replace(/\s+/g, ' ').trim();
  const consonants = hebrew.replace(/[^א-ת]/g, '');
  if (spanish.length === 0 || consonants.length < 2) return null;
  const kind = (raw.kind === 'apellido' || raw.kind === 'concepto') ? raw.kind : 'nombre';
  const id = String(raw.id || '').trim() || ('user:' + spanish[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  return {
    id,
    spanish,
    hebrew,
    kind,
    note: String(raw.note || '').trim(),
    label: String(raw.label || spanish[0]).trim(),
    source: 'user',
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null
  };
}

function GetUserNameDictionary() {
  return readJsonArray(USER_NAME_DICTIONARY_KEY)
    .map(sanitizeUserNameEntry)
    .filter(Boolean);
}

function SaveUserNameEntry(raw) {
  const entry = sanitizeUserNameEntry(raw);
  if (!entry) {
    return { ok: false, error: 'Indica un alias en español y al menos 2 consonantes hebreas.', list: GetUserNameDictionary() };
  }
  const list = GetUserNameDictionary();
  const idx = list.findIndex(e => e.id === entry.id);
  const now = new Date().toISOString();
  entry.createdAt = (idx >= 0 && list[idx].createdAt) || raw.createdAt || now;
  entry.updatedAt = now;
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    if (list.length >= MAX_USER_NAMES) {
      return { ok: false, error: `Límite de ${MAX_USER_NAMES} nombres personales.`, list };
    }
    list.unshift(entry);
  }
  writeJson(USER_NAME_DICTIONARY_KEY, list);
  return { ok: true, entry, list };
}

function RemoveUserNameEntry(id) {
  const key = String(id || '');
  const list = GetUserNameDictionary().filter(e => e.id !== key);
  writeJson(USER_NAME_DICTIONARY_KEY, list);
  return list;
}

function ClearUserNameDictionary() {
  try {
    getStore().removeItem(USER_NAME_DICTIONARY_KEY);
  } catch (e) {}
  return [];
}

const PERSONAL_PROFILE_KEY = 'explore_personal_profile';

function GetPersonalProfileForm() {
  try {
    const parsed = JSON.parse(getStore().getItem(PERSONAL_PROFILE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      givenName: String(parsed.givenName || ''),
      surname: String(parsed.surname || ''),
      birthDate: String(parsed.birthDate || ''),
      extra: String(parsed.extra || '')
    };
  } catch (e) {
    return null;
  }
}

function SavePersonalProfileForm(form) {
  const entry = {
    givenName: String((form && form.givenName) || '').trim(),
    surname: String((form && form.surname) || '').trim(),
    birthDate: String((form && form.birthDate) || '').trim(),
    extra: String((form && form.extra) || '').trim()
  };
  writeJson(PERSONAL_PROFILE_KEY, entry);
  return entry;
}

const GematriaStorage = {
  SaveFavorite,
  GetFavorites,
  RemoveFavorite,
  ClearFavorites,
  GetELSSearchHistory,
  SaveELSSearchHistory,
  ClearELSSearchHistory,
  GetExploreHistory,
  SaveExploreHistory,
  ClearExploreHistory,
  GetUserNameDictionary,
  SaveUserNameEntry,
  RemoveUserNameEntry,
  ClearUserNameDictionary,
  GetPersonalProfileForm,
  SavePersonalProfileForm,
  MAX_USER_NAMES
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GematriaStorage;
}
if (typeof window !== 'undefined') {
  window.GematriaStorage = GematriaStorage;
  // Convenience aliases matching PROJECT.md casing
  window.SaveFavorite = SaveFavorite;
  window.GetFavorites = GetFavorites;
  window.RemoveFavorite = RemoveFavorite;
}
