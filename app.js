/**
 * Controlador principal de la aplicación GematriaDecipher.
 * Gestiona la UI, las pestañas, la interacción del teclado, el buscador de Torá,
 * renderiza un gráfico interactivo en HTML5 Canvas para visualizar las correlaciones,
 * dibuja la línea de tiempo interactiva y el comparador místico de dos órbitas.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- CARGAR BASE DE DATOS Y MOTOR ---
  const DB = window.GematriaDB;
  const Engine = window.GematriaEngine;
  const Storage = window.GematriaStorage || {};

  if (!DB || !Engine) {
    console.error('Error: No se pudo cargar database.js o gematria.js.');
    return;
  }

  // --- REFERENCIAS DE ELEMENTOS DE LA INTERFAZ (DOM) ---
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const txtInput = document.getElementById('txtInput');
  const btnHebrewInput = document.getElementById('btnHebrewInput');
  const btnSpanishInput = document.getElementById('btnSpanishInput');
  const phoneticContainer = document.getElementById('phoneticContainer');
  const lblTranslitHebrew = document.getElementById('lblTranslitHebrew');
  const virtualKeyboard = document.getElementById('virtualKeyboard');
  const btnBackspace = document.getElementById('btnBackspace');
  const btnClear = document.getElementById('btnClear');
  const btnSpace = document.getElementById('btnSpace');
  
  const valAbsolute = document.getElementById('valAbsolute');
  const valAbsoluteGadol = document.getElementById('valAbsoluteGadol');
  const valOrdinal = document.getElementById('valOrdinal');
  const valReduced = document.getElementById('valReduced');
  const valAtbashText = document.getElementById('valAtbashText');
  const valAtbashValue = document.getElementById('valAtbashValue');
  const valAlbamText = document.getElementById('valAlbamText');
  const valAlbamValue = document.getElementById('valAlbamValue');
  const valAvgadText = document.getElementById('valAvgadText');
  const valAvgadValue = document.getElementById('valAvgadValue');
  const breakdownContainer = document.getElementById('breakdownContainer');
  
  const relationCanvas = document.getElementById('relationCanvas');
  const txtSearchTorah = document.getElementById('txtSearchTorah');
  const btnSearchTorah = document.getElementById('btnSearchTorah');
  const torahResultsContainer = document.getElementById('torahResultsContainer');
  
  const zionismGrid = document.getElementById('zionismGrid');
  const lettersGrid = document.getElementById('lettersGrid');
  
  const reflectionTopicsContainer = document.getElementById('reflectionTopicsContainer');
  const reflectionContent = document.getElementById('reflectionContent');
  
  const letterModal = document.getElementById('letterModal');
  const btnModalClose = document.getElementById('btnModalClose');
  const modalLetterChar = document.getElementById('modalLetterChar');
  const modalLetterName = document.getElementById('modalLetterName');
  const modalLetterCosmology = document.getElementById('modalLetterCosmology');
  const modalValAbsolute = document.getElementById('modalValAbsolute');
  const modalValOrdinal = document.getElementById('modalValOrdinal');
  const modalValReduced = document.getElementById('modalValReduced');
  const modalLetterMeaning = document.getElementById('modalLetterMeaning');

  // --- FASE 2: ELEMENTOS DE INTERFAZ DE MEJORAS ---
  const discoveriesSection = document.getElementById('discoveriesSection');
  const discoveriesCarousel = document.getElementById('discoveriesCarousel');
  const discoveryDetailsBox = document.getElementById('discoveryDetailsBox');

  const timelineCanvas = document.getElementById('timelineCanvas');
  const timelineDetailPanel = document.getElementById('timelineDetailPanel');

  const txtCompareA = document.getElementById('txtCompareA');
  const txtCompareB = document.getElementById('txtCompareB');
  const hintCompareA = document.getElementById('hintCompareA');
  const hintCompareB = document.getElementById('hintCompareB');
  const btnCompare = document.getElementById('btnCompare');
  const comparisonCanvas = document.getElementById('comparisonCanvas');
  const comparisonBridge = document.getElementById('comparisonBridge');

  // --- FASE 3: ELEMENTOS DE INTERFAZ DEL CÓDIGO DE LA BIBLIA ---
  const txtSearchELS = document.getElementById('txtSearchELS');
  const btnSearchELS = document.getElementById('btnSearchELS');
  const numMinSkip = document.getElementById('numMinSkip');
  const numMaxSkip = document.getElementById('numMaxSkip');
  const elsResultsList = document.getElementById('elsResultsList');

  const matrixWidthController = document.getElementById('matrixWidthController');
  const rangeMatrixWidth = document.getElementById('rangeMatrixWidth');
  const lblMatrixWidth = document.getElementById('lblMatrixWidth');
  const matrixEmptyState = document.getElementById('matrixEmptyState');
  const matrixContainer = document.getElementById('matrixContainer');

  const elsSecondaryPanel = document.getElementById('elsSecondaryPanel');
  const elsSecondaryWordsList = document.getElementById('elsSecondaryWordsList');

  // --- ESTADO DE LA APLICACIÓN ---
  let autoScanDebounceTimer = null;
  let appState = {
    currentTab: 'explore',
    inputLanguage: 'hebrew', // 'hebrew' o 'spanish'
    rawInputText: '',
    hebrewProcessedText: '',
    gematriaResult: null,
    activeReflectionIndex: 0,
    bestAutoELS: null,
    studyQuery: ''
  };

  // --- Estado del comparador ---
  let compState = {
    calcA: null,
    calcB: null,
    comparisonAngle: 0
  };

  // --- Estado de la línea de tiempo ---
  let timelineState = {
    selectedEvent: null,
    focusEvent: null,
    mouse: { x: null, y: null }
  };

  // --- Estado del código de la Biblia ---
  let bibleCodeState = {
    activeMatch: null,
    matrixWidth: 50,
    primaryWord: '',
    secondaryMatches: []
  };

  function currentElsSkipRange() {
    const minS = numMinSkip ? parseInt(numMinSkip.value, 10) : 2;
    const maxS = numMaxSkip ? parseInt(numMaxSkip.value, 10) : 120;
    return {
      minSkip: Number.isFinite(minS) ? minS : 2,
      maxSkip: Number.isFinite(maxS) ? maxS : 120
    };
  }

  function honestyForMatch(match, runControl) {
    if (!match || !Engine || typeof Engine.AssessELSHonesty !== 'function') return null;
    const range = currentElsSkipRange();
    const text = window.TORAH_TEXT || window.TorahText || '';
    return Engine.AssessELSHonesty(match, {
      text,
      minSkip: range.minSkip,
      maxSkip: range.maxSkip,
      runControl: !!runControl
    });
  }

  function honestyBandChip(honesty) {
    if (!honesty) return '';
    const short = honesty.band === 'common' ? 'Muy común' : honesty.band === 'rare' ? 'Raro (modelo)' : 'Plausible';
    return `<span class="els-band-chip band-${honesty.band}">${short}</span>`;
  }

  function formatHonestyHtml(honesty) {
    if (!honesty) return '';
    const expSkip = honesty.expectedAtSkip != null ? honesty.expectedAtSkip.toFixed(3) : '—';
    const expRange = honesty.expectedInRange != null ? honesty.expectedInRange.toFixed(2) : '—';
    const pSkip = honesty.pValueSkip != null ? honesty.pValueSkip.toExponential(2) : '—';
    const ctrl = honesty.control
      ? ` · control mezclado: ${honesty.control.controlCount}`
      : '';
    const warns = (honesty.warnings || []).map(w => `<li>${w}</li>`).join('');
    return `<div class="els-honesty band-${honesty.band}">
      <span class="els-honesty-label">${honesty.label}</span>
      <div class="els-honesty-note">${honesty.note}</div>
      <div class="els-honesty-meta">E(salto) ≈ ${expSkip} · E(rango) ≈ ${expRange} · p(salto) ≈ ${pSkip}${ctrl}</div>
      ${warns ? `<ul>${warns}</ul>` : ''}
    </div>`;
  }

  // --- 1. ENRUTADOR INTERNO DE PESTAÑAS ---
  const SECONDARY_TABS = {
    torah: true,
    acrostics: true,
    zionism: true,
    comparison: true,
    letters: true,
    reflection: true
  };

  function closeNavMore() {
    const menu = document.getElementById('navMoreMenu');
    const toggle = document.getElementById('btnNavMore');
    if (menu) menu.hidden = true;
    if (toggle) {
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function updateStudyChrome(tabId) {
    const toggle = document.getElementById('btnNavMore');
    if (toggle) toggle.classList.toggle('active-group', !!SECONDARY_TABS[tabId]);
    const bar = document.getElementById('studyReturnBar');
    const qEl = document.getElementById('studyReturnQuery');
    const show = tabId !== 'explore' && !!(appState.studyQuery);
    if (bar) bar.hidden = !show;
    if (qEl) qEl.textContent = appState.studyQuery || '';
    closeNavMore();
  }

  function switchTab(tabId) {
    if (!tabId) return;

    navButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));

    const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    const tab = document.getElementById(tabId);
    if (btn) btn.classList.add('active');
    if (tab) tab.classList.add('active');

    appState.currentTab = tabId;
    updateStudyChrome(tabId);

    if (tabId === 'calculator') {
      resizeCanvas();
      updateRelationGraph();
    } else if (tabId === 'comparison') {
      resizeComparisonCanvas();
    } else if (tabId === 'zionism') {
      resizeTimelineCanvas();
    } else if (tabId === 'biblecode') {
      if (bibleCodeState.activeMatch) {
        renderBibleCodeMatrix();
      }
    } else if (tabId === 'favorites') {
      renderFavoritesTab();
    }
  }

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchTab(button.getAttribute('data-tab'));
    });
  });

  const btnNavMore = document.getElementById('btnNavMore');
  const navMoreMenu = document.getElementById('navMoreMenu');
  if (btnNavMore && navMoreMenu) {
    btnNavMore.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const willOpen = navMoreMenu.hidden;
      navMoreMenu.hidden = !willOpen;
      btnNavMore.classList.toggle('open', willOpen);
      btnNavMore.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  }
  document.addEventListener('click', (ev) => {
    const wrap = document.querySelector('.nav-more-wrap');
    if (!wrap || wrap.contains(ev.target)) return;
    closeNavMore();
  });
  const btnReturnToStudy = document.getElementById('btnReturnToStudy');
  if (btnReturnToStudy) {
    btnReturnToStudy.addEventListener('click', () => switchTab('explore'));
  }

  // --- 2. CONFIGURACIÓN DEL INPUT E IDIOMAS ---
  btnHebrewInput.addEventListener('click', () => {
    setLanguage('hebrew');
  });

  btnSpanishInput.addEventListener('click', () => {
    setLanguage('spanish');
  });

  function setLanguage(lang) {
    appState.inputLanguage = lang;
    txtInput.value = '';
    lblTranslitHebrew.textContent = '';
    
    if (lang === 'hebrew') {
      btnHebrewInput.classList.add('active');
      btnSpanishInput.classList.remove('active');
      txtInput.classList.add('rtl');
      txtInput.setAttribute('dir', 'rtl');
      txtInput.setAttribute('placeholder', 'Escribe en hebreo o usa el teclado inferior...');
      phoneticContainer.style.display = 'none';
      virtualKeyboard.style.display = 'grid';
    } else {
      btnSpanishInput.classList.add('active');
      btnHebrewInput.classList.remove('active');
      txtInput.classList.remove('rtl');
      txtInput.removeAttribute('dir');
      txtInput.setAttribute('placeholder', 'Escribe en español (ej: Sion, Israel, Jose)...');
      phoneticContainer.style.display = 'flex';
      virtualKeyboard.style.display = 'none';
    }
    
    processInputText('');
  }

  // --- 3. TECLADO VIRTUAL HEBREO ---
  function renderVirtualKeyboard() {
    virtualKeyboard.innerHTML = '';
    DB.HEBREW_LETTERS.forEach(letter => {
      const key = document.createElement('button');
      key.className = 'key-btn';
      
      const charSpan = document.createElement('span');
      charSpan.textContent = letter.char;
      
      const valSpan = document.createElement('span');
      valSpan.className = 'val-sub';
      valSpan.textContent = letter.value;
      
      key.appendChild(charSpan);
      key.appendChild(valSpan);
      
      key.addEventListener('click', () => {
        const start = txtInput.selectionStart;
        const end = txtInput.selectionEnd;
        const text = txtInput.value;
        txtInput.value = text.substring(0, start) + letter.char + text.substring(end);
        txtInput.focus();
        
        const newPos = start + letter.char.length;
        txtInput.setSelectionRange(newPos, newPos);
        
        processInputText(txtInput.value);
      });
      
      virtualKeyboard.appendChild(key);
    });
  }

  // Acciones del teclado
  btnBackspace.addEventListener('click', () => {
    const start = txtInput.selectionStart;
    const end = txtInput.selectionEnd;
    const text = txtInput.value;
    
    if (start === end && start > 0) {
      txtInput.value = text.substring(0, start - 1) + text.substring(end);
      txtInput.setSelectionRange(start - 1, start - 1);
    } else {
      txtInput.value = text.substring(0, start) + text.substring(end);
      txtInput.setSelectionRange(start, start);
    }
    txtInput.focus();
    processInputText(txtInput.value);
  });

  btnClear.addEventListener('click', () => {
    txtInput.value = '';
    txtInput.focus();
    processInputText('');
  });

  btnSpace.addEventListener('click', () => {
    const start = txtInput.selectionStart;
    const text = txtInput.value;
    txtInput.value = text.substring(0, start) + ' ' + text.substring(start);
    txtInput.focus();
    txtInput.setSelectionRange(start + 1, start + 1);
    processInputText(txtInput.value);
  });

  txtInput.addEventListener('input', (e) => {
    processInputText(e.target.value);
  });

  // --- 4. MOTOR DE PROCESAMIENTO ---
  function processInputText(text) {
    appState.rawInputText = text;
    appState.bestAutoELS = null; // Limpiar escaneo anterior al comenzar a escribir
    
    if (appState.inputLanguage === 'spanish') {
      const converted = Engine.SpanishToHebrew(text);
      appState.hebrewProcessedText = converted;
      lblTranslitHebrew.textContent = converted || '—';
    } else {
      appState.hebrewProcessedText = text;
    }
    
    // Calcular Gematria
    const result = Engine.CalculateGematria(appState.hebrewProcessedText);
    appState.gematriaResult = result;
    
    // Actualizar Panel de Resultados en UI
    updateResultsUI(result);
    
    // FASE 2: Descubrimientos en tiempo real
    updateDiscoveriesPanel(result);
    
    // Actualizar el gráfico
    updateRelationGraph();

    // FASE 4: Escaneo automático debounced de ELS
    clearTimeout(autoScanDebounceTimer);
    if (text.trim().length >= 2) {
      autoScanDebounceTimer = setTimeout(() => {
        runAutoELSScan(appState.hebrewProcessedText);
      }, 400);
    }
  }

  function updateResultsUI(result) {
    if (!result || result.lettersCount === 0) {
      valAbsolute.textContent = '0';
      valAbsoluteGadol.textContent = '0';
      valOrdinal.textContent = '0';
      valReduced.textContent = '0';
      valAtbashText.textContent = '—';
      valAtbashValue.textContent = '0';
      if (valAlbamText) { valAlbamText.textContent = '—'; valAlbamValue.textContent = '0'; }
      if (valAvgadText) { valAvgadText.textContent = '—'; valAvgadValue.textContent = '0'; }
      breakdownContainer.innerHTML = '<span style="color: var(--text-secondary); font-style: italic; font-size: 0.9rem;">Escribe una palabra para ver su desglose...</span>';
      return;
    }
    
    valAbsolute.textContent = result.absolute;
    valAbsoluteGadol.textContent = result.absoluteGadol;
    valOrdinal.textContent = result.ordinal;
    valReduced.textContent = result.reduced;
    valAtbashText.textContent = result.atbashText;
    valAtbashValue.textContent = result.atbashValue;
    if (valAlbamText) { valAlbamText.textContent = result.albamText || '—'; valAlbamValue.textContent = result.albamValue || 0; }
    if (valAvgadText) { valAvgadText.textContent = result.avgadText || '—'; valAvgadValue.textContent = result.avgadValue || 0; }
    
    // Renderizar desglose
    breakdownContainer.innerHTML = '';
    result.breakdown.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'breakdown-chip';
      chip.title = `${item.name} | Ordinal: ${item.ordinal} | Reducido: ${item.reduced} | Albam: ${item.albam}(${item.albamVal}) | Avgad: ${item.avgad}(${item.avgadVal})`;
      
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = item.letter;
      
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = item.absolute;
      
      chip.appendChild(letter);
      chip.appendChild(num);
      
      chip.addEventListener('click', () => {
        openLetterDetails(item.letter);
      });
      
      breakdownContainer.appendChild(chip);
    });
  }

  // --- FASE 2: CAROUSEL DE DESCUBRIMIENTOS EN TIEMPO REAL ---
  function updateDiscoveriesPanel(result) {
    if (!discoveriesSection || !discoveriesCarousel) return;

    if (!result || result.lettersCount === 0) {
      discoveriesSection.style.display = 'none';
      return;
    }

    // Buscar correlaciones usando el Grafo expandido
    const correlations = Engine.FindCorrelations(result.cleanText, DB.KNOWLEDGE_GRAPH);

    if (correlations.length === 0 && !appState.bestAutoELS) {
      discoveriesSection.style.display = 'none';
      return;
    }

    discoveriesSection.style.display = 'block';
    discoveriesCarousel.innerHTML = '';
    discoveryDetailsBox.style.display = 'none';

    // Prepend la tarjeta de ELS automática si existe
    if (appState.bestAutoELS) {
      const bestMatch = appState.bestAutoELS.match;
      const crossovers = appState.bestAutoELS.crossovers;

      const card = document.createElement('div');
      card.className = 'discovery-card bible-code-card';
      card.classList.add('active');
      showAutoELSDiscoveryDetails(bestMatch, crossovers);

      let starsCount = Math.min(5, Math.max(1, crossovers.length + 1));
      let starsHtml = '';
      for (let s = 0; s < 5; s++) {
        starsHtml += s < starsCount ? '⭐' : '☆';
      }

      card.innerHTML = `
        <div class="discovery-card-top">
          <span class="discovery-stars">${starsHtml}</span>
          <span class="discovery-badge biblecode">Código ELS</span>
        </div>
        <div class="discovery-word-box">
          <div class="discovery-hebrew">${bestMatch.word}</div>
          <div class="discovery-translation">Salto: ${bestMatch.skip}</div>
        </div>
        <div class="discovery-value-bar">
          <span>Cruces: <strong>${crossovers.length}</strong></span>
          <span style="font-size: 0.75rem; color: var(--purple-accent); font-weight: bold;">Torá (5 libros)</span>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.discovery-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        showAutoELSDiscoveryDetails(bestMatch, crossovers);
      });

      discoveriesCarousel.appendChild(card);
    }

    correlations.slice(0, 12).forEach((corr, idx) => {
      const card = document.createElement('div');
      card.className = 'discovery-card';
      
      // Si no hay tarjeta ELS, activar la primera de correlación
      if (!appState.bestAutoELS && idx === 0) {
        card.classList.add('active');
        showDiscoveryDetails(corr);
      }

      // Dibujar estrellas
      let starsHtml = '';
      for (let s = 0; s < 5; s++) {
        starsHtml += s < corr.stars ? '⭐' : '☆';
      }

      const primaryMatch = corr.matches[0];
      const badgeClass = primaryMatch.type;
      const badgeText = primaryMatch.type === 'exact' ? 'Exacta' :
                        primaryMatch.type === 'reduced' ? 'Reducida' :
                        primaryMatch.type === 'atbash' ? 'Atbash' :
                        primaryMatch.type === 'root' ? 'Raíz' : 'Factor';

      card.innerHTML = `
        <div class="discovery-card-top">
          <span class="discovery-stars">${starsHtml}</span>
          <span class="discovery-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="discovery-word-box">
          <div class="discovery-hebrew">${corr.entry.hebrew}</div>
          <div class="discovery-translation">${corr.entry.spanish}</div>
        </div>
        <div class="discovery-value-bar">
          <span>Gematria: <strong>${corr.gematria.absolute}</strong></span>
          <span style="text-transform: capitalize; font-size: 0.75rem; color: var(--gold-primary);">${corr.entry.category}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.discovery-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        showDiscoveryDetails(corr);
      });

      discoveriesCarousel.appendChild(card);
    });
  }

  function showDiscoveryDetails(corr) {
    if (!discoveryDetailsBox) return;

    let matchesHtml = '';
    corr.matches.forEach(match => {
      matchesHtml += `<li><strong>${match.desc}</strong></li>`;
    });

    discoveryDetailsBox.innerHTML = `
      <div class="discovery-details-header">
        <div class="discovery-details-title">${corr.entry.spanish} (<span style="font-family: var(--font-hebrew);">${corr.entry.hebrew}</span>)</div>
        <div style="font-size: 0.9rem; color: var(--gold-primary);">Gematria: ${corr.gematria.absolute} | Reducido: ${corr.gematria.reduced}</div>
      </div>
      <div class="discovery-details-body">
        <p style="color: var(--text-primary); font-size: 0.95rem; margin-bottom: 0.8rem; line-height: 1.6;">
          ${corr.entry.mysticalNote || 'Sin detalles cabalísticos adicionales cargados.'}
        </p>
        <p style="color: var(--text-secondary); font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem; margin-bottom: 0.5rem;">
          <strong>Dimensiones Coincidentes:</strong>
          <ul style="padding-left: 1.2rem; margin-top: 0.3rem; color: var(--gold-glow); font-size: 0.85rem;">
            ${matchesHtml}
          </ul>
        </p>
        ${corr.entry.relatedVerses && corr.entry.relatedVerses.length > 0 ? 
          `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
            <strong>Referencias Bíblicas:</strong> ${corr.entry.relatedVerses.join(', ')}
           </p>` : ''
        }
      </div>
    `;
    discoveryDetailsBox.style.display = 'block';
  }

  // Muestra los detalles de código ELS autodetectado en el panel principal
  function showAutoELSDiscoveryDetails(match, crossovers) {
    if (!discoveryDetailsBox) return;

    let crossingsListHtml = crossovers.map(c => `<li>🔮 <strong>${c.entry.spanish}</strong> (${c.entry.hebrew}) con salto ${c.match.skip}</li>`).join('');
    if (crossovers.length === 0) {
      crossingsListHtml = '<li><em>Ningún cruce conceptual detectado en este cuadrante.</em></li>';
    }

    const verseCtx = getVerseContext(match.start, match.indices);

    discoveryDetailsBox.innerHTML = `
      <div class="discovery-details-header">
        <div class="discovery-details-title">Código de la Biblia: ${appState.rawInputText} (<span style="font-family: var(--font-hebrew);">${match.word}</span>)</div>
        <div style="font-size: 0.9rem; color: var(--purple-accent); font-weight: bold;">Salto: ${match.skip} | Inicio: Letra #${match.start}</div>
      </div>
      <div class="discovery-details-body">
        <p style="color: var(--text-primary); font-size: 0.95rem; margin-bottom: 0.8rem; line-height: 1.6;">
          Se detectó una secuencia equidistante (ELS) en la Torá para esta palabra empezando en <strong>${verseCtx}</strong> con un salto exacto de <strong>${match.skip} letras</strong>.
        </p>
        <p style="color: var(--text-secondary); font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem; margin-bottom: 1rem;">
          <strong>Conceptos Relacionados Cruzados en la Rejilla:</strong>
          <ul style="padding-left: 1.2rem; margin-top: 0.3rem; color: #d8a0f8; font-size: 0.85rem; line-height: 1.5;">
            ${crossingsListHtml}
          </ul>
        </p>
        <div style="margin-top: 1.2rem; text-align: center;">
          <button class="search-btn" id="btnAutoNavigateELS" style="width: auto; padding: 0.6rem 1.5rem; background: linear-gradient(135deg, var(--purple-accent) 0%, var(--gold-primary) 100%); border: none;">
            Auto-Navegar Matriz ➔
          </button>
        </div>
      </div>
    `;
    discoveryDetailsBox.style.display = 'block';

    const btnAutoNavigateELS = document.getElementById('btnAutoNavigateELS');
    if (btnAutoNavigateELS) {
      btnAutoNavigateELS.addEventListener('click', () => {
        autoNavigateToMatrix(match, crossovers);
      });
    }
  }

  // Función de escaneo ELS automático de alta densidad de crossovers
  function runAutoELSScan(hebrewText) {
    const cleanHebrew = hebrewText.replace(/[^א-ת]/g, '');
    if (cleanHebrew.length < 2) {
      appState.bestAutoELS = null;
      return;
    }

    const text = window.TORAH_TEXT || window.TorahText || "";
    if (!text) return;

    // Buscar coincidencias ELS en un rango estándar rápido de saltos (2 a 120)
    const matches = Engine.FindELS(text, cleanHebrew, 2, 120);
    if (matches.length === 0) {
      appState.bestAutoELS = null;
      updateDiscoveriesPanel(appState.gematriaResult);
      return;
    }

    // Medir la cantidad de crossovers (densidad) para cada coincidencia ELS hallada
    const scoredMatches = matches.map(match => {
      const w = Math.abs(match.skip);
      const matchIndices = match.indices;
      const minIdx = Math.min(...matchIndices);
      const maxIdx = Math.max(...matchIndices);

      const startRow = Math.floor(minIdx / w);
      const endRow = Math.floor(maxIdx / w);

      const paddingRows = 6;
      const minRow = Math.max(0, startRow - paddingRows);
      const maxRow = Math.min(Math.floor((text.length - 1) / w), endRow + paddingRows);

      const visibleStartIdx = minRow * w;
      const visibleEndIdx = (maxRow + 1) * w - 1;

      const crossovers = [];
      DB.KNOWLEDGE_GRAPH.forEach(entry => {
        if (entry.hebrew === match.word) return;

        // Escanear si hay alguna coincidencia del concepto secundario dentro de esta ventana de matriz
        const subMatches = Engine.FindELS(text, entry.hebrew, 2, 80);
        for (let m of subMatches) {
          const allInWindow = m.indices.every(idx => idx >= visibleStartIdx && idx <= visibleEndIdx);
          if (allInWindow) {
            crossovers.push({
              entry: entry,
              match: m
            });
            break;
          }
        }
      });

      return {
        match: match,
        crossovers: crossovers,
        score: crossovers.length
      };
    });

    // Ordenar: primero mayor densidad de crossovers, y si empatan, menor salto absoluto
    scoredMatches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return Math.abs(a.match.skip) - Math.abs(b.match.skip);
    });

    const best = scoredMatches[0];
    appState.bestAutoELS = {
      match: best.match,
      crossovers: best.crossovers
    };

    updateDiscoveriesPanel(appState.gematriaResult);
  }

  // Animación interactiva del Matrix Scanner
  function triggerMatrixScannerAnimation(match, crossovers, callback) {
    const overlay = document.getElementById('matrixScannerOverlay');
    const termBody = document.getElementById('scannerTerminalBody');
    const progressBar = document.getElementById('scannerProgressBar');
    const matrixBg = document.getElementById('scannerMatrixBg');

    if (!overlay || !termBody || !progressBar || !matrixBg) {
      if (callback) callback();
      return;
    }

    // Reiniciar UI
    overlay.style.display = 'flex';
    termBody.innerHTML = '';
    progressBar.style.width = '0%';
    matrixEmptyState.style.display = 'none';
    matrixContainer.style.display = 'none';
    if (elsSecondaryPanel) elsSecondaryPanel.style.display = 'none';

    // Animación de caracteres de fondo
    let matrixInterval = setInterval(() => {
      let randomHebrew = '';
      const letters = 'אבגדהוזחטיכלמנסעפצקרשת';
      for (let i = 0; i < 400; i++) {
        randomHebrew += letters[Math.floor(Math.random() * letters.length)];
      }
      matrixBg.textContent = randomHebrew;
    }, 45);

    const corpusLen = (typeof window.TORAH_TEXT === 'string' && window.TORAH_TEXT.length)
      ? window.TORAH_TEXT.length.toLocaleString('es-ES')
      : '26.371';
    const kgCount = (DB.KNOWLEDGE_GRAPH && DB.KNOWLEDGE_GRAPH.length) || 50;
    const logs = [
      { text: '> INICIANDO DECODIFICADOR AUTOMÁTICO EN LA TORÁ...', delay: 0 },
      { text: `> Cargando corpus de 5 libros: ${corpusLen} consonantes puras en memoria.`, delay: 200 },
      { text: `> Escaneando secuencias equidistantes para: "${match.word}"...`, delay: 400 },
      { text: `> ¡Palabra hallada! Salto constante = ${match.skip} letras (Letra de inicio: #${match.start}).`, delay: 650, class: 'info' },
      { text: `> Buscando cruces en el cuadrante con el Grafo de ${kgCount} conceptos...`, delay: 850 },
      { text: `> ¡Detección de cruces completada! ${crossovers.length} correspondencias identificadas.`, delay: 1050, class: 'success' },
      { text: `> Configurando ancho de columnas de la cuadrícula a ${Math.abs(match.skip)}. Renderizando...`, delay: 1250 }
    ];

    logs.forEach(log => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.className = 'term-line';
        if (log.class) line.classList.add(log.class);
        line.textContent = log.text;
        termBody.appendChild(line);
        termBody.scrollTop = termBody.scrollHeight;

        const progress = Math.min(100, Math.round((log.delay / 1250) * 100));
        progressBar.style.width = `${progress}%`;
      }, log.delay);
    });

    setTimeout(() => {
      clearInterval(matrixInterval);
      progressBar.style.width = '100%';
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.opacity = 1;
        if (callback) callback();
      }, 150);
    }, 1500);
  }

  // Auto-navegar de la calculadora al visualizador
  function autoNavigateToMatrix(match, crossovers) {
    switchTab('biblecode');

    triggerMatrixScannerAnimation(match, crossovers, () => {
      bibleCodeState.activeMatch = match;
      bibleCodeState.primaryWord = match.word;
      
      const skipWidth = Math.abs(match.skip);
      rangeMatrixWidth.value = skipWidth;
      lblMatrixWidth.textContent = skipWidth;
      bibleCodeState.matrixWidth = skipWidth;
      bibleCodeState.secondaryMatches = crossovers;

      renderBibleCodeMatrix();
      
      // Seleccionar el item correspondiente en el menú lateral si existe
      document.querySelectorAll('.els-result-item').forEach(el => el.classList.remove('active'));
      const listItems = document.querySelectorAll('.els-result-item');
      listItems.forEach(item => {
        const skipText = item.querySelector('.els-result-skip').textContent;
        if (skipText.includes(match.skip.toString())) {
          item.classList.add('active');
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  // --- 5. DETALLE DE LETRA (MODAL) ---
  function openLetterDetails(char) {
    const letterInfo = DB.HEBREW_LETTERS.find(l => l.char === char);
    if (!letterInfo) return;
    
    modalLetterChar.textContent = letterInfo.char;
    modalLetterName.textContent = letterInfo.name;
    modalLetterCosmology.textContent = letterInfo.element;
    modalValAbsolute.textContent = letterInfo.value;
    modalValOrdinal.textContent = letterInfo.ordinal;
    modalValReduced.textContent = letterInfo.reduced;
    modalLetterMeaning.textContent = letterInfo.meaning;
    
    letterModal.style.display = 'flex';
  }

  btnModalClose.addEventListener('click', () => {
    letterModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === letterModal) {
      letterModal.style.display = 'none';
    }
  });

  // --- 6. BUSCADOR DE LA TORÁ ---
  btnSearchTorah.addEventListener('click', executeTorahSearch);
  txtSearchTorah.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeTorahSearch();
  });

  function executeTorahSearch() {
    const query = txtSearchTorah.value.trim();
    if (!query) return;
    
    let searchVal = parseInt(query, 10);
    let isNumeric = !isNaN(searchVal);
    
    if (!isNumeric) {
      let searchHebrew = query;
      if (/[a-zA-Z]/.test(query)) {
        searchHebrew = Engine.SpanishToHebrew(query);
      }
      const calc = Engine.CalculateGematria(searchHebrew);
      searchVal = calc.absolute;
      isNumeric = true;
    }
    
    const matches = DB.TORAH_VERSES.filter(v => v.gematria === searchVal);
    renderTorahResults(matches, searchVal, query);
  }

  function renderTorahResults(results, searchVal, originalQuery) {
    torahResultsContainer.innerHTML = '';
    
    const resultsHeader = document.createElement('h4');
    resultsHeader.style.color = 'var(--gold-primary)';
    resultsHeader.style.fontFamily = 'var(--font-serif)';
    resultsHeader.style.marginBottom = '1.5rem';
    
    if (results.length === 0) {
      resultsHeader.textContent = `No se encontraron versículos clave con Gematria ${searchVal} (Consulta: "${originalQuery}")`;
      torahResultsContainer.appendChild(resultsHeader);
      
      const tipBox = document.createElement('div');
      tipBox.className = 'verse-item';
      tipBox.innerHTML = `
        <p style="color: var(--text-secondary);">
          Tip: Intenta buscar números como <strong>708</strong> (Año de la independencia de Israel), <strong>2701</strong> (Génesis 1:1), <strong>156</strong> (Sión / José), o <strong>13</strong> (Amor / Unidad).
        </p>
      `;
      torahResultsContainer.appendChild(tipBox);
      return;
    }
    
    resultsHeader.textContent = `${results.length} Coincidencia(s) encontrada(s) para Gematria ${searchVal}:`;
    torahResultsContainer.appendChild(resultsHeader);
    
    results.forEach(verse => {
      const item = document.createElement('div');
      item.className = 'verse-item';
      
      item.innerHTML = `
        <div class="verse-header">
          <span class="verse-ref">${verse.reference}</span>
          <span class="verse-val-badge">Gematria: ${verse.gematria}</span>
        </div>
        <div class="verse-hebrew">${verse.hebrew}</div>
        <div class="verse-translation">"${verse.translation}"</div>
        <div class="verse-commentary">
          <strong style="color: var(--gold-primary);">Reflexión:</strong> 
          <span>${verse.commentary}</span>
        </div>
      `;
      
      torahResultsContainer.appendChild(item);
    });
  }

  // --- 7. CORRELACIONES DEL SIONISMO (PESTAÑA) ---
  function renderZionismGrid() {
    zionismGrid.innerHTML = '';
    
    DB.ZIONIST_CORRELATIONS.forEach(item => {
      const card = document.createElement('div');
      card.className = 'glass-card letter-card';
      card.style.textAlign = 'left';
      card.style.cursor = 'default';
      
      card.innerHTML = `
        <div class="concept-card-top">
          <h4 class="concept-title">${item.concept}</h4>
          <span class="concept-hebrew" title="Gematria: ${item.gematria}">${item.hebrew}</span>
        </div>
        <div class="concept-info">
          <div class="info-block">
            <span class="info-label">Gematria Estándar</span>
            <span class="info-content" style="color: var(--gold-glow); font-weight: bold; font-size: 1.2rem;">${item.gematria}</span>
          </div>
          <div class="info-block">
            <span class="info-label">Contexto Histórico</span>
            <span class="info-content">${item.historicalContext}</span>
          </div>
          <div class="info-block" style="border-left-color: var(--purple-accent);">
            <span class="info-label">Conexión Mística</span>
            <span class="info-content" style="font-style: italic;">${item.mysticalConnection}</span>
          </div>
        </div>
      `;
      
      zionismGrid.appendChild(card);
    });
  }

  // --- 8. ESPEJO DE LETRAS (PESTAÑA) ---
  function renderLettersGrid() {
    lettersGrid.innerHTML = '';
    
    DB.HEBREW_LETTERS.forEach(letter => {
      const card = document.createElement('div');
      card.className = 'glass-card letter-card';
      
      const char = document.createElement('div');
      char.className = 'letter-card-char';
      char.textContent = letter.char;
      
      const name = document.createElement('div');
      name.className = 'letter-card-name';
      name.textContent = letter.name;
      
      const val = document.createElement('div');
      val.className = 'letter-card-val';
      val.innerHTML = `Val: <strong>${letter.value}</strong> | Ord: <strong>${letter.ordinal}</strong>`;
      
      card.setAttribute('data-letter', letter.char);
      card.appendChild(char);
      card.appendChild(name);
      card.appendChild(val);
      
      card.addEventListener('click', () => {
        openLetterDetails(letter.char);
      });
      
      lettersGrid.appendChild(card);
    });
  }

  // --- 9. ESPACIO DE REFLEXIÓN (PESTAÑA) ---
  function renderReflectionTab() {
    reflectionTopicsContainer.innerHTML = '';
    
    DB.DAILY_REFLECTIONS.forEach((topic, idx) => {
      const btn = document.createElement('button');
      btn.className = `reflection-topic-btn ${idx === appState.activeReflectionIndex ? 'active' : ''}`;
      
      btn.innerHTML = `
        <span class="ref-topic-title">${topic.title}</span>
        <span class="ref-topic-preview">${topic.text}</span>
      `;
      
      btn.addEventListener('click', () => {
        appState.activeReflectionIndex = idx;
        
        document.querySelectorAll('.reflection-topic-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        showReflectionContent(topic);
      });
      
      reflectionTopicsContainer.appendChild(btn);
    });
    
    if (DB.DAILY_REFLECTIONS.length > 0) {
      showReflectionContent(DB.DAILY_REFLECTIONS[appState.activeReflectionIndex]);
    }
  }

  function showReflectionContent(topic) {
    reflectionContent.style.opacity = '0';
    reflectionContent.style.transform = 'translateY(5px)';
    
    setTimeout(() => {
      reflectionContent.innerHTML = `
        <h3 class="input-title" style="margin-bottom: 1.5rem;">${topic.title}</h3>
        <blockquote class="reflection-quote">
          ${topic.text}
        </blockquote>
        <div class="reflection-prompt">
          <div class="reflection-prompt-title">Punto de Introspección:</div>
          <p style="color: var(--text-primary); line-height: 1.5;">
            Trata de escribir palabras relacionadas con este tema en el Calculador (usando el modo Español Fonético si no sabes hebreo) y observa si los valores de gematria resultantes despiertan alguna correlación o pensamiento en ti.
          </p>
        </div>
      `;
      
      reflectionContent.style.transition = 'all 0.3s ease';
      reflectionContent.style.opacity = '1';
      reflectionContent.style.transform = 'translateY(0)';
    }, 150);
  }

  // --- 10. GRÁFICO INTERACTIVO DE RELACIONES (CANVAS) ---
  let canvasCtx = relationCanvas.getContext('2d');
  let nodes = [];
  let particles = [];
  let mouse = { x: null, y: null };
  let selectedNode = null;

  function resizeCanvas() {
    const rect = relationCanvas.parentElement.getBoundingClientRect();
    relationCanvas.width = rect.width;
    relationCanvas.height = rect.height || 380;
  }

  window.addEventListener('resize', () => {
    if (appState.currentTab === 'calculator') {
      resizeCanvas();
      updateRelationGraph();
    } else if (appState.currentTab === 'comparison') {
      resizeComparisonCanvas();
    } else if (appState.currentTab === 'zionism') {
      resizeTimelineCanvas();
    }
  });

  relationCanvas.addEventListener('mousemove', (e) => {
    const rect = relationCanvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  relationCanvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  relationCanvas.addEventListener('click', () => {
    if (selectedNode) {
      if (selectedNode.type === 'letter') {
        openLettersFromExplore(selectedNode.label);
      } else if (selectedNode.type === 'concept') {
        if (selectedNode.category === 'sefirah') {
          openReflectionFromExplore(selectedNode.label || selectedNode.desc || '');
        } else {
          switchTab('zionism');
        }
      } else if (selectedNode.type === 'verse') {
        openTorahFromExplore(selectedNode.value);
      }
    }
  });

  function updateRelationGraph() {
    nodes = [];
    particles = [];
    const width = relationCanvas.width;
    const height = relationCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    if (!appState.gematriaResult || appState.gematriaResult.lettersCount === 0) {
      createSimbologyNodes(centerX, centerY);
      return;
    }

    const res = appState.gematriaResult;

    // 1. Nodo central (La Palabra)
    const centerNode = {
      x: centerX,
      y: centerY,
      targetX: centerX,
      targetY: centerY,
      radius: 40,
      label: res.cleanText,
      value: res.absolute,
      type: 'center',
      desc: 'Tu Palabra',
      color: '#d4af37',
      glowColor: 'rgba(212, 175, 55, 0.4)'
    };
    nodes.push(centerNode);

    // 2. Nodo de Valor (Suma Gematria)
    const valNode = {
      x: centerX,
      y: centerY,
      targetX: centerX - 130,
      targetY: centerY - 80,
      radius: 25,
      label: `Gematria: ${res.absolute}`,
      value: res.absolute,
      type: 'value',
      desc: 'Valor estándar absoluto',
      color: '#ffd700',
      glowColor: 'rgba(255, 215, 0, 0.3)'
    };
    nodes.push(valNode);

    // 3. Nodo de Reducido (Esencia)
    const redNode = {
      x: centerX,
      y: centerY,
      targetX: centerX + 130,
      targetY: centerY + 80,
      radius: 20,
      label: `Reducido: ${res.reduced}`,
      value: res.reduced,
      type: 'value',
      desc: 'Esencia primordial (1-9)',
      color: '#8e44ad',
      glowColor: 'rgba(142, 68, 173, 0.3)'
    };
    nodes.push(redNode);

    // 4. Conexiones encontradas en el Grafo de Conocimiento (KNOWLEDGE_GRAPH)
    const correlations = Engine.FindCorrelations(res.cleanText, DB.KNOWLEDGE_GRAPH);
    let angle = -Math.PI / 4;
    
    correlations.slice(0, 4).forEach((corr, idx) => {
      const dist = 180;
      const xOffset = Math.cos(angle) * dist;
      const yOffset = Math.sin(angle) * dist;
      angle += (Math.PI * 2) / 6;

      let color = '#3498db';
      let glowColor = 'rgba(52, 152, 219, 0.3)';
      if (corr.entry.category === 'divino') {
        color = '#f1c40f';
        glowColor = 'rgba(241, 196, 15, 0.3)';
      } else if (corr.entry.category === 'sefirah') {
        color = '#9b59b6';
        glowColor = 'rgba(155, 89, 182, 0.3)';
      }

      nodes.push({
        x: centerX,
        y: centerY,
        targetX: centerX + xOffset,
        targetY: centerY + yOffset,
        radius: 24,
        label: corr.entry.hebrew,
        value: corr.gematria.absolute,
        type: 'concept',
        category: corr.entry.category,
        desc: `${corr.entry.spanish} (${corr.entry.hebrew})`,
        color: color,
        glowColor: glowColor
      });
    });

    // 5. Conexiones con versículos de la Torá
    const matchesVerses = DB.TORAH_VERSES.filter(v => v.gematria === res.absolute);
    matchesVerses.slice(0, 2).forEach((verse) => {
      const dist = 240;
      const xOffset = Math.cos(angle) * dist;
      const yOffset = Math.sin(angle) * dist;
      angle += (Math.PI * 2) / 6;

      nodes.push({
        x: centerX,
        y: centerY,
        targetX: centerX + xOffset,
        targetY: centerY + yOffset,
        radius: 22,
        label: verse.reference.split(' ')[0],
        value: verse.gematria,
        type: 'verse',
        desc: `Versículo: ${verse.reference}`,
        color: '#e74c3c',
        glowColor: 'rgba(231, 76, 60, 0.3)'
      });
    });

    // 6. Nodos de letras individuales del desglose (alrededor de la palabra)
    const breakdownLetters = res.breakdown.slice(0, 6);
    breakdownLetters.forEach((item, idx) => {
      const subAngle = (idx * Math.PI * 2) / breakdownLetters.length;
      const dist = 70;
      const x = centerX + Math.cos(subAngle) * dist;
      const y = centerY + Math.sin(subAngle) * dist;

      nodes.push({
        x: centerX,
        y: centerY,
        targetX: x,
        targetY: y,
        radius: 14,
        label: item.letter,
        value: item.absolute,
        type: 'letter',
        desc: `${item.name} (${item.absolute})`,
        color: '#2ecc71',
        glowColor: 'rgba(46, 204, 113, 0.3)'
      });
    });

    createCosmicDust(width, height);
  }

  function createSimbologyNodes(centerX, centerY) {
    const radius = 90;
    const numNodes = 6;
    const labels = ['א', 'ש', 'מ', 'ת', 'י', 'ה'];
    const desc = ['Aire / Líder', 'Fuego / Transformación', 'Agua / Misterio', 'Verdad / Sello', 'Espiritualidad', 'Revelación'];
    
    nodes.push({
      x: centerX,
      y: centerY,
      targetX: centerX,
      targetY: centerY,
      radius: 25,
      label: 'Torá',
      value: 611,
      type: 'center',
      desc: 'Base de Sabiduría',
      color: '#d4af37',
      glowColor: 'rgba(212, 175, 55, 0.4)'
    });

    for (let i = 0; i < numNodes; i++) {
      const angle = (i * Math.PI * 2) / numNodes - Math.PI / 2;
      nodes.push({
        x: centerX,
        y: centerY,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        radius: 16,
        label: labels[i],
        value: labels[i] === 'Torá' ? 611 : (DB.HEBREW_LETTERS.find(l => l.char === labels[i])?.value || 1),
        type: 'letter',
        desc: desc[i],
        color: '#8e44ad',
        glowColor: 'rgba(142, 68, 173, 0.2)'
      });
    }

    createCosmicDust(relationCanvas.width, relationCanvas.height);
  }

  function createCosmicDust(width, height) {
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  // Loop de renderizado del Canvas
  function drawCanvas() {
    if (appState.currentTab !== 'calculator') {
      requestAnimationFrame(drawCanvas);
      return;
    }

    canvasCtx.clearRect(0, 0, relationCanvas.width, relationCanvas.height);

    // Dibujar polvo cósmico
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > relationCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > relationCanvas.height) p.vy *= -1;

      canvasCtx.beginPath();
      canvasCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      canvasCtx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      canvasCtx.fill();
    });

    // Dibujar conexiones entre nodos
    canvasCtx.lineWidth = 1;
    
    const center = nodes[0];
    if (center) {
      for (let i = 1; i < nodes.length; i++) {
        const target = nodes[i];
        
        const grad = canvasCtx.createLinearGradient(center.x, center.y, target.x, target.y);
        grad.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
        grad.addColorStop(1, target.glowColor);
        
        canvasCtx.strokeStyle = grad;
        canvasCtx.beginPath();
        canvasCtx.moveTo(center.x, center.y);
        canvasCtx.lineTo(target.x, target.y);
        canvasCtx.stroke();
      }

      if (center.label === 'Torá' && nodes.length === 7) {
        canvasCtx.strokeStyle = 'rgba(142, 68, 173, 0.1)';
        for (let i = 1; i < nodes.length; i++) {
          const nodeA = nodes[i];
          const nextIdx = (i % 6) + 1;
          const nodeB = nodes[nextIdx];
          
          canvasCtx.beginPath();
          canvasCtx.moveTo(nodeA.x, nodeA.y);
          canvasCtx.lineTo(nodeB.x, nodeB.y);
          canvasCtx.stroke();
          
          const crossIdx = ((i + 1) % 6) + 1;
          const nodeC = nodes[crossIdx];
          canvasCtx.beginPath();
          canvasCtx.moveTo(nodeA.x, nodeA.y);
          canvasCtx.lineTo(nodeC.x, nodeC.y);
          canvasCtx.stroke();
        }
      }
    }

    // Dibujar y actualizar los nodos
    selectedNode = null;
    canvasCtx.textAlign = 'center';
    canvasCtx.textBaseline = 'middle';

    nodes.forEach(node => {
      node.x += (node.targetX - node.x) * 0.1;
      node.y += (node.targetY - node.y) * 0.1;

      let isHovered = false;
      if (mouse.x !== null && mouse.y !== null) {
        const dist = Math.hypot(node.x - mouse.x, node.y - mouse.y);
        if (dist < node.radius) {
          isHovered = true;
          selectedNode = node;
        }
      }

      canvasCtx.beginPath();
      canvasCtx.arc(node.x, node.y, node.radius + (isHovered ? 8 : 4), 0, Math.PI * 2);
      canvasCtx.fillStyle = isHovered ? node.glowColor.replace('0.3', '0.5').replace('0.2', '0.4') : node.glowColor;
      canvasCtx.fill();

      canvasCtx.beginPath();
      canvasCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      canvasCtx.fillStyle = node.color;
      canvasCtx.fill();
      
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      canvasCtx.lineWidth = 1;
      canvasCtx.stroke();

      canvasCtx.fillStyle = (node.color === '#d4af37' || node.color === '#ffd700' || node.color === '#f1c40f') ? '#05060c' : '#f5f6fa';
      
      const isHebrewLabel = /[\u0590-\u05FF]/.test(node.label);
      
      if (isHebrewLabel) {
        canvasCtx.font = `bold ${node.radius * 0.9}px var(--font-hebrew)`;
      } else {
        canvasCtx.font = `${node.radius * 0.35}px var(--font-sans)`;
      }
      canvasCtx.fillText(node.label, node.x, node.y);

      if (isHovered) {
        canvasCtx.fillStyle = 'rgba(10, 8, 20, 0.95)';
        canvasCtx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        canvasCtx.lineWidth = 1;
        
        const tooltipW = 170;
        const tooltipH = 50;
        const tx = node.x - tooltipW / 2;
        const ty = node.y - node.radius - tooltipH - 8;
        
        canvasCtx.beginPath();
        canvasCtx.roundRect(tx, ty, tooltipW, tooltipH, 8);
        canvasCtx.fill();
        canvasCtx.stroke();
        
        canvasCtx.fillStyle = '#f5f6fa';
        canvasCtx.font = 'bold 11px var(--font-sans)';
        canvasCtx.textAlign = 'left';
        
        // Truncar descripción larga si es necesario
        let textToShow = node.desc;
        if (textToShow.length > 25) textToShow = textToShow.substring(0, 22) + '...';
        canvasCtx.fillText(textToShow, tx + 10, ty + 18);
        
        canvasCtx.fillStyle = '#d4af37';
        canvasCtx.font = '10px var(--font-sans)';
        canvasCtx.fillText(`Haz clic para explorar`, tx + 10, ty + 35);
        
        canvasCtx.textAlign = 'center';
      }
    });

    requestAnimationFrame(drawCanvas);
  }

  // --- FASE 2: LÍNEA DE TIEMPO DEL SIONISMO ---
  let timelineCtx = timelineCanvas ? timelineCanvas.getContext('2d') : null;

  function resizeTimelineCanvas() {
    if (!timelineCanvas) return;
    const rect = timelineCanvas.parentElement.getBoundingClientRect();
    timelineCanvas.width = rect.width;
    timelineCanvas.height = rect.height || 180;
  }

  if (timelineCanvas) {
    timelineCanvas.addEventListener('mousemove', (e) => {
      const rect = timelineCanvas.getBoundingClientRect();
      timelineState.mouse.x = e.clientX - rect.left;
      timelineState.mouse.y = e.clientY - rect.top;
    });

    timelineCanvas.addEventListener('mouseleave', () => {
      timelineState.mouse.x = null;
      timelineState.mouse.y = null;
    });

    timelineCanvas.addEventListener('click', () => {
      if (timelineState.selectedEvent) {
        timelineState.focusEvent = timelineState.selectedEvent;
        showTimelineEventDetails(timelineState.selectedEvent);
      }
    });
  }

  function showTimelineEventDetails(event) {
    if (!timelineDetailPanel) return;

    // Buscar si hay alguna correlación actual
    let activeValue = appState.gematriaResult ? appState.gematriaResult.absolute : null;
    let isMatch = activeValue && event.gematriaMatches.includes(activeValue);

    timelineDetailPanel.innerHTML = `
      <div class="timeline-detail-header">
        <span class="timeline-detail-year">${event.label} (Año Hebreo: ${event.hebrewYear})</span>
        <span class="timeline-detail-hebrew">Gematrias Conectadas: ${event.gematriaMatches.join(', ')}</span>
      </div>
      <div class="timeline-detail-title" style="font-weight: bold; margin-bottom: 0.5rem; color: var(--gold-primary); font-family: var(--font-serif); font-size: 1.15rem;">
        ${event.title} ${isMatch ? '<span style="color: #2ecc71; font-size: 0.9rem; margin-left: 0.5rem;">⚡ Resonancia Activa</span>' : ''}
      </div>
      <div class="timeline-detail-desc">${event.desc}</div>
    `;
    timelineDetailPanel.style.display = 'block';
  }

  function drawTimeline() {
    if (appState.currentTab !== 'zionism' || !timelineCtx) {
      requestAnimationFrame(drawTimeline);
      return;
    }

    const width = timelineCanvas.width;
    const height = timelineCanvas.height;
    timelineCtx.clearRect(0, 0, width, height);

    const paddingX = 60;
    const centerY = height / 2;
    const startX = paddingX;
    const endX = width - paddingX;
    const length = endX - startX;

    // Dibujar línea principal de tiempo
    timelineCtx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    timelineCtx.lineWidth = 4;
    timelineCtx.beginPath();
    timelineCtx.moveTo(startX, centerY);
    timelineCtx.lineTo(endX, centerY);
    timelineCtx.stroke();

    timelineCtx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
    timelineCtx.lineWidth = 12;
    timelineCtx.beginPath();
    timelineCtx.moveTo(startX, centerY);
    timelineCtx.lineTo(endX, centerY);
    timelineCtx.stroke();

    // Obtener valor activo
    const activeValue = appState.gematriaResult ? appState.gematriaResult.absolute : null;
    const activeReduced = appState.gematriaResult ? appState.gematriaResult.reduced : null;

    const numEvents = DB.HISTORICAL_EVENTS.length;
    timelineState.selectedEvent = null;

    DB.HISTORICAL_EVENTS.forEach((event, idx) => {
      const x = startX + (idx / (numEvents - 1)) * length;
      const y = centerY;

      // Verificar coincidencias
      // Coincide si el valor absoluto de la calculadora coincide con alguno en gematriaMatches
      const isMatch = activeValue && event.gematriaMatches.includes(activeValue);

      let isHovered = false;
      const isFocused = timelineState.focusEvent === event;
      if (timelineState.mouse.x !== null && timelineState.mouse.y !== null) {
        const dist = Math.hypot(x - timelineState.mouse.x, y - timelineState.mouse.y);
        if (dist < 15) {
          isHovered = true;
          timelineState.selectedEvent = event;
        }
      }

      let radius = 8;
      let fillColor = '#100c1e';
      let strokeColor = 'rgba(212, 175, 55, 0.4)';
      let glowColor = 'rgba(212, 175, 55, 0.1)';

      if (isMatch) {
        radius = 12;
        fillColor = '#ffd700';
        strokeColor = '#ffffff';
        glowColor = 'rgba(255, 215, 0, 0.6)';
      } else if (isHovered || isFocused) {
        radius = 10;
        fillColor = '#8e44ad';
        strokeColor = '#ffd700';
        glowColor = 'rgba(142, 68, 173, 0.5)';
      }

      // Dibujar resplandor
      timelineCtx.beginPath();
      timelineCtx.arc(x, y, radius + 6, 0, Math.PI * 2);
      timelineCtx.fillStyle = glowColor;
      timelineCtx.fill();

      // Dibujar punto
      timelineCtx.beginPath();
      timelineCtx.arc(x, y, radius, 0, Math.PI * 2);
      timelineCtx.fillStyle = fillColor;
      timelineCtx.strokeStyle = strokeColor;
      timelineCtx.lineWidth = 2;
      timelineCtx.fill();
      timelineCtx.stroke();

      // Año arriba
      timelineCtx.fillStyle = isMatch ? '#ffd700' : ((isHovered || isFocused) ? '#ffd700' : '#a4b0be');
      timelineCtx.font = isMatch || isHovered || isFocused ? 'bold 12px var(--font-serif)' : '10px var(--font-serif)';
      timelineCtx.textAlign = 'center';
      timelineCtx.fillText(event.label, x, y - 20);

      // Título abreviado abajo
      timelineCtx.fillStyle = isMatch ? '#ffffff' : ((isHovered || isFocused) ? '#ffd700' : '#888899');
      timelineCtx.font = '8.5px var(--font-sans)';
      let shortTitle = event.title.split(' ').slice(0, 2).join(' ');
      if (event.title.split(' ').length > 2) shortTitle += '...';
      timelineCtx.fillText(shortTitle, x, y + 22);
    });

    requestAnimationFrame(drawTimeline);
  }

  // --- FASE 2: COMPARADOR DE DOS VÍAS ---
  let comparisonCtx = comparisonCanvas ? comparisonCanvas.getContext('2d') : null;

  function resizeComparisonCanvas() {
    if (!comparisonCanvas) return;
    const rect = comparisonCanvas.parentElement.getBoundingClientRect();
    comparisonCanvas.width = rect.width;
    comparisonCanvas.height = rect.height || 220;
  }

  if (btnCompare) {
    btnCompare.addEventListener('click', handleComparison);
  }

  function handleComparison() {
    const inputA = txtCompareA.value.trim();
    const inputB = txtCompareB.value.trim();
    
    if (!inputA || !inputB) return;

    let textA = inputA;
    let textB = inputB;
    if (/[a-zA-Z]/.test(inputA)) textA = Engine.SpanishToHebrew(inputA);
    if (/[a-zA-Z]/.test(inputB)) textB = Engine.SpanishToHebrew(inputB);

    hintCompareA.textContent = textA || '—';
    hintCompareB.textContent = textB || '—';

    const calcA = Engine.CalculateGematria(textA);
    const calcB = Engine.CalculateGematria(textB);

    compState.calcA = calcA;
    compState.calcB = calcB;

    const scoreResult = Engine.ScoreCorrelation(calcA, calcB);
    renderComparisonBridge(calcA, calcB, scoreResult, inputA, inputB);
  }

  function renderComparisonBridge(calcA, calcB, scoreResult, rawA, rawB) {
    if (!comparisonBridge) return;

    let dimensionsHtml = '';
    scoreResult.matches.forEach(match => {
      let icon = '🔮';
      if (match.type === 'exact') icon = '⚡';
      if (match.type === 'reduced') icon = '✨';
      if (match.type === 'atbash') icon = '🔄';
      if (match.type === 'root') icon = '🌿';
      if (match.type === 'factor') icon = '📊';

      dimensionsHtml += `
        <div class="bridge-dim-item">
          <span class="bridge-dim-icon">${icon}</span>
          <span class="bridge-dim-text"><strong>${match.desc}</strong></span>
        </div>
      `;
    });

    if (scoreResult.matches.length === 0) {
      dimensionsHtml = `
        <div class="bridge-dim-item" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05);">
          <span class="bridge-dim-icon">🌀</span>
          <span class="bridge-dim-text" style="color: var(--text-secondary);">No se detectaron correspondencias directas en las 5 dimensiones.</span>
        </div>
      `;
    }

    let bridgeNarrativeHtml = '';
    if (scoreResult.matches.length > 0) {
      let explanation = `La relación entre "${rawA}" (${calcA.cleanText}) y "${rawB}" (${calcB.cleanText}) revela una sincronía de nivel ${scoreResult.stars} estrellas. `;
      
      const exactMatch = scoreResult.matches.find(m => m.type === 'exact');
      const reducedMatch = scoreResult.matches.find(m => m.type === 'reduced');
      const rootMatch = scoreResult.matches.find(m => m.type === 'root');
      const factorMatch = scoreResult.matches.find(m => m.type === 'factor');
      const atbashMatch = scoreResult.matches.find(m => m.type === 'atbash');

      if (exactMatch) {
        explanation += `Ambas comparten el valor numérico absoluto exacto de <strong>${calcA.absolute}</strong>. En la Cábala, esto denota "Equivalencia de Forma" (Jashav), sugiriendo que a nivel espiritual expresan la misma fuerza divina bajo diferentes ropajes. `;
      }
      
      if (reducedMatch && !exactMatch) {
        explanation += `Comparten el valor reducido o "esencia" (Mispar Katan) de <strong>${calcA.reduced}</strong>. Esto implica que, aunque operan en planos materiales diferentes, su núcleo espiritual y propósito último resuena con la misma frecuencia energética del 1 al 9. `;
      }

      if (atbashMatch) {
        explanation += `Están conectadas a través del cifrado <strong>Atbash</strong>. Esto representa una correspondencia oculta de reflejo, una revelación que solo es visible cuando se invierte la estructura de las letras. `;
      }

      if (rootMatch) {
        explanation += `Lingüísticamente comparten letras en común (<strong>${rootMatch.details}</strong>), sugiriendo una proximidad en su origen raíz hebreo (Shoresh). `;
      }

      if (factorMatch) {
        const factor = factorMatch.details.factor;
        const type = factorMatch.details.type;
        if (type === 'multiple') {
          explanation += `El valor de "${rawA}" (${calcA.absolute}) es exactamente <strong>${factor} veces</strong> el valor de "${rawB}" (${calcB.absolute}). Esto enseña que la primera palabra "contiene" o amplifica la frecuencia de la segunda. `;
        } else {
          explanation += `El valor de "${rawB}" (${calcB.absolute}) es exactamente <strong>${factor} veces</strong> el valor de "${rawA}" (${calcA.absolute}). Esto indica que la segunda palabra es un contenedor amplificado de la energía de la primera. `;
        }
      }

      bridgeNarrativeHtml = `
        <div class="bridge-narrative" style="margin-top: 1.5rem;">
          <div class="bridge-narrative-title">Interpretación Cabalística</div>
          <div class="bridge-narrative-text">"${explanation}"</div>
        </div>
      `;
    } else {
      bridgeNarrativeHtml = `
        <div class="bridge-narrative" style="margin-top: 1.5rem; border-left-color: var(--text-secondary); background: rgba(255,255,255,0.02);">
          <div class="bridge-narrative-title" style="color: var(--text-secondary);">Meditación Reflexiva</div>
          <div class="bridge-narrative-text" style="color: var(--text-secondary);">
            Ambos conceptos poseen valores numéricos independientes (A=${calcA.absolute}, B=${calcB.absolute}). Esto indica que representan canales y virtudes divinas diferenciadas en el árbol de la vida, invitando a la mente a contemplar cómo cada uno sostiene la creación desde su propia frecuencia.
          </div>
        </div>
      `;
    }

    comparisonBridge.innerHTML = `
      <div class="bridge-values-flex">
        <div class="bridge-val-card ${calcA.absolute === calcB.absolute ? 'match' : ''}">
          <div class="bridge-val-title">${rawA}</div>
          <div class="bridge-val-hebrew">${calcA.cleanText}</div>
          <div class="bridge-val-number">${calcA.absolute}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Esencia: ${calcA.reduced}</div>
        </div>
        <div class="bridge-val-card ${calcA.absolute === calcB.absolute ? 'match' : ''}">
          <div class="bridge-val-title">${rawB}</div>
          <div class="bridge-val-hebrew">${calcB.cleanText}</div>
          <div class="bridge-val-number">${calcB.absolute}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Esencia: ${calcB.reduced}</div>
        </div>
      </div>

      <h4 style="color: var(--gold-primary); font-family: var(--font-serif); margin-bottom: 0.8rem; font-size: 1rem;">Dimensiones de Resonancia:</h4>
      <div class="bridge-dimensions-list">
        ${dimensionsHtml}
      </div>

      ${bridgeNarrativeHtml}
    `;
  }

  function drawComparisonCanvas() {
    if (appState.currentTab !== 'comparison' || !comparisonCtx) {
      requestAnimationFrame(drawComparisonCanvas);
      return;
    }

    const width = comparisonCanvas.width;
    const height = comparisonCanvas.height;
    comparisonCtx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const orbitRadius = 55;

    compState.comparisonAngle += 0.015;

    if (!compState.calcA || !compState.calcB) {
      // Dibujar órbitas vacías
      comparisonCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      comparisonCtx.lineWidth = 1;
      
      comparisonCtx.beginPath();
      comparisonCtx.arc(centerX - 50, centerY, orbitRadius, 0, Math.PI * 2);
      comparisonCtx.stroke();
      
      comparisonCtx.beginPath();
      comparisonCtx.arc(centerX + 50, centerY, orbitRadius, 0, Math.PI * 2);
      comparisonCtx.stroke();

      requestAnimationFrame(drawComparisonCanvas);
      return;
    }

    const xA = centerX - 65;
    const xB = centerX + 65;

    // Órbita A (Azul místico)
    comparisonCtx.strokeStyle = 'rgba(52, 152, 219, 0.15)';
    comparisonCtx.lineWidth = 2;
    comparisonCtx.beginPath();
    comparisonCtx.arc(xA, centerY, orbitRadius, 0, Math.PI * 2);
    comparisonCtx.stroke();

    // Órbita B (Púrpura místico)
    comparisonCtx.strokeStyle = 'rgba(142, 68, 173, 0.15)';
    comparisonCtx.lineWidth = 2;
    comparisonCtx.beginPath();
    comparisonCtx.arc(xB, centerY, orbitRadius, 0, Math.PI * 2);
    comparisonCtx.stroke();

    // Intersección dorada si hay correlación
    const scoreResult = Engine.ScoreCorrelation(compState.calcA, compState.calcB);
    const hasCorrelation = scoreResult.matches.length > 0;

    if (hasCorrelation) {
      const grad = comparisonCtx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 35);
      grad.addColorStop(0, `rgba(212, 175, 55, ${0.12 + Math.sin(compState.comparisonAngle * 3) * 0.04})`);
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      
      comparisonCtx.fillStyle = grad;
      comparisonCtx.beginPath();
      comparisonCtx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      comparisonCtx.fill();
    }

    // Dibujar Soles
    // Sol A
    comparisonCtx.beginPath();
    comparisonCtx.arc(xA, centerY, 20, 0, Math.PI * 2);
    comparisonCtx.fillStyle = '#3498db';
    comparisonCtx.fill();
    comparisonCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    comparisonCtx.stroke();
    
    // Sol B
    comparisonCtx.beginPath();
    comparisonCtx.arc(xB, centerY, 20, 0, Math.PI * 2);
    comparisonCtx.fillStyle = '#8e44ad';
    comparisonCtx.fill();
    comparisonCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    comparisonCtx.stroke();

    // Textos de palabras hebreas sobre los soles
    comparisonCtx.fillStyle = '#ffffff';
    comparisonCtx.font = 'bold 11px var(--font-hebrew)';
    comparisonCtx.textAlign = 'center';
    comparisonCtx.textBaseline = 'middle';
    comparisonCtx.fillText(compState.calcA.cleanText, xA, centerY);
    comparisonCtx.fillText(compState.calcB.cleanText, xB, centerY);

    // Partículas orbitales
    const pX_A = xA + Math.cos(compState.comparisonAngle) * orbitRadius;
    const pY_A = centerY + Math.sin(compState.comparisonAngle) * orbitRadius;
    comparisonCtx.beginPath();
    comparisonCtx.arc(pX_A, pY_A, 5, 0, Math.PI * 2);
    comparisonCtx.fillStyle = '#ffd700';
    comparisonCtx.fill();

    const pX_B = xB + Math.cos(-compState.comparisonAngle * 1.2 + Math.PI) * orbitRadius;
    const pY_B = centerY + Math.sin(-compState.comparisonAngle * 1.2 + Math.PI) * orbitRadius;
    comparisonCtx.beginPath();
    comparisonCtx.arc(pX_B, pY_B, 5, 0, Math.PI * 2);
    comparisonCtx.fillStyle = '#ffd700';
    comparisonCtx.fill();

    if (hasCorrelation) {
      comparisonCtx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
      comparisonCtx.lineWidth = 1;
      
      comparisonCtx.beginPath();
      comparisonCtx.moveTo(pX_A, pY_A);
      comparisonCtx.lineTo(centerX, centerY);
      comparisonCtx.stroke();

      comparisonCtx.beginPath();
      comparisonCtx.moveTo(pX_B, pY_B);
      comparisonCtx.lineTo(centerX, centerY);
      comparisonCtx.stroke();
    }

    requestAnimationFrame(drawComparisonCanvas);
  }

  // --- FASE 3: LÓGICA DEL CÓDIGO DE LA BIBLIA (ELS MATRIX) ---



  // Mapear índice global a libro + posición aproximada en el corpus expandido
  function getVerseContext(globalIdx, indices) {
    if (typeof window.LookupTorahVerseSpan === 'function' && Array.isArray(indices) && indices.length) {
      const span = window.LookupTorahVerseSpan(indices);
      if (span) return span;
    }
    if (typeof window.LookupTorahVerse === 'function') {
      const v = window.LookupTorahVerse(globalIdx);
      if (v) return v.reference;
    }
    const offsets = window.TORAH_BOOK_OFFSETS;
    if (Array.isArray(offsets) && offsets.length) {
      for (const book of offsets) {
        if (globalIdx >= book.offset && globalIdx < book.offset + book.length) {
          return `${book.label} (letra #${globalIdx})`;
        }
      }
    }
    return `Torá (letra #${globalIdx})`;
  }

  // --- FASE 5: HISTORIAL Y SUGERENCIAS RÁPIDAS DE BÚSQUEDA ELS ---
  function saveELSSearchHistory(query) {
    if (Storage.SaveELSSearchHistory) Storage.SaveELSSearchHistory(query);
    renderELSSearchHistory();
  }

  function renderELSSearchHistory() {
    const section = document.getElementById('elsHistorySection');
    const container = document.getElementById('elsHistoryChips');
    if (!section || !container) return;

    const history = Storage.GetELSSearchHistory ? Storage.GetELSSearchHistory() : [];
    if (history.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    history.forEach(item => {
      const chip = document.createElement('button');
      chip.className = 'els-history-chip';
      chip.textContent = item;
      chip.addEventListener('click', () => {
        txtSearchELS.value = item;
        handleELSSearch();
      });
      container.appendChild(chip);
    });
  }

  const btnClearELSHistory = document.getElementById('btnClearELSHistory');
  if (btnClearELSHistory) {
    btnClearELSHistory.addEventListener('click', () => {
      if (Storage.ClearELSSearchHistory) Storage.ClearELSSearchHistory();
      renderELSSearchHistory();
    });
  }

  // Quick Pick Chips
  const quickPickChips = document.querySelectorAll('.els-quick-chip');
  quickPickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (query) {
        txtSearchELS.value = query;
        handleELSSearch();
      }
    });
  });

  // Manejador del submit de búsqueda ELS (Soporta Multi-Término)
  // --- WEB WORKER para búsquedas ELS pesadas ---
  let elsWorkerInstance = null;
  let activeELSRequestId = null;

  function getELSWorker() {
    if (!elsWorkerInstance && typeof Worker !== 'undefined') {
      try {
        elsWorkerInstance = new Worker('elsWorker.js');
        elsWorkerInstance.onmessage = handleWorkerMessage_ELS;
        elsWorkerInstance.onerror = (e) => {
          console.warn('[ELS Worker] Error:', e.message);
          elsWorkerInstance = null; // reset so fallback is used
        };
      } catch (e) {
        console.warn('[ELS Worker] Worker creation failed, using sync fallback:', e.message);
        elsWorkerInstance = null;
      }
    }
    return elsWorkerInstance;
  }

  function handleWorkerMessage_ELS(event) {
    const msg = event.data;
    if (!msg) return;
    if (msg.requestId && msg.requestId !== activeELSRequestId) return; // stale

    if (msg.action === 'progress') {
      updateELSProgressBar(msg.percent, msg.currentSkip, msg.searchWord);
    } else if (msg.action === 'elsResults') {
      hideELSProgressBar();
      renderELSResultsList(msg.matches, msg.searchWord, [msg.searchWord]);
    } else if (msg.action === 'cancelled') {
      hideELSProgressBar();
      activeELSRequestId = null;
      elsResultsList.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:1rem;font-style:italic;">Búsqueda cancelada.</div>';
    } else if (msg.action === 'error') {
      hideELSProgressBar();
      elsResultsList.innerHTML = `<div style="color:#e74c3c;text-align:center;padding:1.5rem;">Error en el worker: ${msg.error}</div>`;
    }
  }

  function showELSProgressBar(word) {
    let bar = document.getElementById('elsProgressBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'elsProgressBar';
      bar.style.cssText = 'margin-bottom:0.8rem;background:rgba(0,0,0,0.4);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:0.6rem 0.8rem;font-size:0.78rem;color:var(--gold-primary);';
      elsResultsList.parentNode.insertBefore(bar, elsResultsList);
    }
    bar.style.display = 'block';
    bar.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
        <span>⚙️ Escaneando Torá para <strong style="font-family:var(--font-hebrew)">${word}</strong>...</span>
        <button id="btnCancelELS" style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;padding:0.2rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.72rem;">✕ Cancelar</button>
      </div>
      <div style="background:rgba(255,255,255,0.05);border-radius:6px;overflow:hidden;height:6px;">
        <div id="elsProgressFill" style="height:100%;background:linear-gradient(90deg,var(--gold-primary),#00ced1);width:0%;transition:width 0.3s;border-radius:6px;"></div>
      </div>
      <div id="elsProgressLabel" style="font-size:0.7rem;color:var(--text-secondary);margin-top:0.3rem;">Inicializando...</div>
    `;
    const btnCancel = document.getElementById('btnCancelELS');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        const cancelledId = activeELSRequestId;
        activeELSRequestId = null;
        if (elsWorkerInstance) {
          try {
            elsWorkerInstance.postMessage({ action: 'cancel', requestId: cancelledId });
          } catch (e) {}
          // Hard-stop: terminate worker so FindELS cannot keep burning CPU
          try {
            elsWorkerInstance.terminate();
          } catch (e) {}
          elsWorkerInstance = null;
        }
        hideELSProgressBar();
        elsResultsList.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:1rem;font-style:italic;">Búsqueda cancelada.</div>';
      });
    }
  }

  function updateELSProgressBar(percent, currentSkip, word) {
    const fill = document.getElementById('elsProgressFill');
    const label = document.getElementById('elsProgressLabel');
    if (fill) fill.style.width = percent + '%';
    if (label) label.textContent = `Progreso: ${percent}% | Salto actual: ${currentSkip}`;
  }

  function hideELSProgressBar() {
    const bar = document.getElementById('elsProgressBar');
    if (bar) bar.style.display = 'none';
  }

  function handleELSSearch() {
    const rawQuery = txtSearchELS.value.trim();
    if (!rawQuery) return;

    saveELSSearchHistory(rawQuery);

    const minSkip = parseInt(numMinSkip.value, 10) || 2;
    const maxSkip = parseInt(numMaxSkip.value, 10) || 120;
    const text = window.TORAH_TEXT || window.TorahText || "";

    if (!text) {
      elsResultsList.innerHTML = `
        <div style="color: #e74c3c; text-align: center; padding: 2rem 0; font-size: 0.9rem;">
          Error: No se encontró el texto de la Torá. Asegúrese de que torah_text.js está cargado.
        </div>
      `;
      return;
    }

    // Dividir por comas para multi-término
    const termsRaw = rawQuery.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    // Para búsquedas multi-término o saltos amplios, usar Web Worker
    const useWorker = (maxSkip - minSkip > 30 || termsRaw.length === 1) && typeof Worker !== 'undefined';

    if (useWorker && termsRaw.length === 1) {
      let searchHebrew = termsRaw[0];
      if (/[a-zA-Z]/.test(searchHebrew)) searchHebrew = Engine.SpanishToHebrew(searchHebrew);
      searchHebrew = searchHebrew.replace(/[^א-ת]/g, '');

      if (searchHebrew.length < 2) {
        elsResultsList.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:1rem;">La palabra debe tener al menos 2 letras hebreas.</div>';
        return;
      }

      const worker = getELSWorker();
      if (worker) {
        activeELSRequestId = `req_${Date.now()}`;
        elsResultsList.innerHTML = '';
        showELSProgressBar(searchHebrew);

        worker.postMessage({
          action: 'searchELS',
          text: window.TORAH_TEXT || window.TorahText || '',
          searchWord: searchHebrew,
          minSkip,
          maxSkip,
          requestId: activeELSRequestId
        });
        return; // resultado llega en handleWorkerMessage_ELS
      }
    }

    // Fallback síncrono (multi-término o worker no disponible)
    let allMatches = [];
    termsRaw.forEach((termStr, termIdx) => {
      let searchHebrew = termStr;
      if (/[a-zA-Z]/.test(termStr)) {
        searchHebrew = Engine.SpanishToHebrew(termStr);
      }
      searchHebrew = searchHebrew.replace(/[^א-ת]/g, '');

      if (searchHebrew.length >= 2) {
        const matches = Engine.FindELS(text, searchHebrew, minSkip, maxSkip);
        matches.forEach(m => {
          m.termIndex = termIdx;
          m.rawQuery = termStr;
          allMatches.push(m);
        });
      }
    });

    const countBadge = document.getElementById('elsResultCountBadge');
    if (countBadge) countBadge.textContent = `${allMatches.length} hallazgo(s)`;

    renderELSResultsList(allMatches, rawQuery, termsRaw);
  }

  function renderELSResultsList(matches, searchedQuery, termsArray) {
    elsResultsList.innerHTML = '';
    const narrativePanel = document.getElementById('elsNarrativePanel');

    if (matches.length === 0) {
      elsResultsList.innerHTML = `
        <div style="color: var(--text-secondary); text-align: center; padding: 2rem 0; font-size: 0.9rem;">
          No se encontraron secuencias ELS para "${searchedQuery}" en el rango de saltos especificado.
        </div>
      `;
      
      bibleCodeState.activeMatch = null;
      matrixEmptyState.style.display = 'block';
      matrixContainer.style.display = 'none';
      matrixWidthController.style.display = 'none';
      elsSecondaryPanel.style.display = 'none';
      if (narrativePanel) narrativePanel.style.display = 'none';
      return;
    }

    matches.forEach((match, idx) => {
      const item = document.createElement('div');
      item.className = 'els-result-item';
      
      const verseContext = getVerseContext(match.start, match.indices);
      const termBadgeClass = `term-badge-${match.termIndex % 4}`;
      const honesty = honestyForMatch(match, false);

      item.innerHTML = `
        <div class="els-result-header-row">
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
            <span class="els-result-word">${match.word}</span>
            ${termsArray && termsArray.length > 1 ? `<span class="term-badge ${termBadgeClass}">${match.rawQuery}</span>` : ''}
            ${honestyBandChip(honesty)}
          </div>
          <span class="els-result-skip">Salto: ${match.skip}</span>
        </div>
        <div class="els-result-context" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
          <span>Inicio: Letra #${match.start}</span>
          <span>${verseContext}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('.els-result-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        bibleCodeState.activeMatch = match;
        bibleCodeState.primaryWord = match.word;
        
        const defaultWidth = Math.min(150, Math.max(10, Math.abs(match.skip)));
        rangeMatrixWidth.value = defaultWidth;
        lblMatrixWidth.textContent = defaultWidth;
        bibleCodeState.matrixWidth = defaultWidth;

        renderBibleCodeMatrix();
      });

      if (idx === 0) {
        item.classList.add('active');
        bibleCodeState.activeMatch = match;
        bibleCodeState.primaryWord = match.word;
        
        const defaultWidth = Math.min(150, Math.max(10, Math.abs(match.skip)));
        rangeMatrixWidth.value = defaultWidth;
        lblMatrixWidth.textContent = defaultWidth;
        bibleCodeState.matrixWidth = defaultWidth;
      }

      elsResultsList.appendChild(item);
    });

    if (bibleCodeState.activeMatch) {
      const match = bibleCodeState.activeMatch;
      const w = bibleCodeState.matrixWidth;
      const text = window.TORAH_TEXT || window.TorahText || "";
      const minIdx = Math.min(...match.indices);
      const maxIdx = Math.max(...match.indices);
      const startRow = Math.floor(minIdx / w);
      const endRow = Math.floor(maxIdx / w);
      const minRow = Math.max(0, startRow - 6);
      const maxRow = Math.min(Math.floor((text.length - 1) / w), endRow + 6);
      const visibleStart = minRow * w;
      const visibleEnd = (maxRow + 1) * w - 1;
      const crossovers = searchSecondaryMatches(visibleStart, visibleEnd);

      triggerMatrixScannerAnimation(match, crossovers, () => {
        renderBibleCodeMatrix();
      });
    }
  }

  function searchSecondaryMatches(minIdx, maxIdx) {
    const matches = [];
    const text = window.TORAH_TEXT || window.TorahText || "";
    
    DB.KNOWLEDGE_GRAPH.forEach(entry => {
      if (entry.hebrew === bibleCodeState.primaryWord) return;

      const subMatches = Engine.FindELS(text, entry.hebrew, 2, 80);
      
      for (let m of subMatches) {
        const allInWindow = m.indices.every(idx => idx >= minIdx && idx <= maxIdx);
        if (allInWindow) {
          matches.push({
            entry: entry,
            match: m
          });
          break;
        }
      }
    });

    return matches;
  }

  function renderNarrativePanel(match, crossovers) {
    const panel = document.getElementById('elsNarrativePanel');
    const textContainer = document.getElementById('elsNarrativeText');
    if (!panel || !textContainer || !match) return;

    panel.style.display = 'block';

    const verseCtx = getVerseContext(match.start, match.indices);
    const skipDirection = match.skip > 0 ? 'hacia adelante' : 'hacia atrás (inverso)';
    const termColorClass = `term-badge-${(match.termIndex || 0) % 4}`;

    let crossoverNarrative = '';
    if (crossovers && crossovers.length > 0) {
      const crossoverNames = crossovers.map(c => `<strong>${c.entry.spanish}</strong> (${c.entry.hebrew})`).join(', ');
      crossoverNarrative = ` En esta misma cuadrícula se cruzan los conceptos del grafo místico: ${crossoverNames}. La proximidad espacial de estos términos en el código sugiere una densidad conceptual compartida.`;
    } else {
      crossoverNarrative = ' No se detectaron cruces de conceptos del grafo secundario en este cuadrante específico.';
    }

    textContainer.innerHTML = `
      La palabra <span class="term-badge ${termColorClass}" style="font-family: var(--font-hebrew); font-size: 0.95rem;">${match.word}</span> 
      ${match.rawQuery ? `(búsqueda: "${match.rawQuery}")` : ''} 
      aparece en la Torá con un salto de <strong>${match.skip} letras</strong> ${skipDirection}, iniciando en la letra <strong>#${match.start}</strong> (correspondiente a <strong>${verseCtx}</strong>). 
      ${crossoverNarrative}
      ${formatHonestyHtml(honestyForMatch(match, true))}
    `;
  }

  function renderBibleCodeMatrix() {
    const match = bibleCodeState.activeMatch;
    if (!match) return;

    const text = window.TORAH_TEXT || window.TorahText || "";
    const w = bibleCodeState.matrixWidth;

    const matchIndices = match.indices;
    const minIdx = Math.min(...matchIndices);
    const maxIdx = Math.max(...matchIndices);

    const startRow = Math.floor(minIdx / w);
    const endRow = Math.floor(maxIdx / w);

    const paddingRows = 6;
    const minRow = Math.max(0, startRow - paddingRows);
    const maxRow = Math.min(Math.floor((text.length - 1) / w), endRow + paddingRows);

    const visibleStartIdx = minRow * w;
    const visibleEndIdx = (maxRow + 1) * w - 1;

    bibleCodeState.secondaryMatches = searchSecondaryMatches(visibleStartIdx, visibleEndIdx);

    renderSecondaryPanel();
    renderNarrativePanel(match, bibleCodeState.secondaryMatches);

    matrixEmptyState.style.display = 'none';
    matrixContainer.style.display = 'block';
    matrixWidthController.style.display = 'flex';
    matrixContainer.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'bible-code-matrix';

    const termHighlightClass = `highlight-term-${(match.termIndex || 0) % 4}`;

    for (let r = minRow; r <= maxRow; r++) {
      const tr = document.createElement('tr');
      
      for (let c = 0; c < w; c++) {
        const globalIdx = r * w + c;
        const td = document.createElement('td');

        if (globalIdx < text.length) {
          const letter = text[globalIdx];
          td.textContent = letter;
          td.dataset.index = globalIdx;
          
          const verseCtx = getVerseContext(globalIdx);
          td.title = `Letra #${globalIdx} | ${verseCtx}`;

          const isPrimary = matchIndices.includes(globalIdx);
          if (isPrimary) {
            td.classList.add(termHighlightClass);
          }

          let isSecondary = false;
          bibleCodeState.secondaryMatches.forEach(sm => {
            if (sm.match.indices.includes(globalIdx)) {
              td.classList.add('highlight-secondary');
              isSecondary = true;
              td.title += ` | Cruce con: ${sm.entry.spanish} (${sm.entry.hebrew})`;
            }
          });

          if (isPrimary && isSecondary) {
            td.style.animation = 'pulse 1.5s infinite';
          }
        } else {
          td.textContent = '';
        }
        
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    matrixContainer.appendChild(table);
  }

  function renderSecondaryPanel() {
    if (!elsSecondaryPanel || !elsSecondaryWordsList) return;

    if (bibleCodeState.secondaryMatches.length === 0) {
      elsSecondaryPanel.style.display = 'none';
      return;
    }

    elsSecondaryPanel.style.display = 'block';
    elsSecondaryWordsList.innerHTML = '';

    bibleCodeState.secondaryMatches.forEach(sm => {
      const badge = document.createElement('span');
      badge.className = 'secondary-badge';
      badge.innerHTML = `🔮 ${sm.entry.spanish} (${sm.entry.hebrew}) [Salto: ${sm.match.skip}]`;
      
      badge.addEventListener('click', () => {
        const secondarySkip = Math.abs(sm.match.skip);
        rangeMatrixWidth.value = secondarySkip;
        lblMatrixWidth.textContent = secondarySkip;
        bibleCodeState.matrixWidth = secondarySkip;
        renderBibleCodeMatrix();
      });

      elsSecondaryWordsList.appendChild(badge);
    });
  }

  // Integración de búsqueda ELS desde el panel de la línea de tiempo del Sionismo
  const origShowTimelineEventDetails = showTimelineEventDetails;
  showTimelineEventDetails = function(event) {
    origShowTimelineEventDetails(event);
    if (!timelineDetailPanel) return;

    if (event.searchTerms && event.searchTerms.length > 0) {
      const btnContainer = document.createElement('div');
      btnContainer.style.marginTop = '0.8rem';

      const btnELS = document.createElement('button');
      btnELS.className = 'search-btn';
      btnELS.style.fontSize = '0.8rem';
      btnELS.style.padding = '0.4rem 1rem';
      btnELS.style.width = 'auto';
      btnELS.style.background = 'linear-gradient(135deg, var(--gold-primary) 0%, var(--purple-accent) 100%)';
      btnELS.innerHTML = `🔍 Buscar "${event.searchTerms.join(', ')}" en el Código de la Biblia`;

      btnELS.addEventListener('click', () => {
        switchTab('biblecode');
        txtSearchELS.value = event.searchTerms.join(', ');
        handleELSSearch();
      });

      btnContainer.appendChild(btnELS);
      timelineDetailPanel.appendChild(btnContainer);
    }
  };

  // --- LISTENERS DEL CÓDIGO DE LA BIBLIA ---
  if (btnSearchELS) {
    btnSearchELS.addEventListener('click', handleELSSearch);
  }
  if (txtSearchELS) {
    txtSearchELS.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleELSSearch();
    });
  }
  if (rangeMatrixWidth) {
    rangeMatrixWidth.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      lblMatrixWidth.textContent = val;
      bibleCodeState.matrixWidth = val;
      renderBibleCodeMatrix();
    });
  }

  // Mostrar/ocultar botones de exportar PNG y guardar favorito cuando haya un match activo
  function toggleELSActionButtons(show) {
    const btnPNG = document.getElementById('btnExportMatrixPNG');
    const btnFav = document.getElementById('btnSaveELSFavorite');
    if (btnPNG) btnPNG.style.display = show ? 'inline-block' : 'none';
    if (btnFav) btnFav.style.display = show ? 'inline-block' : 'none';
  }

  // Sobreescribir renderBibleCodeMatrix original para añadir toggle de botones
  const _origRenderBibleCodeMatrix = renderBibleCodeMatrix;
  renderBibleCodeMatrix = function() {
    _origRenderBibleCodeMatrix();
    toggleELSActionButtons(!!bibleCodeState.activeMatch);
  };

  // --- MÓDULO: EXPORTAR MATRIZ ELS COMO PNG ---
  const btnExportMatrixPNG = document.getElementById('btnExportMatrixPNG');
  if (btnExportMatrixPNG) {
    btnExportMatrixPNG.addEventListener('click', () => {
      if (typeof window.ExportMatrixAsPNG !== 'function') return;
      const match = bibleCodeState.activeMatch;
      window.ExportMatrixAsPNG(matrixContainer, undefined, match || null);
    });
  }

  // --- MÓDULO: FAVORITOS ELS (storage.js) ---
  function renderFavoritesTab() {
    const container = document.getElementById('favoritesContainer');
    if (!container) return;
    const favs = Storage.GetFavorites ? Storage.GetFavorites() : [];
    if (favs.length === 0) {
      container.innerHTML = '<div class="favorites-empty">No hay favoritos guardados. Guarda hallazgos ELS o correlaciones desde Explorar.</div>';
      return;
    }

    container.innerHTML = '';
    favs.forEach((fav, idx) => {
      const card = document.createElement('div');
      card.className = 'glass-card favorite-card';
      if (fav.type === 'explore') {
        const data = fav.data || {};
        card.innerHTML = `
          <div class="favorite-card-header">
            <span class="favorite-word" style="font-family:var(--font-serif);font-size:1.1rem;">🔎 ${fav.title || fav.word}</span>
            <button data-idx="${idx}" class="fav-remove-btn" title="Eliminar">✕</button>
          </div>
          <div class="favorite-meta">Correlación · ${fav.verse || data.queryType || 'explore'}</div>
          <div class="favorite-sig sig-mid">
            ${(data.events || []).slice(0, 2).join(' · ') || 'Sin eventos'} ${(data.primaryHebrew ? '· ' + data.primaryHebrew : '')}
          </div>
          <div class="favorite-date">${new Date(fav.savedAt || fav.timestamp).toLocaleDateString()}</div>
          <button data-idx="${idx}" class="fav-reload-btn" data-fav-type="explore">🔍 Volver a explorar</button>
        `;
      } else if (fav.type === 'profile') {
        const data = fav.data || {};
        const pr = data.profile || {};
        card.innerHTML = `
          <div class="favorite-card-header">
            <span class="favorite-word" style="font-family:var(--font-serif);font-size:1.1rem;">👤 ${fav.title || fav.word}</span>
            <button data-idx="${idx}" class="fav-remove-btn" title="Eliminar">✕</button>
          </div>
          <div class="favorite-meta">Perfil · ${escapeHtml([pr.givenName, pr.surname].filter(Boolean).join(' '))} ${pr.birthDate ? '· ' + escapeHtml(pr.birthDate) : ''}</div>
          <div class="favorite-sig sig-mid">
            ${(data.events || []).slice(0, 2).join(' · ') || 'Sin eventos'} ${(data.primaryHebrew ? '· ' + data.primaryHebrew : '')}
          </div>
          <div class="favorite-date">${new Date(fav.savedAt || fav.timestamp).toLocaleDateString()}</div>
          <button data-idx="${idx}" class="fav-reload-btn" data-fav-type="profile">🔍 Abrir perfil</button>
        `;
      } else {
        const honesty = Engine.AssessELSHonesty
          ? Engine.AssessELSHonesty(fav, { text: window.TORAH_TEXT || '', minSkip: 2, maxSkip: 120, runControl: false })
          : null;
        const bandClass = honesty
          ? (honesty.band === 'rare' ? 'sig-high' : honesty.band === 'plausible' ? 'sig-mid' : 'sig-low')
          : 'sig-low';
        card.innerHTML = `
          <div class="favorite-card-header">
            <span class="favorite-word">${fav.word}</span>
            <button data-idx="${idx}" class="fav-remove-btn" title="Eliminar">✕</button>
          </div>
          <div class="favorite-meta">
            Salto: <strong>${fav.skip}</strong> | Posición: #${fav.start} | ${fav.verse || ''}
          </div>
          <div class="favorite-sig ${bandClass}">
            ${honesty ? honesty.label : 'Exploratorio'} · p(salto) ≈ ${(fav.pValue || 1).toExponential(2)}
          </div>
          <div class="favorite-date">${new Date(fav.savedAt || fav.timestamp).toLocaleDateString()}</div>
          <button data-idx="${idx}" class="fav-reload-btn" data-fav-type="els">🔍 Volver a buscar</button>
        `;
      }
      container.appendChild(card);
    });

    container.querySelectorAll('.fav-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Storage.RemoveFavorite) Storage.RemoveFavorite(parseInt(btn.dataset.idx, 10));
        renderFavoritesTab();
      });
    });

    container.querySelectorAll('.fav-reload-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fav = (Storage.GetFavorites ? Storage.GetFavorites() : [])[parseInt(btn.dataset.idx, 10)];
        if (!fav) return;
        if (fav.type === 'profile' || btn.getAttribute('data-fav-type') === 'profile') {
          const pr = (fav.data && fav.data.profile) || {};
          switchTab('explore');
          setExploreMode('profile');
          fillProfileForm(pr);
          runProfileBuild(pr);
          return;
        }
        if (fav.type === 'explore' || btn.getAttribute('data-fav-type') === 'explore') {
          switchTab('explore');
          setExploreMode('query');
          runExploreSearch(fav.title || fav.word);
          return;
        }
        switchTab('biblecode');
        txtSearchELS.value = fav.word;
        handleELSSearch();
      });
    });
  }

  const btnSaveELSFavorite = document.getElementById('btnSaveELSFavorite');
  if (btnSaveELSFavorite) {
    btnSaveELSFavorite.addEventListener('click', () => {
      const match = bibleCodeState.activeMatch;
      if (!match || !Storage.SaveFavorite) return;
      const before = Storage.GetFavorites ? Storage.GetFavorites().length : 0;
      Storage.SaveFavorite({
        word: match.word,
        skip: match.skip,
        start: match.start,
        indices: match.indices,
        pValue: match.pValue,
        significanceScore: match.significanceScore,
        verse: getVerseContext(match.start, match.indices),
        savedAt: new Date().toISOString()
      });
      const after = Storage.GetFavorites ? Storage.GetFavorites().length : 0;
      btnSaveELSFavorite.textContent = after === before ? '✅ Ya guardado' : '✅ Guardado';
      setTimeout(() => { btnSaveELSFavorite.textContent = '⭐ Guardar'; }, 2000);
    });
  }

  const btnClearAllFavorites = document.getElementById('btnClearAllFavorites');
  if (btnClearAllFavorites) {
    btnClearAllFavorites.addEventListener('click', () => {
      if (confirm('¿Eliminar todos los favoritos guardados?')) {
        if (Storage.ClearFavorites) Storage.ClearFavorites();
        renderFavoritesTab();
      }
    });
  }

  // --- MÓDULO: ACRÓSTICOS (ROSHEI / SOFEI TEIVOT) ---
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

  if (btnFindAcrostics) {
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

    // Enter también dispara la búsqueda
    if (txtAcrosticsInput) {
      txtAcrosticsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) btnFindAcrostics.click();
      });
    }
  }

  // --- MÓDULO: EXPLORAR CORRELACIONES (apellido / fecha / evento) ---
  const Explore = window.GematriaExplore;
  const txtExploreQuery = document.getElementById('txtExploreQuery');
  const btnExploreSearch = document.getElementById('btnExploreSearch');
  const exploreResults = document.getElementById('exploreResults');
  const exploreStatus = document.getElementById('exploreStatus');
  const exploreHistoryEl = document.getElementById('exploreHistory');
  let lastExploreData = null;

  function rememberStudyQuery(data) {
    if (!data || data.error) {
      appState.studyQuery = '';
      return;
    }
    appState.studyQuery = String(data.query || '').trim();
  }

  function openTimelineFromExplore(yearAttr, title) {
    const year = parseInt(yearAttr, 10);
    const spec = {
      year: Number.isFinite(year) ? year : null,
      title: title || ''
    };
    const picker = Explore && Explore.PickHistoricalEvent;
    const picked = picker ? picker(DB.HISTORICAL_EVENTS, spec) : null;
    timelineState.focusEvent = picked;
    switchTab('zionism');
    if (picked) showTimelineEventDetails(picked);
  }

  function openTorahFromExplore(value) {
    if (value == null || value === '') return;
    switchTab('torah');
    if (txtSearchTorah) {
      txtSearchTorah.value = String(value);
      executeTorahSearch();
    }
  }

  function openCompareFromExplore(textA, textB) {
    if (!textA || !textB) return;
    switchTab('comparison');
    if (txtCompareA) txtCompareA.value = textA;
    if (txtCompareB) txtCompareB.value = textB;
    handleComparison();
  }

  const SOFIT_TO_REGULAR = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  function regularHebrewLetters(hebrew) {
    return String(hebrew || '')
      .replace(/[^א-ת]/g, '')
      .split('')
      .map(ch => SOFIT_TO_REGULAR[ch] || ch);
  }

  function highlightStudyLetters(hebrew) {
    if (!lettersGrid) return;
    const wanted = new Set(regularHebrewLetters(hebrew));
    lettersGrid.querySelectorAll('.letter-card').forEach(card => {
      const ch = card.getAttribute('data-letter') || '';
      card.classList.toggle('study-focus', wanted.has(ch));
    });
    const first = lettersGrid.querySelector('.letter-card.study-focus');
    if (first && typeof first.scrollIntoView === 'function') {
      first.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function openLettersFromExplore(hebrew) {
    if (!hebrew) return;
    switchTab('letters');
    highlightStudyLetters(hebrew);
  }

  function openAcrosticsFromExplore(targetHebrew, sourceText) {
    switchTab('acrostics');
    if (txtAcrosticsTarget) txtAcrosticsTarget.value = targetHebrew || '';
    if (txtAcrosticsInput && sourceText) txtAcrosticsInput.value = sourceText;
  }

  function openReflectionFromExplore(query) {
    const picker = Explore && Explore.PickDailyReflection;
    const picked = picker ? picker(DB.DAILY_REFLECTIONS, query || appState.studyQuery) : null;
    if (picked && typeof picked.index === 'number') {
      appState.activeReflectionIndex = picked.index;
    }
    switchTab('reflection');
    renderReflectionTab();
  }

  function fillProfileForm(pr) {
    pr = pr || {};
    const givenEl = document.getElementById('txtProfileGiven');
    const surnameEl = document.getElementById('txtProfileSurname');
    const dateEl = document.getElementById('txtProfileDate');
    const extraEl = document.getElementById('txtProfileExtra');
    if (givenEl) givenEl.value = pr.givenName || '';
    if (surnameEl) surnameEl.value = pr.surname || '';
    if (dateEl) dateEl.value = pr.birthDate || '';
    if (extraEl) extraEl.value = pr.extra || '';
  }

  function runProfileBuild(pr, opts) {
    pr = pr || {};
    opts = opts || {};
    const givenName = String(pr.givenName || '').trim();
    const surname = String(pr.surname || '').trim();
    const birthDate = String(pr.birthDate || '').trim();
    const extra = String(pr.extra || '').trim();

    if (!Explore || typeof Explore.BuildPersonalProfile !== 'function') {
      if (exploreStatus) exploreStatus.textContent = 'Motor de exploración no disponible.';
      return;
    }
    if (!givenName && !surname) {
      lastExploreData = null;
      setExploreMode('profile');
      renderExploreResults({
        query: '',
        queryType: 'profile',
        error: 'Indica al menos un nombre o un apellido.',
        knowledge: [],
        events: [],
        zionist: [],
        verses: []
      });
      return;
    }

    const data = Explore.BuildPersonalProfile({
      givenName,
      surname,
      birthDate,
      extra
    }, DB, Engine);
    lastExploreData = data;
    if (Storage.SaveExploreHistory) Storage.SaveExploreHistory(data.query);
    if (Storage.SavePersonalProfileForm && !(opts && opts.example)) {
      Storage.SavePersonalProfileForm({ givenName, surname, birthDate, extra });
    }
    setExploreMode('profile');
    renderExploreHistory();
    setExampleBanner(!!(opts && opts.example));
    renderExploreResults(data);
    if (exploreResults) exploreResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderExploreHistory() {
    if (!exploreHistoryEl || !Storage.GetExploreHistory) return;
    const history = Storage.GetExploreHistory();
    if (!history.length) {
      exploreHistoryEl.style.display = 'none';
      exploreHistoryEl.innerHTML = '';
      return;
    }
    exploreHistoryEl.style.display = 'flex';
    exploreHistoryEl.innerHTML = '<span class="explore-history-label">Recientes:</span>' +
      history.map(q => `<button type="button" class="explore-chip explore-history-chip" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('') +
      '<button type="button" class="explore-chip explore-history-clear" id="btnClearExploreHistory" title="Limpiar historial">✕</button>';
    exploreHistoryEl.querySelectorAll('.explore-history-chip').forEach(chip => {
      chip.addEventListener('click', () => runExploreSearch(chip.getAttribute('data-q')));
    });
    const clearBtn = document.getElementById('btnClearExploreHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (Storage.ClearExploreHistory) Storage.ClearExploreHistory();
        renderExploreHistory();
      });
    }
  }

  function runExploreSearch(rawQuery) {
    if (!Explore || typeof Explore.ExploreCorrelations !== 'function') {
      if (exploreStatus) exploreStatus.textContent = 'Motor de exploración no disponible.';
      return;
    }
    const query = (rawQuery != null ? rawQuery : (txtExploreQuery && txtExploreQuery.value) || '').trim();
    if (txtExploreQuery) txtExploreQuery.value = query;
    setExploreMode('query');
    if (!query) {
      if (exploreStatus) exploreStatus.textContent = 'Escribe un apellido, fecha, evento o número. También: «Herzl + 1897».';
      if (exploreResults) exploreResults.innerHTML = '';
      lastExploreData = null;
      return;
    }

    if (Storage.SaveExploreHistory) Storage.SaveExploreHistory(query);
    renderExploreHistory();
    hideExploreSuggest();

    const data = Explore.ExploreCorrelations(query, DB, Engine);
    lastExploreData = data;
    setExampleBanner(false);
    renderExploreResults(data);
  }

  function renderExploreResults(data) {
    if (!exploreResults) return;
    const meta = data.meta || {};
    const typeLabels = {
      surname: 'Apellido',
      name: 'Nombre',
      date: 'Fecha',
      event: 'Evento',
      number: 'Número',
      concept: 'Concepto',
      hebrew: 'Hebreo',
      text: 'Texto',
      compound: 'Compuesta',
      profile: 'Perfil personal'
    };

    if (data.error) {
      rememberStudyQuery(null);
      if (exploreStatus) exploreStatus.textContent = data.error;
      exploreResults.innerHTML = `<div class="explore-empty">${escapeHtml(data.error)}</div>`;
      return;
    }

    rememberStudyQuery(data);

    const knowledge = data.knowledge || [];
    const events = data.events || [];
    const zionist = data.zionist || [];
    const verses = data.verses || [];
    const total = knowledge.length + events.length + zionist.length + verses.length;

    if (exploreStatus) {
      const he = meta.primaryHebrew
        ? ` · Hebreo: <span style="font-family:var(--font-hebrew)">${escapeHtml(meta.primaryHebrew)}</span>`
        : '';
      const g = meta.primaryGematria && meta.primaryGematria.absolute
        ? ` · Gematria: <strong>${meta.primaryGematria.absolute}</strong>`
        : (meta.numbers && meta.numbers.length ? ` · Números: ${meta.numbers.slice(0, 5).join(', ')}` : '');
      const dictNote = meta.nameEntry
        ? ` · Diccionario: <strong>${meta.nameEntry.source === 'user' ? 'personal' : 'base'}</strong>${meta.nameEntry.note ? ' — ' + escapeHtml(meta.nameEntry.note) : ''}`
        : '';
      const source = meta.hebrewSource;
      const sourcePill = source === 'dictionary' || source === 'dictionary-user'
        ? ' <span class="hebrew-source-pill dictionary">Hebreo de diccionario</span>'
        : source === 'phonetic'
          ? ' <span class="hebrew-source-pill phonetic">Fonética aproximada</span>'
          : source === 'hebrew'
            ? ' <span class="hebrew-source-pill hebrew">Hebreo escrito</span>'
            : '';
      exploreStatus.innerHTML = `Tipo: <strong>${typeLabels[data.queryType] || data.queryType}</strong>${he}${g}${dictNote}${sourcePill} · ${total} correlación(es)`;
    }

    if (total === 0 && !(data.suggestedELS && data.suggestedELS.length) && !data.profile) {
      exploreResults.innerHTML = '<div class="explore-empty">Sin correlaciones directas. Prueba otro apellido, una fecha (ej. 1948), un evento (ej. Oslo) o una búsqueda compuesta (Herzl + 1897).</div>';
      return;
    }

    let html = '';

    if (data.profile) {
      const p = data.profile;
      const g = p.fullGematria || p.givenGematria || p.surnameGematria;
      html += `<div class="profile-identity">
        <div>
          <div class="profile-name">${escapeHtml(p.displayName)}</div>
          ${p.birthDate ? `<div class="meta">Nacimiento: ${escapeHtml(p.birthDate)}${p.dateInfo && p.dateInfo.hebrewFormatted ? ' · ' + escapeHtml(p.dateInfo.hebrewFormatted) : (p.dateInfo && p.dateInfo.hebrewYearApprox ? ' · HE ' + p.dateInfo.hebrewYearApprox : '')}</div>` : ''}
          ${p.extra ? `<div class="meta">Extra: ${escapeHtml(p.extra)}</div>` : ''}
        </div>
        ${p.fullHebrew ? `<div class="he">${escapeHtml(p.givenHebrew || '')} ${escapeHtml(p.surnameHebrew || '')}</div>` : ''}
        <div class="profile-gem-pills">
          ${p.givenHebrew ? `<span class="profile-gem-pill">Nombre <span class="he" style="font-size:1rem;">${escapeHtml(p.givenHebrew)}</span> <strong>${p.givenGematria ? p.givenGematria.absolute : ''}</strong></span>` : ''}
          ${p.surnameHebrew ? `<span class="profile-gem-pill">Apellido <span class="he" style="font-size:1rem;">${escapeHtml(p.surnameHebrew)}</span> <strong>${p.surnameGematria ? p.surnameGematria.absolute : ''}</strong></span>` : ''}
          ${g ? `<span class="profile-gem-pill">Completo Abs <strong>${g.absolute}</strong> · Ord <strong>${g.ordinal}</strong> · Red <strong>${g.reduced}</strong></span>` : ''}
        </div>
      </div>`;
      if (total === 0 && !(data.suggestedELS && data.suggestedELS.length)) {
        html += '<div class="explore-empty">Identidad calculada, pero sin correlaciones directas en el grafo o la línea de tiempo. Prueba un término extra (Israel, Oslo, Sión…).</div>';
      }
    }

    html += `<div class="explore-actions explore-toolbar">
      <button type="button" class="explore-action-btn" id="btnExportExploreReport">📄 Exportar informe</button>
      <button type="button" class="explore-action-btn" id="btnSaveExploreFavorite">⭐ Guardar correlación</button>
      ${meta.hebrewSource === 'phonetic' && meta.primaryHebrew ? '<button type="button" class="explore-action-btn" id="btnPinToDictionary">📌 Fijar hebreo en el diccionario</button>' : ''}
      ${meta.primaryHebrew ? `<button type="button" class="explore-action-btn" data-explore-calc="${escapeHtml(meta.primaryHebrew)}">Abrir en calculadora</button>` : ''}
      ${data.profile && data.profile.givenHebrew && data.profile.surnameHebrew
        ? `<button type="button" class="explore-action-btn" data-explore-compare-a="${escapeHtml(data.profile.givenHebrew)}" data-explore-compare-b="${escapeHtml(data.profile.surnameHebrew)}">Comparar nombre y apellido</button>`
        : ''}
      ${meta.primaryGematria && meta.primaryGematria.absolute
        ? `<button type="button" class="explore-action-btn" data-explore-torah="${meta.primaryGematria.absolute}">Versículos con este valor</button>`
        : ''}
      ${data.suggestedELS && data.suggestedELS.length ? `<button type="button" class="explore-action-btn" data-els-terms="${escapeHtml(data.suggestedELS.join(','))}">Ver matriz ELS</button>` : ''}
      ${meta.primaryHebrew ? `<button type="button" class="explore-action-btn" data-explore-letters="${escapeHtml(meta.primaryHebrew)}">Espejo de letras</button>` : ''}
      ${meta.primaryHebrew ? `<button type="button" class="explore-action-btn" data-explore-acrostics="${escapeHtml(meta.primaryHebrew)}" data-acrostic-text="${escapeHtml((verses[0] && verses[0].verse && verses[0].verse.hebrew) || '')}">Acrósticos</button>` : ''}
      <button type="button" class="explore-action-btn" data-explore-reflection="${escapeHtml(data.query || '')}">Reflexión</button>
    </div>`;

    if (meta.nameEntry || meta.dateInfo || meta.primaryGematria || data.queryType === 'compound') {
      html += '<div class="explore-summary-bar">';
      if (data.queryType === 'compound' && meta.parts) {
        html += `<span>Partes: <strong>${escapeHtml(meta.parts.map(p => p.query).join(' + '))}</strong></span>`;
      }
      if (meta.nameEntry) {
        html += `<span>Diccionario: <strong>${escapeHtml(meta.nameEntry.note || meta.nameEntry.id)}</strong></span>`;
      } else if (meta.hebrewSource === 'phonetic') {
        html += '<span>Hebreo por <strong>fonética aproximada</strong> — no está en el diccionario</span>';
      }
      if (meta.dateInfo) {
        html += `<span>Año: <strong>${meta.dateInfo.year}</strong>`;
        if (meta.dateInfo.hebrewFormatted) html += ` · ${escapeHtml(meta.dateInfo.hebrewFormatted)}`;
        else if (meta.dateInfo.hebrewYearApprox) html += ` · hebreo ${meta.dateInfo.hebrewYearApprox}`;
        html += '</span>';
      }
      if (meta.primaryGematria) {
        html += `<span>Abs ${meta.primaryGematria.absolute} · Ord ${meta.primaryGematria.ordinal} · Red ${meta.primaryGematria.reduced}</span>`;
      }
      html += '</div>';
    }

    if (data.events.length) {
      html += '<div><div class="explore-section-title">Línea de tiempo</div><div class="explore-grid">';
      data.events.slice(0, 8).forEach((hit, idx) => {
        const ev = hit.event;
        html += `
          <div class="explore-card">
            <h4>${escapeHtml(ev.title)}</h4>
            <div class="meta">${escapeHtml(ev.label)} · ${escapeHtml(ev.hebrewYear || '')}</div>
            <div class="meta">${escapeHtml(ev.desc)}</div>
            <div class="reasons">${escapeHtml((hit.reasons || []).join(' · '))}</div>
            <div class="explore-actions">
              <button type="button" class="explore-action-btn" data-explore-els="${idx}" data-els-terms="${escapeHtml((ev.searchTerms || []).join(','))}">Buscar ELS</button>
              <button type="button" class="explore-action-btn" data-explore-zionism="1" data-year="${ev.year}" data-title="${escapeHtml(ev.title)}">Ver timeline</button>
            </div>
          </div>`;
      });
      html += '</div></div>';
    }

    if (data.knowledge.length) {
      html += '<div><div class="explore-section-title">Grafo de conocimiento</div><div class="explore-grid">';
      data.knowledge.slice(0, 12).forEach(corr => {
        const e = corr.entry;
        const matchDesc = (corr.matches || []).map(m => m.desc).join(' · ');
        html += `
          <div class="explore-card">
            <div class="he">${escapeHtml(e.hebrew)}</div>
            <h4>${escapeHtml(e.spanish)}</h4>
            <div class="meta">${'⭐'.repeat(corr.stars || 1)} · ${escapeHtml(e.category || '')}</div>
            <div class="meta">${escapeHtml((e.mysticalNote || '').slice(0, 160))}${(e.mysticalNote || '').length > 160 ? '…' : ''}</div>
            <div class="reasons">${escapeHtml(matchDesc)}</div>
            <div class="explore-actions">
              <button type="button" class="explore-action-btn" data-explore-calc="${escapeHtml(e.hebrew)}">Abrir en calculadora</button>
            </div>
          </div>`;
      });
      html += '</div></div>';
    }

    if (data.zionist.length) {
      html += '<div><div class="explore-section-title">Correlaciones sionistas</div><div class="explore-grid">';
      data.zionist.slice(0, 6).forEach(hit => {
        const c = hit.card;
        html += `
          <div class="explore-card">
            <div class="he">${escapeHtml(c.hebrew)}</div>
            <h4>${escapeHtml(c.concept)}</h4>
            <div class="meta">Gematria ${c.gematria}</div>
            <div class="meta">${escapeHtml((c.mysticalConnection || '').slice(0, 160))}…</div>
            <div class="reasons">${escapeHtml((hit.reasons || []).join(' · '))}</div>
            <div class="explore-actions">
              <button type="button" class="explore-action-btn" data-explore-calc="${escapeHtml(c.hebrew)}">Abrir en calculadora</button>
            </div>
          </div>`;
      });
      html += '</div></div>';
    }

    if (data.verses.length) {
      html += '<div><div class="explore-section-title">Versículos por valor</div><div class="explore-grid">';
      data.verses.forEach(hit => {
        const v = hit.verse;
        html += `
          <div class="explore-card">
            <h4>${escapeHtml(v.reference)}</h4>
            <div class="he">${escapeHtml(v.hebrew)}</div>
            <div class="meta">${escapeHtml(v.translation)}</div>
            <div class="reasons">Gematria ${v.gematria}</div>
            <div class="explore-actions">
              <button type="button" class="explore-action-btn" data-explore-torah="${v.gematria}">Buscar en la Torá</button>
            </div>
          </div>`;
      });
      html += '</div></div>';
    }

    if (data.suggestedELS && data.suggestedELS.length) {
      html += `
        <div>
          <div class="explore-section-title">Código de la Biblia (ELS)</div>
          <p class="meta" style="margin-bottom:0.6rem;color:var(--text-secondary);font-size:0.85rem;">
            Lanza una búsqueda ELS con los términos sugeridos a partir de tu consulta.
          </p>
          <div class="explore-actions">
            <button type="button" class="explore-action-btn" id="btnExploreRunELS" data-els-terms="${escapeHtml(data.suggestedELS.join(','))}">
              Buscar ELS: ${escapeHtml(data.suggestedELS.join(', '))}
            </button>
          </div>
        </div>`;
    }

    exploreResults.innerHTML = html;

    const btnExport = document.getElementById('btnExportExploreReport');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const report = Explore.FormatCorrelationReport
          ? Explore.FormatCorrelationReport(data)
          : '';
        if (!report) return;
        const safe = String(data.query || 'consulta').replace(/[^\wא-ת\-]+/g, '_').slice(0, 40);
        if (typeof window.ExportCorrelationReport === 'function') {
          window.ExportCorrelationReport(report, `correlacion_${safe}.txt`);
        } else {
          const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `correlacion_${safe}.txt`;
          a.click();
        }
        btnExport.textContent = '✅ Informe descargado';
        setTimeout(() => { btnExport.textContent = '📄 Exportar informe'; }, 2000);
      });
    }

    const btnSaveExplore = document.getElementById('btnSaveExploreFavorite');
    if (btnSaveExplore && Storage.SaveFavorite) {
      btnSaveExplore.addEventListener('click', () => {
        const summary = {
          events: (data.events || []).slice(0, 5).map(h => h.event.title),
          knowledge: (data.knowledge || []).slice(0, 5).map(c => c.entry.spanish),
          suggestedELS: data.suggestedELS || [],
          queryType: data.queryType,
          primaryHebrew: meta.primaryHebrew || '',
          absolute: meta.primaryGematria ? meta.primaryGematria.absolute : null
        };
        const before = Storage.GetFavorites().length;
        Storage.SaveFavorite({
          id: data.queryType === 'profile'
            ? `profile|${(data.profile && data.profile.displayName) || data.query}|${(data.profile && data.profile.birthDate) || ''}`
            : `explore|${data.query}`,
          type: data.queryType === 'profile' ? 'profile' : 'explore',
          title: data.query,
          word: data.query,
          skip: '—',
          start: '—',
          verse: meta.primaryHebrew || data.queryType,
          significanceScore: data.events.length + data.knowledge.length,
          pValue: null,
          data: data.queryType === 'profile' ? {
            profile: {
              givenName: data.profile.givenName,
              surname: data.profile.surname,
              birthDate: data.profile.birthDate,
              extra: data.profile.extra
            },
            events: (data.events || []).slice(0, 5).map(h => h.event.title),
            knowledge: (data.knowledge || []).slice(0, 5).map(c => c.entry.spanish),
            suggestedELS: data.suggestedELS || [],
            queryType: 'profile',
            primaryHebrew: meta.primaryHebrew || '',
            absolute: meta.primaryGematria ? meta.primaryGematria.absolute : null
          } : summary,
          savedAt: new Date().toISOString()
        });
        const after = Storage.GetFavorites().length;
        btnSaveExplore.textContent = after === before ? '✅ Ya guardado' : '✅ Guardado';
        setTimeout(() => { btnSaveExplore.textContent = '⭐ Guardar correlación'; }, 2000);
      });
    }

    exploreResults.querySelectorAll('[data-els-terms]').forEach(btn => {
      btn.addEventListener('click', () => {
        const terms = btn.getAttribute('data-els-terms') || '';
        if (!terms) return;
        switchTab('biblecode');
        if (txtSearchELS) {
          txtSearchELS.value = terms;
          handleELSSearch();
        }
      });
    });

    exploreResults.querySelectorAll('[data-explore-zionism]').forEach(btn => {
      btn.addEventListener('click', () => {
        openTimelineFromExplore(btn.getAttribute('data-year'), btn.getAttribute('data-title') || '');
      });
    });

    exploreResults.querySelectorAll('[data-explore-torah]').forEach(btn => {
      btn.addEventListener('click', () => {
        openTorahFromExplore(btn.getAttribute('data-explore-torah'));
      });
    });

    exploreResults.querySelectorAll('[data-explore-compare-a]').forEach(btn => {
      btn.addEventListener('click', () => {
        openCompareFromExplore(
          btn.getAttribute('data-explore-compare-a') || '',
          btn.getAttribute('data-explore-compare-b') || ''
        );
      });
    });

    exploreResults.querySelectorAll('[data-explore-calc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const he = btn.getAttribute('data-explore-calc') || '';
        switchTab('calculator');
        setLanguage('hebrew');
        if (txtInput) {
          txtInput.value = he;
          processInputText(he);
        }
      });
    });

    exploreResults.querySelectorAll('[data-explore-letters]').forEach(btn => {
      btn.addEventListener('click', () => {
        openLettersFromExplore(btn.getAttribute('data-explore-letters') || '');
      });
    });

    exploreResults.querySelectorAll('[data-explore-acrostics]').forEach(btn => {
      btn.addEventListener('click', () => {
        openAcrosticsFromExplore(
          btn.getAttribute('data-explore-acrostics') || '',
          btn.getAttribute('data-acrostic-text') || ''
        );
      });
    });

    exploreResults.querySelectorAll('[data-explore-reflection]').forEach(btn => {
      btn.addEventListener('click', () => {
        openReflectionFromExplore(btn.getAttribute('data-explore-reflection') || data.query || '');
      });
    });

    const btnPin = document.getElementById('btnPinToDictionary');
    if (btnPin) {
      btnPin.addEventListener('click', () => {
        setExploreMode('dictionary');
        const spanishEl = document.getElementById('txtDictSpanish');
        const hebrewEl = document.getElementById('txtDictHebrew');
        if (spanishEl) spanishEl.value = data.query || '';
        if (hebrewEl) hebrewEl.value = meta.primaryHebrew || '';
        if (typeof updateDictPreview === 'function') updateDictPreview();
        const dictForm = document.getElementById('formNameDictionary');
        if (dictForm) dictForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  if (btnExploreSearch) {
    btnExploreSearch.addEventListener('click', () => runExploreSearch());
  }
  document.querySelectorAll('#exploreQuickChips .explore-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      runExploreSearch(chip.getAttribute('data-q') || chip.textContent);
    });
  });
  renderExploreHistory();

  const EXAMPLE_PROFILE = {
    givenName: 'David',
    surname: 'Cohen',
    birthDate: '14/05/1948',
    extra: ''
  };

  function setExampleBanner(visible) {
    const banner = document.getElementById('exploreExampleBanner');
    if (banner) banner.hidden = !visible;
  }

  function setExploreMode(mode) {
    const allowed = { query: 'exploreModeQuery', profile: 'exploreModeProfile', dictionary: 'exploreModeDictionary' };
    const key = allowed[mode] ? mode : 'query';
    Object.keys(allowed).forEach(m => {
      const panel = document.getElementById(allowed[m]);
      if (panel) panel.hidden = m !== key;
    });
    document.querySelectorAll('.explore-mode-btn').forEach(btn => {
      const on = btn.getAttribute('data-explore-mode') === key;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.explore-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setExploreMode(btn.getAttribute('data-explore-mode')));
  });
  document.querySelectorAll('.explore-text-btn[data-explore-mode]').forEach(btn => {
    btn.addEventListener('click', () => setExploreMode(btn.getAttribute('data-explore-mode')));
  });

  const exploreSuggestEl = document.getElementById('exploreSuggest');
  let suggestActiveIndex = -1;

  function hideExploreSuggest() {
    if (!exploreSuggestEl) return;
    exploreSuggestEl.hidden = true;
    exploreSuggestEl.innerHTML = '';
    suggestActiveIndex = -1;
  }

  function renderExploreSuggest(query) {
    if (!exploreSuggestEl || !Explore || typeof Explore.SuggestNameDictionary !== 'function') return;
    const q = String(query || '').trim();
    if (q.length < 1) {
      hideExploreSuggest();
      return;
    }
    const hits = Explore.SuggestNameDictionary(q, Explore.GetActiveNameDictionary(), 8);
    if (!hits.length) {
      hideExploreSuggest();
      return;
    }
    exploreSuggestEl.hidden = false;
    exploreSuggestEl.innerHTML = hits.map((h, i) => {
      const src = h.source === 'user' ? 'personal' : 'diccionario';
      return `<button type="button" class="explore-suggest-item" role="option" data-suggest-q="${escapeHtml(h.alias)}" data-idx="${i}">
        <span>${escapeHtml(h.alias)} <span class="explore-suggest-src">${src}</span></span>
        <span class="he">${escapeHtml(h.hebrew)}</span>
      </button>`;
    }).join('');
    suggestActiveIndex = -1;
  }

  if (txtExploreQuery) {
    txtExploreQuery.addEventListener('input', () => {
      renderExploreSuggest(txtExploreQuery.value);
    });
    txtExploreQuery.addEventListener('keydown', (e) => {
      if (exploreSuggestEl && !exploreSuggestEl.hidden) {
        const items = exploreSuggestEl.querySelectorAll('.explore-suggest-item');
        if (e.key === 'ArrowDown' && items.length) {
          e.preventDefault();
          suggestActiveIndex = Math.min(items.length - 1, suggestActiveIndex + 1);
          items.forEach((el, i) => el.classList.toggle('active', i === suggestActiveIndex));
          return;
        }
        if (e.key === 'ArrowUp' && items.length) {
          e.preventDefault();
          suggestActiveIndex = Math.max(0, suggestActiveIndex - 1);
          items.forEach((el, i) => el.classList.toggle('active', i === suggestActiveIndex));
          return;
        }
        if (e.key === 'Escape') {
          hideExploreSuggest();
          return;
        }
        if (e.key === 'Enter' && suggestActiveIndex >= 0 && items[suggestActiveIndex]) {
          e.preventDefault();
          const q = items[suggestActiveIndex].getAttribute('data-suggest-q') || '';
          hideExploreSuggest();
          runExploreSearch(q);
          return;
        }
      }
      if (e.key === 'Enter') {
        hideExploreSuggest();
        runExploreSearch();
      }
    });
  }
  if (exploreSuggestEl) {
    exploreSuggestEl.addEventListener('mousedown', (ev) => {
      const item = ev.target.closest('[data-suggest-q]');
      if (!item) return;
      ev.preventDefault();
      hideExploreSuggest();
      runExploreSearch(item.getAttribute('data-suggest-q') || '');
    });
  }
  document.addEventListener('click', (ev) => {
    if (!exploreSuggestEl || exploreSuggestEl.hidden) return;
    if (ev.target === txtExploreQuery || exploreSuggestEl.contains(ev.target)) return;
    hideExploreSuggest();
  });

  function maybeShowExampleDossier() {
    const saved = Storage.GetPersonalProfileForm ? Storage.GetPersonalProfileForm() : null;
    const hasSaved = saved && (saved.givenName || saved.surname);
    if (hasSaved) {
      fillProfileForm(saved);
      return;
    }
    const hist = Storage.GetExploreHistory ? Storage.GetExploreHistory() : [];
    if (hist && hist.length) return;
    fillProfileForm(EXAMPLE_PROFILE);
    runProfileBuild(EXAMPLE_PROFILE, { example: true });
  }

  const formPersonalProfile = document.getElementById('formPersonalProfile');
  const btnProfileExample = document.getElementById('btnProfileExample');
  if (formPersonalProfile) {
    formPersonalProfile.addEventListener('submit', (ev) => {
      ev.preventDefault();
      runProfileBuild({
        givenName: (document.getElementById('txtProfileGiven') || {}).value,
        surname: (document.getElementById('txtProfileSurname') || {}).value,
        birthDate: (document.getElementById('txtProfileDate') || {}).value,
        extra: (document.getElementById('txtProfileExtra') || {}).value
      });
    });
  }
  if (btnProfileExample) {
    btnProfileExample.addEventListener('click', () => {
      fillProfileForm(EXAMPLE_PROFILE);
      runProfileBuild(EXAMPLE_PROFILE, { example: true });
    });
  }

  // --- Diccionario vivo (base + entradas personales persistidas) ---
  const dictListEl = document.getElementById('dictList');
  const dictCountEl = document.getElementById('dictCount');
  const dictFilterEl = document.getElementById('txtDictFilter');
  const dictPreviewEl = document.getElementById('dictPreview');
  const dictFormStatusEl = document.getElementById('dictFormStatus');
  const formNameDictionary = document.getElementById('formNameDictionary');
  const txtDictSpanish = document.getElementById('txtDictSpanish');
  const txtDictHebrew = document.getElementById('txtDictHebrew');
  const selDictKind = document.getElementById('selDictKind');
  const txtDictNote = document.getElementById('txtDictNote');
  const txtDictEditId = document.getElementById('txtDictEditId');
  const btnDictCancelEdit = document.getElementById('btnDictCancelEdit');
  const kindLabels = { nombre: 'Nombre', apellido: 'Apellido', concepto: 'Concepto' };

  function setDictFormStatus(message, kind) {
    if (!dictFormStatusEl) return;
    dictFormStatusEl.textContent = message || '';
    dictFormStatusEl.classList.remove('error', 'ok');
    if (kind) dictFormStatusEl.classList.add(kind);
  }

  function resetDictForm() {
    if (formNameDictionary) formNameDictionary.reset();
    if (txtDictEditId) txtDictEditId.value = '';
    if (selDictKind) selDictKind.value = 'nombre';
    if (btnDictCancelEdit) btnDictCancelEdit.hidden = true;
    updateDictPreview();
  }

  function fillDictForm(entry) {
    if (!entry) return;
    if (txtDictSpanish) txtDictSpanish.value = (entry.spanish || []).join(', ');
    if (txtDictHebrew) txtDictHebrew.value = entry.hebrew || '';
    if (selDictKind) selDictKind.value = entry.kind || 'nombre';
    if (txtDictNote) txtDictNote.value = entry.note || '';
    if (txtDictEditId) txtDictEditId.value = entry.id || '';
    if (btnDictCancelEdit) btnDictCancelEdit.hidden = false;
    updateDictPreview();
  }

  function updateDictPreview() {
    if (!dictPreviewEl || !Explore) return;
    const spanish = (txtDictSpanish && txtDictSpanish.value) || '';
    const hebrewInput = (txtDictHebrew && txtDictHebrew.value) || '';
    const built = Explore.BuildUserNameEntry({
      spanish,
      hebrew: hebrewInput,
      kind: (selDictKind && selDictKind.value) || 'nombre'
    }, Engine);
    if (!spanish.trim()) {
      dictPreviewEl.innerHTML = 'Escribe un nombre para ver el hebreo y su gematria.';
      return;
    }
    if (!built.ok) {
      dictPreviewEl.textContent = built.error;
      return;
    }
    const gem = Engine && typeof Engine.CalculateGematria === 'function'
      ? Engine.CalculateGematria(built.entry.hebrew)
      : null;
    const phonetic = !hebrewInput.trim() && Engine && typeof Engine.SpanishToHebrew === 'function';
    dictPreviewEl.innerHTML =
      `Hebreo ${phonetic ? '(fonética)' : '(escrito)'}: <span class="he">${escapeHtml(built.entry.hebrew)}</span>` +
      (gem && gem.lettersCount ? ` · Abs <strong>${gem.absolute}</strong> · Ord ${gem.ordinal} · Red ${gem.reduced}` : '');
  }

  function renderNameDictionary() {
    if (!dictListEl || !Explore) return;
    const merged = Explore.GetActiveNameDictionary();
    const q = (dictFilterEl && dictFilterEl.value) || '';
    const rows = Explore.SearchNameDictionary(q, merged);
    const userCount = merged.filter(e => e.source === 'user').length;
    if (dictCountEl) {
      dictCountEl.textContent = q
        ? `${rows.length} de ${merged.length} (personales: ${userCount})`
        : `${merged.length} entradas · ${userCount} personales`;
    }
    if (!rows.length) {
      dictListEl.innerHTML = '<div class="dict-empty">Ninguna entrada coincide. Añade el nombre arriba para usarlo en Explorar y en el perfil.</div>';
      return;
    }
    dictListEl.innerHTML = rows.map(entry => {
      const isUser = entry.source === 'user';
      const gem = Engine && typeof Engine.CalculateGematria === 'function'
        ? Engine.CalculateGematria(entry.hebrew)
        : null;
      const aliases = (entry.spanish || []).join(', ');
      const exploreQ = (entry.label || (entry.spanish && entry.spanish[0]) || '').replace(/"/g, '');
      return `<div class="dict-row${isUser ? ' user' : ''}" data-dict-id="${escapeHtml(entry.id)}">
        <div class="dict-row-main">
          <div class="dict-row-title">
            <span class="dict-badge ${isUser ? 'user' : 'base'}">${isUser ? 'Personal' : 'Base'}</span>
            ${escapeHtml(entry.label || aliases)}
            <span class="he"> ${escapeHtml(entry.hebrew)}</span>
          </div>
          <div class="dict-row-meta">
            ${escapeHtml(kindLabels[entry.kind] || entry.kind || 'Nombre')}
            · ${escapeHtml(aliases)}
            ${gem && gem.lettersCount ? ` · Abs ${gem.absolute}` : ''}
            ${entry.note ? ` · ${escapeHtml(entry.note)}` : ''}
          </div>
        </div>
        <div class="dict-row-actions">
          <button type="button" class="explore-action-btn" data-dict-explore="${escapeHtml(exploreQ)}">Explorar</button>
          ${isUser ? `<button type="button" class="explore-action-btn" data-dict-edit="${escapeHtml(entry.id)}">Editar</button>
          <button type="button" class="explore-action-btn" data-dict-del="${escapeHtml(entry.id)}">Borrar</button>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  if (formNameDictionary) {
    formNameDictionary.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!Explore || typeof Explore.BuildUserNameEntry !== 'function' || !Storage || !Storage.SaveUserNameEntry) {
        setDictFormStatus('El diccionario no está disponible.', 'error');
        return;
      }
      const built = Explore.BuildUserNameEntry({
        id: (txtDictEditId && txtDictEditId.value) || '',
        spanish: (txtDictSpanish && txtDictSpanish.value) || '',
        hebrew: (txtDictHebrew && txtDictHebrew.value) || '',
        kind: (selDictKind && selDictKind.value) || 'nombre',
        note: (txtDictNote && txtDictNote.value) || ''
      }, Engine);
      if (!built.ok) {
        setDictFormStatus(built.error, 'error');
        return;
      }
      const saved = Storage.SaveUserNameEntry(built.entry);
      if (!saved.ok) {
        setDictFormStatus(saved.error, 'error');
        return;
      }
      const probe = Explore.ExploreCorrelations(saved.entry.spanish[0], DB, Engine);
      const heOk = probe && probe.meta && probe.meta.primaryHebrew === saved.entry.hebrew.replace(/[^א-ת]/g, '');
      setDictFormStatus(
        heOk
          ? `Guardado: ${saved.entry.label} → ${saved.entry.hebrew}. Ya resuelve en Explorar y en el perfil.`
          : `Guardado: ${saved.entry.label} → ${saved.entry.hebrew}.`,
        'ok'
      );
      resetDictForm();
      renderNameDictionary();
    });
  }

  [txtDictSpanish, txtDictHebrew, selDictKind].forEach(el => {
    if (el) el.addEventListener('input', updateDictPreview);
  });
  if (dictFilterEl) {
    dictFilterEl.addEventListener('input', renderNameDictionary);
  }
  if (btnDictCancelEdit) {
    btnDictCancelEdit.addEventListener('click', () => {
      resetDictForm();
      setDictFormStatus('');
    });
  }
  if (dictListEl) {
    dictListEl.addEventListener('click', (ev) => {
      const exploreBtn = ev.target.closest('[data-dict-explore]');
      if (exploreBtn) {
        runExploreSearch(exploreBtn.getAttribute('data-dict-explore') || '');
        return;
      }
      const editBtn = ev.target.closest('[data-dict-edit]');
      if (editBtn) {
        const id = editBtn.getAttribute('data-dict-edit');
        const entry = (Storage.GetUserNameDictionary ? Storage.GetUserNameDictionary() : [])
          .find(e => e.id === id);
        if (entry) {
          fillDictForm(entry);
          setDictFormStatus('Editando entrada personal. Guardar sustituye la anterior.', '');
        }
        return;
      }
      const delBtn = ev.target.closest('[data-dict-del]');
      if (delBtn) {
        const id = delBtn.getAttribute('data-dict-del');
        if (Storage.RemoveUserNameEntry) Storage.RemoveUserNameEntry(id);
        if (txtDictEditId && txtDictEditId.value === id) resetDictForm();
        setDictFormStatus('Entrada personal eliminada. Las búsquedas vuelven a la base o a la fonética.', 'ok');
        renderNameDictionary();
      }
    });
  }
  updateDictPreview();
  renderNameDictionary();

  // --- 11. INICIALIZACIÓN COMPLETA DE LA APP ---
  function init() {
    // FASE 2: Pre-calcular la gematria para todas las entradas de Grafo de Conocimiento
    DB.KNOWLEDGE_GRAPH.forEach(entry => {
      entry.gematria = Engine.CalculateGematria(entry.hebrew);
    });

    renderVirtualKeyboard();
    renderLettersGrid();
    renderZionismGrid();
    renderReflectionTab();
    renderELSSearchHistory();
    if (typeof maybeShowExampleDossier === 'function') maybeShowExampleDossier();
    
    processInputText('');
    
    // Iniciar las animaciones y layouts
    resizeCanvas();
    resizeTimelineCanvas();
    resizeComparisonCanvas();

    requestAnimationFrame(drawCanvas);
    requestAnimationFrame(drawTimeline);
    requestAnimationFrame(drawComparisonCanvas);
  }

  init();
});
