/**
 * Torah Gematria Deciphering Tool
 * Módulo: calculatorView.js - Calculadora de Gematria, Teclado Virtual y Búsqueda Inversa
 */

(function(global) {
  'use strict';

  const CalculatorView = {
    currentSearchMode: 'word',

    init: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const self = this;

      const txtInput = document.getElementById('txtInput');
      const btnClearInput = document.getElementById('btnClearInput');
      const langBtns = document.querySelectorAll('.lang-btn');
      const suggestionsBar = document.getElementById('semanticSuggestionsBar');
      const suggestionsChips = document.getElementById('semanticSuggestionsChips');

      // Teclado Virtual
      this.renderVirtualKeyboard(context);

      // Limpieza de entrada
      if (btnClearInput) {
        btnClearInput.addEventListener('click', () => {
          if (txtInput) {
            txtInput.value = '';
            txtInput.focus();
            context.processInputText('');
          }
        });
      }

      // Cambio de idioma (Hebreo / Español)
      langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          langBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const lang = btn.getAttribute('data-lang');
          context.setLanguage(lang);
        });
      });

      // Entrada en tiempo real
      if (txtInput) {
        txtInput.addEventListener('input', (e) => {
          const val = e.target.value;
          context.processInputText(val);
          self.updateSemanticSuggestions(val, context);
        });
      }

      // Pestaña Buscador en la Torá / Búsqueda Inversa
      this.initTorahSearchTab(context);
    },

    renderVirtualKeyboard: function(context) {
      const Engine = global.GematriaEngine;
      const keyboardContainer = document.getElementById('virtualKeyboard');
      const txtInput = document.getElementById('txtInput');
      if (!keyboardContainer || !Engine) return;

      keyboardContainer.innerHTML = '';
      Object.keys(Engine.HEBREW_MAP).forEach(letter => {
        const key = document.createElement('button');
        key.className = 'kbd-key';
        key.innerHTML = `<span>${letter}</span><span class="key-val">${Engine.HEBREW_MAP[letter].absolute}</span>`;
        
        key.addEventListener('click', () => {
          if (txtInput) {
            txtInput.value += letter;
            context.setLanguage('hebrew');
            context.processInputText(txtInput.value);
            txtInput.focus();
          }
        });
        
        keyboardContainer.appendChild(key);
      });
    },

    updateSemanticSuggestions: function(text, context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const suggestionsBar = document.getElementById('semanticSuggestionsBar');
      const suggestionsChips = document.getElementById('semanticSuggestionsChips');
      const txtInput = document.getElementById('txtInput');
      if (!suggestionsBar || !suggestionsChips || !Engine || !DB) return;

      if (!text || text.trim().length === 0 || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(text)) {
        suggestionsBar.style.display = 'none';
        return;
      }

      const matches = Engine.SearchSpanishSemantic(text, DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH, 5);
      if (matches.length === 0) {
        suggestionsBar.style.display = 'none';
        return;
      }

      suggestionsChips.innerHTML = '';
      matches.forEach(m => {
        const chip = document.createElement('button');
        chip.className = 'semantic-chip';
        chip.innerHTML = `<span>${m.spanish}</span> <span class="chip-hebrew">${m.hebrew}</span> <span class="chip-val">(${m.value})</span>`;
        chip.addEventListener('click', () => {
          if (txtInput) {
            txtInput.value = m.hebrew;
            context.setLanguage('hebrew');
            context.processInputText(m.hebrew);
            suggestionsBar.style.display = 'none';
          }
        });
        suggestionsChips.appendChild(chip);
      });

      suggestionsBar.style.display = 'block';
    },

    renderResults: function(result, context) {
      const valAbsolute = document.getElementById('valAbsolute');
      const valOrdinal = document.getElementById('valOrdinal');
      const valReduced = document.getElementById('valReduced');
      const valAtbash = document.getElementById('valAtbash');
      const valAlbam = document.getElementById('valAlbam');
      const valAvgad = document.getElementById('valAvgad');

      if (valAbsolute) valAbsolute.textContent = result.absolute;
      if (valOrdinal) valOrdinal.textContent = result.ordinal;
      if (valReduced) valReduced.textContent = result.reduced;
      if (valAtbash) valAtbash.textContent = `${result.atbash.absolute} (${result.atbash.text})`;
      if (valAlbam) valAlbam.textContent = `${result.albam.absolute} (${result.albam.text})`;
      if (valAvgad) valAvgad.textContent = `${result.avgad.absolute} (${result.avgad.text})`;

      this.renderLettersGrid(result.letters);
      this.renderSefirotBreakdown(result.absolute);
    },

    renderLettersGrid: function(letters) {
      const container = document.getElementById('lettersBreakdownGrid');
      if (!container) return;

      if (!letters || letters.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">Ingresa texto para ver el desglose letra por letra.</span>';
        return;
      }

      container.innerHTML = '';
      letters.forEach(l => {
        const item = document.createElement('div');
        item.className = 'letter-item';
        item.innerHTML = `
          <div class="letter-char">${l.char}</div>
          <div class="letter-name">${l.name}</div>
          <div class="letter-value">${l.absolute}</div>
          <div style="font-size:0.65rem; color:var(--text-secondary); margin-top:2px;">Ord: ${l.ordinal}</div>
        `;
        container.appendChild(item);
      });
    },

    renderSefirotBreakdown: function(absoluteValue) {
      const container = document.getElementById('sefirotBreakdown');
      if (!container) return;

      const sefirot = [
        { name: 'Kéter (Corona)', val: 620, desc: 'Voluntad primordial y luz infinita' },
        { name: 'Jojmá (Sabiduría)', val: 73, desc: 'El destello de la revelación' },
        { name: 'Biná (Entendimiento)', val: 67, desc: 'La matriz conceptual estructurante' },
        { name: 'Jésed (Misericordia)', val: 72, desc: 'Amor expansivo y benevolencia' },
        { name: 'Gevurá (Fuerza)', val: 216, desc: 'Rigor, juicio y restricción' },
        { name: 'Tiféret (Belleza)', val: 1081, desc: 'Armonía y verdad integradora' },
        { name: 'Nétzaj (Victoria)', val: 148, desc: 'Perseverancia y eternidad' },
        { name: 'Hod (Esplendor)', val: 15, desc: 'Reverberación y gratitud' },
        { name: 'Yesod (Fundamento)', val: 80, desc: 'Canal de conexión y alianza' },
        { name: 'Maljut (Reino)', val: 496, desc: 'Manifestación física en la creación' }
      ];

      container.innerHTML = '';
      sefirot.forEach(s => {
        const item = document.createElement('div');
        item.className = 'sefirah-item';
        const isResonant = (absoluteValue > 0 && (absoluteValue % s.val === 0 || s.val % absoluteValue === 0 || Math.abs(absoluteValue - s.val) <= 1));
        
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color: ${isResonant ? 'var(--gold-primary)' : 'var(--text-primary)'};">${s.name}</strong>
            <span style="font-size:0.75rem; color:var(--gold-primary); font-weight:bold;">${s.val}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">${s.desc}</div>
        `;
        if (isResonant) {
          item.style.borderColor = 'var(--gold-primary)';
          item.style.background = 'rgba(212,175,55,0.15)';
        }
        container.appendChild(item);
      });
    },

    initTorahSearchTab: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const self = this;

      const txtSearchTorah = document.getElementById('txtSearchTorah');
      const btnSearchTorah = document.getElementById('btnSearchTorah');
      const torahSearchResults = document.getElementById('torahSearchResults');
      const searchModeWordBtn = document.getElementById('searchModeWord');
      const searchModeNumberBtn = document.getElementById('searchModeNumber');
      const reverseControls = document.getElementById('reverseSearchControls');
      const selTolerance = document.getElementById('selTolerance');
      const selReverseSystem = document.getElementById('selReverseSystem');
      const quickNumChips = document.querySelectorAll('.quick-num-chip');

      if (searchModeWordBtn && searchModeNumberBtn) {
        searchModeWordBtn.addEventListener('click', () => {
          self.currentSearchMode = 'word';
          searchModeWordBtn.classList.add('active');
          searchModeNumberBtn.classList.remove('active');
          if (reverseControls) reverseControls.style.display = 'none';
          if (txtSearchTorah) txtSearchTorah.placeholder = 'Buscar palabra o concepto hebreo...';
        });

        searchModeNumberBtn.addEventListener('click', () => {
          self.currentSearchMode = 'number';
          searchModeNumberBtn.classList.add('active');
          searchModeWordBtn.classList.remove('active');
          if (reverseControls) reverseControls.style.display = 'block';
          if (txtSearchTorah) txtSearchTorah.placeholder = 'Ingresa un número (ej. 13, 26, 708, 541)...';
        });
      }

      quickNumChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const num = chip.getAttribute('data-num');
          if (txtSearchTorah && num) {
            txtSearchTorah.value = num;
            if (searchModeNumberBtn) searchModeNumberBtn.click();
            self.executeSearch(context);
          }
        });
      });

      if (btnSearchTorah) {
        btnSearchTorah.addEventListener('click', () => self.executeSearch(context));
      }

      if (txtSearchTorah) {
        txtSearchTorah.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') self.executeSearch(context);
        });
      }
    },

    executeSearch: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const txtSearchTorah = document.getElementById('txtSearchTorah');
      const torahSearchResults = document.getElementById('torahSearchResults');
      const selTolerance = document.getElementById('selTolerance');
      const selReverseSystem = document.getElementById('selReverseSystem');
      if (!txtSearchTorah || !torahSearchResults || !Engine || !DB) return;

      const query = txtSearchTorah.value.trim();
      if (!query) {
        torahSearchResults.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">Ingresa un término o número para buscar.</span>';
        return;
      }

      if (this.currentSearchMode === 'number' || /^\d+$/.test(query)) {
        const targetNumber = parseInt(query, 10);
        const tolerance = selTolerance ? parseInt(selTolerance.value, 10) : 0;
        const system = selReverseSystem ? selReverseSystem.value : 'all';

        const matches = Engine.FindReverseGematria(targetNumber, { tolerance, system }, DB.KNOWLEDGE_GRAPH);

        if (matches.length === 0) {
          torahSearchResults.innerHTML = `
            <div style="color: var(--text-secondary); text-align: center; padding: 2rem 0; font-size: 0.9rem;">
              No se encontraron palabras con valor ${targetNumber} (tolerancia ±${tolerance}) en el grafo de conocimiento.
            </div>`;
          return;
        }

        torahSearchResults.innerHTML = '';
        matches.forEach(m => {
          const card = document.createElement('div');
          card.className = 'reverse-match-card';
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
              <span class="reverse-match-hebrew">${m.entry.hebrew}</span>
              <span class="reverse-match-val">${m.bestMatch.val} (${m.bestMatch.system})</span>
            </div>
            <div style="font-size:0.85rem; font-weight:bold; color:var(--text-primary);">${m.entry.spanish || m.entry.concept}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;">${m.entry.meaning || m.entry.mysticalMeaning || ''}</div>
          `;
          card.addEventListener('click', () => {
            if (context && context.switchTab && context.processInputText) {
              context.switchTab('calculator');
              const txtInput = document.getElementById('txtInput');
              if (txtInput) txtInput.value = m.entry.hebrew;
              context.setLanguage('hebrew');
              context.processInputText(m.entry.hebrew);
            }
          });
          torahSearchResults.appendChild(card);
        });
      } else {
        // Búsqueda por palabra/concepto
        const results = DB.KNOWLEDGE_GRAPH.filter(k => 
          k.hebrew.includes(query) || 
          (k.concept && k.concept.toLowerCase().includes(query.toLowerCase())) ||
          (k.spanish && k.spanish.toLowerCase().includes(query.toLowerCase()))
        );

        if (results.length === 0) {
          torahSearchResults.innerHTML = `
            <div style="color: var(--text-secondary); text-align: center; padding: 2rem 0; font-size: 0.9rem;">
              No se encontraron coincidencias para "${query}".
            </div>`;
          return;
        }

        torahSearchResults.innerHTML = '';
        results.forEach(r => {
          const card = document.createElement('div');
          card.className = 'reverse-match-card';
          const gem = r.gematria || Engine.CalculateGematria(r.hebrew);
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
              <span class="reverse-match-hebrew">${r.hebrew}</span>
              <span class="reverse-match-val">${gem.absolute}</span>
            </div>
            <div style="font-size:0.85rem; font-weight:bold; color:var(--text-primary);">${r.spanish || r.concept}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;">${r.meaning || r.mysticalMeaning || ''}</div>
          `;
          card.addEventListener('click', () => {
            if (context && context.switchTab && context.processInputText) {
              context.switchTab('calculator');
              const txtInput = document.getElementById('txtInput');
              if (txtInput) txtInput.value = r.hebrew;
              context.setLanguage('hebrew');
              context.processInputText(r.hebrew);
            }
          });
          torahSearchResults.appendChild(card);
        });
      }
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.calculatorView = CalculatorView;

})(typeof window !== 'undefined' ? window : globalThis);
