/**
 * Torah Gematria Deciphering Tool
 * Módulo: comparatorView.js - Comparador Místico Inteligente y Análisis de Delta (Δ)
 */

(function(global) {
  'use strict';

  const ComparatorView = {
    canvas: null,
    ctx: null,
    animationFrame: null,

    init: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const self = this;

      const txtCompareA = document.getElementById('txtCompareA');
      const txtCompareB = document.getElementById('txtCompareB');
      const btnCompareWords = document.getElementById('btnCompareWords');
      const legendaryPairsChips = document.getElementById('legendaryPairsChips');

      this.canvas = document.getElementById('comparisonCanvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');

      // Cargar Pares Legendarios
      if (legendaryPairsChips && DB && DB.LEGENDARY_PAIRS) {
        legendaryPairsChips.innerHTML = '';
        DB.LEGENDARY_PAIRS.forEach(pair => {
          const chip = document.createElement('button');
          chip.className = 'pair-chip';
          chip.innerHTML = `<span style="font-family:var(--font-hebrew); font-weight:bold;">${pair.a}</span> ⚡ <span style="font-family:var(--font-hebrew); font-weight:bold;">${pair.b}</span> <span style="font-size:0.7rem; color:var(--text-secondary);">(${pair.desc})</span>`;
          chip.addEventListener('click', () => {
            if (txtCompareA && txtCompareB) {
              txtCompareA.value = pair.a;
              txtCompareB.value = pair.b;
              self.executeComparison(context);
            }
          });
          legendaryPairsChips.appendChild(chip);
        });
      }

      if (btnCompareWords) {
        btnCompareWords.addEventListener('click', () => self.executeComparison(context));
      }

      [txtCompareA, txtCompareB].forEach(input => {
        if (input) {
          input.addEventListener('input', () => self.executeComparison(context));
        }
      });

      this.animate();
    },

    executeComparison: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const txtCompareA = document.getElementById('txtCompareA');
      const txtCompareB = document.getElementById('txtCompareB');
      const deltaBadge = document.getElementById('compareDeltaBadge');
      const sumBadge = document.getElementById('compareSumBadge');
      const narrativeBox = document.getElementById('compareNarrativeBox');
      const narrativeText = document.getElementById('compareNarrativeText');

      if (!txtCompareA || !txtCompareB || !Engine || !DB) return;

      let wordA = txtCompareA.value.trim();
      let wordB = txtCompareB.value.trim();

      if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(wordA)) {
        const sem = Engine.SearchSpanishSemantic(wordA, DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH, 1);
        wordA = sem.length > 0 ? sem[0].hebrew : Engine.SpanishToHebrew(wordA);
      }
      if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(wordB)) {
        const sem = Engine.SearchSpanishSemantic(wordB, DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH, 1);
        wordB = sem.length > 0 ? sem[0].hebrew : Engine.SpanishToHebrew(wordB);
      }

      const resA = Engine.CalculateGematria(wordA);
      const resB = Engine.CalculateGematria(wordB);

      // Actualizar valores en UI
      const lblValA = document.getElementById('compareValA');
      const lblValB = document.getElementById('compareValB');
      if (lblValA) lblValA.textContent = resA.absolute;
      if (lblValB) lblValB.textContent = resB.absolute;

      const analysis = Engine.AnalyzeCrossConnection(wordA, wordB, DB.KNOWLEDGE_GRAPH);

      if (deltaBadge) deltaBadge.textContent = `Δ = ${analysis.delta}`;
      if (sumBadge) sumBadge.textContent = `Suma = ${analysis.sum}`;

      if (narrativeBox && narrativeText) {
        if (wordA.length > 0 && wordB.length > 0) {
          narrativeText.innerHTML = `
            <p><strong>${analysis.isExactMatch ? '✨ Equivalencia de Forma Mística (Dvekut):' : '⚡ Conexión y Flujo Energético:'}</strong> ${analysis.narrative}</p>
            ${analysis.isAnagram ? '<p style="color:#00ced1; margin-top:0.4rem;">🔮 <strong>¡Tzeruf Otiot (Permutación Sagrada)!</strong> Ambas palabras contienen exactamente las mismas letras.</p>' : ''}
            ${analysis.bridgeConcept ? `<p style="color:var(--gold-primary); margin-top:0.4rem;">🌉 <strong>Concepto Puente:</strong> Resuena con "${analysis.bridgeConcept.hebrew}" (${analysis.bridgeConcept.spanish || analysis.bridgeConcept.concept}).</p>` : ''}
          `;
          narrativeBox.style.display = 'block';
        } else {
          narrativeBox.style.display = 'none';
        }
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
      const h = this.canvas.height = this.canvas.offsetHeight || 180;
      const time = Date.now() * 0.002;

      ctx.clearRect(0, 0, w, h);

      // Onda A (Dorado)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.03 + time) * 28 * Math.cos(time * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Onda B (Cian)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 206, 209, 0.7)';
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.035 - time * 1.2) * 28 * Math.sin(time * 0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.comparatorView = ComparatorView;

})(typeof window !== 'undefined' ? window : globalThis);
