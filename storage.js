/**
 * storage.js — LocalStorage manager for Favorites and ELS search history.
 * Contract (PROJECT.md): SaveFavorite / GetFavorites / RemoveFavorite
 */

const FAVORITES_KEY = 'els_favorites';
const ELS_HISTORY_KEY = 'els_search_history';
const EXPLORE_HISTORY_KEY = 'explore_search_history';
const MAX_FAVORITES = 50;
const MAX_HISTORY = 8;
const MAX_EXPLORE_HISTORY = 10;

function GetFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch (e) {
    return [];
  }
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
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {}
  return favs;
}

function RemoveFavorite(id) {
  let favs = GetFavorites();
  if (typeof id === 'number') {
    favs.splice(id, 1);
  } else {
    favs = favs.filter(f => f.id !== id && `${f.word}|${f.skip}|${f.start}` !== id);
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {}
  return favs;
}

function ClearFavorites() {
  try {
    localStorage.removeItem(FAVORITES_KEY);
  } catch (e) {}
}

function GetELSSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(ELS_HISTORY_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function SaveELSSearchHistory(query) {
  if (!query || query.trim().length === 0) return GetELSSearchHistory();
  let history = GetELSSearchHistory();
  history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(ELS_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
  return history;
}

function ClearELSSearchHistory() {
  try {
    localStorage.removeItem(ELS_HISTORY_KEY);
  } catch (e) {}
}

function GetExploreHistory() {
  try {
    return JSON.parse(localStorage.getItem(EXPLORE_HISTORY_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function SaveExploreHistory(query) {
  if (!query || String(query).trim().length === 0) return GetExploreHistory();
  let history = GetExploreHistory();
  const q = String(query).trim();
  history = history.filter(item => item.toLowerCase() !== q.toLowerCase());
  history.unshift(q);
  if (history.length > MAX_EXPLORE_HISTORY) history = history.slice(0, MAX_EXPLORE_HISTORY);
  try {
    localStorage.setItem(EXPLORE_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
  return history;
}

function ClearExploreHistory() {
  try {
    localStorage.removeItem(EXPLORE_HISTORY_KEY);
  } catch (e) {}
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
  ClearExploreHistory
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
