/**
 * Torah Gematria Deciphering Tool
 * Módulo: reportGenerator.js - Generador de Reporte Ceremonial PDF e Imprimible
 */

(function(global) {
  'use strict';

  const ReportGenerator = {
    openModal: function(data) {
      const modal = document.getElementById('reportPreviewModal');
      const content = document.getElementById('reportSheetContent');
      if (!modal || !content) return;

      content.innerHTML = this.buildReportHTML(data);
      modal.style.display = 'flex';
    },

    buildReportHTML: function(data) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const res = data.result;
      const today = Engine ? Engine.GregorianToHebrew(new Date()) : { fullHebrewString: '', year: 5786, monthSpanish: 'Av', day: 25 };

      const conceptMatch = DB && DB.KNOWLEDGE_GRAPH ? DB.KNOWLEDGE_GRAPH.find(k => k.hebrew === res.cleanText) : null;
      const verseMatch = DB && DB.TORAH_VERSES ? DB.TORAH_VERSES.filter(v => v.gematria === res.absolute || Math.abs(v.gematria - res.absolute) <= 1) : [];

      // Desglose de letras
      const lettersRows = (res.letters || []).map(l => `
        <tr>
          <td style="font-family: var(--font-hebrew); font-size: 1.3rem; font-weight: bold; color: var(--gold-primary);">${l.char}</td>
          <td><strong>${l.name}</strong></td>
          <td>${l.absolute}</td>
          <td>${l.ordinal}</td>
        </tr>
      `).join('');

      // Desglose de Sefirot
      const sefirotList = [
        { name: 'Kéter (Corona)', val: 620, desc: 'Luz Primordial y Voluntad Suprema' },
        { name: 'Jojmá (Sabiduría)', val: 73, desc: 'El destello de la revelación' },
        { name: 'Biná (Entendimiento)', val: 67, desc: 'La matriz conceptual estructurante' },
        { name: 'Jésed (Misericordia)', val: 72, desc: 'Amor expansivo incondicional' },
        { name: 'Gevurá (Rigor)', val: 216, desc: 'Fuerza, juicio y contención' },
        { name: 'Tiféret (Belleza)', val: 1081, desc: 'Armonía y verdad integradora' },
        { name: 'Nétzaj (Victoria)', val: 148, desc: 'Perseverancia y eternidad' },
        { name: 'Hod (Esplendor)', val: 15, desc: 'Reverberación y gratitud' },
        { name: 'Yesod (Fundamento)', val: 80, desc: 'Canal de conexión y alianza' },
        { name: 'Maljut (Reino)', val: 496, desc: 'Manifestación física en la creación' }
      ];

      const sefirotRows = sefirotList.map(s => {
        const isResonant = res.absolute > 0 && (res.absolute === s.val || res.absolute % s.val === 0 || s.val % res.absolute === 0 || Math.abs(res.absolute - s.val) <= 1);
        return `
          <tr style="${isResonant ? 'background: rgba(212,175,55,0.12); font-weight: bold;' : ''}">
            <td>${isResonant ? '⭐ ' : ''}${s.name}</td>
            <td>${s.val}</td>
            <td style="font-size: 0.8rem; color: var(--text-secondary);">${s.desc}</td>
            <td><span style="color: ${isResonant ? '#2ecc71' : 'inherit'}; font-size:0.75rem;">${isResonant ? 'RESONANCIA DIRECTA' : 'Armónico'}</span></td>
          </tr>
        `;
      }).join('');

      // Versículos
      const versesHtml = verseMatch.length > 0 ? verseMatch.slice(0, 3).map(v => `
        <div style="margin-bottom: 0.8rem; padding: 0.6rem 0.8rem; background: rgba(0,0,0,0.25); border-left: 3px solid var(--gold-primary); border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--gold-primary); font-weight: bold;">
            <span>📜 ${v.reference}</span>
            <span>Valor: ${v.gematria}</span>
          </div>
          <div style="font-family: var(--font-hebrew); font-size: 1.1rem; direction: rtl; margin: 0.3rem 0; color: #ffd700;">${v.hebrew}</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); font-style: italic;">"${v.translation}"</div>
        </div>
      `).join('') : '<p style="color: var(--text-secondary); font-style: italic; font-size: 0.85rem;">No se encontraron versículos de concordancia directa exacta en la base de datos.</p>';

      return `
        <div class="report-ceremonial-sheet">
          <!-- Encabezado Ceremonial -->
          <div class="report-header">
            <div class="report-title-top">TORAH GEMATRIA & DECIPHERING TOOL</div>
            <h1 class="report-main-title">REPORTE CEREMONIAL DE DECODIFICACIÓN</h1>
            <div class="report-dedication">🛡️ DEDICADO A LOS HÉROES DE LAS FUERZAS DE DEFENSA DE ISRAEL (FDI) 🛡️</div>
            <div class="report-date-badge">
              <span>📅 Fecha Hebrea: <strong>${today.fullHebrewString} (${today.year})</strong></span> • 
              <span>Fecha Gregoriana: <strong>${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</strong></span>
            </div>
          </div>

          <!-- Término Central y Firma Numérica -->
          <div class="report-word-hero">
            <div class="report-hebrew-word">${res.cleanText}</div>
            <div class="report-concept-title">${conceptMatch ? (conceptMatch.spanish || conceptMatch.concept) : 'Frecuencia Sagrada'}</div>
            <div class="report-concept-meaning">${conceptMatch ? (conceptMatch.mysticalMeaning || conceptMatch.meaning) : 'Emanación espiritual y vibración del nombre en la estructura cabalística.'}</div>
          </div>

          <!-- Tabla de los 6 Sistemas Gemátricos -->
          <div class="report-section">
            <h3 class="report-section-title">1. Matriz de los 6 Sistemas Numéricos</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Sistema Cabalístico</th>
                  <th>Valor Calculado</th>
                  <th>Cifrado / Transformación</th>
                  <th>Significado Tradicional</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Gematria Absoluta (Estándar)</strong></td>
                  <td><strong style="color: var(--gold-primary); font-size: 1.1rem;">${res.absolute}</strong></td>
                  <td>—</td>
                  <td>Valor ontológico y cósmico fundamental en la Torá</td>
                </tr>
                <tr>
                  <td><strong>Gematria Ordinal (Siduri)</strong></td>
                  <td><strong>${res.ordinal}</strong></td>
                  <td>—</td>
                  <td>Posición correlativa en el alfabeto de 22 letras</td>
                </tr>
                <tr>
                  <td><strong>Gematria Reducida (Katan)</strong></td>
                  <td><strong>${res.reduced}</strong></td>
                  <td>Raíz digital (1-9)</td>
                  <td>Esencia primordial concentrada en una sola cifra</td>
                </tr>
                <tr>
                  <td><strong>Cifrado Atbash (Inverso)</strong></td>
                  <td><strong>${res.atbash.absolute}</strong></td>
                  <td style="font-family: var(--font-hebrew);">${res.atbash.text}</td>
                  <td>Sustitución espejo (Alef ↔ Tav, Bet ↔ Shin)</td>
                </tr>
                <tr>
                  <td><strong>Cifrado Albam (Bipartito)</strong></td>
                  <td><strong>${res.albam.absolute}</strong></td>
                  <td style="font-family: var(--font-hebrew);">${res.albam.text}</td>
                  <td>Sustitución por mitad de alefato (Alef ↔ Lamed)</td>
                </tr>
                <tr>
                  <td><strong>Cifrado Avgad (Ascenso)</strong></td>
                  <td><strong>${res.avgad.absolute}</strong></td>
                  <td style="font-family: var(--font-hebrew);">${res.avgad.text}</td>
                  <td>Sustitución por letra siguiente (Alef → Bet)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Desglose Letra por Letra -->
          <div class="report-section">
            <h3 class="report-section-title">2. Desglose Consonante por Consonante</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Letra</th>
                  <th>Nombre</th>
                  <th>Valor Absoluto</th>
                  <th>Valor Ordinal</th>
                </tr>
              </thead>
              <tbody>
                ${lettersRows}
              </tbody>
            </table>
          </div>

          <!-- Resonancia con las Sefirot -->
          <div class="report-section">
            <h3 class="report-section-title">3. Resonancia en el Árbol de la Vida (10 Sefirot)</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Sefirá</th>
                  <th>Valor</th>
                  <th>Atributo Divino</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${sefirotRows}
              </tbody>
            </table>
          </div>

          <!-- Versículos y Correspondencias Bíblicas -->
          <div class="report-section">
            <h3 class="report-section-title">4. Concordancias en la Torá y Textos Sagrados</h3>
            ${versesHtml}
          </div>

          <!-- Sello y Pie de Página -->
          <div class="report-footer">
            <p>Documento generado para fines de estudio, meditación y elevación espiritual.</p>
            <p>✡️ <em>Decodificador de Torá & Gematria • Desarrollado con reverencia y rigor matemático</em></p>
          </div>
        </div>
      `;
    },

    init: function(context) {
      const self = this;
      const btnGenerateReport = document.getElementById('btnGenerateReport');
      const btnPrintReport = document.getElementById('btnPrintReport');
      const btnCloseReport = document.getElementById('btnCloseReport');
      const modal = document.getElementById('reportPreviewModal');

      if (btnGenerateReport) {
        btnGenerateReport.addEventListener('click', () => {
          const res = context && context.appState ? context.appState.gematriaResult : null;
          if (!res || !res.cleanText) {
            alert('Ingresa primero una palabra para generar su reporte ceremonial.');
            return;
          }
          self.openModal({ result: res });
        });
      }

      if (btnPrintReport) {
        btnPrintReport.addEventListener('click', () => {
          window.print();
        });
      }

      if (btnCloseReport && modal) {
        btnCloseReport.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      }
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.reportGenerator = ReportGenerator;

})(typeof window !== 'undefined' ? window : globalThis);
