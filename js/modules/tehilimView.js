/**
 * Torah Gematria Deciphering Tool
 * Módulo: tehilimView.js - Vista de Salmos (Tehilim) y Plegarias Sagradas
 */

(function(global) {
  'use strict';

  const TehilimView = {
    currentCategory: 'all',
    currentSearch: '',

    init: function(context) {
      const self = this;
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const Audio = global.AppModules && global.AppModules.mysticAudio;

      const txtSearch = document.getElementById('txtTehilimSearch');
      const btnSearch = document.getElementById('btnTehilimSearch');
      const categoryFilters = document.querySelectorAll('.tehilim-cat-filter');
      const resultsContainer = document.getElementById('tehilimResultsContainer');
      const prayersContainer = document.getElementById('sacredPrayersContainer');

      // 1. Renderizar Plegarias Sagradas Iniciales
      if (prayersContainer && DB && DB.SACRED_PRAYERS) {
        self.renderPrayers(DB.SACRED_PRAYERS, prayersContainer, context, Audio);
      }

      // 2. Filtrado por Categoría
      categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
          categoryFilters.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          self.currentCategory = btn.getAttribute('data-cat') || 'all';
          self.renderPsalms(context);
        });
      });

      // 3. Búsqueda
      function executeSearch() {
        self.currentSearch = txtSearch ? txtSearch.value.trim() : '';
        self.renderPsalms(context);
      }

      if (btnSearch) btnSearch.addEventListener('click', executeSearch);
      if (txtSearch) {
        txtSearch.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') executeSearch();
        });
      }

      // Render inicial
      self.renderPsalms(context);
    },

    renderPsalms: function(context) {
      const self = this;
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const Audio = global.AppModules && global.AppModules.mysticAudio;
      const container = document.getElementById('tehilimResultsContainer');
      if (!container || !DB || !DB.TEHILIM_PSALMS) return;

      let psalms = DB.TEHILIM_PSALMS;

      // Filtrar por categoría
      if (self.currentCategory !== 'all') {
        psalms = psalms.filter(p => p.category === self.currentCategory);
      }

      // Si hay término de búsqueda numérico o textual
      let targetGematria = 0;
      if (self.currentSearch) {
        if (/^\d+$/.test(self.currentSearch)) {
          targetGematria = parseInt(self.currentSearch, 10);
        } else {
          const calc = Engine.CalculateGematria(self.currentSearch);
          targetGematria = calc.absolute;
        }
      }

      // Si hay un target de búsqueda, buscar por resonancia
      if (targetGematria > 0) {
        const resonantVerses = Engine.FindResonantPsalms(targetGematria, psalms, 1);
        if (resonantVerses.length === 0) {
          container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
              <p>No se encontraron versículos de resonancia directa con el valor <strong>${targetGematria}</strong> en los salmos seleccionados.</p>
              <button class="share-act-btn btn-copy-text" id="btnResetTehilimSearch" style="margin-top: 1rem;">Ver Todos los Salmos</button>
            </div>
          `;
          const btnReset = document.getElementById('btnResetTehilimSearch');
          if (btnReset) {
            btnReset.addEventListener('click', () => {
              const txt = document.getElementById('txtTehilimSearch');
              if (txt) txt.value = '';
              self.currentSearch = '';
              self.renderPsalms(context);
            });
          }
          return;
        }

        container.innerHTML = `
          <div class="tehilim-resonance-banner">
            <span>✨ Mostrando <strong>${resonantVerses.length}</strong> versículos resonantes con valor <strong>${targetGematria}</strong></span>
          </div>
          <div class="tehilim-grid">
            ${resonantVerses.map(v => `
              <div class="glass-card psalm-verse-card">
                <div class="psalm-verse-header">
                  <span class="psalm-verse-ref">📜 ${v.reference}</span>
                  <span class="psalm-gematria-badge">Valor: ${v.gematria}</span>
                </div>
                <div class="psalm-verse-hebrew">${v.hebrew}</div>
                <div class="psalm-verse-spanish">"${v.spanish}"</div>
                <div class="psalm-reasons-list">
                  ${v.reasons.map(r => `<span class="psalm-reason-chip">⭐ ${r}</span>`).join('')}
                </div>
                <div class="psalm-card-actions">
                  <button class="psalm-act-btn btn-play-psalm" data-text="${v.hebrew}" title="Escuchar acorde armónico de este versículo">🎵 Escuchar</button>
                  <button class="psalm-act-btn btn-calc-psalm" data-text="${v.hebrew}" title="Calcular este versículo en la Calculadora">🔢 Calcular</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        // Mostrar Salmos completos categorizados
        container.innerHTML = `
          <div class="tehilim-grid">
            ${psalms.map(p => `
              <div class="glass-card psalm-full-card">
                <div class="psalm-header-row">
                  <div>
                    <h3 class="psalm-card-title">${p.title}</h3>
                    <div class="psalm-hebrew-title">${p.hebrewTitle}</div>
                  </div>
                  <span class="psalm-cat-badge ${p.category}">${p.intention}</span>
                </div>
                <p class="psalm-mystical-notes">💡 ${p.mysticalNotes}</p>
                <div class="psalm-verses-scroll">
                  ${p.verses.map(v => `
                    <div class="psalm-verse-item">
                      <div class="psalm-v-top">
                        <span class="psalm-v-num">v.${v.verseNum}</span>
                        <span class="psalm-v-val">Gematria: ${v.gematria}</span>
                      </div>
                      <div class="psalm-v-hebrew">${v.hebrew}</div>
                      <div class="psalm-v-spanish">${v.spanish}</div>
                    </div>
                  `).join('')}
                </div>
                <div class="psalm-card-actions">
                  <button class="psalm-act-btn btn-play-psalm" data-text="${p.verses[0].hebrew}" title="Escuchar primer versículo">🎵 Escuchar Inicio</button>
                  <button class="psalm-act-btn btn-calc-psalm" data-text="${p.verses[0].hebrew}" title="Calcular primer versículo">🔢 Analizar</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // Conectar botones de audio y cálculo
      container.querySelectorAll('.btn-play-psalm').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-text');
          if (Audio && text) Audio.playWordHarmonics(text, 'arpeggio');
        });
      });

      container.querySelectorAll('.btn-calc-psalm').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-text');
          if (context && text) {
            const txtInput = document.getElementById('txtInput');
            if (txtInput) txtInput.value = text;
            context.processInputText(text);
            context.switchTab('calculator');
          }
        });
      });
    },

    renderPrayers: function(prayers, container, context, Audio) {
      container.innerHTML = `
        <div class="prayers-grid">
          ${prayers.map(pr => `
            <div class="glass-card prayer-card">
              <div class="prayer-header">
                <h4 class="prayer-title">${pr.name}</h4>
                <span class="prayer-source">${pr.source}</span>
              </div>
              <div class="prayer-hebrew">${pr.hebrew}</div>
              <div class="prayer-translit"><em>${pr.transliteration}</em></div>
              <div class="prayer-spanish">"${pr.spanish}"</div>
              <div class="prayer-metrics">
                <span>📏 Letras: <strong>${pr.letterCount}</strong></span> • 
                <span>🔢 Gematria: <strong>${pr.gematria}</strong></span> • 
                <span>🌱 Raíz: <strong>${pr.reduced}</strong></span>
              </div>
              <p class="prayer-purpose">✡️ ${pr.purpose}</p>
              <div class="psalm-card-actions">
                <button class="psalm-act-btn btn-play-prayer" data-text="${pr.hebrew}">🎵 Escuchar Armónicos</button>
                <button class="psalm-act-btn btn-calc-prayer" data-text="${pr.hebrew}">🔢 Decodificar</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.querySelectorAll('.btn-play-prayer').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-text');
          if (Audio && text) Audio.playWordHarmonics(text, 'arpeggio');
        });
      });

      container.querySelectorAll('.btn-calc-prayer').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-text');
          if (context && text) {
            const txtInput = document.getElementById('txtInput');
            if (txtInput) txtInput.value = text;
            context.processInputText(text);
            context.switchTab('calculator');
          }
        });
      });
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.tehilimView = TehilimView;

})(typeof window !== 'undefined' ? window : globalThis);
