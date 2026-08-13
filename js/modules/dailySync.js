/**
 * Torah Gematria Deciphering Tool
 * Módulo: dailySync.js - Widget de Sincronía y Número del Día
 */

(function(global) {
  'use strict';

  const DailySync = {
    init: function(context) {
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      if (!Engine || !DB) return;

      const todayInfo = Engine.GregorianToHebrew(new Date());
      const lblDailyHebrewDate = document.getElementById('lblDailyHebrewDate');
      const lblDailyYearVal = document.getElementById('lblDailyYearVal');
      const lblDailyFreqVal = document.getElementById('lblDailyFreqVal');
      const lblDailySefirahInfo = document.getElementById('lblDailySefirahInfo');
      const dailySyncChips = document.getElementById('dailySyncChips');
      const btnExploreDailyNumber = document.getElementById('btnExploreDailyNumber');

      if (lblDailyHebrewDate) {
        lblDailyHebrewDate.textContent = `📅 ${todayInfo.fullHebrewString} • ${todayInfo.day} de ${todayInfo.monthSpanish} (${todayInfo.year})`;
      }
      if (lblDailyYearVal) {
        lblDailyYearVal.textContent = `${todayInfo.yearHebrew} (${todayInfo.yearShortNumber})`;
      }
      if (lblDailyFreqVal) {
        lblDailyFreqVal.textContent = `${todayInfo.fullDailyFrequency} Hz`;
      }
      if (lblDailySefirahInfo) {
        lblDailySefirahInfo.textContent = `Sefirá & Energía: ${todayInfo.monthInfo.sefirah} • Signo Zodiacal: ${todayInfo.monthInfo.zodiac}`;
      }

      if (dailySyncChips) {
        dailySyncChips.innerHTML = '';
        
        // Buscar palabras en el grafo con resonancia para el año o la frecuencia del día
        let resonating = Engine.FindReverseGematria(todayInfo.yearShortNumber, { tolerance: 10, system: 'absolute' }, DB.KNOWLEDGE_GRAPH);
        if (resonating.length === 0) {
          resonating = DB.KNOWLEDGE_GRAPH.slice(0, 4).map(e => ({ 
            entry: e, 
            bestMatch: { val: e.gematria ? e.gematria.absolute : 0, desc: 'Concepto Sagrado' } 
          }));
        }

        resonating.slice(0, 4).forEach(r => {
          const chip = document.createElement('button');
          chip.className = 'sync-chip';
          chip.innerHTML = `<span style="font-family:var(--font-hebrew); font-weight:bold;">${r.entry.hebrew}</span> <span style="font-size:0.7rem; color:var(--gold-primary);">(${r.entry.spanish || r.entry.concept})</span>`;
          chip.title = `Gematria: ${r.gematria ? r.gematria.absolute : ''} - Clic para calcular`;
          chip.addEventListener('click', () => {
            if (context && context.switchTab && context.processInputText) {
              context.switchTab('calculator');
              const txtInput = document.getElementById('txtInput');
              if (txtInput) txtInput.value = r.entry.hebrew;
              if (context.setLanguage) context.setLanguage('hebrew');
              context.processInputText(r.entry.hebrew);
            }
          });
          dailySyncChips.appendChild(chip);
        });
      }

      if (btnExploreDailyNumber) {
        btnExploreDailyNumber.addEventListener('click', () => {
          if (context && context.switchTab && context.setTorahSearchMode && context.executeTorahOrReverseSearch) {
            context.switchTab('torah');
            context.setTorahSearchMode('number');
            const txtSearchTorah = document.getElementById('txtSearchTorah');
            if (txtSearchTorah) txtSearchTorah.value = todayInfo.yearShortNumber;
            context.executeTorahOrReverseSearch();
          }
        });
      }
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.dailySync = DailySync;

})(typeof window !== 'undefined' ? window : globalThis);
