/**
 * Torah Gematria Deciphering Tool
 * Módulo: timelineView.js - Correlación Sionista, Línea de Tiempo y Acrósticos
 */

(function(global) {
  'use strict';

  const TimelineView = {
    canvas: null,
    ctx: null,

    init: function(context) {
      const DB = global.GematriaDB;
      const Engine = global.GematriaEngine;
      const self = this;

      this.canvas = document.getElementById('timelineCanvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');

      this.renderZionismGrid(context);
      this.initAcrostics(context);
      this.animate();
    },

    renderZionismGrid: function(context) {
      const DB = global.GematriaDB;
      const Engine = global.GematriaEngine;
      const container = document.getElementById('zionismGrid');
      if (!container || !DB || !DB.HISTORICAL_EVENTS) return;

      container.innerHTML = '';
      DB.HISTORICAL_EVENTS.forEach(event => {
        const card = document.createElement('div');
        card.className = 'history-card glass-card';
        const hebrew = (event.searchTerms && event.searchTerms[0]) || event.hebrew || '';
        const gem = Engine && hebrew ? Engine.CalculateGematria(hebrew) : { absolute: 0 };

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <span style="font-size:0.8rem; font-weight:bold; color:var(--gold-primary);">${event.year} (${event.hebrewYear || event.label || ''})</span>
            <span style="font-family:var(--font-hebrew); font-size:1.3rem; color:#00ced1;">${hebrew}</span>
          </div>
          <h4 style="font-family:var(--font-serif); color:var(--text-primary); margin-bottom:0.4rem;">${event.title || event.event || ''}</h4>
          <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">${event.desc || event.biblicalCorrelation || event.significance || ''}</p>
          <div style="margin-top:0.6rem; font-size:0.75rem; color:var(--gold-primary);">
            ${gem.absolute ? `Gematria <strong>${gem.absolute}</strong>` : (event.label || '')}
          </div>
        `;

        card.addEventListener('click', () => {
          TimelineView.focusEvent(event);
        });

        container.appendChild(card);
      });
    },

    focusEvent: function(event) {
      const panel = document.getElementById('timelineDetailPanel');
      if (!panel || !event) return;
      const hebrew = (event.searchTerms && event.searchTerms[0]) || event.hebrew || '';
      panel.style.display = 'block';
      panel.innerHTML = `
        <h4 style="font-family:var(--font-serif); color:var(--gold-primary); margin:0 0 0.4rem;">${event.title || event.event || ''}</h4>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin:0 0 0.5rem;">${event.label || event.year} · ${event.hebrewYear || ''}</p>
        <p style="color:var(--text-primary); font-size:0.9rem; line-height:1.5; margin:0;">${event.desc || ''}</p>
        ${hebrew ? `<p style="font-family:var(--font-hebrew); font-size:1.4rem; color:#00ced1; margin:0.6rem 0 0; direction:rtl;">${hebrew}</p>` : ''}
      `;
    },

    initAcrostics: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const self = this;
      this._acrosticContext = context;
      this.selectedAcrosticType = 'roshei';

      const txtAcrosticsInput = document.getElementById('txtAcrosticsInput');
      const txtAcrosticsTarget = document.getElementById('txtAcrosticsTarget');
      const acrosticsResults = document.getElementById('acrosticsResults');
      const btnFindAcrostics = document.getElementById('btnFindAcrostics');
      const btnAcrosticsCorpus = document.getElementById('btnAcrosticsCorpus');
      const acrosticTypeBtns = document.querySelectorAll('.acrostic-type-btn');

      const setType = (type) => {
        self.selectedAcrosticType = type || 'roshei';
        acrosticTypeBtns.forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-type') === self.selectedAcrosticType);
        });
      };

      if (acrosticTypeBtns.length > 0) {
        acrosticTypeBtns.forEach(btn => {
          btn.addEventListener('click', () => setType(btn.getAttribute('data-type')));
        });
      }

      const renderHits = (results, meta) => {
        if (!acrosticsResults) return;
        meta = meta || {};
        if (!results || results.length === 0) {
          const target = meta.target || '';
          acrosticsResults.innerHTML = `
            <div style="color: var(--text-secondary); text-align: center; padding: 1.5rem 0; font-size: 0.9rem;">
              ${target
                ? `No se encontró <span style="font-family: var(--font-hebrew); color: var(--gold-primary);">${target}</span> como acróstico${meta.corpus ? ' en las frases curadas' : ' en el texto ingresado'}.`
                : 'No se pudo extraer acróstico del texto ingresado.'
              }
              <div style="margin-top:0.7rem;font-size:0.78rem;">Búsqueda exploratoria: un objetivo corto puede aparecer por azar en pocas palabras.</div>
            </div>`;
          return;
        }

        acrosticsResults.innerHTML = '';
        if (meta.corpus) {
          const note = document.createElement('p');
          note.className = 'acrostic-honesty-note';
          note.textContent = 'Frases curadas con espacios (palabras). El corpus ELS no tiene cortes de palabra: no se busca Roshei Teivot ahí.';
          acrosticsResults.appendChild(note);
        }
        results.forEach(r => {
          const card = document.createElement('div');
          card.className = 'acrostic-hit-card';
          const typeLabel = r.isRoshei ? 'Roshei Teivot (Iniciales)' : 'Sofei Teivot (Finales)';
          const typeBadge = r.isRoshei
            ? 'background: rgba(212,175,55,0.15); color: var(--gold-primary);'
            : 'background: rgba(0,206,209,0.15); color: #00ced1;';
          const lettersHtml = (r.wordDetails || []).map(wd => `
            <span style="display: inline-flex; flex-direction: column; align-items: center; margin: 0 0.3rem; gap: 0.1rem;">
              <span style="font-family: var(--font-hebrew); font-size: 1.1rem; color: ${r.isRoshei ? 'var(--gold-primary)' : '#00ced1'}; font-weight: bold;">${wd.letter}</span>
              <span style="font-size: 0.65rem; color: var(--text-secondary); max-width: 55px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${wd.word}</span>
            </span>
          `).join('');
          const ref = r.reference ? `<div class="acrostic-hit-ref">${r.reference}${r.translation ? ' — ' + r.translation : ''}</div>` : '';
          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.4rem;">
              <span style="font-family: var(--font-hebrew); font-size: 1.8rem; color: var(--gold-primary);">${r.word}</span>
              <span style="padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.72rem; font-weight: bold; ${typeBadge}">${typeLabel}</span>
            </div>
            ${ref}
            <div style="display: flex; flex-wrap: wrap; align-items: flex-start; direction: rtl; padding: 0.5rem 0; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); margin: 0.5rem 0;">
              ${lettersHtml}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">
              Palabras ${r.startIndex + 1}–${r.endIndex + 1} · ${r.word.length} letras
            </div>
          `;
          acrosticsResults.appendChild(card);
        });
      };

      const resolveTarget = () => {
        const targetRaw = txtAcrosticsTarget ? txtAcrosticsTarget.value.trim() : '';
        let targetHebrew = targetRaw || null;
        if (targetHebrew && /[a-zA-Z]/.test(targetHebrew) && Engine) {
          targetHebrew = Engine.SpanishToHebrew(targetHebrew);
        }
        if (targetHebrew) targetHebrew = targetHebrew.replace(/[^א-ת]/g, '') || null;
        return targetHebrew;
      };

      this.runAcrosticSearch = function(opts) {
        opts = opts || {};
        if (!Engine || !acrosticsResults) return;
        const targetHebrew = resolveTarget();
        const text = txtAcrosticsInput ? txtAcrosticsInput.value.trim() : '';
        const type = self.selectedAcrosticType || 'roshei';
        const forceCorpus = !!opts.forceCorpus || (!text && !!targetHebrew);

        if (!text && !targetHebrew) {
          acrosticsResults.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">Ingresa un texto hebreo, un objetivo, o elige un ejemplo clásico.</span>';
          return;
        }

        let results;
        if (forceCorpus && targetHebrew) {
          const phrases = Engine.GetAcrosticPhraseCorpus ? Engine.GetAcrosticPhraseCorpus(DB) : (DB.TORAH_VERSES || []);
          results = Engine.FindAcrosticsInPhrases(phrases, targetHebrew, type === 'both' ? 'both' : type);
          renderHits(results, { target: targetHebrew, corpus: true });
          return;
        }

        if (!text) {
          acrosticsResults.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">Ingresa un texto hebreo para analizar, o busca en las frases curadas.</span>';
          return;
        }
        results = Engine.FindAcrostics(text, type, targetHebrew);
        renderHits(results, { target: targetHebrew, corpus: false });
      };

      this.searchFromStudy = function(hebrew) {
        const he = String(hebrew || '').replace(/[^א-ת]/g, '');
        if (!he) return;
        if (txtAcrosticsTarget) txtAcrosticsTarget.value = he;
        if (txtAcrosticsInput) txtAcrosticsInput.value = '';
        setType('both');
        if (context && context.switchTab) context.switchTab('acrostics');
        self.runAcrosticSearch({ forceCorpus: true });
      };

      this.loadAcrosticExample = function(example) {
        if (!example) return;
        setType(example.type || 'roshei');
        if (txtAcrosticsTarget) txtAcrosticsTarget.value = example.target || '';
        const phrases = Engine && Engine.GetAcrosticPhraseCorpus
          ? Engine.GetAcrosticPhraseCorpus(DB)
          : (DB.TORAH_VERSES || []);
        const phrase = phrases.find(p => p.reference === example.reference);
        if (txtAcrosticsInput) txtAcrosticsInput.value = phrase ? phrase.hebrew : '';
        self.runAcrosticSearch({ forceCorpus: true });
      };

      this.loadAcrosticVerse = function(reference) {
        const phrases = Engine && Engine.GetAcrosticPhraseCorpus
          ? Engine.GetAcrosticPhraseCorpus(DB)
          : (DB.TORAH_VERSES || []);
        const phrase = phrases.find(p => p.reference === reference);
        if (!phrase) return;
        if (txtAcrosticsInput) txtAcrosticsInput.value = phrase.hebrew;
        if (txtAcrosticsTarget) txtAcrosticsTarget.value = '';
        self.runAcrosticSearch();
      };

      if (btnFindAcrostics) {
        btnFindAcrostics.addEventListener('click', () => self.runAcrosticSearch());
      }
      if (btnAcrosticsCorpus) {
        btnAcrosticsCorpus.addEventListener('click', () => self.runAcrosticSearch({ forceCorpus: true }));
      }
      document.querySelectorAll('[data-acrostic-ex]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-acrostic-ex');
          const examples = (DB && DB.ACROSTIC_EXAMPLES) || [];
          const ex = examples.find(e => e.id === id);
          if (ex) self.loadAcrosticExample(ex);
        });
      });
      document.querySelectorAll('[data-acrostic-verse]').forEach(btn => {
        btn.addEventListener('click', () => {
          self.loadAcrosticVerse(btn.getAttribute('data-acrostic-verse'));
        });
      });
    },

    animate: function() {
      const self = this;
      this.draw();
      requestAnimationFrame(() => self.animate());
    },

    draw: function() {
      if (!this.canvas || !this.ctx) return;
      const ctx = this.ctx;
      const w = this.canvas.width = this.canvas.offsetWidth || 300;
      const h = this.canvas.height = this.canvas.offsetHeight || 140;
      const time = Date.now() * 0.0015;

      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(20, h / 2);
      ctx.lineTo(w - 20, h / 2);
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const x = 30 + (i / 5) * (w - 60);
        const y = h / 2 + Math.sin(time + i) * 6;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
      }
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.timelineView = TimelineView;

})(typeof window !== 'undefined' ? window : globalThis);
