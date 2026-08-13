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
        const gem = Engine ? Engine.CalculateGematria(event.hebrew) : { absolute: 0 };

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <span style="font-size:0.8rem; font-weight:bold; color:var(--gold-primary);">${event.year} (${event.hebrewYear})</span>
            <span style="font-family:var(--font-hebrew); font-size:1.3rem; color:#00ced1;">${event.hebrew}</span>
          </div>
          <h4 style="font-family:var(--font-serif); color:var(--text-primary); margin-bottom:0.4rem;">${event.event}</h4>
          <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">${event.biblicalCorrelation || event.significance}</p>
          <div style="margin-top:0.6rem; font-size:0.75rem; color:var(--gold-primary);">
            Valor: <strong>${gem.absolute}</strong> • Sefirá: <strong>${event.sefirah || 'Maljut'}</strong>
          </div>
        `;

        card.addEventListener('click', () => {
          if (context && context.switchTab && context.processInputText) {
            context.switchTab('calculator');
            const txtInput = document.getElementById('txtInput');
            if (txtInput) txtInput.value = event.hebrew;
            context.setLanguage('hebrew');
            context.processInputText(event.hebrew);
          }
        });

        container.appendChild(card);
      });
    },

    initAcrostics: function(context) {
      const Engine = global.GematriaEngine;
      const txtAcrosticsInput = document.getElementById('txtAcrosticsInput');
      const txtAcrosticsTarget = document.getElementById('txtAcrosticsTarget');
      const acrosticsResults = document.getElementById('acrosticsResults');
      const btnFindAcrostics = document.getElementById('btnFindAcrostics');
      const acrosticTypeBtns = document.querySelectorAll('.acrostic-type-btn');
      let selectedAcrosticType = 'roshei';

      if (acrosticTypeBtns.length > 0) {
        acrosticTypeBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            acrosticTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAcrosticType = btn.getAttribute('data-type');
          });
        });
      }

      if (btnFindAcrostics && Engine) {
        btnFindAcrostics.addEventListener('click', () => {
          if (!txtAcrosticsInput || !acrosticsResults) return;
          const text = txtAcrosticsInput.value.trim();
          if (!text) {
            acrosticsResults.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">Ingresa un texto hebreo para analizar.</span>';
            return;
          }

          const targetRaw = txtAcrosticsTarget ? txtAcrosticsTarget.value.trim() : '';
          let targetHebrew = targetRaw || null;
          if (targetHebrew && /[a-zA-Z]/.test(targetHebrew)) {
            targetHebrew = Engine.SpanishToHebrew(targetHebrew);
          }
          if (targetHebrew) targetHebrew = targetHebrew.replace(/[^א-ת]/g, '') || null;

          const results = Engine.FindAcrostics(text, selectedAcrosticType, targetHebrew);

          if (!results || results.length === 0) {
            acrosticsResults.innerHTML = `
              <div style="color: var(--text-secondary); text-align: center; padding: 1.5rem 0; font-size: 0.9rem;">
                ${targetHebrew
                  ? `No se encontró el acróstico "<span style="font-family: var(--font-hebrew); color: var(--gold-primary);">${targetHebrew}</span>" en el texto ingresado.`
                  : 'No se pudo extraer acróstico del texto ingresado.'
                }
              </div>`;
            return;
          }

          acrosticsResults.innerHTML = '';
          results.forEach(r => {
            const card = document.createElement('div');
            card.style.cssText = 'margin-bottom: 1rem; padding: 0.8rem 1rem; background: rgba(212,175,55,0.05); border: 1px solid rgba(212,175,55,0.2); border-radius: 10px;';
            const typeLabel = r.isRoshei ? 'Roshei Teivot (Iniciales)' : 'Sofei Teivot (Finales)';
            const typeBadge = r.isRoshei
              ? 'background: rgba(212,175,55,0.15); color: var(--gold-primary);'
              : 'background: rgba(0,206,209,0.15); color: #00ced1;';

            const lettersHtml = r.wordDetails.map(wd => `
              <span style="display: inline-flex; flex-direction: column; align-items: center; margin: 0 0.3rem; gap: 0.1rem;">
                <span style="font-family: var(--font-hebrew); font-size: 1.1rem; color: ${r.isRoshei ? 'var(--gold-primary)' : '#00ced1'}; font-weight: bold;">${wd.letter}</span>
                <span style="font-size: 0.65rem; color: var(--text-secondary); max-width: 55px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${wd.word}</span>
              </span>
            `).join('');

            card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.4rem;">
                <span style="font-family: var(--font-hebrew); font-size: 1.8rem; color: var(--gold-primary);">${r.word}</span>
                <span style="padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.72rem; font-weight: bold; ${typeBadge}">${typeLabel}</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; align-items: flex-start; direction: rtl; padding: 0.5rem 0; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); margin: 0.5rem 0;">
                ${lettersHtml}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-secondary);">
                Palabras: ${r.startIndex + 1} a ${r.endIndex + 1} del texto | Longitud del acróstico: ${r.word.length} letras
              </div>
            `;
            acrosticsResults.appendChild(card);
          });
        });
      }
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
