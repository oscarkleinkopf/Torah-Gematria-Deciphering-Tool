/**
 * Torah Gematria Deciphering Tool
 * Módulo: comparatorView.js - Comparador Místico Inteligente (Dúo A vs B)
 * y Matriz de Resonancia Grupal / Familiar Multi-Palabra (Característica 6)
 */

(function(global) {
  'use strict';

  const GROUP_PRESETS = [
    {
      label: 'Patriarcas (Avraham, Yitzjak, Yaakov)',
      icon: '👨‍👦‍👦',
      terms: ['אברהם', 'יצחק', 'יעקב'],
      desc: 'Los tres patriarcas de Israel: Jésed, Gevurá y Tiféret'
    },
    {
      label: 'Matriarcas (Sará, Rivká, Rajel, Leá)',
      icon: '👑',
      terms: ['שרה', 'רבקה', 'רחל', 'לאה'],
      desc: 'Las cuatro madres fundadoras de las tribus de Israel'
    },
    {
      label: 'Pilares del Mundo (Torá, Avodá, Jésed)',
      icon: '🏛️',
      terms: ['תורה', 'עבודה', 'חסד'],
      desc: 'Pirkei Avot 1:2 — Los tres pilares sobre los que se sostiene el mundo'
    },
    {
      label: 'Tríada de Paz (Emet, Din, Shalom)',
      icon: '🕊️',
      terms: ['אמת', 'דין', 'שלום'],
      desc: 'Pirkei Avot 1:18 — Verdad, Justicia y Paz'
    },
    {
      label: 'Familia & Sión (David, Raquel, Cohen, Israel)',
      icon: '🇮🇱',
      terms: ['David', 'Raquel', 'Cohen', 'Israel'],
      desc: 'Ejemplo de resonancia familiar e identidad en español/hebreo'
    }
  ];

  const ComparatorView = {
    canvas: null,
    ctx: null,
    animationFrame: null,
    currentMode: 'duo',
    groupTerms: ['אברהם', 'יצחק', 'יעקב', 'דוד'],
    lastGroupAnalysis: null,
    isPlayingGroup: false,

    init: function(context) {
      const DB = global.GematriaDB;
      const self = this;

      const txtCompareA = document.getElementById('txtCompareA');
      const txtCompareB = document.getElementById('txtCompareB');
      const btnCompareWords = document.getElementById('btnCompareWords') || document.getElementById('btnCompare');
      const legendaryPairsChips = document.getElementById('legendaryPairsChips') || document.getElementById('legendaryPairsContainer');

      this.canvas = document.getElementById('comparisonCanvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');

      // 1. Conmutador de modo (Dúo vs Matriz Grupal)
      const modeButtons = document.querySelectorAll('[data-compare-mode]');
      modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-compare-mode') || 'duo';
          self.setCompareMode(mode, context);
        });
      });

      // 2. Cargar Pares Legendarios (Modo Dúo)
      if (legendaryPairsChips && DB && DB.LEGENDARY_PAIRS) {
        legendaryPairsChips.innerHTML = '';
        DB.LEGENDARY_PAIRS.forEach(pair => {
          const chip = document.createElement('button');
          chip.className = 'pair-chip';
          const wordA = pair.wordA || pair.a;
          const wordB = pair.wordB || pair.b;
          const label = pair.title || pair.desc || '';
          chip.innerHTML = `<span style="font-family:var(--font-hebrew); font-weight:bold;">${wordA}</span> ⚡ <span style="font-family:var(--font-hebrew); font-weight:bold;">${wordB}</span> <span style="font-size:0.7rem; color:var(--text-secondary);">(${label})</span>`;
          chip.addEventListener('click', () => {
            self.openPairFromStudy(wordA, wordB, context);
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

      // 3. Inicializar Modo Grupal (Característica 6)
      this.initGroupComparator(context);

      this.animate();
    },

    setCompareMode: function(mode, context) {
      this.currentMode = mode === 'group' ? 'group' : 'duo';
      const duoPanel = document.getElementById('compareModeDuo');
      const groupPanel = document.getElementById('compareModeGroup');
      const modeButtons = document.querySelectorAll('[data-compare-mode]');

      modeButtons.forEach(btn => {
        const isTarget = btn.getAttribute('data-compare-mode') === this.currentMode;
        btn.classList.toggle('active', isTarget);
        btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      });

      if (duoPanel) duoPanel.hidden = this.currentMode !== 'duo';
      if (groupPanel) groupPanel.hidden = this.currentMode !== 'group';

      if (this.currentMode === 'group') {
        this.executeGroupComparison(context);
      }
    },

    openPairFromStudy: function(wordA, wordB, context) {
      if (context && context.switchTab) context.switchTab('comparison');
      this.setCompareMode('duo', context);
      const txtCompareA = document.getElementById('txtCompareA');
      const txtCompareB = document.getElementById('txtCompareB');
      if (txtCompareA) txtCompareA.value = wordA || '';
      if (txtCompareB) txtCompareB.value = wordB || '';
      this.executeComparison(context);
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
      const comparisonBridge = document.getElementById('comparisonBridge');

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

      // Actualizar valores y pistas en UI
      const lblValA = document.getElementById('compareValA');
      const lblValB = document.getElementById('compareValB');
      if (lblValA) lblValA.textContent = resA.absolute;
      if (lblValB) lblValB.textContent = resB.absolute;

      const hintA = document.getElementById('hintCompareA');
      const hintB = document.getElementById('hintCompareB');
      if (hintA) hintA.textContent = wordA ? `${wordA} • Valor: ${resA.absolute} (Raíz ${resA.reduced})` : '—';
      if (hintB) hintB.textContent = wordB ? `${wordB} • Valor: ${resB.absolute} (Raíz ${resB.reduced})` : '—';

      const analysis = Engine.AnalyzeCrossConnection(wordA, wordB, DB.KNOWLEDGE_GRAPH);

      if (deltaBadge) deltaBadge.textContent = `Δ = ${analysis.delta}`;
      if (sumBadge) sumBadge.textContent = `Suma = ${analysis.sum}`;

      const bridgeHtml = `
        <div class="duo-bridge-summary">
          <div class="duo-badges-row" style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-bottom:0.8rem;">
            <span class="psalm-gematria-badge">Δ Diferencia: ${analysis.delta}</span>
            <span class="psalm-gematria-badge" style="color:#00ced1;">Σ Suma Cósmica: ${analysis.sum}</span>
          </div>
          <p><strong>${analysis.isExactMatch ? '✨ Equivalencia de Forma Mística (Dvekut):' : '⚡ Conexión y Flujo Energético:'}</strong> ${analysis.narrative}</p>
          ${analysis.isAnagram ? '<p style="color:#00ced1; margin-top:0.4rem;">🔮 <strong>¡Tzeruf Otiot (Permutación Sagrada)!</strong> Ambas palabras contienen exactamente las mismas letras.</p>' : ''}
          ${analysis.bridgeConcept ? `<p style="color:var(--gold-primary); margin-top:0.4rem;">🌉 <strong>Concepto Puente:</strong> Resuena con "${analysis.bridgeConcept.hebrew}" (${analysis.bridgeConcept.spanish || analysis.bridgeConcept.concept}).</p>` : ''}
        </div>
      `;

      if (narrativeBox && narrativeText) {
        if (wordA.length > 0 && wordB.length > 0) {
          narrativeText.innerHTML = bridgeHtml;
          narrativeBox.style.display = 'block';
        } else {
          narrativeBox.style.display = 'none';
        }
      }

      if (comparisonBridge) {
        if (wordA.length > 0 && wordB.length > 0) {
          comparisonBridge.innerHTML = bridgeHtml;
        }
      }
    },

    // =========================================================================
    // MODO 2: COMPARADOR MULTI-PALABRA & MATRIZ DE RESONANCIA GRUPAL
    // =========================================================================

    initGroupComparator: function(context) {
      const self = this;
      const presetsContainer = document.getElementById('groupPresetsContainer');
      const btnAddMember = document.getElementById('btnAddGroupMember');
      const btnAnalyzeGroup = document.getElementById('btnAnalyzeGroup');
      const btnPlayGroupHarmony = document.getElementById('btnPlayGroupHarmony');

      if (presetsContainer) {
        presetsContainer.innerHTML = GROUP_PRESETS.map((p, idx) => `
          <button type="button" class="sentence-preset-chip group-preset-chip" data-group-idx="${idx}" title="${p.desc}">
            <span>${p.icon}</span> ${p.label}
          </button>
        `).join('');

        presetsContainer.querySelectorAll('.group-preset-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-group-idx'), 10);
            const preset = GROUP_PRESETS[idx];
            if (preset) {
              self.groupTerms = preset.terms.slice();
              self.renderGroupInputs(context);
              self.executeGroupComparison(context);
            }
          });
        });
      }

      if (btnAddMember) {
        btnAddMember.addEventListener('click', () => {
          self.syncTermsFromInputs();
          if (self.groupTerms.length < 8) {
            self.groupTerms.push('שלום');
            self.renderGroupInputs(context);
            self.executeGroupComparison(context);
          }
        });
      }

      if (btnAnalyzeGroup) {
        btnAnalyzeGroup.addEventListener('click', () => {
          self.syncTermsFromInputs();
          self.executeGroupComparison(context);
        });
      }

      if (btnPlayGroupHarmony) {
        btnPlayGroupHarmony.addEventListener('click', () => {
          const Audio = global.AppModules && global.AppModules.mysticAudio;
          self.playGroupHarmony(Audio);
        });
      }

      this.renderGroupInputs(context);
      this.executeGroupComparison(context);
    },

    syncTermsFromInputs: function() {
      const inputs = document.querySelectorAll('.group-member-input');
      if (inputs.length > 0) {
        this.groupTerms = Array.from(inputs).map(inp => inp.value.trim());
      }
    },

    renderGroupInputs: function(context) {
      const self = this;
      const container = document.getElementById('groupMembersInputs');
      if (!container) return;

      container.innerHTML = this.groupTerms.map((term, idx) => `
        <div class="group-member-card">
          <div class="group-member-top">
            <span class="group-member-idx">Integrante #${idx + 1}</span>
            ${self.groupTerms.length > 2 ? `<button type="button" class="group-member-remove" data-remove-idx="${idx}" title="Quitar integrante">&times;</button>` : ''}
          </div>
          <input type="text" class="compare-text-input group-member-input" data-member-idx="${idx}" value="${term}" placeholder="Nombre o concepto (ej: David, אברהם)..." autocomplete="off">
          <div class="group-member-preview" id="groupMemberPreview_${idx}">—</div>
        </div>
      `).join('');

      container.querySelectorAll('.group-member-input').forEach(inp => {
        inp.addEventListener('input', () => {
          self.syncTermsFromInputs();
          self.executeGroupComparison(context);
        });
      });

      container.querySelectorAll('.group-member-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          self.syncTermsFromInputs();
          const idx = parseInt(btn.getAttribute('data-remove-idx'), 10);
          if (self.groupTerms.length > 2) {
            self.groupTerms.splice(idx, 1);
            self.renderGroupInputs(context);
            self.executeGroupComparison(context);
          }
        });
      });
    },

    executeGroupComparison: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      if (!Engine || !Engine.AnalyzeGroupResonance || !DB) return;

      const analysis = Engine.AnalyzeGroupResonance(this.groupTerms, {
        knowledgeGraph: DB.KNOWLEDGE_GRAPH,
        spanishDict: DB.SPANISH_HEBREW_DICT,
        psalmsList: DB.TEHILIM_PSALMS,
        versesList: DB.TORAH_VERSES
      });

      this.lastGroupAnalysis = analysis;

      // Actualizar previews bajo cada input
      analysis.members.forEach((m, idx) => {
        const prev = document.getElementById(`groupMemberPreview_${idx}`);
        if (prev) {
          prev.innerHTML = `<span class="he" style="color:#ffd700; font-family:var(--font-hebrew); font-size:1.05rem;">${m.hebrew}</span> • Valor: <strong>${m.absolute}</strong> (Raíz ${m.reduced})`;
        }
      });

      this.renderGroupMetrics(analysis);
      this.renderGroupHighlights(analysis, context);
      this.renderGroupMatrixTable(analysis, context);
      this.renderGroupBlessing(analysis, context);
      this.drawGroupNetwork(analysis);
    },

    renderGroupMetrics: function(analysis) {
      const container = document.getElementById('groupMetricsGrid');
      if (!container) return;

      container.innerHTML = `
        <div class="result-card primary">
          <span class="result-card-label">Suma Colectiva (Σ)</span>
          <div class="result-card-value">${analysis.collectiveSum.toLocaleString()}</div>
          <span class="result-card-desc">Fuerza unificada de ${analysis.memberCount} integrantes</span>
        </div>

        <div class="result-card">
          <span class="result-card-label">Centro de Gravedad</span>
          <div class="result-card-value">${analysis.centerOfGravity}</div>
          <span class="result-card-desc">Baricentro (Armónico: ${analysis.harmonicCenter})</span>
        </div>

        <div class="result-card">
          <span class="result-card-label">Acróstico Grupal</span>
          <div class="result-card-value" style="font-family:var(--font-hebrew); color:#ffd700;" dir="rtl">${analysis.groupAcrostic.word || '—'}</div>
          <span class="result-card-desc">Valor: ${analysis.groupAcrostic.gematria} (Iniciales)</span>
        </div>

        <div class="result-card">
          <span class="result-card-label">Raíz Sefirótica</span>
          <div class="result-card-value">${analysis.collectiveReduced}</div>
          <span class="result-card-desc">Vibración esencial del conjunto</span>
        </div>
      `;
    },

    renderGroupHighlights: function(analysis, context) {
      const container = document.getElementById('groupHighlightsContainer');
      if (!container) return;

      const bond = analysis.strongestBond;
      const span = analysis.widestSpan;
      const centerNode = analysis.centerConcept;

      container.innerHTML = `
        ${bond ? `
          <div class="glass-card group-highlight-card bond-card">
            <div class="group-hl-title">💎 Vínculo Nuclear (Mayor Afinidad: ${bond.affinityScore}%)</div>
            <div class="group-hl-pair">
              <strong>${bond.memberA.label}</strong> (<span class="he">${bond.memberA.hebrew}</span> = ${bond.memberA.absolute})
              <span>⚡</span>
              <strong>${bond.memberB.label}</strong> (<span class="he">${bond.memberB.hebrew}</span> = ${bond.memberB.absolute})
            </div>
            <div class="group-hl-meta">
              Δ = <strong>${bond.delta}</strong> • Σ = <strong>${bond.sum}</strong>
              ${bond.sharedRoot ? ` • Misma Raíz (${bond.sharedRoot})` : ''}
              ${bond.sharedLetters && bond.sharedLetters.length > 0 ? ` • Letras en común: <span class="he">${bond.sharedLetters.join(', ')}</span>` : ''}
            </div>
          </div>
        ` : ''}

        ${centerNode ? `
          <div class="glass-card group-highlight-card center-card">
            <div class="group-hl-title">🧭 Arquetipo del Centro de Gravedad</div>
            <div class="group-hl-pair">
              <span class="he" style="font-size:1.3rem; color:#ffd700;">${centerNode.hebrew}</span>
              <strong>${centerNode.spanish}</strong> (Valor: ${centerNode.gematria})
            </div>
            <div class="group-hl-meta">${centerNode.meaning || 'Concepto eje que equilibra las energías del grupo.'}</div>
          </div>
        ` : ''}

        ${span && span !== bond ? `
          <div class="glass-card group-highlight-card span-card">
            <div class="group-hl-title">🌌 Arco Polar (Mayor Amplitud Energética)</div>
            <div class="group-hl-pair">
              <strong>${span.memberA.label}</strong> (${span.memberA.absolute}) ↔ <strong>${span.memberB.label}</strong> (${span.memberB.absolute})
            </div>
            <div class="group-hl-meta">Distancia Δ = <strong>${span.delta}</strong> • Suma = <strong>${span.sum}</strong></div>
          </div>
        ` : ''}
      `;
    },

    renderGroupMatrixTable: function(analysis, context) {
      const self = this;
      const container = document.getElementById('groupMatrixTableContainer');
      if (!container) return;

      if (!analysis.members || analysis.members.length < 2) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Ingresa al menos 2 integrantes para generar la matriz cruzada.</p>';
        return;
      }

      const members = analysis.members;
      container.innerHTML = `
        <div class="sentence-table-wrapper">
          <table class="report-table group-matrix-table">
            <thead>
              <tr>
                <th>Integrante</th>
                ${members.map(m => `<th><div>${m.label}</div><div class="he" style="color:#ffd700; font-size:0.95rem;">${m.hebrew} (${m.absolute})</div></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${members.map((rowMember, rIdx) => `
                <tr>
                  <td>
                    <strong>${rowMember.label}</strong>
                    <div class="he" style="color:#ffd700; font-size:0.95rem;">${rowMember.hebrew} (${rowMember.absolute})</div>
                  </td>
                  ${members.map((colMember, cIdx) => {
                    const cell = analysis.matrix[rIdx][cIdx];
                    if (!cell || cell.isSelf) {
                      return `<td class="matrix-self-cell">—</td>`;
                    }
                    const badgeClass = cell.affinityScore >= 80 ? 'delta-plus' : (cell.affinityScore >= 55 ? 'delta-zero' : 'delta-minus');
                    return `
                      <td class="matrix-pair-cell" data-word-a="${rowMember.hebrew}" data-word-b="${colMember.hebrew}" title="Clic para abrir ${rowMember.label} vs ${colMember.label} en Comparador Dúo">
                        <div><span class="delta-chip ${badgeClass}">Δ ${cell.delta}</span></div>
                        <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.2rem;">Σ ${cell.sum} • ${cell.affinityScore}%</div>
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      container.querySelectorAll('.matrix-pair-cell').forEach(td => {
        td.addEventListener('click', () => {
          const wA = td.getAttribute('data-word-a');
          const wB = td.getAttribute('data-word-b');
          if (wA && wB) {
            self.openPairFromStudy(wA, wB, context);
          }
        });
      });
    },

    renderGroupBlessing: function(analysis, context) {
      const container = document.getElementById('groupBlessingContainer');
      if (!container) return;

      const verse = analysis.collectiveVerse;
      const psalm = analysis.collectivePsalm;
      const Audio = global.AppModules && global.AppModules.mysticAudio;

      container.innerHTML = `
        <div class="acrostics-flow-grid">
          ${verse ? `
            <div class="glass-card psalm-verse-card">
              <div class="psalm-verse-header">
                <span class="psalm-verse-ref">📜 Versículo de la Torá: ${verse.reference}</span>
                <span class="psalm-gematria-badge">Valor: ${verse.gematria}</span>
              </div>
              <div class="psalm-verse-hebrew" dir="rtl">${verse.hebrew}</div>
              <div class="psalm-verse-spanish">"${verse.spanish}"</div>
              <div class="psalm-card-actions">
                <button type="button" class="psalm-act-btn btn-play-blessing" data-text="${verse.hebrew}">🎵 Escuchar Versículo</button>
                <button type="button" class="psalm-act-btn btn-calc-blessing" data-text="${verse.hebrew}">🔢 Analizar en Calculadora</button>
              </div>
            </div>
          ` : ''}

          ${psalm ? `
            <div class="glass-card psalm-verse-card">
              <div class="psalm-verse-header">
                <span class="psalm-verse-ref">🛡️ ${psalm.reference}</span>
                <span class="psalm-gematria-badge">Valor: ${psalm.gematria}</span>
              </div>
              <div class="psalm-verse-hebrew" dir="rtl">${psalm.hebrew}</div>
              <div class="psalm-verse-spanish">"${psalm.spanish}"</div>
              <div class="psalm-card-actions">
                <button type="button" class="psalm-act-btn btn-play-blessing" data-text="${psalm.hebrew}">🎵 Escuchar Salmo</button>
                <button type="button" class="psalm-act-btn btn-calc-blessing" data-text="${psalm.hebrew}">🔢 Analizar en Calculadora</button>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.querySelectorAll('.btn-play-blessing').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-text');
          if (Audio && text) Audio.playWordHarmonics(text, 'arpeggio');
        });
      });

      container.querySelectorAll('.btn-calc-blessing').forEach(btn => {
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

    drawGroupNetwork: function(analysis) {
      const canvas = document.getElementById('groupResonanceCanvas');
      if (!canvas || !analysis || !analysis.members || analysis.members.length === 0) return;

      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || 460;
      const H = 270;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      // Fondo cósmico
      const bg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.65);
      bg.addColorStop(0, '#16112c');
      bg.addColorStop(1, '#060510');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const radius = Math.min(W, H) * 0.34;
      const members = analysis.members;
      const N = members.length;

      const nodes = members.map((m, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
        return {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          member: m
        };
      });

      // 1. Dibujar aristas entre todos los pares según su afinidad
      analysis.pairs.forEach(pair => {
        const nA = nodes[pair.indexA];
        const nB = nodes[pair.indexB];
        if (!nA || !nB) return;

        const normAff = Math.max(0.15, pair.affinityScore / 100);
        ctx.beginPath();
        ctx.moveTo(nA.x, nA.y);
        ctx.lineTo(nB.x, nB.y);
        ctx.strokeStyle = pair.affinityScore >= 75
          ? `rgba(255, 215, 0, ${normAff * 0.85})`
          : `rgba(0, 206, 209, ${normAff * 0.55})`;
        ctx.lineWidth = 1 + normAff * 2.8;
        ctx.stroke();
      });

      // 2. Líneas sutiles al Centro de Gravedad
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.moveTo(cx, cy);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 3. Nodo Central (Centro de Gravedad)
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.22)';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px "Cinzel", serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.round(analysis.centerOfGravity)), cx, cy + 4);

      // 4. Nodos de cada integrante
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#0c1828';
        ctx.strokeStyle = '#00ced1';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px "David Libre", serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(n.member.hebrew, n.x, n.y + 4);

        const labelY = n.y < cy ? n.y - 22 : n.y + 28;
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${n.member.label} (${n.member.absolute})`, n.x, labelY);
      });
    },

    playGroupHarmony: function(Audio) {
      if (!Audio || !this.lastGroupAnalysis || !this.lastGroupAnalysis.members.length) return;
      if (this.isPlayingGroup) return;

      this.isPlayingGroup = true;
      const self = this;
      const btn = document.getElementById('btnPlayGroupHarmony');
      if (btn) {
        btn.classList.add('active');
        btn.textContent = '🔊 Reproduciendo Armonía...';
      }

      const members = this.lastGroupAnalysis.members;
      let idx = 0;

      function nextMember() {
        if (idx >= members.length) {
          self.isPlayingGroup = false;
          if (btn) {
            btn.classList.remove('active');
            btn.textContent = '🎵 Escuchar Armonía del Grupo';
          }
          return;
        }
        Audio.playWordHarmonics(members[idx].hebrew, 'arpeggio');
        idx++;
        setTimeout(nextMember, 700);
      }

      nextMember();
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
