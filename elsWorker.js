/**
 * elsWorker.js - Multithreaded ELS Worker for Browser Web Workers and Node.js worker_threads
 * Milestone M2 Implementation Component
 */

let isNodeWorker = false;
let parentPort = null;

try {
  const workerThreads = require('worker_threads');
  if (workerThreads.parentPort) {
    isNodeWorker = true;
    parentPort = workerThreads.parentPort;
  }
} catch (e) {
  // Browser Web Worker context
}

// Global scope polyfill
const _global = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis);
if (typeof self !== 'undefined' && typeof self.window === 'undefined') {
  self.window = self;
}

let Engine = null;
let TorahModule = null;

// Module / Script Loading
if (isNodeWorker || typeof require === 'function') {
  try {
    Engine = require('./gematria.js');
  } catch (e) {
    console.error('[elsWorker] Error requiring gematria.js:', e);
  }
  try {
    TorahModule = require('./torah_text.js');
  } catch (e) {
    console.error('[elsWorker] Error requiring torah_text.js:', e);
  }
}

if (!Engine && typeof importScripts === 'function') {
  try {
    importScripts('gematria.js');
    Engine = _global.GematriaEngine || {
      FindELS: _global.FindELS,
      CalculateLetterFrequencies: _global.CalculateLetterFrequencies,
      CalculateELSPValue: _global.CalculateELSPValue
    };
  } catch (e) {
    console.error('[elsWorker] Error importScripts gematria.js:', e);
  }
  try {
    importScripts('torah_text.js');
    TorahModule = {
      TORAH_TEXT: _global.TORAH_TEXT || _global.TorahText,
      TORAH_BOOKS: _global.TORAH_BOOKS
    };
  } catch (e) {
    console.error('[elsWorker] Error importScripts torah_text.js:', e);
  }
}

// Fallback lookup for Engine functions
function getFindELS() {
  if (Engine && typeof Engine.FindELS === 'function') return Engine.FindELS;
  if (_global.GematriaEngine && typeof _global.GematriaEngine.FindELS === 'function') return _global.GematriaEngine.FindELS;
  if (typeof _global.FindELS === 'function') return _global.FindELS;
  return null;
}

function getTorahText(book = 'all') {
  if (TorahModule && TorahModule.TORAH_BOOKS && book && book !== 'all' && TorahModule.TORAH_BOOKS[book]) {
    return TorahModule.TORAH_BOOKS[book];
  }
  if (_global.TORAH_BOOKS && book && book !== 'all' && _global.TORAH_BOOKS[book]) {
    return _global.TORAH_BOOKS[book];
  }
  if (TorahModule && TorahModule.TORAH_TEXT) return TorahModule.TORAH_TEXT;
  if (_global.TORAH_TEXT) return _global.TORAH_TEXT;
  if (_global.TorahText) return _global.TorahText;
  return '';
}

function getScanTopographicELS() {
  if (Engine && typeof Engine.ScanTopographicELS === 'function') return Engine.ScanTopographicELS;
  if (_global.GematriaEngine && typeof _global.GematriaEngine.ScanTopographicELS === 'function') return _global.GematriaEngine.ScanTopographicELS;
  if (typeof _global.ScanTopographicELS === 'function') return _global.ScanTopographicELS;
  return null;
}

// Message helper
function sendWorkerMessage(data) {
  if (isNodeWorker && parentPort) {
    parentPort.postMessage(data);
  } else if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
    self.postMessage(data);
  }
}

let activeCancellation = false;

function handleWorkerMessage(data) {
  if (!data || !data.action) return;

  const requestId = data.requestId || (data.options && data.options.requestId);

  switch (data.action) {
    case 'ping':
      sendWorkerMessage({
        action: 'pong',
        status: 'pong',
        timestamp: Date.now(),
        requestId
      });
      break;

    case 'cancel':
      activeCancellation = true;
      sendWorkerMessage({
        action: 'cancelled',
        status: 'cancelled',
        requestId
      });
      break;

    case 'scanTopographic': {
      activeCancellation = false;
      const startTime = Date.now();
      const ScanTopographic = getScanTopographicELS();
      const book = data.book || 'all';
      const text = data.text || getTorahText(book);
      const skip = data.skip || 50;
      const wordsList = data.wordsList || [];
      const options = data.options || {};

      if (typeof ScanTopographic !== 'function') {
        sendWorkerMessage({
          action: 'error',
          error: 'ScanTopographicELS function is not available in worker context',
          requestId
        });
        return;
      }

      const foundWords = ScanTopographic(text, skip, wordsList, options);
      const totalTimeMs = Date.now() - startTime;

      if (!activeCancellation) {
        sendWorkerMessage({
          action: 'topographicResults',
          foundWords,
          skip,
          book,
          status: 'complete',
          totalTimeMs,
          requestId
        });
      }
      break;
    }

    case 'searchELS': {
      activeCancellation = false;
      const startTime = Date.now();
      const FindELS = getFindELS();
      const book = data.book || 'all';
      const defaultText = getTorahText(book);
      const text = data.text || defaultText;
      const searchWord = data.searchWord;
      const minSkip = data.minSkip || 2;
      const maxSkip = data.maxSkip || 120;
      const options = data.options || {};

      if (typeof FindELS !== 'function') {
        sendWorkerMessage({
          action: 'error',
          error: 'FindELS function is not available in worker context',
          requestId
        });
        return;
      }

      let lastPercentReported = -1;

      const onProgress = (progressInfo) => {
        if (activeCancellation) return;
        const currentPercent = progressInfo.percent;
        if (currentPercent > lastPercentReported || currentPercent === 100) {
          lastPercentReported = currentPercent;
          sendWorkerMessage({
            action: 'progress',
            percent: currentPercent,
            currentSkip: progressInfo.currentSkip,
            totalSkips: progressInfo.totalSkips,
            processedSkips: progressInfo.processedSkips,
            searchWord,
            book,
            requestId
          });
        }
      };

      const matches = FindELS(text, searchWord, minSkip, maxSkip, {
        onProgress,
        shouldCancel: () => activeCancellation,
        ...options
      });

      const totalTimeMs = Date.now() - startTime;

      if (!activeCancellation) {
        sendWorkerMessage({
          action: 'elsResults',
          matches,
          book,
          status: 'complete',
          progress: 100,
          totalTimeMs,
          executionTimeMs: totalTimeMs,
          searchWord,
          minSkip,
          maxSkip,
          requestId
        });
      }
      break;
    }

    default:
      sendWorkerMessage({
        action: 'error',
        error: `Unknown worker action: ${data.action}`,
        requestId
      });
  }
}

// Event Listeners setup
if (isNodeWorker && parentPort) {
  parentPort.on('message', (data) => handleWorkerMessage(data));
}

if (typeof self !== 'undefined') {
  self.onmessage = function (e) {
    handleWorkerMessage(e.data);
  };
}
