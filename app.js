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
    currentTab: 'calculator',
    inputLanguage: 'hebrew', // 'hebrew' o 'spanish'
    rawInputText: '',
    hebrewProcessedText: '',
    gematriaResult: null,
    activeReflectionIndex: 0,
    bestAutoELS: null
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
    mouse: { x: null, y: null }
  };

  // --- Estado del código de la Biblia ---
  let bibleCodeState = {
    activeMatch: null,
    matrixWidth: 50,
    primaryWord: '',
    secondaryMatches: []
  };

  // --- 1. ENRUTADOR INTERNO DE PESTAÑAS ---
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Actualizar botones de navegación
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Actualizar vistas
      tabContents.forEach(tab => tab.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      
      appState.currentTab = tabId;

      // Resize y render según corresponda
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
      }
    });
  });

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
          <span style="font-size: 0.75rem; color: var(--purple-accent); font-weight: bold;">Torah (Génesis)</span>
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

    const verseCtx = getVerseContext(match.start);

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

    const text = window.TorahText || "";
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

  // Navegar a otra pestaña
  function switchTab(tabId) {
    const button = Array.from(navButtons).find(btn => btn.getAttribute('data-tab') === tabId);
    if (button) {
      button.click();
    }
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

    const logs = [
      { text: '> INICIANDO DECODIFICADOR AUTOMÁTICO EN LA TORÁ...', delay: 0 },
      { text: `> Cargando Génesis 1-5: 6,877 consonantes puras cargadas en memoria.`, delay: 200 },
      { text: `> Escaneando secuencias equidistantes para: "${match.word}"...`, delay: 400 },
      { text: `> ¡Palabra hallada! Salto constante = ${match.skip} letras (Letra de inicio: #${match.start}).`, delay: 650, class: 'info' },
      { text: `> Buscando cruces en el cuadrante con el Grafo de 50 conceptos...`, delay: 850 },
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
        openLetterDetails(selectedNode.label);
      } else if (selectedNode.type === 'concept') {
        if (selectedNode.category === 'sefirah') {
          const reflectionTabBtn = document.querySelector('[data-tab="reflection"]');
          if (reflectionTabBtn) reflectionTabBtn.click();
        } else {
          const zionTabBtn = document.querySelector('[data-tab="zionism"]');
          if (zionTabBtn) zionTabBtn.click();
        }
      } else if (selectedNode.type === 'verse') {
        const torahTabBtn = document.querySelector('[data-tab="torah"]');
        if (torahTabBtn) {
          torahTabBtn.click();
          txtSearchTorah.value = selectedNode.value;
          executeTorahSearch();
        }
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
      } else if (isHovered) {
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
      timelineCtx.fillStyle = isMatch ? '#ffd700' : (isHovered ? '#ffd700' : '#a4b0be');
      timelineCtx.font = isMatch || isHovered ? 'bold 12px var(--font-serif)' : '10px var(--font-serif)';
      timelineCtx.textAlign = 'center';
      timelineCtx.fillText(event.label, x, y - 20);

      // Título abreviado abajo
      timelineCtx.fillStyle = isMatch ? '#ffffff' : '#888899';
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



  // Mapear índice global a versículo aproximado de Génesis 1-5
  function getVerseContext(globalIdx) {
    const boundaries = [
      { ch: 1, limit: 1677, verses: 31, rate: 1677 / 31, offset: 0 },
      { ch: 2, limit: 2912, verses: 25, rate: 1235 / 25, offset: 1677 },
      { ch: 3, limit: 4223, verses: 24, rate: 1311 / 24, offset: 2912 },
      { ch: 4, limit: 5452, verses: 26, rate: 1229 / 26, offset: 4223 },
      { ch: 5, limit: 6877, verses: 32, rate: 1425 / 32, offset: 5452 }
    ];
    
    for (let b of boundaries) {
      if (globalIdx < b.limit) {
        const relativeIdx = globalIdx - b.offset;
        const verseNum = Math.min(b.verses, Math.floor(relativeIdx / b.rate) + 1);
        return `Génesis ${b.ch}:${verseNum}`;
      }
    }
    return "Génesis 5:32";
  }

  // --- FASE 5: HISTORIAL Y SUGERENCIAS RÁPIDAS DE BÚSQUEDA ELS ---
  function getELSSearchHistory() {
    try {
      return JSON.parse(localStorage.getItem('els_search_history') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveELSSearchHistory(query) {
    if (!query || query.trim().length === 0) return;
    let history = getELSSearchHistory();
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    if (history.length > 8) history = history.slice(0, 8);
    try {
      localStorage.setItem('els_search_history', JSON.stringify(history));
    } catch (e) {}
    renderELSSearchHistory();
  }

  function renderELSSearchHistory() {
    const section = document.getElementById('elsHistorySection');
    const container = document.getElementById('elsHistoryChips');
    if (!section || !container) return;

    const history = getELSSearchHistory();
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
      localStorage.removeItem('els_search_history');
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
        if (elsWorkerInstance) elsWorkerInstance.postMessage({ action: 'cancel', requestId: activeELSRequestId });
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
    const text = window.TorahText || "";

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
      
      const verseContext = getVerseContext(match.start);
      const termBadgeClass = `term-badge-${match.termIndex % 4}`;

      item.innerHTML = `
        <div class="els-result-header-row">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="els-result-word">${match.word}</span>
            ${termsArray && termsArray.length > 1 ? `<span class="term-badge ${termBadgeClass}">${match.rawQuery}</span>` : ''}
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
      const text = window.TorahText || "";
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
    const text = window.TorahText || "";
    
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

    const verseCtx = getVerseContext(match.start);
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
      aparece codificada en la Torá con un salto de <strong>${match.skip} letras</strong> ${skipDirection}, iniciando en la letra <strong>#${match.start}</strong> (correspondiente a <strong>${verseCtx}</strong>). 
      ${crossoverNarrative}
    `;
  }

  function renderBibleCodeMatrix() {
    const match = bibleCodeState.activeMatch;
    if (!match) return;

    const text = window.TorahText || "";
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
      const table = matrixContainer.querySelector('.bible-code-matrix');
      if (!table) return;

      const match = bibleCodeState.activeMatch;
      const wordLabel = match ? match.word : 'matriz';

      // Crear canvas temporal con estilo
      const W = table.offsetWidth + 40;
      const H = table.offsetHeight + 80;
      const canvas = document.createElement('canvas');
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext('2d');

      // Fondo oscuro
      ctx.scale(2, 2);
      ctx.fillStyle = '#05040a';
      ctx.fillRect(0, 0, W, H);

      // Título
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 13px serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Código de la Biblia ELS — "${wordLabel}" | Salto: ${match ? match.skip : '?'} | Torah Gematria Decipher`, W / 2, 20);

      // Usar html2canvas-like approach: renderizar via SVG foreignObject
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${W - 40}" height="${H - 40}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: monospace; font-size: 11px; color: #ccc; background: #05040a; padding: 4px;">
              ${table.outerHTML}
            </div>
          </foreignObject>
        </svg>`;

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 20, 30);

        // Pie de página
        ctx.fillStyle = 'rgba(212,175,55,0.6)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Generado por GematriaDecipher — Torah Gematria Deciphering Tool', W / 2, H - 8);

        URL.revokeObjectURL(url);

        // Descargar
        const link = document.createElement('a');
        link.download = `ELS_${wordLabel.replace(/[^א-ת\w]/g, '_')}_skip${match ? match.skip : ''}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback: solo descargar el canvas con fondo
        const link = document.createElement('a');
        link.download = `ELS_matrix.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };

      img.src = url;
    });
  }

  // --- MÓDULO: FAVORITOS ELS (localStorage) ---
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem('els_favorites') || '[]'); } catch(e) { return []; }
  }

  function saveFavorites(favs) {
    try { localStorage.setItem('els_favorites', JSON.stringify(favs)); } catch(e) {}
  }

  function renderFavoritesTab() {
    const container = document.getElementById('favoritesContainer');
    if (!container) return;
    const favs = getFavorites();
    if (favs.length === 0) {
      container.innerHTML = '<div style="color: var(--text-secondary); font-style: italic; text-align: center; padding: 3rem 0; grid-column: 1/-1;">No hay favoritos guardados. Busca palabras en el Código de la Biblia y guarda tus hallazgos con ⭐.</div>';
      return;
    }

    container.innerHTML = '';
    favs.forEach((fav, idx) => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.cssText = 'padding: 1rem; border: 1px solid rgba(212,175,55,0.2); position: relative;';
      const sigScore = (fav.significanceScore || 0).toFixed(2);
      const sigClass = fav.significanceScore > 5 ? 'color: #2ecc71;' : fav.significanceScore > 2 ? 'color: var(--gold-primary);' : 'color: var(--text-secondary);';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span style="font-family: var(--font-hebrew); font-size: 1.6rem; color: var(--gold-primary);">${fav.word}</span>
          <button data-idx="${idx}" class="fav-remove-btn" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 0.9rem;" title="Eliminar">✕</button>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
          Salto: <strong style="color: var(--text-primary);">${fav.skip}</strong> | Posición: #${fav.start} | ${fav.verse || ''}
        </div>
        <div style="font-size: 0.78rem; ${sigClass}">
          Significancia: ${sigScore} | p-valor ≈ ${(fav.pValue || 1).toExponential(2)}
        </div>
        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-top: 0.4rem;">${new Date(fav.savedAt).toLocaleDateString()}</div>
        <button data-idx="${idx}" class="fav-reload-btn" style="margin-top: 0.7rem; width: 100%; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.25); color: var(--gold-primary); padding: 0.3rem; border-radius: 10px; cursor: pointer; font-size: 0.78rem; transition: all 0.2s;">🔍 Volver a buscar</button>
      `;
      container.appendChild(card);
    });

    // Eventos eliminar
    container.querySelectorAll('.fav-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const favs2 = getFavorites();
        favs2.splice(parseInt(btn.dataset.idx, 10), 1);
        saveFavorites(favs2);
        renderFavoritesTab();
      });
    });

    // Eventos volver a buscar
    container.querySelectorAll('.fav-reload-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fav = getFavorites()[parseInt(btn.dataset.idx, 10)];
        if (!fav) return;
        switchTab('biblecode');
        txtSearchELS.value = fav.word;
        handleELSSearch();
      });
    });
  }

  function switchTab(tabId) {
    navButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));
    const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    const tab = document.getElementById(tabId);
    if (btn) btn.classList.add('active');
    if (tab) tab.classList.add('active');
    appState.currentTab = tabId;
    if (tabId === 'favorites') renderFavoritesTab();
  }

  const btnSaveELSFavorite = document.getElementById('btnSaveELSFavorite');
  if (btnSaveELSFavorite) {
    btnSaveELSFavorite.addEventListener('click', () => {
      const match = bibleCodeState.activeMatch;
      if (!match) return;
      const favs = getFavorites();
      const already = favs.find(f => f.word === match.word && f.skip === match.skip && f.start === match.start);
      if (already) {
        btnSaveELSFavorite.textContent = '✅ Ya guardado';
        setTimeout(() => { btnSaveELSFavorite.textContent = '⭐ Guardar'; }, 2000);
        return;
      }
      favs.unshift({
        word: match.word,
        skip: match.skip,
        start: match.start,
        indices: match.indices,
        pValue: match.pValue,
        significanceScore: match.significanceScore,
        verse: getVerseContext(match.start),
        savedAt: new Date().toISOString()
      });
      if (favs.length > 50) favs.pop();
      saveFavorites(favs);
      btnSaveELSFavorite.textContent = '✅ Guardado';
      setTimeout(() => { btnSaveELSFavorite.textContent = '⭐ Guardar'; }, 2000);
    });
  }

  const btnClearAllFavorites = document.getElementById('btnClearAllFavorites');
  if (btnClearAllFavorites) {
    btnClearAllFavorites.addEventListener('click', () => {
      if (confirm('¿Eliminar todos los favoritos guardados?')) {
        localStorage.removeItem('els_favorites');
        renderFavoritesTab();
      }
    });
  }

  // Renderizar favoritos cuando se navega a ese tab
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.getAttribute('data-tab') === 'favorites') {
        renderFavoritesTab();
      }
    });
  });

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

  // Añadir p-value y significancia estadística al panel de narrativa ELS
  const _origRenderNarrative = renderNarrativePanel;
  renderNarrativePanel = function(match, crossovers) {
    _origRenderNarrative(match, crossovers);
    const textContainer = document.getElementById('elsNarrativeText');
    if (!textContainer || !match) return;

    const pVal = match.pValue;
    const sigScore = match.significanceScore || 0;
    let sigLabel, sigColor;
    if (sigScore > 8) { sigLabel = '🔥 Altamente Significativo'; sigColor = '#2ecc71'; }
    else if (sigScore > 4) { sigLabel = '⚡ Significativo'; sigColor = 'var(--gold-primary)'; }
    else if (sigScore > 2) { sigLabel = '🔍 Moderado'; sigColor = '#00ced1'; }
    else { sigLabel = '📊 Bajo / Casual'; sigColor = 'var(--text-secondary)'; }

    const statsHtml = (pVal !== undefined && pVal !== null) ? `
      <div style="margin-top: 0.6rem; padding: 0.5rem 0.8rem; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 0.82rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
        <span>📈 <strong>Análisis Estadístico ELS</strong></span>
        <span style="color: ${sigColor}; font-weight: bold;">${sigLabel}</span>
        <span style="color: var(--text-secondary);">Score: <strong style="color: var(--text-primary);">${sigScore.toFixed(2)}</strong></span>
        <span style="color: var(--text-secondary);">p-valor ≈ <strong style="color: var(--text-primary);">${pVal.toExponential(3)}</strong></span>
      </div>` : '';

    textContainer.insertAdjacentHTML('beforeend', statsHtml);
  };

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
