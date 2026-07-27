# Technical Design Report: Web Worker Multithreading for ELS Search (`elsWorker.js`)

**Milestone**: M2 (Web Worker Multithreading)  
**Author**: `explorer_m2_1`  
**Target Output**: `c:\Users\oscar\.gemini\antigravity\scratch\GematriaDecipher\.agents\explorer_m2_1\analysis.md`  
**Date**: 2026-07-27  

---

## 1. Executive Summary

Searching for Equidistant Letter Sequences (ELS) across large ancient texts like the Torah (`torah_text.js`, length ~$304,805$ characters) involves evaluating tens of thousands of character position steps over wide skip ranges (e.g. skips from $-120$ to $+120$). Currently, `app.js` calls `Engine.FindELS(text, searchHebrew, minSkip, maxSkip)` directly on the main thread (lines 539, 568, 1874, 1986). On single-threaded JavaScript runtimes, this causes UI lag and blocks user interaction during intensive searches.

This report presents the architectural design for offloading ELS computations to a dedicated Web Worker (`elsWorker.js`), defining:
1. The message protocol between the main thread and `elsWorker.js` (including real-time progress reporting).
2. The compatibility layer for importing `gematria.js` into worker scope.
3. A robust, fail-safe main thread fallback mechanism when Web Workers are unavailable or restricted.

---

## 2. Analysis of Existing Codebase (`gematria.js` & `app.js`)

### 2.1 ELS Algorithm Inspection (`gematria.js`)
* **Algorithm Location**: `gematria.js` lines 736–786 (`FindELS`), supported by lines 594–615 (`CalculateLetterFrequencies`) and lines 625–731 (`CalculateELSPValue`).
* **Signature**: `FindELS(text, searchWord, minSkip, maxSkip)`
* **Loop Structure**:
  ```javascript
  // gematria.js lines 752-754
  for (let skip = -maxSkip; skip <= maxSkip; skip++) {
    const absSkip = Math.abs(skip);
    if (absSkip < minSkip) continue;
    ...
  }
  ```
* **Workload Breakdown**:
  * Total skip iterations to evaluate: $N_{\text{skips}} = 2 \times (\text{maxSkip} - \text{minSkip} + 1)$.
  * For standard range `minSkip = 2`, `maxSkip = 120`: $N_{\text{skips}} = 2 \times (120 - 2 + 1) = 238$ skip step values.
  * For extended searches (e.g., `maxSkip = 1000`): $N_{\text{skips}} = 1998$ skip step values.
  * Each skip step checks all starting indices where `text[i] === searchWord[0]`.

### 2.2 Invocation Points in `app.js`
* **Line 1874**: User-initiated ELS Search UI (`performELSSearch`). Multi-term search queries split by comma are executed sequentially.
* **Line 539 & 568**: Automatic high-density ELS crossover scanner (`runAutoELSScan`), which performs primary ELS search and sub-matches against `DB.KNOWLEDGE_GRAPH`.

### 2.3 Module Export Compatibility in Worker Context
In `gematria.js` lines 808–827:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ... };
} else {
  window.GematriaEngine = { ... };
}
```
* **Worker Scope Issue**: In a Web Worker environment (`WorkerGlobalScope`), `window` is `undefined`. Evaluating `window.GematriaEngine` in a worker context will throw a `ReferenceError: window is not defined`.
* **Top-level functions**: Functions such as `FindELS`, `CalculateLetterFrequencies`, and `CalculateELSPValue` are declared as top-level function declarations (`function FindELS(...)`). In classic worker scripts loaded via `importScripts()`, these function declarations attach to the global worker scope (`self` / `globalThis`).
* **Compatibility Requirement**: `elsWorker.js` must polyfill `self.window = self;` prior to `importScripts('gematria.js')`, ensuring `window.GematriaEngine` executes cleanly without throwing an unhandled exception.

---

## 3. Web Worker Message Protocol Specification

Communication between the main thread (`app.js`) and `elsWorker.js` uses `postMessage()` and standard structured clone messaging.

### 3.1 Input Message Format (Main Thread $\rightarrow$ Worker)
**Action**: `searchELS`
Sent by main thread to request an ELS search execution.

```typescript
interface ELSSearchInputMessage {
  action: 'searchELS';
  text: string;           // Full text corpus (e.g. Torah text)
  searchWord: string;     // Hebrew word to search
  minSkip: number;        // Minimum skip distance (e.g. 2)
  maxSkip: number;        // Maximum skip distance (e.g. 120)
  options?: {
    requestId?: string;   // Unique request ID to match async response
    progressInterval?: number; // Minimum percentage jump between progress posts (default: 1)
  };
}
```

**JSON Example**:
```json
{
  "action": "searchELS",
  "text": "בראשית ברא אלהים...",
  "searchWord": "תורה",
  "minSkip": 2,
  "maxSkip": 120,
  "options": {
    "requestId": "req_els_1722100000_1"
  }
}
```

### 3.2 Progress Update Format (Worker $\rightarrow$ Main Thread)
**Action**: `progress`
Emitted periodically during search iteration over the skip range.

```typescript
interface ELSProgressMessage {
  action: 'progress';
  percent: number;        // Completion percentage (0 to 100 integer)
  currentSkip: number;    // Current skip value being processed (e.g. -45 or +12)
  totalSkips: number;     // Total number of valid skip steps to evaluate (e.g. 238)
  processedSkips: number; // Count of skip steps completed so far
  searchWord: string;     // Word being searched
  requestId?: string;     // Request identifier matching input message
}
```

**JSON Example**:
```json
{
  "action": "progress",
  "percent": 45,
  "currentSkip": 54,
  "totalSkips": 238,
  "processedSkips": 107,
  "searchWord": "תורה",
  "requestId": "req_els_1722100000_1"
}
```

### 3.3 Completion Message Format (Worker $\rightarrow$ Main Thread)
**Action**: `elsResults`
Emitted upon successful completion of the search.

```typescript
interface ELSResultsMessage {
  action: 'elsResults';
  matches: Array<{
    word: string;
    start: number;
    skip: number;
    indices: number[];
    expectedCount: number;
    pValue: number;
    significanceScore: number;
  }>;
  searchWord: string;
  minSkip: number;
  maxSkip: number;
  executionTimeMs?: number;
  requestId?: string;
}
```

**JSON Example**:
```json
{
  "action": "elsResults",
  "matches": [
    {
      "word": "תורה",
      "start": 50,
      "skip": 50,
      "indices": [50, 100, 150, 200],
      "expectedCount": 0.00124,
      "pValue": 0.001239,
      "significanceScore": 2.906
    }
  ],
  "searchWord": "תורה",
  "minSkip": 2,
  "maxSkip": 120,
  "executionTimeMs": 42,
  "requestId": "req_els_1722100000_1"
}
```

### 3.4 Error Handling Format (Worker $\rightarrow$ Main Thread)
**Action**: `error`
Emitted if invalid inputs are passed or an runtime exception occurs inside worker logic.

```typescript
interface ELSErrorMessage {
  action: 'error';
  message: string;        // Human-readable error message
  code?: string;          // Error classification code
  requestId?: string;
}
```

**JSON Example**:
```json
{
  "action": "error",
  "message": "Invalid input parameters: searchWord must contain at least 2 Hebrew characters.",
  "code": "INVALID_INPUT",
  "requestId": "req_els_1722100000_1"
}
```

---

## 4. Script Import & Worker Implementation Design (`elsWorker.js`)

### 4.1 Script Import Strategy (`importScripts`)
Browser Web Workers in non-bundled vanilla JS environments rely on `importScripts()`.
To resolve the `window is not defined` ReferenceError when loading `gematria.js`:

```javascript
// Scope polyfill for gematria.js in Web Worker context
if (typeof window === 'undefined') {
  self.window = self;
}

// Import gematria engine algorithms
importScripts('gematria.js');
```

### 4.2 Proposed `elsWorker.js` Standalone Source
Below is the design specification for `elsWorker.js`:

```javascript
/**
 * elsWorker.js - Web Worker for Multithreaded ELS (Equidistant Letter Sequence) Searching
 * Milestone M2 Implementation Component
 */

// Step 1: Ensure window object exists for gematria.js compatibility
if (typeof window === 'undefined') {
  self.window = self;
}

// Step 2: Import Gematria Engine algorithms
try {
  importScripts('gematria.js');
} catch (e) {
  console.error('[elsWorker] Failed to import gematria.js:', e);
}

/**
 * Executes ELS search with granular progress reporting
 */
function runSearchELS(data) {
  const { text, searchWord, minSkip, maxSkip, options = {} } = data;
  const requestId = options.requestId;

  // Validation
  if (!text || typeof text !== 'string') {
    self.postMessage({ action: 'error', message: 'Text corpus is empty or invalid.', code: 'INVALID_TEXT', requestId });
    return;
  }
  if (!searchWord || typeof searchWord !== 'string' || searchWord.length < 2) {
    self.postMessage({ action: 'error', message: 'Search word must be at least 2 characters long.', code: 'INVALID_SEARCH_WORD', requestId });
    return;
  }

  const effectiveMin = Math.max(1, parseInt(minSkip, 10) || 2);
  const effectiveMax = Math.max(effectiveMin, parseInt(maxSkip, 10) || 120);

  // Access search algorithm from global scope or GematriaEngine
  const findELSFunc = (self.GematriaEngine && self.GematriaEngine.FindELS) || self.FindELS;
  const calcFreqFunc = (self.GematriaEngine && self.GematriaEngine.CalculateLetterFrequencies) || self.CalculateLetterFrequencies;
  const calcPValueFunc = (self.GematriaEngine && self.GematriaEngine.CalculateELSPValue) || self.CalculateELSPValue;

  if (typeof findELSFunc !== 'function') {
    self.postMessage({ action: 'error', message: 'FindELS function is not available in worker context.', code: 'ENGINE_NOT_FOUND', requestId });
    return;
  }

  const startTime = performance.now();
  const results = [];
  const wordLen = searchWord.length;
  const freqData = calcFreqFunc ? calcFreqFunc(text) : null;
  const firstChar = searchWord[0];
  const textLen = text.length;

  // Find all starting indices matching searchWord[0]
  const startIndices = [];
  for (let i = 0; i < textLen; i++) {
    if (text[i] === firstChar) {
      startIndices.push(i);
    }
  }

  // Calculate total skips to evaluate
  const totalSkips = 2 * (effectiveMax - effectiveMin + 1);
  let processedSkips = 0;
  let lastReportedPercent = -1;

  // Iterative skip search with progress tracking
  for (let skip = -effectiveMax; skip <= effectiveMax; skip++) {
    const absSkip = Math.abs(skip);
    if (absSkip < effectiveMin) continue;

    processedSkips++;
    const currentPercent = Math.floor((processedSkips / totalSkips) * 100);

    // Report progress periodically (every 2% or on completion)
    if (currentPercent >= lastReportedPercent + 2 || processedSkips === totalSkips) {
      lastReportedPercent = currentPercent;
      self.postMessage({
        action: 'progress',
        percent: currentPercent,
        currentSkip: skip,
        totalSkips: totalSkips,
        processedSkips: processedSkips,
        searchWord: searchWord,
        requestId: requestId
      });
    }

    // Check indices for current skip
    for (let startIdx of startIndices) {
      let match = true;
      const pathIndices = [startIdx];

      for (let charIdx = 1; charIdx < wordLen; charIdx++) {
        const nextIdx = startIdx + charIdx * skip;
        if (nextIdx < 0 || nextIdx >= textLen || text[nextIdx] !== searchWord[charIdx]) {
          match = false;
          break;
        }
        pathIndices.push(nextIdx);
      }

      if (match) {
        const stats = calcPValueFunc && freqData 
          ? calcPValueFunc(textLen, searchWord, skip, freqData.frequencies) 
          : { expectedMatches: 0, pValue: 1.0, statisticalSignificanceScore: 0 };

        results.push({
          word: searchWord,
          start: startIdx,
          skip: skip,
          indices: pathIndices,
          expectedCount: stats.expectedMatches,
          pValue: stats.pValue,
          significanceScore: stats.statisticalSignificanceScore
        });
      }
    }
  }

  results.sort((a, b) => Math.abs(a.skip) - Math.abs(b.skip));
  const executionTimeMs = Math.round(performance.now() - startTime);

  // Send completion message
  self.postMessage({
    action: 'elsResults',
    matches: results,
    searchWord: searchWord,
    minSkip: effectiveMin,
    maxSkip: effectiveMax,
    executionTimeMs: executionTimeMs,
    requestId: requestId
  });
}

// Message Dispatcher
self.onmessage = function (e) {
  const data = e.data;
  if (!data || !data.action) return;

  switch (data.action) {
    case 'searchELS':
      runSearchELS(data);
      break;
    default:
      self.postMessage({ action: 'error', message: `Unknown action: ${data.action}` });
  }
};
```

---

## 5. Main Thread Fallback Mechanism

### 5.1 Fallback Triggers
Web Worker instantiation can fail under the following environment conditions:
1. Browsers running without Web Worker support (legacy embedded WebViews).
2. Local `file://` protocol execution where CORS/security policies restrict worker script loading.
3. Content Security Policy (CSP) blocking worker creation (`worker-src`).
4. Worker runtime initialization failure (`onerror` event or instantiation throw).

### 5.2 Dual-Mode ELS Service Architecture (`ELSSearchService`)

The recommended integration pattern wraps worker management and main thread fallback into a single service:

```javascript
/**
 * ELS Search Manager with Web Worker & Main Thread Fallback
 */
class ELSSearchManager {
  constructor(workerPath = 'elsWorker.js') {
    this.workerPath = workerPath;
    this.worker = null;
    this.isWorkerSupported = false;
    this.initWorker();
  }

  initWorker() {
    if (typeof window !== 'undefined' && typeof window.Worker !== 'undefined') {
      try {
        this.worker = new Worker(this.workerPath);
        this.isWorkerSupported = true;
        console.log('[ELSSearchManager] Web Worker initialized successfully.');
      } catch (err) {
        console.warn('[ELSSearchManager] Web Worker instantiation failed, fallback active:', err);
        this.isWorkerSupported = false;
        this.worker = null;
      }
    } else {
      console.warn('[ELSSearchManager] Web Workers not supported in environment.');
      this.isWorkerSupported = false;
    }
  }

  /**
   * Perform ELS search with unified callbacks
   */
  search(text, searchWord, minSkip, maxSkip, callbacks = {}) {
    const { onProgress, onSuccess, onError } = callbacks;

    if (this.isWorkerSupported && this.worker) {
      const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const handleMessage = (e) => {
        const msg = e.data;
        if (msg.requestId && msg.requestId !== requestId) return;

        if (msg.action === 'progress') {
          if (onProgress) onProgress(msg);
        } else if (msg.action === 'elsResults') {
          cleanup();
          if (onSuccess) onSuccess(msg);
        } else if (msg.action === 'error') {
          cleanup();
          if (onError) onError(msg.message);
        }
      };

      const handleError = (err) => {
        cleanup();
        console.error('[ELSSearchManager] Worker runtime error, delegating to main thread fallback:', err);
        this.fallbackMainThread(text, searchWord, minSkip, maxSkip, callbacks);
      };

      const cleanup = () => {
        this.worker.removeEventListener('message', handleMessage);
        this.worker.removeEventListener('error', handleError);
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      this.worker.postMessage({
        action: 'searchELS',
        text,
        searchWord,
        minSkip,
        maxSkip,
        options: { requestId }
      });
    } else {
      // Main Thread Fallback
      this.fallbackMainThread(text, searchWord, minSkip, maxSkip, callbacks);
    }
  }

  /**
   * Fallback execution directly on main thread
   */
  fallbackMainThread(text, searchWord, minSkip, maxSkip, callbacks = {}) {
    const { onProgress, onSuccess, onError } = callbacks;
    try {
      if (onProgress) {
        onProgress({ action: 'progress', percent: 0, currentSkip: minSkip, totalSkips: 2 * (maxSkip - minSkip + 1) });
      }

      const Engine = window.GematriaEngine || { FindELS: window.FindELS };
      const matches = Engine.FindELS(text, searchWord, minSkip, maxSkip);

      if (onProgress) {
        onProgress({ action: 'progress', percent: 100, currentSkip: maxSkip, totalSkips: 2 * (maxSkip - minSkip + 1) });
      }

      if (onSuccess) {
        onSuccess({
          action: 'elsResults',
          matches,
          searchWord,
          minSkip,
          maxSkip
        });
      }
    } catch (err) {
      if (onError) onError(err.message || 'Main thread ELS search failed.');
    }
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
```

---

## 6. Verification Plan & Testing Criteria

| Verification ID | Test Case | Target Behavior | Method |
|---|---|---|---|
| **V-01** | `elsWorker.js` script load | Imports `gematria.js` without throwing `ReferenceError: window is not defined` | Instantiate `elsWorker.js` in browser console, send test ping |
| **V-02** | Message Protocol Validation | Input `searchELS` message returns valid `progress` and `elsResults` | Post message with word `"תורה"`, minSkip 2, maxSkip 20 |
| **V-03** | Progress Increments | Percent strictly increases from 0 to 100 during long skips | Listen to `progress` event stream |
| **V-04** | Main Thread Fallback | Disabling `Worker` or simulating instantiation failure executes `fallbackMainThread` seamlessly | Pass bad worker path / dummy mock without breaking ELS output |
| **V-05** | Output Parity | `elsWorker.js` matches count and data structure match main thread `FindELS` outputs exactly | Compare result arrays from both execution modes on identical input |
