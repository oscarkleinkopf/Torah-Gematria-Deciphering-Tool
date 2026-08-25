/**
 * Torah Gematria Deciphering Tool
 * Orquestador Principal de la Aplicación
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const Engine = window.GematriaEngine;
  const DB = window.GematriaDB;
  const Modules = window.AppModules || {};

  // Estado Global de la Aplicación
  const appState = {
    currentTab: 'calculator',
    currentLanguage: 'hebrew',
    inputText: '',
    gematriaResult: null
  };

  // Contexto Compartido para los Módulos
  const appContext = {
    appState: appState,
    switchTab: switchTab,
    setLanguage: setLanguage,
    processInputText: processInputText,
    setTorahSearchMode: (mode) => {
      if (Modules.calculatorView) Modules.calculatorView.currentSearchMode = mode;
    },
    executeTorahOrReverseSearch: () => {
      if (Modules.calculatorView) Modules.calculatorView.executeSearch(appContext);
    }
  };

  // --- NAVEGACIÓN ENTRE PESTAÑAS (TABS) ---
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(tabId) {
    appState.currentTab = tabId;

    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    // Redimensionar Canvas activos
    setTimeout(() => {
      if (tabId === 'calculator' && Modules.galaxyCanvas) Modules.galaxyCanvas.resize();
      if (tabId === 'comparison' && Modules.comparatorView && Modules.comparatorView.canvas) {
        Modules.comparatorView.canvas.width = Modules.comparatorView.canvas.offsetWidth;
      }
      if (tabId === 'zionism' && Modules.timelineView && Modules.timelineView.canvas) {
        Modules.timelineView.canvas.width = Modules.timelineView.canvas.offsetWidth;
      }
    }, 50);
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });

  // --- CONFIGURACIÓN DE IDIOMA Y PROCESAMIENTO DE TEXTO ---
  function setLanguage(lang) {
    appState.currentLanguage = lang;
    const txtInput = document.getElementById('txtInput');
    if (txtInput) {
      if (lang === 'spanish') {
        txtInput.placeholder = 'Escribe en español (ej. Paz, Amor, Sabiduría)...';
      } else {
        txtInput.placeholder = 'Escribe en hebreo o usa el teclado virtual (ej. שלום, אהבה)...';
      }
    }
  }

  function processInputText(rawText) {
    appState.inputText = rawText;
    let textToCalculate = rawText.trim();

    if (appState.currentLanguage === 'spanish' && textToCalculate.length > 0) {
      if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(textToCalculate)) {
        const sem = Engine.SearchSpanishSemantic(textToCalculate, DB.SPANISH_HEBREW_DICT, DB.KNOWLEDGE_GRAPH, 1);
        textToCalculate = sem.length > 0 ? sem[0].hebrew : Engine.SpanishToHebrew(textToCalculate);
      }
    }

    const result = Engine.CalculateGematria(textToCalculate);
    appState.gematriaResult = result;

    // Actualizar Vistas
    if (Modules.calculatorView) {
      Modules.calculatorView.renderResults(result, appContext);
    }
    if (Modules.galaxyCanvas) {
      Modules.galaxyCanvas.updateNodes(result, []);
    }
  }

  // --- RESPONSIVE MOBILE NAV TOGGLE ---
  const btnMobileNavToggle = document.getElementById('btnMobileNavToggle');
  if (btnMobileNavToggle) {
    btnMobileNavToggle.addEventListener('click', () => {
      const nav = document.querySelector('nav');
      if (nav) {
        nav.classList.toggle('mobile-expanded');
        nav.style.flexWrap = nav.classList.contains('mobile-expanded') ? 'wrap' : 'nowrap';
      }
    });
  }

  // --- REDIMENSIONADO DE VENTANA ---
  window.addEventListener('resize', () => {
    if (Modules.galaxyCanvas) Modules.galaxyCanvas.resize();
  });

  // --- INICIALIZACIÓN DE LA SUITE COMPLETA ---
  function init() {
    // Pre-calcular gematria en el grafo
    if (DB && DB.KNOWLEDGE_GRAPH) {
      DB.KNOWLEDGE_GRAPH.forEach(entry => {
        entry.gematria = Engine.CalculateGematria(entry.hebrew);
      });
    }

    // Inicializar cada módulo
    if (Modules.calculatorView) Modules.calculatorView.init(appContext);
    if (Modules.galaxyCanvas) Modules.galaxyCanvas.init(appContext);
    if (Modules.comparatorView) Modules.comparatorView.init(appContext);
    if (Modules.timelineView) Modules.timelineView.init(appContext);
    if (Modules.bibleCodeView) Modules.bibleCodeView.init(appContext);
    if (Modules.shareCard) Modules.shareCard.init(appContext);
    if (Modules.tourModal) Modules.tourModal.init(appContext);
    if (Modules.dailySync) Modules.dailySync.init(appContext);
    if (Modules.reportGenerator) Modules.reportGenerator.init(appContext);
    if (Modules.pwaManager) Modules.pwaManager.init(appContext);

    // Estado inicial
    processInputText('שלום');
  }

  init();
});
