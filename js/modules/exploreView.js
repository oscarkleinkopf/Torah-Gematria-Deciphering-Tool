/**
 * Módulo: exploreView.js — consulta, perfil, diccionario y handoff a acrósticos
 * en frases curadas (Roshei / Sofei Teivot sobre TORAH_VERSES, no TORAH_TEXT).
 */
(function(global) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const EXAMPLE_PROFILE = {
    givenName: 'David',
    surname: 'Cohen',
    birthDate: '14/05/1948',
    extra: ''
  };

  const ExploreView = {
    lastData: null,

    init: function(context) {
      const Explore = global.GematriaExplore;
      const Engine = global.GematriaEngine;
      const DB = global.GematriaDB;
      const Storage = global.GematriaStorage;
      const Modules = global.AppModules || {};
      const self = this;

      const txtExploreQuery = document.getElementById('txtExploreQuery');
      const btnExploreSearch = document.getElementById('btnExploreSearch');
      const exploreResults = document.getElementById('exploreResults');
      const exploreStatus = document.getElementById('exploreStatus');
      const exploreHistoryEl = document.getElementById('exploreHistory');
      const exploreSuggestEl = document.getElementById('exploreSuggest');
      let suggestActiveIndex = -1;

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

      function setExampleBanner(visible) {
        const banner = document.getElementById('exploreExampleBanner');
        if (banner) banner.hidden = !visible;
      }

      function rememberStudyQuery(data) {
        const q = data && !data.error ? String(data.query || '').trim() : '';
        if (context && typeof context.setStudyQuery === 'function') {
          context.setStudyQuery(q);
        }
      }

      function acrosticHitsFor(hebrew) {
        const he = String(hebrew || '').replace(/[^א-ת]/g, '');
        if (!he || he.length < 2 || !Engine || !Engine.FindAcrosticsInPhrases) return [];
        const phrases = Engine.GetAcrosticPhraseCorpus(DB);
        return Engine.FindAcrosticsInPhrases(phrases, he, 'both');
      }

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

      function renderExploreHistory() {
        if (!exploreHistoryEl || !Storage || !Storage.GetExploreHistory) return;
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

      function openTimelineFromExplore(yearAttr, title) {
        if (context && context.switchTab) context.switchTab('zionism');
        const year = parseInt(yearAttr, 10);
        const picker = Explore && Explore.PickHistoricalEvent;
        const picked = picker ? picker(DB.HISTORICAL_EVENTS, {
          year: Number.isFinite(year) ? year : null,
          title: title || ''
        }) : null;
        if (picked && Modules.timelineView && typeof Modules.timelineView.focusEvent === 'function') {
          Modules.timelineView.focusEvent(picked);
        }
      }

      function openTorahFromExplore(value) {
        if (value == null || value === '') return;
        if (context && context.switchTab) context.switchTab('torah');
        const txtSearchTorah = document.getElementById('txtSearchTorah');
        if (txtSearchTorah) txtSearchTorah.value = String(value);
        if (context && typeof context.setTorahSearchMode === 'function') {
          context.setTorahSearchMode(/^\d+$/.test(String(value)) ? 'number' : 'word');
        }
        if (context && typeof context.executeTorahOrReverseSearch === 'function') {
          context.executeTorahOrReverseSearch();
        } else if (Modules.calculatorView && typeof Modules.calculatorView.executeSearch === 'function') {
          Modules.calculatorView.executeSearch(context);
        }
      }

      function openCompareFromExplore(textA, textB) {
        if (!textA || !textB) return;
        if (context && context.switchTab) context.switchTab('comparison');
        const txtCompareA = document.getElementById('txtCompareA');
        const txtCompareB = document.getElementById('txtCompareB');
        if (txtCompareA) txtCompareA.value = textA;
        if (txtCompareB) txtCompareB.value = textB;
        if (Modules.comparatorView && typeof Modules.comparatorView.executeComparison === 'function') {
          Modules.comparatorView.executeComparison(context);
        }
      }

      function openLettersFromExplore(hebrew) {
        if (context && context.switchTab) context.switchTab('letters');
        if (Modules.lettersView && typeof Modules.lettersView.highlightFromStudy === 'function') {
          Modules.lettersView.highlightFromStudy(hebrew);
        }
      }

      function openAcrosticsFromExplore(targetHebrew) {
        const tv = Modules.timelineView;
        if (tv && typeof tv.searchFromStudy === 'function') {
          tv.searchFromStudy(targetHebrew);
          return;
        }
        if (context && context.switchTab) context.switchTab('acrostics');
        const txtAcrosticsTarget = document.getElementById('txtAcrosticsTarget');
        if (txtAcrosticsTarget) txtAcrosticsTarget.value = targetHebrew || '';
      }

      function openReflectionFromExplore(query) {
        if (Modules.reflectionView && typeof Modules.reflectionView.openFromQuery === 'function') {
          Modules.reflectionView.openFromQuery(query);
        }
        if (context && context.switchTab) context.switchTab('reflection');
      }

      function openElsFromExplore(terms) {
        if (!terms) return;
        if (context && context.switchTab) context.switchTab('biblecode');
        const txtSearchELS = document.getElementById('txtSearchELS');
        if (txtSearchELS) txtSearchELS.value = terms;
        if (Modules.bibleCodeView && typeof Modules.bibleCodeView.handleSearch === 'function') {
          Modules.bibleCodeView.handleSearch(context);
        }
      }

      function renderExploreResults(data) {
        if (!exploreResults) return;
        self.lastData = data;
        const meta = (data && data.meta) || {};
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

        if (!data || data.error) {
          rememberStudyQuery(null);
          if (exploreStatus) exploreStatus.textContent = (data && data.error) || '';
          exploreResults.innerHTML = data && data.error
            ? `<div class="explore-empty">${escapeHtml(data.error)}</div>`
            : '';
          return;
        }

        rememberStudyQuery(data);

        const knowledge = data.knowledge || [];
        const events = data.events || [];
        const zionist = data.zionist || [];
        const verses = data.verses || [];
        const hebrew = meta.primaryHebrew || '';
        const acrosticHits = acrosticHitsFor(hebrew);
        const total = knowledge.length + events.length + zionist.length + verses.length + acrosticHits.length;

        if (exploreStatus) {
          const he = hebrew
            ? ` · Hebreo: <span style="font-family:var(--font-hebrew)">${escapeHtml(hebrew)}</span>`
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
        }

        html += `<div class="explore-actions explore-toolbar">
          <button type="button" class="explore-action-btn" id="btnExportExploreReport">📄 Exportar informe</button>
          <button type="button" class="explore-action-btn" id="btnSaveExploreFavorite">⭐ Guardar correlación</button>
          ${meta.hebrewSource === 'phonetic' && hebrew ? '<button type="button" class="explore-action-btn" id="btnPinToDictionary">📌 Fijar hebreo en el diccionario</button>' : ''}
          ${hebrew ? `<button type="button" class="explore-action-btn" data-explore-calc="${escapeHtml(hebrew)}">Abrir en calculadora</button>` : ''}
          ${data.profile && data.profile.givenHebrew && data.profile.surnameHebrew
            ? `<button type="button" class="explore-action-btn" data-explore-compare-a="${escapeHtml(data.profile.givenHebrew)}" data-explore-compare-b="${escapeHtml(data.profile.surnameHebrew)}">Comparar nombre y apellido</button>`
            : ''}
          ${meta.primaryGematria && meta.primaryGematria.absolute
            ? `<button type="button" class="explore-action-btn" data-explore-torah="${meta.primaryGematria.absolute}">Versículos con este valor</button>`
            : ''}
          ${data.suggestedELS && data.suggestedELS.length ? `<button type="button" class="explore-action-btn" data-els-terms="${escapeHtml(data.suggestedELS.join(','))}">Ver matriz ELS</button>` : ''}
          ${hebrew ? `<button type="button" class="explore-action-btn" data-explore-letters="${escapeHtml(hebrew)}">Espejo de letras</button>` : ''}
          ${hebrew ? `<button type="button" class="explore-action-btn" data-explore-acrostics="${escapeHtml(hebrew)}">Acrósticos en frases curadas</button>` : ''}
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

        html += '<div><div class="explore-section-title">Acrósticos (frases curadas)</div>';
        if (!hebrew) {
          html += '<div class="explore-empty">Sin hebreo que buscar como Roshei/Sofei Teivot.</div>';
        } else if (!acrosticHits.length) {
          html += `<div class="explore-empty"><span style="font-family:var(--font-hebrew)">${escapeHtml(hebrew)}</span> no aparece como iniciales ni finales en las frases curadas. Un objetivo corto puede aparecer por azar.</div>`;
        } else {
          html += '<p class="acrostic-honesty-note">Se busca en versículos con espacios, no en el corpus ELS (esa cinta no tiene palabras).</p>';
          html += '<div class="explore-grid">';
          acrosticHits.forEach(h => {
            html += `<div class="explore-card">
              <h4>${escapeHtml(h.reference || 'Frase')}</h4>
              <div class="he">${escapeHtml(h.word)}</div>
              <div class="meta">${h.isRoshei ? 'Roshei Teivot' : 'Sofei Teivot'}</div>
              <div class="reasons">${escapeHtml(h.translation || h.phrase || '')}</div>
            </div>`;
          });
          html += '</div>';
        }
        html += '</div>';

        if (events.length) {
          html += '<div><div class="explore-section-title">Línea de tiempo</div><div class="explore-grid">';
          events.slice(0, 8).forEach((hit, idx) => {
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

        if (knowledge.length) {
          html += '<div><div class="explore-section-title">Grafo de conocimiento</div><div class="explore-grid">';
          knowledge.slice(0, 12).forEach(corr => {
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

        if (zionist.length) {
          html += '<div><div class="explore-section-title">Correlaciones sionistas</div><div class="explore-grid">';
          zionist.slice(0, 6).forEach(hit => {
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

        if (verses.length) {
          html += '<div><div class="explore-section-title">Versículos por valor</div><div class="explore-grid">';
          verses.forEach(hit => {
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
                <button type="button" class="explore-action-btn" data-els-terms="${escapeHtml(data.suggestedELS.join(','))}">
                  Buscar ELS: ${escapeHtml(data.suggestedELS.join(', '))}
                </button>
              </div>
            </div>`;
        }

        exploreResults.innerHTML = html;

        const btnExport = document.getElementById('btnExportExploreReport');
        if (btnExport) {
          btnExport.addEventListener('click', () => {
            const report = Explore && Explore.FormatCorrelationReport
              ? Explore.FormatCorrelationReport(data)
              : '';
            if (!report) return;
            const safe = String(data.query || 'consulta').replace(/[^\wא-ת\-]+/g, '_').slice(0, 40);
            const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `correlacion_${safe}.txt`;
            a.click();
            btnExport.textContent = '✅ Informe descargado';
            setTimeout(() => { btnExport.textContent = '📄 Exportar informe'; }, 2000);
          });
        }

        const btnSaveExplore = document.getElementById('btnSaveExploreFavorite');
        if (btnSaveExplore && Storage && Storage.SaveFavorite) {
          btnSaveExplore.addEventListener('click', () => {
            const summary = {
              events: events.slice(0, 5).map(h => h.event.title),
              knowledge: knowledge.slice(0, 5).map(c => c.entry.spanish),
              suggestedELS: data.suggestedELS || [],
              queryType: data.queryType,
              primaryHebrew: hebrew,
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
              verse: hebrew || data.queryType,
              significanceScore: events.length + knowledge.length,
              pValue: null,
              data: data.queryType === 'profile' ? {
                profile: {
                  givenName: data.profile.givenName,
                  surname: data.profile.surname,
                  birthDate: data.profile.birthDate,
                  extra: data.profile.extra
                },
                events: summary.events,
                knowledge: summary.knowledge,
                suggestedELS: data.suggestedELS || [],
                queryType: 'profile',
                primaryHebrew: hebrew,
                absolute: summary.absolute
              } : summary,
              savedAt: new Date().toISOString()
            });
            const after = Storage.GetFavorites().length;
            btnSaveExplore.textContent = after === before ? '✅ Ya guardado' : '✅ Guardado';
            setTimeout(() => { btnSaveExplore.textContent = '⭐ Guardar correlación'; }, 2000);
          });
        }

        exploreResults.querySelectorAll('[data-els-terms]').forEach(btn => {
          btn.addEventListener('click', () => openElsFromExplore(btn.getAttribute('data-els-terms') || ''));
        });
        exploreResults.querySelectorAll('[data-explore-zionism]').forEach(btn => {
          btn.addEventListener('click', () => {
            openTimelineFromExplore(btn.getAttribute('data-year'), btn.getAttribute('data-title') || '');
          });
        });
        exploreResults.querySelectorAll('[data-explore-torah]').forEach(btn => {
          btn.addEventListener('click', () => openTorahFromExplore(btn.getAttribute('data-explore-torah')));
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
            if (context && context.switchTab) context.switchTab('calculator');
            if (context && context.setLanguage) context.setLanguage('hebrew');
            const txtInput = document.getElementById('txtInput');
            if (txtInput) txtInput.value = he;
            if (context && context.processInputText) context.processInputText(he);
          });
        });
        exploreResults.querySelectorAll('[data-explore-letters]').forEach(btn => {
          btn.addEventListener('click', () => openLettersFromExplore(btn.getAttribute('data-explore-letters') || ''));
        });
        exploreResults.querySelectorAll('[data-explore-acrostics]').forEach(btn => {
          btn.addEventListener('click', () => openAcrosticsFromExplore(btn.getAttribute('data-explore-acrostics') || ''));
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
            if (hebrewEl) hebrewEl.value = hebrew || '';
            if (typeof updateDictPreview === 'function') updateDictPreview();
            const dictForm = document.getElementById('formNameDictionary');
            if (dictForm) dictForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          self.lastData = null;
          rememberStudyQuery(null);
          return;
        }
        if (Storage && Storage.SaveExploreHistory) Storage.SaveExploreHistory(query);
        renderExploreHistory();
        hideExploreSuggest();
        const data = Explore.ExploreCorrelations(query, DB, Engine);
        setExampleBanner(false);
        renderExploreResults(data);
        if (exploreResults) exploreResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

        const data = Explore.BuildPersonalProfile({ givenName, surname, birthDate, extra }, DB, Engine);
        if (Storage && Storage.SaveExploreHistory) Storage.SaveExploreHistory(data.query);
        if (Storage && Storage.SavePersonalProfileForm && !(opts && opts.example)) {
          Storage.SavePersonalProfileForm({ givenName, surname, birthDate, extra });
        }
        setExploreMode('profile');
        renderExploreHistory();
        setExampleBanner(!!(opts && opts.example));
        renderExploreResults(data);
        if (exploreResults) exploreResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      document.querySelectorAll('.explore-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setExploreMode(btn.getAttribute('data-explore-mode')));
      });
      document.querySelectorAll('.explore-text-btn[data-explore-mode]').forEach(btn => {
        btn.addEventListener('click', () => setExploreMode(btn.getAttribute('data-explore-mode')));
      });

      if (btnExploreSearch) {
        btnExploreSearch.addEventListener('click', () => runExploreSearch());
      }
      if (txtExploreQuery) {
        txtExploreQuery.addEventListener('input', () => renderExploreSuggest(txtExploreQuery.value));
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
      document.querySelectorAll('#exploreQuickChips .explore-chip').forEach(chip => {
        chip.addEventListener('click', () => runExploreSearch(chip.getAttribute('data-q')));
      });

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
      if (dictFilterEl) dictFilterEl.addEventListener('input', renderNameDictionary);
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
      renderExploreHistory();

      function maybeShowExampleDossier() {
        const saved = Storage && Storage.GetPersonalProfileForm ? Storage.GetPersonalProfileForm() : null;
        const hasSaved = saved && (saved.givenName || saved.surname);
        if (hasSaved) {
          fillProfileForm(saved);
          return;
        }
        const hist = Storage && Storage.GetExploreHistory ? Storage.GetExploreHistory() : [];
        if (hist && hist.length) return;
        fillProfileForm(EXAMPLE_PROFILE);
        runProfileBuild(EXAMPLE_PROFILE, { example: true });
      }
      maybeShowExampleDossier();

      this.runExploreSearch = runExploreSearch;
      this.renderExploreResults = renderExploreResults;
      this.setExploreMode = setExploreMode;
      this.fillProfileForm = fillProfileForm;
      this.runProfileBuild = runProfileBuild;
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.exploreView = ExploreView;
})(typeof window !== 'undefined' ? window : globalThis);
