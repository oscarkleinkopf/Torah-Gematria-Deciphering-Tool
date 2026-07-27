/**
 * Mock elsWorker.js inside explorer_m2_3 for prototyping M2 test assertions.
 */
const { parentPort } = require('worker_threads');
const Engine = require('../../gematria.js');

function handleSearch(data) {
  const { text, searchWord, minSkip, maxSkip } = data;
  const wordLen = searchWord.length;

  if (!text || !searchWord || minSkip === undefined || maxSkip === undefined) {
    if (parentPort) {
      parentPort.postMessage({ action: 'error', error: 'Parametros invalidos' });
    }
    return;
  }

  // Report initial progress
  if (parentPort) {
    parentPort.postMessage({ action: 'progress', percent: 0, currentSkip: minSkip });
  }

  const matches = [];
  const totalSkips = (maxSkip - minSkip + 1) * 2; // Positive & negative skips
  let processedSkips = 0;

  const freqData = Engine.CalculateLetterFrequencies(text);
  const firstChar = searchWord[0];
  const textLen = text.length;

  const startIndices = [];
  for (let i = 0; i < textLen; i++) {
    if (text[i] === firstChar) {
      startIndices.push(i);
    }
  }

  for (let skip = -maxSkip; skip <= maxSkip; skip++) {
    const absSkip = Math.abs(skip);
    if (absSkip < minSkip) continue;

    processedSkips++;
    if (processedSkips % Math.max(1, Math.floor(totalSkips / 5)) === 0) {
      const percent = Math.min(99, Math.round((processedSkips / totalSkips) * 100));
      if (parentPort) {
        parentPort.postMessage({ action: 'progress', percent, currentSkip: skip });
      }
    }

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
        const stats = Engine.CalculateELSPValue(textLen, searchWord, skip, freqData.frequencies);
        matches.push({
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

  matches.sort((a, b) => Math.abs(a.skip) - Math.abs(b.skip));

  if (parentPort) {
    parentPort.postMessage({
      action: 'elsResults',
      matches: matches,
      status: 'complete',
      progress: 100
    });
  }
}

if (parentPort) {
  parentPort.on('message', (msg) => {
    if (msg && msg.action === 'searchELS') {
      handleSearch(msg);
    }
  });
}
