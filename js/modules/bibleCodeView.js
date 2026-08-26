/**
 * Torah Gematria Deciphering Tool
 * Módulo: bibleCodeView.js - Código de la Torá (ELS), Matriz Topográfica, Paginación y Caché
 */

(function(global) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const BibleCodeView = {
    state: {
      activeMatch: null,
      primaryWord: '',
      matrixWidth: 50,
      isTopographic: false,
      topographicWords: [],
      pendingSelect: null,
      pendingMatrixWidth: null,
      activeExampleId: null
    },
    _context: null,

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

      this._context = context;
      this.cache = new Engine.GematriaSearchCache(100);

      const txtSearchELS = document.getElementById('txtSearchELS');
      const btnSearchELS = document.getElementById('btnSearchELS');
      const rangeMatrixWidth = document.getElementById('rangeMatrixWidth');
      const lblMatrixWidth = document.getElementById('lblMatrixWidth');
      const btnShareELS = document.getElementById('btnShareELS');
      const btnTopographicScan = document.getElementById('btnToggleTopographicELS') || document.getElementById('btnTopographicScan');

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

      // Quick Chips (exclude acrostic type buttons that reuse the class)
      const quickChips = document.querySelectorAll('#elsQuickPicks .els-quick-chip');
      quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const query = chip.getAttribute('data-query');
          if (txtSearchELS && query) {
            txtSearchELS.value = query;
            self.handleSearch(context);
          }
        });
      });

      this.renderClassicGallery();
      this.bindClassicTriggers(context);

      const btnShuffle = document.getElementById('btnElsShuffledControl');
      if (btnShuffle) {
        btnShuffle.addEventListener('click', () => self.runShuffledControl());
      }

      const btnCopy = document.getElementById('btnCopyELSCitation');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => self.copyCitation());
      }

      const btnClearHistory = document.getElementById('btnClearELSHistory');
      if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => self.clearSearchHistory());
      }

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
              verse: self.formatVerseLabel(match.start, match.indices)
            });
          }
        });
      }

      // Paginación y Ordenamiento
      this.initPagination();
      this.renderSearchHistory();
      this.initFavoriteAndExport(context);
    },

    toggleElsActionButtons: function(show) {
      const btnPNG = document.getElementById('btnExportMatrixPNG');
      const btnFav = document.getElementById('btnSaveELSFavorite');
      const btnShuffle = document.getElementById('btnElsShuffledControl');
      const btnShare = document.getElementById('btnShareELS');
      const btnCopy = document.getElementById('btnCopyELSCitation');
      const display = show ? 'inline-block' : 'none';
      if (btnPNG) btnPNG.style.display = display;
      if (btnFav) btnFav.style.display = display;
      if (btnShuffle) btnShuffle.style.display = display;
      if (btnShare) btnShare.style.display = display;
      if (btnCopy) btnCopy.style.display = display;
    },

    initFavoriteAndExport: function(context) {
      const Storage = global.GematriaStorage;
      const self = this;
      const btnExport = document.getElementById('btnExportMatrixPNG');
      const btnFav = document.getElementById('btnSaveELSFavorite');

      if (btnExport) {
        btnExport.addEventListener('click', () => {
          const match = self.state.activeMatch;
          if (typeof global.ExportMatrixAsPNG !== 'function') return;
          global.ExportMatrixAsPNG('matrixContainer', undefined, match || null);
        });
      }
      if (btnFav) {
        btnFav.addEventListener('click', () => {
          const match = self.state.activeMatch;
          if (!match || !Storage || !Storage.SaveFavorite) return;
          const before = Storage.GetFavorites().length;
          Storage.SaveFavorite({
            word: match.word,
            skip: match.skip,
            start: match.start,
            indices: match.indices,
            pValue: match.pValue,
            significanceScore: match.significanceScore,
            verse: self.formatVerseLabel(match.start, match.indices),
            savedAt: new Date().toISOString()
          });
          const after = Storage.GetFavorites().length;
          btnFav.textContent = after === before ? '✅ Ya guardado' : '✅ Guardado';
          setTimeout(() => { btnFav.textContent = '⭐ Guardar'; }, 2000);
        });
      }
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

    getBookOffset: function() {
      if (this.selectedBook === 'all') return 0;
      const offsets = global.TORAH_BOOK_OFFSETS || [];
      const book = offsets.find(b => b.key === this.selectedBook);
      return book ? book.offset : 0;
    },

    getGlobalIndex: function(localIdx) {
      return this.getBookOffset() + (localIdx | 0);
    },

    getVerseContext: function(pos) {
      return this.formatVerseLabel(pos);
    },

    formatVerseLabel: function(localIdx, indices) {
      const Lookup = global.LookupTorahVerse;
      const LookupSpan = global.LookupTorahVerseSpan;
      if (Array.isArray(indices) && indices.length && typeof LookupSpan === 'function') {
        const span = LookupSpan(indices.map(i => this.getGlobalIndex(i)));
        if (span) return span;
      }
      if (typeof Lookup === 'function') {
        const v = Lookup(this.getGlobalIndex(localIdx));
        if (v && v.reference) return v.reference;
      }
      const bookNames = {
        genesis: 'Génesis',
        exodus: 'Éxodo',
        leviticus: 'Levítico',
        numbers: 'Números',
        deuteronomy: 'Deuteronomio',
        all: 'Torá'
      };
      const book = bookNames[this.selectedBook] || 'Torá';
      return book + ' · Letra #' + localIdx;
    },

    setSelectedBook: function(bookKey) {
      const key = bookKey || 'all';
      this.selectedBook = key;
      document.querySelectorAll('.book-pill').forEach(p => {
        p.classList.toggle('active', (p.getAttribute('data-book') || 'all') === key);
      });
    },

    honestyBadgeHtml: function(match) {
      const Engine = global.GematriaEngine;
      if (!Engine || typeof Engine.AssessELSHonesty !== 'function') return '';
      const numMinSkip = document.getElementById('numMinSkip');
      const numMaxSkip = document.getElementById('numMaxSkip');
      const honesty = Engine.AssessELSHonesty(match, {
        text: this.getActiveTorahText(),
        minSkip: numMinSkip ? parseInt(numMinSkip.value, 10) : 2,
        maxSkip: numMaxSkip ? parseInt(numMaxSkip.value, 10) : 120,
        runControl: false
      });
      const band = honesty.band || 'common';
      const title = escapeHtml((honesty.label || '') + ' — ' + (honesty.note || ''));
      return `<span class="honesty-badge ${escapeHtml(band)}" title="${title}">${escapeHtml(honesty.label)}</span>`;
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

      this.state.isTopographic = false;
      this.state.topographicWords = [];
      const legendBox = document.getElementById('elsTopographicLegend');
      if (legendBox) legendBox.style.display = 'none';

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
      if (!this.state.pendingSelect) {
        this.state.activeMatch = null;
      }

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

    applyPendingSelect: function(sortedMatches) {
      const hint = this.state.pendingSelect;
      if (!hint || !sortedMatches.length) return;
      const idx = sortedMatches.findIndex(m => m.start === hint.start && m.skip === hint.skip);
      this.state.pendingSelect = null;
      if (idx < 0) return;
      const match = sortedMatches[idx];
      this.state.activeMatch = match;
      this.state.primaryWord = match.word;
      const pageSize = this.pagination.pageSize || 15;
      this.pagination.currentPage = Math.floor(idx / pageSize) + 1;
      const width = this.state.pendingMatrixWidth || Math.min(150, Math.max(10, Math.abs(match.skip)));
      this.state.pendingMatrixWidth = null;
      this.applyMatrixWidth(width);
    },

    applyMatrixWidth: function(width) {
      const w = Math.min(150, Math.max(10, width | 0));
      this.state.matrixWidth = w;
      const rangeMatrixWidth = document.getElementById('rangeMatrixWidth');
      const lblMatrixWidth = document.getElementById('lblMatrixWidth');
      if (rangeMatrixWidth) rangeMatrixWidth.value = w;
      if (lblMatrixWidth) lblMatrixWidth.textContent = w;
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

      if (!resultsList || !Engine) return;
      resultsList.innerHTML = '';

      const totalMatches = this.pagination.allMatches.length;
      if (countBadge) countBadge.textContent = `${totalMatches} hallazgo(s)`;

      if (totalMatches === 0) {
        resultsList.innerHTML = `
          <div style="color: var(--text-secondary); text-align: center; padding: 2rem 0; font-size: 0.9rem;">
            No se encontraron secuencias ELS para "${escapeHtml(this.pagination.searchedQuery)}" en el libro seleccionado (${escapeHtml(this.selectedBook.toUpperCase())}) y rango de saltos.
          </div>`;
        if (paginationControls) paginationControls.style.display = 'none';
        if (matrixEmptyState) matrixEmptyState.style.display = 'block';
        if (matrixContainer) matrixContainer.style.display = 'none';
        this.toggleElsActionButtons(false);
        this.fillNarrativePanel(null);
        this.fillSecondaryPanel(null);
        return;
      }

      const sortedMatches = Engine.SortELSResults(this.pagination.allMatches, this.pagination.sortBy);
      this.applyPendingSelect(sortedMatches);

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
      const active = this.state.activeMatch;
      pageMatches.forEach((match, idx) => {
        const item = document.createElement('div');
        item.className = 'els-result-item';
        const verseContext = self.formatVerseLabel(match.start, match.indices);
        const termBadgeClass = `term-badge-${(match.termIndex || 0) % 4}`;
        const isActive = active && active.start === match.start && active.skip === match.skip && active.word === match.word;

        item.innerHTML = `
          <div class="els-result-header-row">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span class="els-result-word">${escapeHtml(match.word)}</span>
              ${self.pagination.termsArray && self.pagination.termsArray.length > 1 ? `<span class="term-badge ${termBadgeClass}">${escapeHtml(match.rawQuery || '')}</span>` : ''}
              ${self.honestyBadgeHtml(match)}
            </div>
            <span class="els-result-skip">Salto: ${match.skip}</span>
          </div>
          <div class="els-result-context" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.3rem;">
            <span>Inicio: Letra #${match.start}</span>
            <span>${escapeHtml(verseContext)}</span>
          </div>
        `;

        item.addEventListener('click', () => {
          document.querySelectorAll('.els-result-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          self.state.activeMatch = match;
          self.state.primaryWord = match.word;
          self.applyMatrixWidth(Math.abs(match.skip));
          self.renderMatrix();
        });

        if (isActive || (!active && idx === 0 && currentPage === 1)) {
          item.classList.add('active');
          self.state.activeMatch = match;
          self.state.primaryWord = match.word;
          if (!active) {
            self.applyMatrixWidth(Math.abs(match.skip));
          }
        }

        resultsList.appendChild(item);
      });

      if (this.state.activeMatch) {
        this.renderMatrix();
        this.fillNarrativePanel(this.state.activeMatch);
      }
    },

    showMatrixVerseHover: function(localIdx) {
      const hint = document.getElementById('matrixVerseHint');
      if (!hint) return;
      const verse = this.formatVerseLabel(localIdx);
      const globalIdx = this.getGlobalIndex(localIdx);
      hint.textContent = verse + ' · letra #' + globalIdx;
      hint.hidden = false;
    },

    bindMatrixHover: function(table) {
      if (!table || table._verseBound) return;
      const self = this;
      table.addEventListener('mouseover', (e) => {
        const td = e.target.closest('td');
        if (!td || !table.contains(td) || td.dataset.idx == null) return;
        self.showMatrixVerseHover(parseInt(td.dataset.idx, 10));
      });
      table.addEventListener('focusin', (e) => {
        const td = e.target.closest('td');
        if (!td || td.dataset.idx == null) return;
        self.showMatrixVerseHover(parseInt(td.dataset.idx, 10));
      });
      table._verseBound = true;
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
      this.toggleElsActionButtons(true);
      this.bindMatrixHover(matrixGrid);

      const text = this.getActiveTorahText();
      const w = this.state.matrixWidth;
      const minIdx = Math.min(...match.indices);
      const maxIdx = Math.max(...match.indices);
      const startRow = Math.floor(minIdx / w);
      const endRow = Math.floor(maxIdx / w);
      const minRow = Math.max(0, startRow - 4);
      const maxRow = Math.min(Math.floor((text.length - 1) / w), endRow + 4);

      matrixGrid.innerHTML = '';
      const matchSet = new Set(match.indices);
      const secondaryByIdx = {};
      (this.state.topographicWords || []).forEach(fw => {
        if (!fw || fw.word === match.word) return;
        (fw.indices || []).forEach(i => {
          if (secondaryByIdx[i] == null) secondaryByIdx[i] = fw.color || '#9b59b6';
        });
      });
      const hint = document.getElementById('matrixVerseHint');
      if (hint) {
        hint.textContent = this.formatVerseLabel(match.start, match.indices) +
          ' · pasa el cursor por una letra';
        hint.hidden = false;
      }

      for (let r = minRow; r <= maxRow; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < w; c++) {
          const idx = r * w + c;
          if (idx >= text.length) break;
          const td = document.createElement('td');
          td.textContent = text[idx];
          td.dataset.idx = String(idx);
          td.tabIndex = 0;
          const verse = this.formatVerseLabel(idx);
          td.title = verse + ' · letra #' + this.getGlobalIndex(idx);
          if (matchSet.has(idx)) td.classList.add('highlight-primary');
          if (secondaryByIdx[idx] != null) {
            td.classList.add('highlight-secondary');
            if (!matchSet.has(idx)) td.style.borderColor = secondaryByIdx[idx];
          }
          tr.appendChild(td);
        }
        matrixGrid.appendChild(tr);
      }
      this.fillNarrativePanel(match);
      this.fillSecondaryPanel(match);
    },

    handleTopographicScan: function() {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const numMinSkip = document.getElementById('numMinSkip');
      const numMaxSkip = document.getElementById('numMaxSkip');
      if (!Engine || !DB) return;

      let skip = 50;
      if (this.state.activeMatch && this.state.activeMatch.skip) {
        skip = Math.abs(this.state.activeMatch.skip);
      } else if (numMinSkip && numMaxSkip) {
        const minS = parseInt(numMinSkip.value, 10);
        const maxS = parseInt(numMaxSkip.value, 10);
        skip = (minS === maxS && minS >= 2) ? minS : 50;
      }
      const text = this.getActiveTorahText();
      const results = Engine.ScanTopographicELS(text, skip, DB.KNOWLEDGE_GRAPH, { maxMatches: 8 });
      this.state.isTopographic = true;
      this.state.topographicWords = results;
      this.renderTopographicResults(results, skip);
    },

    renderTopographicResults: function(foundWords, skip) {
      const legendBox = document.getElementById('elsTopographicLegend');
      const chipsContainer = document.getElementById('elsTopographicChips') || document.getElementById('topographicChipsContainer');
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
        chip.type = 'button';
        chip.style.borderColor = fw.color;
        chip.style.backgroundColor = fw.color + '20';
        chip.style.color = fw.color;
        chip.innerHTML = `<span>●</span> <span style="font-family:var(--font-hebrew);">${escapeHtml(fw.word)}</span> <span style="font-size:0.7rem;opacity:0.85;">(${escapeHtml(fw.title)})</span>`;
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
          self.applyMatrixWidth(Math.abs(fw.skip || skip || 50));
          self.renderMatrix();
        });
        chipsContainer.appendChild(chip);
      });

      if (foundWords.length) {
        const first = foundWords[0];
        this.state.activeMatch = {
          word: first.word,
          skip: first.skip,
          start: first.start,
          end: first.end,
          indices: first.indices,
          rawQuery: first.title
        };
        this.state.primaryWord = first.word;
        this.applyMatrixWidth(Math.abs(first.skip || skip || 50));
        this.renderMatrix();
      }
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
    },

    renderClassicGallery: function() {
      const grid = document.getElementById('elsClassicGalleryGrid');
      const DB = global.GematriaDB;
      if (!DB || !DB.ELS_CLASSIC_EXAMPLES) return;
      const biblio = document.getElementById('elsBibliographyList');
      if (biblio && DB.ELS_BIBLIOGRAPHY) {
        biblio.innerHTML = DB.ELS_BIBLIOGRAPHY.map(item =>
          `<li><strong>${escapeHtml(item.author)}</strong>, <em>${escapeHtml(item.title)}</em> (${escapeHtml(item.year)}) — ${escapeHtml(item.note)}</li>`
        ).join('');
      }
      if (!grid) return;
      grid.innerHTML = '';
      const self = this;
      DB.ELS_CLASSIC_EXAMPLES.forEach(ex => {
        const card = document.createElement('article');
        card.className = 'els-gallery-card' + (ex.reproducible ? '' : ' is-note');
        card.setAttribute('data-els-classic', ex.id);
        const actionLabel = ex.kind === 'els' && ex.reproducible
          ? 'Ver en esta Torá'
          : ex.kind === 'acrostic'
            ? 'Abrir acróstico'
            : ex.kind === 'gematria'
              ? 'Abrir comparador'
              : 'Leer nota';
        card.innerHTML = `
          <h5 class="els-gallery-card-title">${escapeHtml(ex.title)}</h5>
          <p class="els-gallery-card-context">${escapeHtml(ex.context || '')}</p>
          <p class="els-gallery-card-note">${escapeHtml(ex.corpusNote || '')}</p>
          <p class="els-gallery-card-sources">${escapeHtml((ex.sources || []).join(' · '))}</p>
          <button type="button" class="els-gallery-open" data-els-classic="${escapeHtml(ex.id)}">${actionLabel}</button>
        `;
        card.addEventListener('click', (ev) => {
          if (ev.target.closest('button')) return;
          self.openClassicExample(ex.id);
        });
        const openBtn = card.querySelector('.els-gallery-open');
        if (openBtn) {
          openBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            self.openClassicExample(ex.id);
          });
        }
        grid.appendChild(card);
      });
    },

    bindClassicTriggers: function(context) {
      const self = this;
      document.querySelectorAll('[data-els-classic]').forEach(el => {
        if (el.closest('#elsClassicGalleryGrid')) return;
        el.addEventListener('click', () => {
          self.openClassicExample(el.getAttribute('data-els-classic'), context);
        });
      });
    },

    showClassicCaption: function(example) {
      const box = document.getElementById('elsClassicCaption');
      if (!box || !example) return;
      box.hidden = false;
      box.innerHTML = `
        <strong>${escapeHtml(example.title)}</strong>
        <span>${escapeHtml(example.context || '')}</span>
        <span class="els-classic-caption-note">${escapeHtml(example.corpusNote || '')}</span>
        <span class="els-classic-caption-sources">${escapeHtml((example.sources || []).join(' · '))}</span>
      `;
    },

    openClassicExample: function(id, context) {
      const DB = global.GematriaDB;
      const ctx = context || this._context;
      const examples = (DB && DB.ELS_CLASSIC_EXAMPLES) || [];
      const example = examples.find(e => e.id === id);
      if (!example) return;
      this.state.activeExampleId = id;
      this.showClassicCaption(example);

      if (example.kind === 'acrostic') {
        const tv = global.AppModules && global.AppModules.timelineView;
        const ac = (DB.ACROSTIC_EXAMPLES || []).find(a => a.id === example.acrosticId);
        if (tv && typeof tv.loadAcrosticExample === 'function' && ac) {
          if (ctx && ctx.switchTab) ctx.switchTab('acrostics');
          tv.loadAcrosticExample(ac);
          return;
        }
        if (tv && typeof tv.searchFromStudy === 'function') {
          tv.searchFromStudy(example.hebrew);
        }
        return;
      }

      if (example.kind === 'gematria') {
        const cv = global.AppModules && global.AppModules.comparatorView;
        if (cv && typeof cv.openPairFromStudy === 'function') {
          cv.openPairFromStudy(example.wordA, example.wordB, ctx);
        } else if (ctx && ctx.switchTab) {
          ctx.switchTab('comparison');
          const a = document.getElementById('txtCompareA');
          const b = document.getElementById('txtCompareB');
          if (a) a.value = example.wordA || '';
          if (b) b.value = example.wordB || '';
        }
        return;
      }

      if (example.kind === 'note' || !example.reproducible) {
        if (ctx && ctx.switchTab) ctx.switchTab('biblecode');
        return;
      }

      if (ctx && ctx.switchTab) ctx.switchTab('biblecode');
      this.setSelectedBook(example.book || 'all');
      const txtSearchELS = document.getElementById('txtSearchELS');
      const numMinSkip = document.getElementById('numMinSkip');
      const numMaxSkip = document.getElementById('numMaxSkip');
      if (txtSearchELS) txtSearchELS.value = example.hebrew || '';
      if (numMinSkip) numMinSkip.value = example.skipMin != null ? example.skipMin : 50;
      if (numMaxSkip) numMaxSkip.value = example.skipMax != null ? example.skipMax : 50;
      this.pagination.sortBy = 'position';
      const selSort = document.getElementById('selELSSort');
      if (selSort) selSort.value = 'position';
      if (example.matchHint) {
        this.state.pendingSelect = { start: example.matchHint.start, skip: example.matchHint.skip };
      }
      this.state.pendingMatrixWidth = example.matrixWidth || example.skipMin || 50;
      this.applyMatrixWidth(this.state.pendingMatrixWidth);
      this.handleSearch(ctx);
    },

    runShuffledControl: function() {
      const Engine = global.GematriaEngine;
      const panel = document.getElementById('elsControlPanel');
      const resultEl = document.getElementById('elsControlResult');
      const match = this.state.activeMatch;
      if (!Engine || typeof Engine.ELSControlAtSkip !== 'function' || !match) return;
      const text = this.getActiveTorahText();
      const ctrl = Engine.ELSControlAtSkip(text, match.word, match.skip);
      if (panel) panel.hidden = false;
      if (!resultEl) return;
      const skip = match.skip;
      resultEl.innerHTML = `En este corpus, <span class="he">${escapeHtml(match.word)}</span> a salto ${skip} aparece
        <strong>${ctrl.originalCount}</strong> vez/veces. Con las mismas letras en orden aleatorio (semilla ${ctrl.seed}):
        <strong>${ctrl.controlCount}</strong> vez/veces. Si también sale barajado, el salto no es distintivo de esta secuencia
        (McKay et al., 1999).`;
    },

    formatCitation: function(match) {
      if (!match) return '';
      const verse = this.formatVerseLabel(match.start, match.indices);
      const globalIdx = this.getGlobalIndex(match.start);
      return `${match.word} · salto ${match.skip} · letra #${globalIdx} · ${verse}`;
    },

    copyCitation: function() {
      const match = this.state.activeMatch;
      const text = this.formatCitation(match);
      const btn = document.getElementById('btnCopyELSCitation');
      if (!text) return;
      const done = (ok) => {
        if (!btn) return;
        const prev = btn.textContent;
        btn.textContent = ok ? 'Copiado' : 'No se pudo copiar';
        setTimeout(() => { btn.textContent = prev; }, 1800);
      };
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => done(true)).catch(() => done(false));
        return;
      }
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done(true);
      } catch (e) {
        done(false);
      }
    },

    fillNarrativePanel: function(match) {
      const panel = document.getElementById('elsNarrativePanel');
      const textEl = document.getElementById('elsNarrativeText');
      if (!panel || !textEl) return;
      if (!match) {
        panel.style.display = 'none';
        return;
      }
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const numMinSkip = document.getElementById('numMinSkip');
      const numMaxSkip = document.getElementById('numMaxSkip');
      const verse = this.formatVerseLabel(match.start, match.indices);
      const citation = this.formatCitation(match);
      let honestyHtml = '';
      if (Engine && typeof Engine.AssessELSHonesty === 'function') {
        const honesty = Engine.AssessELSHonesty(match, {
          text: this.getActiveTorahText(),
          minSkip: numMinSkip ? parseInt(numMinSkip.value, 10) : 2,
          maxSkip: numMaxSkip ? parseInt(numMaxSkip.value, 10) : 120,
          runControl: false
        });
        honestyHtml = `<p><span class="honesty-badge ${escapeHtml(honesty.band)}">${escapeHtml(honesty.label)}</span>
          ${escapeHtml(honesty.note || '')}</p>
          ${(honesty.warnings || []).map(w => `<p class="els-narrative-warn">${escapeHtml(w)}</p>`).join('')}`;
      }
      let classicHtml = '';
      const exId = this.state.activeExampleId;
      const example = exId && DB && DB.ELS_CLASSIC_EXAMPLES
        ? DB.ELS_CLASSIC_EXAMPLES.find(e => e.id === exId)
        : null;
      if (example && example.kind === 'els') {
        classicHtml = `<p class="els-narrative-source">${escapeHtml(example.context || '')}
          ${(example.sources || []).length ? ' · ' + escapeHtml(example.sources.join(' · ')) : ''}</p>`;
      }
      textEl.innerHTML = `
        <p><strong style="font-family:var(--font-hebrew)">${escapeHtml(match.word)}</strong>
          · ${escapeHtml(citation)}</p>
        ${classicHtml}
        ${honestyHtml}
      `;
      panel.style.display = 'block';
    },

    fillSecondaryPanel: function(match) {
      const panel = document.getElementById('elsSecondaryPanel');
      const list = document.getElementById('elsSecondaryWordsList');
      if (!panel || !list) return;
      const others = (this.state.topographicWords || []).filter(fw => fw && match && fw.word !== match.word);
      if (!others.length) {
        panel.style.display = 'none';
        list.innerHTML = '';
        return;
      }
      const seen = {};
      list.innerHTML = others.filter(fw => {
        if (seen[fw.word]) return false;
        seen[fw.word] = true;
        return true;
      }).map(fw =>
        `<span class="secondary-badge" style="border-color:${escapeHtml(fw.color)};color:${escapeHtml(fw.color)}">
          <span style="font-family:var(--font-hebrew)">${escapeHtml(fw.word)}</span>
          <span>${escapeHtml(fw.title || '')}</span>
        </span>`
      ).join('');
      panel.style.display = 'block';
    },

    restoreSearch: function(opts, context) {
      const o = opts || {};
      const ctx = context || this._context;
      if (ctx && ctx.switchTab) ctx.switchTab('biblecode');
      const txtSearchELS = document.getElementById('txtSearchELS');
      const numMinSkip = document.getElementById('numMinSkip');
      const numMaxSkip = document.getElementById('numMaxSkip');
      if (txtSearchELS) txtSearchELS.value = o.word || o.hebrew || '';
      if (o.book) this.setSelectedBook(o.book);
      const skip = o.skip != null ? Math.abs(o.skip) : null;
      if (skip) {
        if (numMinSkip) numMinSkip.value = o.minSkip != null ? o.minSkip : skip;
        if (numMaxSkip) numMaxSkip.value = o.maxSkip != null ? o.maxSkip : skip;
        this.pagination.sortBy = 'position';
        const selSort = document.getElementById('selELSSort');
        if (selSort) selSort.value = 'position';
        this.state.pendingMatrixWidth = skip;
        this.applyMatrixWidth(skip);
        if (o.start != null) {
          this.state.pendingSelect = { start: o.start, skip: o.skip };
        }
      }
      this.handleSearch(ctx);
    },

    clearSearchHistory: function() {
      try {
        localStorage.removeItem('els_search_history');
      } catch (e) {}
      this.renderSearchHistory();
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.bibleCodeView = BibleCodeView;

})(typeof window !== 'undefined' ? window : globalThis);
