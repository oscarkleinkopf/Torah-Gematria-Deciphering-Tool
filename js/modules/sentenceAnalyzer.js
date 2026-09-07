/**
 * Torah Gematria Deciphering Tool
 * Módulo: sentenceAnalyzer.js - Analizador de Frases y Oraciones Completas
 */

(function(global) {
  'use strict';

  const PRESETS = [
    {
      label: 'Génesis 1:1 (La Creación)',
      text: 'בראשית ברא אלהים את השמים ואת הארץ',
      desc: '7 palabras, valor 2701 (Número triangular de 73)'
    },
    {
      label: 'Shemá Israel (Unidad)',
      text: 'שמע ישראל יהוה אלהינו יהוה אחד',
      desc: '6 palabras, valor 1118 (Proclamación de Unicidad)'
    },
    {
      label: 'Birkat Kohanim (Bendición Sacerdotal)',
      text: 'יברכך יהוה וישמרך יאר יהוה פניו אליך ויחנך ישא יהוה פניו אליך וישם לך שלום',
      desc: '15 palabras, 60 letras, valor 2680 (Triple bendición de paz)'
    },
    {
      label: 'Plegaria de Paz (Oseh Shalom)',
      text: 'עושה שלום במרומיו הוא יעשה שלום עלינו ועל כל ישראל',
      desc: 'Invocación de armonía celestial y bendición terrenal'
    },
    {
      label: 'Paz para Israel (Español)',
      text: 'Dios bendiga a Israel y traiga paz a Jerusalen',
      desc: 'Frase en español con transliteración semántica automática'
    }
  ];

  let currentAnalysis = null;
  let isPlayingMelody = false;

  const SentenceAnalyzer = {
    init: function(context) {
      const self = this;
      const Engine = global.GematriaEngine;
      const Audio = global.AppModules && global.AppModules.mysticAudio;

      const txtInput = document.getElementById('txtSentenceInput');
      const btnAnalyze = document.getElementById('btnAnalyzeSentence');
      const presetsContainer = document.getElementById('sentencePresetsContainer');
      const btnPlayMelody = document.getElementById('btnPlaySentenceMelody');

      // 1. Renderizar chips de presets
      if (presetsContainer) {
        presetsContainer.innerHTML = PRESETS.map((p, idx) => `
          <button class="sentence-preset-chip" data-idx="${idx}" title="${p.desc}">
            <span>✨</span> ${p.label}
          </button>
        `).join('');

        presetsContainer.querySelectorAll('.sentence-preset-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            const preset = PRESETS[idx];
            if (preset && txtInput) {
              txtInput.value = preset.text;
              self.runAnalysis(preset.text, context);
            }
          });
        });
      }

      // 2. Ejecutar análisis al hacer click o Ctrl+Enter
      if (btnAnalyze) {
        btnAnalyze.addEventListener('click', () => {
          if (txtInput) self.runAnalysis(txtInput.value, context);
        });
      }

      if (txtInput) {
        txtInput.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            self.runAnalysis(txtInput.value, context);
          }
        });
      }

      // 3. Reproducción melódica secuencial de la oración
      if (btnPlayMelody) {
        btnPlayMelody.addEventListener('click', () => {
          self.playSequentialMelody(Audio);
        });
      }

      // 4. Análisis inicial por defecto (Génesis 1:1)
      if (txtInput && !txtInput.value) {
        txtInput.value = PRESETS[0].text;
      }
      if (txtInput && txtInput.value) {
        self.runAnalysis(txtInput.value, context);
      }
    },

    runAnalysis: function(text, context) {
      const self = this;
      const Engine = global.GematriaEngine;
      if (!Engine || !Engine.AnalyzeSentenceFlow) return;

      const analysis = Engine.AnalyzeSentenceFlow(text);
      currentAnalysis = analysis;

      self.renderMetrics(analysis, context);
      self.renderAcrostics(analysis, context);
      self.renderWordsTable(analysis, context);
      self.drawWaveform(analysis);
    },

    renderMetrics: function(analysis, context) {
      const container = document.getElementById('sentenceMetricsGrid');
      if (!container) return;

      container.innerHTML = `
        <div class="result-card primary">
          <span class="result-card-label">Total Gematria</span>
          <div class="result-card-value">${analysis.totalGematria.toLocaleString()}</div>
          <span class="result-card-desc">Suma total de ${analysis.wordCount} palabras</span>
        </div>

        <div class="result-card">
          <span class="result-card-label">Media Aritmética</span>
          <div class="result-card-value">${analysis.arithmeticMean}</div>
          <span class="result-card-desc">Promedio por palabra</span>
        </div>

        <div class="result-card">
          <span class="result-card-label">Media Armónica</span>
          <div class="result-card-value">${analysis.harmonicMean}</div>
          <span class="result-card-desc">Frecuencia de consonancia</span>
        </div>

        <div class="result-card">
          <span class="result-card-label">Raíz Sefirótica</span>
          <div class="result-card-value">${analysis.totalReduced}</div>
          <span class="result-card-desc">Mispar Katan total</span>
        </div>
      `;

      // Balance Sefirótico
      const balanceBar = document.getElementById('sentenceBalanceContainer');
      if (balanceBar) {
        balanceBar.innerHTML = `
          <div class="sentence-balance-card glass-card">
            <div class="balance-header">
              <span class="balance-title">⚖️ Polaridad Cabalística: <strong>${analysis.sefirahBalance.label}</strong></span>
              ${analysis.isNumericPalindrome ? '<span class="palindrome-badge">🔄 Palíndromo Numérico Simétrico</span>' : ''}
            </div>
            <div class="balance-progress-wrapper">
              <div class="balance-bar-segment chesed" style="width: ${analysis.sefirahBalance.chesedRatio}%;" title="Jésed (Expansión/Ascenso): ${analysis.sefirahBalance.chesedRatio}%">
                Jésed ${analysis.sefirahBalance.chesedRatio}%
              </div>
              <div class="balance-bar-segment gevurah" style="width: ${analysis.sefirahBalance.gevurahRatio}%;" title="Gevurá (Contención/Descenso): ${analysis.sefirahBalance.gevurahRatio}%">
                Gevurá ${analysis.sefirahBalance.gevurahRatio}%
              </div>
            </div>
          </div>
        `;
      }
    },

    renderAcrostics: function(analysis, context) {
      const container = document.getElementById('sentenceAcrosticsContainer');
      if (!container) return;

      const roshei = analysis.rosheiTeivot;
      const sofei = analysis.sofeiTeivot;

      container.innerHTML = `
        <div class="glass-card acrostic-flow-card">
          <div class="acrostic-flow-header">
            <h4>ראשי תיבות • Roshei Teivot (Acróstico Inicial)</h4>
            <span class="acrostic-val-badge">Gematria: ${roshei.gematria}</span>
          </div>
          <div class="acrostic-word-display rtl" dir="rtl">${roshei.word || '—'}</div>
          <p class="acrostic-desc">Palabra sagrada formada por las letras iniciales de cada término.</p>
          <div class="psalm-card-actions">
            <button class="psalm-act-btn btn-calc-acrostic" data-text="${roshei.word}">🔢 Analizar Acróstico</button>
            <button class="psalm-act-btn btn-play-acrostic" data-text="${roshei.word}">🎵 Escuchar Acorde</button>
          </div>
        </div>

        <div class="glass-card acrostic-flow-card">
          <div class="acrostic-flow-header">
            <h4>סופי תיבות • Sofei Teivot (Acróstico Final)</h4>
            <span class="acrostic-val-badge">Gematria: ${sofei.gematria}</span>
          </div>
          <div class="acrostic-word-display rtl" dir="rtl">${sofei.word || '—'}</div>
          <p class="acrostic-desc">Firma secreta formada por las letras finales de cada término.</p>
          <div class="psalm-card-actions">
            <button class="psalm-act-btn btn-calc-acrostic" data-text="${sofei.word}">🔢 Analizar Acróstico</button>
            <button class="psalm-act-btn btn-play-acrostic" data-text="${sofei.word}">🎵 Escuchar Acorde</button>
          </div>
        </div>
      `;

      const Audio = global.AppModules && global.AppModules.mysticAudio;

      container.querySelectorAll('.btn-calc-acrostic').forEach(btn => {
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

      container.querySelectorAll('.btn-play-acrostic').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-text');
          if (Audio && text) Audio.playWordHarmonics(text, 'arpeggio');
        });
      });
    },

    renderWordsTable: function(analysis, context) {
      const container = document.getElementById('sentenceWordsTableContainer');
      if (!container) return;

      if (!analysis.words || analysis.words.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No hay palabras para desglosar.</p>';
        return;
      }

      container.innerHTML = `
        <div class="sentence-table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Término</th>
                <th>Hebreo</th>
                <th>Absoluto</th>
                <th>Ordinal</th>
                <th>Reducido</th>
                <th>Acumulado</th>
                <th>Delta (Δ)</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${analysis.words.map((w, i) => `
                <tr>
                  <td><strong>${w.index}</strong></td>
                  <td>${w.rawToken}</td>
                  <td class="hebrew-cell" style="font-family: var(--font-hebrew); font-size: 1.15rem; color: #ffd700;" dir="rtl">${w.hebrewClean}</td>
                  <td style="font-weight: bold; color: var(--gold-primary);">${w.absolute}</td>
                  <td>${w.ordinal}</td>
                  <td>${w.reduced}</td>
                  <td style="color: #00ced1; font-weight: bold;">${w.cumulative}</td>
                  <td>
                    ${i === 0 ? '—' : `<span class="delta-chip ${w.deltaSign === '+' ? 'delta-plus' : (w.deltaSign === '-' ? 'delta-minus' : 'delta-zero')}">${w.deltaSign}${w.delta}</span>`}
                  </td>
                  <td>
                    <button class="psalm-act-btn btn-send-calc-word" data-word="${w.hebrewClean}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">🔍 Ver</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      container.querySelectorAll('.btn-send-calc-word').forEach(btn => {
        btn.addEventListener('click', () => {
          const word = btn.getAttribute('data-word');
          if (context && word) {
            const txtInput = document.getElementById('txtInput');
            if (txtInput) txtInput.value = word;
            context.processInputText(word);
            context.switchTab('calculator');
          }
        });
      });
    },

    drawWaveform: function(analysis) {
      const canvas = document.getElementById('sentenceWaveCanvas');
      if (!canvas || !analysis || !analysis.words || analysis.words.length === 0) return;

      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = (rect.width || 800) * dpr;
      canvas.height = 240 * dpr;
      ctx.scale(dpr, dpr);

      const W = rect.width || 800;
      const H = 240;

      // Limpiar fondo con degradado cósmico
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#0a0818');
      bgGrad.addColorStop(1, '#05040e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Rejilla cósmica sutil
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 30; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const words = analysis.words;
      const values = words.map(w => w.absolute);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values, minVal + 1);
      const paddingX = 60;
      const paddingY = 40;
      const graphW = W - paddingX * 2;
      const graphH = H - paddingY * 2;

      const stepX = words.length > 1 ? graphW / (words.length - 1) : graphW / 2;

      const points = words.map((w, i) => {
        const x = words.length > 1 ? paddingX + i * stepX : W / 2;
        const norm = (w.absolute - minVal) / (maxVal - minVal || 1);
        const y = H - paddingY - norm * graphH;
        return { x, y, word: w };
      });

      // Dibujar área con degradado bajo la curva
      ctx.beginPath();
      ctx.moveTo(points[0].x, H - paddingY);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, H - paddingY);
      ctx.closePath();

      const areaGrad = ctx.createLinearGradient(0, paddingY, 0, H);
      areaGrad.addColorStop(0, 'rgba(212, 175, 55, 0.35)');
      areaGrad.addColorStop(1, 'rgba(0, 206, 209, 0.02)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Dibujar línea de onda
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dibujar nodos con etiquetas numéricas
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00ced1';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Texto hebreo arriba del nodo
        ctx.font = 'bold 13px "David Libre", serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(p.word.hebrewClean, p.x, p.y - 14);

        // Valor numérico
        ctx.font = '10px "Cinzel", monospace';
        ctx.fillStyle = '#00ced1';
        ctx.fillText(String(p.word.absolute), p.x, p.y + 18);
      });
    },

    playSequentialMelody: function(Audio) {
      if (!Audio || !currentAnalysis || !currentAnalysis.words || currentAnalysis.words.length === 0) return;
      if (isPlayingMelody) return;

      isPlayingMelody = true;
      const btn = document.getElementById('btnPlaySentenceMelody');
      if (btn) {
        btn.classList.add('active');
        btn.textContent = '🔊 Reproduciendo Melodía...';
      }

      const words = currentAnalysis.words;
      let idx = 0;

      function playNext() {
        if (idx >= words.length) {
          isPlayingMelody = false;
          if (btn) {
            btn.classList.remove('active');
            btn.textContent = '🎵 Reproducir Melodía Completa';
          }
          return;
        }

        const word = words[idx];
        Audio.playWordHarmonics(word.hebrewClean, 'arpeggio');
        idx++;
        setTimeout(playNext, 650);
      }

      playNext();
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.sentenceAnalyzer = SentenceAnalyzer;

})(typeof window !== 'undefined' ? window : globalThis);
