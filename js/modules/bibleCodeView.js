/**
 * Torah Gematria Deciphering Tool
 * Módulo: bibleCodeView.js - Código de la Torá (ELS), Matriz Topográfica, Paginación y Caché
 */

(function(global) {
  'use strict';

  const BibleCodeView = {
    state: {
      activeMatch: null,
      primaryWord: '',
      matrixWidth: 50,
      isTopographic: false,
      topographicWords: []
    },

    pagination: {
      currentPage: 1,
      pageSize: 15,
      sortBy: 'significance',
      allMatches: [],
      searchedQuery: '',
      termsArray: []
    },

    cache: null,
    worker: null,
    activeRequestId: null,
    selectedBook: 'all',

    init: function(context) {
      const Engine = global.GematriaEngine;
      const self = this;

      this.cache = new Engine.GematriaSearchCache(100);

      const txtSearchELS = document.getElementById('txtSearchELS');
      const btnSearchELS = document.getElementById('btnSearchELS');
      const rangeMatrixWidth = document.getElementById('rangeMatrixWidth');
      const lblMatrixWidth = document.getElementById('lblMatrixWidth');
      const btnTopographicScan = document.getElementById('btnTopographicScan');
      const btnShareELS = document.getElementById('btnShareELS');

      // Selector de Libros
      const bookPills = document.querySelectorAll('.book-pill');
      bookPills.forEach(pill => {
        pill.addEventListener('click', () => {
          bookPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          self.selectedBook = pill.getAttribute('data-book') || 'all';
        });
      });

      // Slider de Columnas de Matriz
      if (rangeMatrixWidth && lblMatrixWidth) {
        rangeMatrixWidth.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          lblMatrixWidth.textContent = val;
          self.state.matrixWidth = val;
          self.renderMatrix();
        });
      }

      // Escaneo Topográfico
      if (btnTopographicScan) {
        btnTopographicScan.addEventListener('click', () => self.handleTopographicScan());
      }

      // Búsqueda ELS
      if (btnSearchELS) {
        btnSearchELS.addEventListener('click', () => self.handleSearch(context));
      }

      if (txtSearchELS) {
        txtSearchELS.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') self.handleSearch(context);
        });
      }

      // Quick Chips
      const quickChips = document.querySelectorAll('.els-quick-chip');
      quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const query = chip.getAttribute('data-query');
          if (txtSearchELS && query) {
            txtSearchELS.value = query;
            self.handleSearch(context);
          }
        });
      });

      // Compartir ELS
      if (btnShareELS) {
        btnShareELS.addEventListener('click', () => {
          const match = self.state.activeMatch;
          if (!match) {
            alert('Selecciona primero un código ELS para compartir.');
            return;
          }
          if (global.AppModules && global.AppModules.shareCard) {
            global.AppModules.shareCard.open({
              type: 'els',
              hebrew: match.word,
              title: `Código ELS (Salto ${match.skip})`,
              number: Engine.CalculateGematria(match.word).absolute,
              subtitle: `Encontrado en ${self.selectedBook.toUpperCase()} a salto ${match.skip}`,
              context: `Codificado a intervalos equidistantes de ${match.skip} letras, iniciando en la posición #${match.start}.`,
              verse: self.getVerseContext(match.start)
            });
          }
        });
      }

      // Paginación y Ordenamiento
      this.initPagination();
      this.renderSearchHistory();
    },

    initPagination: function() {
      const self = this;
      const selSort = document.getElementById('selELSSort');
      const selPageSize = document.getElementById('selELSPageSize');
      const btnPrev = document.getElementById('btnELSPrevPage');
      const btnNext = document.getElementById('btnELSNextPage');
      const btnClearCache = document.getElementById('btnClearELSCache');

      if (selSort) {
        selSort.addEventListener('change', (e) => {
          self.pagination.sortBy = e.target.value;
          self.pagination.currentPage = 1;
          self.renderPaginatedResults();
        });
      }

      if (selPageSize) {
        selPageSize.addEventListener('change', (e) => {
          const val = e.target.value;
          self.pagination.pageSize = val === 'all' ? 9999 : parseInt(val, 10);
          self.pagination.currentPage = 1;
          self.renderPaginatedResults();
        });
      }

      if (btnPrev) {
        btnPrev.addEventListener('click', () => {
          if (self.pagination.currentPage > 1) {
            self.pagination.currentPage--;
            self.renderPaginatedResults();
          }
        });
      }

      if (btnNext) {
        btnNext.addEventListener('click', () => {
          const totalPages = Math.ceil(self.pagination.allMatches.length / self.pagination.pageSize);
          if (self.pagination.currentPage < totalPages) {
            self.pagination.currentPage++;
            self.renderPaginatedResults();
          }
        });
      }

      if (btnClearCache) {
        btnClearCache.addEventListener('click', () => {
          if (self.cache) self.cache.clear();
          const statusBox = document.getElementById('elsCacheStatus');
          if (statusBox) statusBox.style.display = 'none';
          alert('🧹 Caché de búsquedas ELS vaciada.');
        });
      }
    },

    getActiveTorahText: function() {
      const torahText = global.TORAH_TEXT;
      const torahBooks = global.TORAH_BOOKS;
      if (this.selectedBook !== 'all' && torahBooks && torahBooks[this.selectedBook]) {
        return torahBooks[this.selectedBook];
      }
      return torahText || '';
    },

    getVerseContext: function(pos) {
      const bookNames = {
        genesis: 'Génesis',
        exodus: 'Éxodo',
        leviticus: 'Levítico',
        numbers: 'Números',
        deuteronomy: 'Deuteronomio',
        all: 'Torá'
      };
      const book = bookNames[this.selectedBook] || 'Torá';
      return `${book} • Letra #${pos}`;
    },

    getWorker: function() {
      const self = this;
      if (!this.worker && typeof Worker !== 'undefined') {
        try {
          this.worker = new Worker('elsWorker.js');
          this.worker.onmessage = (e) => self.handleWorkerMessage(e.data);
          this.worker.onerror = () => { self.worker = null; };
        } catch (e) {
          this.worker = null;
        }
      }
      return this.worker;
    },

    handleWorkerMessage: function(msg) {
      if (!msg || (msg.requestId && msg.requestId !== this.activeRequestId)) return;

      if (msg.action === 'progress') {
        this.updateProgressBar(msg.percent, msg.currentSkip);
      } else if (msg.action === 'elsResults') {
        this.hideProgressBar();
        this.renderResultsList(msg.matches, msg.searchWord, [msg.searchWord]);
      } else if (msg.action === 'topographicResults') {
        this.hideProgressBar();
        this.renderTopographicResults(msg.foundWords, msg.skip);
      } else if (msg.action === 'error') {
        this.hideProgressBar();
        const list = document.getElementById('elsResultsList');
        if (list) list.innerHTML = `<div style="color:#e74c3c;text-align:center;padding:1.5rem;">Error: ${msg.error}</div>`;
      }
    },

    handleSearch: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const txtSearchELS = document.getElementById('txtSearchELS');
      const numMinSkip = document.getElementById('numMinSkip');
      const numMaxSkip = document.getElementById('numMaxSkip');
      const cacheStatusBox = document.getElementById('elsCacheStatus');
      const lblCacheText = document.getElementById('lblCacheStatusText');
      const resultsList = document.getElementById('elsResultsList');

      if (!txtSearchELS || !resultsList || !Engine || !DB) return;

      const rawQuery = txtSearchELS.value.trim();
      if (!rawQuery) return;

      this.saveSearchHistory(rawQuery);

      const minSkip = numMinSkip ? parseInt(numMinSkip.value, 10) : 2;
      const maxSkip = numMaxSkip ? parseInt(numMaxSkip.value, 10) : 120;
      const text = this.getActiveTorahText();

      const termsRaw = rawQuery.split(',').map(t => t.trim()).filter(t => t.length > 0);

      // Comprobar Caché
      const cacheParams = { word: rawQuery, book: this.selectedBook, minSkip, maxSkip, mode: 'els' };
      const cached = this.cache ? this.cache.get(cacheParams) : null;
      if (cached) {
        if (cacheStatusBox && lblCacheText) {
          lblCacheText.textContent = `Resultado instantáneo desde Caché (${cached.length} hallazgos • 0 ms)`;
          cacheStatusBox.style.display = 'flex';
        }
        this.renderResultsList(cached, rawQuery, termsRaw);
        return;
      }
      if (cacheStatusBox) cacheStatusBox.style.display = 'none';

      // Uso de Worker
      const useWorker = (maxSkip - minSkip > 30 || termsRaw.length === 1) && typeof Worker !== 'undefined';
      if (useWorker && termsRaw.length === 1) {
        let searchHebrew = termsRaw[0];
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(searchHebrew)) {
          const semHit = Engine.SearchSpanishSemantic(searchHebrew, DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH, 1);
          searchHebrew = semHit.length > 0 ? semHit[0].hebrew : Engine.SpanishToHebrew(searchHebrew);
        }
        searchHebrew = searchHebrew.replace(/[^א-ת]/g, '');

        if (searchHebrew.length < 2) {
          resultsList.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:1rem;">La palabra debe tener al menos 2 letras hebreas.</div>';
          return;
        }

        const worker = this.getWorker();
        if (worker) {
          this.activeRequestId = `req_${Date.now()}`;
          resultsList.innerHTML = '';
          this.showProgressBar(searchHebrew);
          worker.postMessage({
            action: 'searchELS',
            searchWord: searchHebrew,
            book: this.selectedBook,
            minSkip,
            maxSkip,
            requestId: this.activeRequestId
          });
          return;
        }
      }

      // Fallback síncrono
      let allMatches = [];
      termsRaw.forEach((termStr, termIdx) => {
        let searchHebrew = termStr;
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(termStr)) {
          const semHit = Engine.SearchSpanishSemantic(termStr, DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH, 1);
          searchHebrew = semHit.length > 0 ? semHit[0].hebrew : Engine.SpanishToHebrew(termStr);
        }
        searchHebrew = searchHebrew.replace(/[^א-ת]/g, '');
        if (searchHebrew.length >= 2) {
          const matches = Engine.FindELS(text, searchHebrew, minSkip, maxSkip);
          matches.forEach(m => {
            m.termIndex = termIdx;
            m.rawQuery = termStr;
            allMatches.push(m);
          });
        }
      });

      if (this.cache) this.cache.set(cacheParams, allMatches);
      this.renderResultsList(allMatches, rawQuery, termsRaw);
    },

    renderResultsList: function(matches, searchedQuery, termsArray) {
      this.pagination.allMatches = matches || [];
      this.pagination.searchedQuery = searchedQuery;
      this.pagination.termsArray = termsArray;
      this.pagination.currentPage = 1;

      const numMinSkip = document.getElementById('numMinSkip');
      const numMaxSkip = document.getElementById('numMaxSkip');
      if (this.cache) {
        this.cache.set({
          word: searchedQuery,
          book: this.selectedBook,
          minSkip: numMinSkip ? parseInt(numMinSkip.value, 10) : 2,
          maxSkip: numMaxSkip ? parseInt(numMaxSkip.value, 10) : 120,
          mode: 'els'
        }, matches);
      }

      this.renderPaginatedResults();
    },

    renderPaginatedResults: function() {
      const Engine = global.GematriaEngine;
      const resultsList = document.getElementById('elsResultsList');
      const paginationControls = document.getElementById('elsPaginationControls');
      const lblPageInfo = document.getElementById('lblELSPageInfo');
      const btnPrev = document.getElementById('btnELSPrevPage');
      const btnNext = document.getElementById('btnELSNextPage');
      const countBadge = document.getElementById('elsResultCountBadge');
      const matrixEmptyState = document.getElementById('matrixEmptyState');
      const matrixContainer = document.getElementById('matrixContainer');
      const rangeMatrixWidth = document.getElementById('rangeMatrixWidth');
      const lblMatrixWidth = document.getElementById('lblMatrixWidth');

      if (!resultsList || !Engine) return;
      resultsList.innerHTML = '';

      const totalMatches = this.pagination.allMatches.length;
      if (countBadge) countBadge.textContent = `${totalMatches} hallazgo(s)`;

      if (totalMatches === 0) {
        resultsList.innerHTML = `
          <div style="color: var(--text-secondary); text-align: center; padding: 2rem 0; font-size: 0.9rem;">
            No se encontraron secuencias ELS para "${this.pagination.searchedQuery}" en el libro seleccionado (${this.selectedBook.toUpperCase()}) y rango de saltos.
          </div>`;
        if (paginationControls) paginationControls.style.display = 'none';
        if (matrixEmptyState) matrixEmptyState.style.display = 'block';
        if (matrixContainer) matrixContainer.style.display = 'none';
        return;
      }

      const sortedMatches = Engine.SortELSResults(this.pagination.allMatches, this.pagination.sortBy);
      const pageSize = this.pagination.pageSize;
      const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
      const currentPage = Math.min(this.pagination.currentPage, totalPages);
      this.pagination.currentPage = currentPage;

      const startIdx = (currentPage - 1) * pageSize;
      const pageMatches = sortedMatches.slice(startIdx, startIdx + pageSize);

      if (paginationControls) paginationControls.style.display = totalMatches > 15 ? 'flex' : 'none';
      if (lblPageInfo) lblPageInfo.textContent = `Pág ${currentPage} de ${totalPages} (${totalMatches} tot)`;
      if (btnPrev) btnPrev.disabled = currentPage <= 1;
      if (btnNext) btnNext.disabled = currentPage >= totalPages;

      const self = this;
      pageMatches.forEach((match, idx) => {
        const item = document.createElement('div');
        item.className = 'els-result-item';
        const verseContext = self.getVerseContext(match.start);
        const termBadgeClass = `term-badge-${match.termIndex % 4}`;
        const sig = Engine.FormatSignificanceMetrics(match);

        item.innerHTML = `
          <div class="els-result-header-row">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span class="els-result-word">${match.word}</span>
              ${self.pagination.termsArray && self.pagination.termsArray.length > 1 ? `<span class="term-badge ${termBadgeClass}">${match.rawQuery}</span>` : ''}
              ${sig ? `<span class="significance-badge ${sig.level}" title="${sig.explanation} (${sig.probabilityDesc})">${sig.badgeText}</span>` : ''}
            </div>
            <span class="els-result-skip">Salto: ${match.skip}</span>
          </div>
          <div class="els-result-context" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.3rem;">
            <span>Inicio: Letra #${match.start}</span>
            <span>${verseContext}</span>
          </div>
        `;

        item.addEventListener('click', () => {
          document.querySelectorAll('.els-result-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          self.state.activeMatch = match;
          self.state.primaryWord = match.word;

          const defaultWidth = Math.min(150, Math.max(10, Math.abs(match.skip)));
          if (rangeMatrixWidth) rangeMatrixWidth.value = defaultWidth;
          if (lblMatrixWidth) lblMatrixWidth.textContent = defaultWidth;
          self.state.matrixWidth = defaultWidth;
          self.renderMatrix();
        });

        if (idx === 0 && currentPage === 1) {
          item.classList.add('active');
          self.state.activeMatch = match;
          self.state.primaryWord = match.word;
          const defaultWidth = Math.min(150, Math.max(10, Math.abs(match.skip)));
          if (rangeMatrixWidth) rangeMatrixWidth.value = defaultWidth;
          if (lblMatrixWidth) lblMatrixWidth.textContent = defaultWidth;
          self.state.matrixWidth = defaultWidth;
        }

        resultsList.appendChild(item);
      });

      if (this.state.activeMatch && currentPage === 1) {
        this.renderMatrix();
      }
    },

    renderMatrix: function() {
      const match = this.state.activeMatch;
      const matrixGrid = document.getElementById('bibleCodeMatrix');
      const matrixEmptyState = document.getElementById('matrixEmptyState');
      const matrixContainer = document.getElementById('matrixContainer');
      const matrixWidthController = document.getElementById('matrixWidthController');
      if (!match || !matrixGrid) return;

      if (matrixEmptyState) matrixEmptyState.style.display = 'none';
      if (matrixContainer) matrixContainer.style.display = 'block';
      if (matrixWidthController) matrixWidthController.style.display = 'flex';

      const text = this.getActiveTorahText();
      const w = this.state.matrixWidth;
      const minIdx = Math.min(...match.indices);
      const maxIdx = Math.max(...match.indices);
      const startRow = Math.floor(minIdx / w);
      const endRow = Math.floor(maxIdx / w);
      const minRow = Math.max(0, startRow - 4);
      const maxRow = Math.min(Math.floor((text.length - 1) / w), endRow + 4);

      matrixGrid.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
      matrixGrid.innerHTML = '';

      const matchSet = new Set(match.indices);

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = 0; c < w; c++) {
          const idx = r * w + c;
          if (idx >= text.length) break;

          const cell = document.createElement('div');
          cell.className = 'matrix-cell';
          cell.textContent = text[idx];

          if (matchSet.has(idx)) {
            cell.classList.add('highlight-primary');
          }
          matrixGrid.appendChild(cell);
        }
      }
    },

    handleTopographicScan: function() {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const numMinSkip = document.getElementById('numMinSkip');
      if (!Engine || !DB) return;

      const skip = numMinSkip ? parseInt(numMinSkip.value, 10) : 50;
      const text = this.getActiveTorahText();
      const results = Engine.ScanTopographicELS(text, skip, DB.KNOWLEDGE_GRAPH, { maxMatches: 8 });
      this.renderTopographicResults(results, skip);
    },

    renderTopographicResults: function(foundWords, skip) {
      const legendBox = document.getElementById('elsTopographicLegend');
      const chipsContainer = document.getElementById('topographicChipsContainer');
      const lblSkip = document.getElementById('lblTopographicSkip');
      const lblCount = document.getElementById('lblTopographicCount');
      if (!legendBox || !chipsContainer) return;

      legendBox.style.display = 'block';
      if (lblSkip) lblSkip.textContent = skip;
      if (lblCount) lblCount.textContent = `${foundWords.length} cohabitación(es) encontrada(s)`;
      chipsContainer.innerHTML = '';

      const self = this;
      foundWords.forEach(fw => {
        const chip = document.createElement('button');
        chip.className = 'topographic-chip';
        chip.style.borderColor = fw.color;
        chip.style.backgroundColor = fw.color + '20';
        chip.style.color = fw.color;
        chip.innerHTML = `<span>●</span> <span style="font-family:var(--font-hebrew);">${fw.word}</span> <span style="font-size:0.7rem;opacity:0.85;">(${fw.title})</span>`;
        chip.addEventListener('click', () => {
          self.state.activeMatch = {
            word: fw.word,
            skip: fw.skip,
            start: fw.start,
            end: fw.end,
            indices: fw.indices,
            rawQuery: fw.title
          };
          self.state.primaryWord = fw.word;
          self.renderMatrix();
        });
        chipsContainer.appendChild(chip);
      });
    },

    showProgressBar: function(word) {
      let bar = document.getElementById('elsProgressBar');
      const resultsList = document.getElementById('elsResultsList');
      if (!bar && resultsList) {
        bar = document.createElement('div');
        bar.id = 'elsProgressBar';
        bar.style.cssText = 'margin-bottom:0.8rem;background:rgba(0,0,0,0.4);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:0.6rem 0.8rem;font-size:0.78rem;color:var(--gold-primary);';
        resultsList.parentNode.insertBefore(bar, resultsList);
      }
      if (bar) {
        bar.style.display = 'block';
        bar.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
            <span>⚙️ Escaneando Torá para <strong style="font-family:var(--font-hebrew)">${word}</strong>...</span>
          </div>
          <div style="background:rgba(255,255,255,0.05);border-radius:6px;overflow:hidden;height:6px;">
            <div id="elsProgressFill" style="height:100%;background:linear-gradient(90deg,var(--gold-primary),#00ced1);width:0%;transition:width 0.3s;border-radius:6px;"></div>
          </div>
        `;
      }
    },

    updateProgressBar: function(percent, currentSkip) {
      const fill = document.getElementById('elsProgressFill');
      if (fill) fill.style.width = percent + '%';
    },

    hideProgressBar: function() {
      const bar = document.getElementById('elsProgressBar');
      if (bar) bar.style.display = 'none';
    },

    saveSearchHistory: function(query) {
      try {
        let history = JSON.parse(localStorage.getItem('els_search_history') || '[]');
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        if (history.length > 8) history = history.slice(0, 8);
        localStorage.setItem('els_search_history', JSON.stringify(history));
      } catch (e) {}
      this.renderSearchHistory();
    },

    renderSearchHistory: function() {
      const section = document.getElementById('elsHistorySection');
      const container = document.getElementById('elsHistoryChips');
      const txtSearchELS = document.getElementById('txtSearchELS');
      if (!section || !container) return;

      try {
        const history = JSON.parse(localStorage.getItem('els_search_history') || '[]');
        if (history.length === 0) {
          section.style.display = 'none';
          return;
        }
        section.style.display = 'block';
        container.innerHTML = '';
        const self = this;
        history.forEach(item => {
          const chip = document.createElement('button');
          chip.className = 'els-history-chip';
          chip.textContent = item;
          chip.addEventListener('click', () => {
            if (txtSearchELS) {
              txtSearchELS.value = item;
              self.handleSearch();
            }
          });
          container.appendChild(chip);
        });
      } catch (e) {}
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.bibleCodeView = BibleCodeView;

})(typeof window !== 'undefined' ? window : globalThis);
