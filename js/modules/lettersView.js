/**
 * Módulo: lettersView.js — Espejo de las 22 letras hebreas y modal de detalle.
 */
(function(global) {
  'use strict';

  const SOFIT_TO_REGULAR = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  const LettersView = {
    init: function(context) {
      const DB = global.GematriaDB;
      const self = this;
      this._context = context;

      const modal = document.getElementById('letterModal');
      const btnClose = document.getElementById('btnModalClose');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          if (modal) modal.style.display = 'none';
        });
      }
      window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });

      this.renderGrid();
    },

    renderGrid: function() {
      const DB = global.GematriaDB;
      const lettersGrid = document.getElementById('lettersGrid');
      if (!lettersGrid || !DB || !DB.HEBREW_LETTERS) return;
      const self = this;
      lettersGrid.innerHTML = '';
      DB.HEBREW_LETTERS.forEach(letter => {
        const card = document.createElement('div');
        card.className = 'glass-card letter-card';
        card.setAttribute('data-letter', letter.char);
        card.innerHTML = `
          <div class="letter-card-char">${letter.char}</div>
          <div class="letter-card-name">${letter.name}</div>
          <div class="letter-card-val">Val: <strong>${letter.value}</strong> | Ord: <strong>${letter.ordinal}</strong></div>
        `;
        card.addEventListener('click', () => self.openLetter(letter.char));
        lettersGrid.appendChild(card);
      });
    },

    openLetter: function(char) {
      const DB = global.GematriaDB;
      const letterInfo = DB && DB.HEBREW_LETTERS
        ? DB.HEBREW_LETTERS.find(l => l.char === char)
        : null;
      if (!letterInfo) return;
      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };
      setText('modalLetterChar', letterInfo.char);
      setText('modalLetterName', letterInfo.name);
      setText('modalLetterCosmology', letterInfo.element);
      setText('modalValAbsolute', letterInfo.value);
      setText('modalValOrdinal', letterInfo.ordinal);
      setText('modalValReduced', letterInfo.reduced);
      setText('modalLetterMeaning', letterInfo.meaning);
      const modal = document.getElementById('letterModal');
      if (modal) modal.style.display = 'flex';
    },

    highlightFromStudy: function(hebrew) {
      const wanted = new Set(
        String(hebrew || '')
          .replace(/[^א-ת]/g, '')
          .split('')
          .map(ch => SOFIT_TO_REGULAR[ch] || ch)
      );
      const cards = document.querySelectorAll('#lettersGrid .letter-card');
      cards.forEach(card => {
        const ch = card.getAttribute('data-letter') || '';
        card.classList.toggle('study-focus', wanted.has(ch));
      });
      const first = document.querySelector('#lettersGrid .letter-card.study-focus');
      if (first && typeof first.scrollIntoView === 'function') {
        first.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.lettersView = LettersView;
})(typeof window !== 'undefined' ? window : globalThis);
