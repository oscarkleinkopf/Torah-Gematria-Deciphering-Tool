/**
 * Torah Gematria Deciphering Tool
 * Módulo: tourModal.js - Tour Guiado y Modales de Educación Mística
 */

(function(global) {
  'use strict';

  const TourModal = {
    currentTourIdx: 0,
    tourSteps: [
      {
        step: 1,
        badge: 'PASO 1 DE 3 • INICIACIÓN',
        title: 'El Poder de las Letras Sagradas (Otiot)',
        desc: 'Cada consonante hebrea es un canal de energía primordial. Puedes escribir directamente con el teclado virtual, o escribir en español para descubrir automáticamente los términos sagrados correspondientes.',
        interactiveHtml: `
          <div class="tour-interactive-card">
            <p style="margin-bottom:0.5rem; color:var(--gold-primary); font-weight:bold;">💡 Prueba estos conceptos clásicos:</p>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button class="sync-chip" id="btnTourTryShalom">Paz (שלום - 376)</button>
              <button class="sync-chip" id="btnTourTryAhava">Amor (אהבה - 13)</button>
              <button class="sync-chip" id="btnTourTryIsrael">Israel (ישראל - 541)</button>
            </div>
          </div>
        `,
        targetTab: 'calculator'
      },
      {
        step: 2,
        badge: 'PASO 2 DE 3 • LA MATRIZ NUMÉRICA',
        title: 'Los 4 Sistemas & El Mapa Cósmico',
        desc: 'La calculadora evalúa simultáneamente los 4 sistemas (Absoluto, Ordinal, Reducido y Atbash). Además, el Mapa Estelar Galáctico revela en tiempo real cómo tu palabra orbita con las 10 Sefirot y los nombres sagrados.',
        interactiveHtml: `
          <div class="tour-interactive-card">
            <p><strong>🔭 Exploración Galáctica:</strong> Haz zoom con la rueda del ratón y arrastra el mapa estelar para explorar constelaciones divinas y sionistas.</p>
          </div>
        `,
        targetTab: 'calculator'
      },
      {
        step: 3,
        badge: 'PASO 3 DE 3 • EL CÓDIGO BÍBLICO',
        title: 'Código de la Torá (ELS) & Sionismo',
        desc: 'Descubre secuencias de letras equidistantes en los 5 libros de la Torá con cálculo de significancia estadística, o explora la línea de tiempo del renacimiento de Israel y los héroes de las FDI.',
        interactiveHtml: `
          <div class="tour-interactive-card">
            <p><strong>📜 Todo listo:</strong> ¡Comienza tu viaje de descifrado o comparte tus descubrimientos con tarjetas místicas!</p>
          </div>
        `,
        targetTab: 'biblecode'
      }
    ],

    openEducationalModal: function(key) {
      const Engine = global.GematriaEngine;
      const modal = document.getElementById('educationalTooltipModal');
      const title = document.getElementById('eduModalTitle');
      const body = document.getElementById('eduModalBody');
      if (!modal || !title || !body || !Engine) return;

      const info = Engine.EDUCATIONAL_TOOLTIPS[key] || {
        title: 'Información Mística',
        text: 'Concepto cabalístico para el descifrado e interpretación espiritual.'
      };

      title.textContent = info.title;
      body.innerHTML = `<p>${info.text}</p>`;
      modal.style.display = 'flex';
    },

    startGuidedTour: function(context) {
      this.currentTourIdx = 0;
      this.renderTourStep(context);
      const modal = document.getElementById('guidedTourModal');
      if (modal) modal.style.display = 'flex';
    },

    renderTourStep: function(context) {
      const step = this.tourSteps[this.currentTourIdx];
      const body = document.getElementById('tourStepBody');
      const dotsContainer = document.getElementById('tourProgressDots');
      const btnPrev = document.getElementById('btnTourPrev');
      const btnNext = document.getElementById('btnTourNext');

      if (!step || !body) return;

      if (step.targetTab && context && context.switchTab) {
        context.switchTab(step.targetTab);
      }

      body.innerHTML = `
        <div class="tour-step-title">${step.title}</div>
        <div class="tour-step-desc">${step.desc}</div>
        ${step.interactiveHtml || ''}
      `;

      const txtInput = document.getElementById('txtInput');
      const btnTryShalom = document.getElementById('btnTourTryShalom');
      const btnTryAhava = document.getElementById('btnTourTryAhava');
      const btnTryIsrael = document.getElementById('btnTourTryIsrael');

      if (btnTryShalom) btnTryShalom.addEventListener('click', () => { if (txtInput && context) { txtInput.value = 'שלום'; context.setLanguage('hebrew'); context.processInputText('שלום'); } });
      if (btnTryAhava) btnTryAhava.addEventListener('click', () => { if (txtInput && context) { txtInput.value = 'אהבה'; context.setLanguage('hebrew'); context.processInputText('אהבה'); } });
      if (btnTryIsrael) btnTryIsrael.addEventListener('click', () => { if (txtInput && context) { txtInput.value = 'ישראל'; context.setLanguage('hebrew'); context.processInputText('ישראל'); } });

      if (dotsContainer) {
        dotsContainer.innerHTML = this.tourSteps.map((_, i) => 
          `<span class="tour-dot ${i === this.currentTourIdx ? 'active' : ''}"></span>`
        ).join('');
      }

      if (btnPrev) {
        btnPrev.style.display = this.currentTourIdx > 0 ? 'inline-block' : 'none';
      }

      if (btnNext) {
        btnNext.textContent = this.currentTourIdx === this.tourSteps.length - 1 ? '✨ ¡Comenzar!' : 'Siguiente →';
      }
    },

    init: function(context) {
      const self = this;
      const btnStartTour = document.getElementById('btnStartTour');
      if (btnStartTour) btnStartTour.addEventListener('click', () => self.startGuidedTour(context));

      const btnTourClose = document.getElementById('btnTourClose');
      if (btnTourClose) {
        btnTourClose.addEventListener('click', () => {
          const modal = document.getElementById('guidedTourModal');
          if (modal) modal.style.display = 'none';
        });
      }

      const btnTourPrev = document.getElementById('btnTourPrev');
      if (btnTourPrev) {
        btnTourPrev.addEventListener('click', () => {
          if (self.currentTourIdx > 0) {
            self.currentTourIdx--;
            self.renderTourStep(context);
          }
        });
      }

      const btnTourNext = document.getElementById('btnTourNext');
      if (btnTourNext) {
        btnTourNext.addEventListener('click', () => {
          if (self.currentTourIdx < self.tourSteps.length - 1) {
            self.currentTourIdx++;
            self.renderTourStep(context);
          } else {
            const modal = document.getElementById('guidedTourModal');
            if (modal) modal.style.display = 'none';
          }
        });
      }

      const btnEduModalClose = document.getElementById('btnEduModalClose');
      if (btnEduModalClose) {
        btnEduModalClose.addEventListener('click', () => {
          const modal = document.getElementById('educationalTooltipModal');
          if (modal) modal.style.display = 'none';
        });
      }

      // Conectar tarjetas de resultados
      const cardAbsolute = document.querySelector('.result-card.primary');
      if (cardAbsolute) cardAbsolute.addEventListener('click', () => self.openEducationalModal('absolute'));

      const resultCards = document.querySelectorAll('.results-grid .result-card');
      resultCards.forEach(card => {
        const label = card.querySelector('.result-card-label');
        if (label) {
          const text = label.textContent.toLowerCase();
          if (text.includes('ordinal')) card.addEventListener('click', () => self.openEducationalModal('ordinal'));
          else if (text.includes('reducido')) card.addEventListener('click', () => self.openEducationalModal('reduced'));
          else if (text.includes('atbash')) card.addEventListener('click', () => self.openEducationalModal('atbash'));
          else if (text.includes('albam')) card.addEventListener('click', () => self.openEducationalModal('albam'));
          else if (text.includes('avgad')) card.addEventListener('click', () => self.openEducationalModal('avgad'));
        }
      });
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.tourModal = TourModal;

})(typeof window !== 'undefined' ? window : globalThis);
