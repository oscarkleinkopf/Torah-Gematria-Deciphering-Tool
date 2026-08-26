/**
 * Módulo: favoritesView.js — lista de favoritos ELS / Explorar / perfil y recarga.
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

  const FavoritesView = {
    init: function(context) {
      const Storage = global.GematriaStorage;
      const self = this;
      this._context = context;

      const btnClear = document.getElementById('btnClearAllFavorites');
      if (btnClear) {
        btnClear.addEventListener('click', () => {
          if (!confirm('¿Eliminar todos los favoritos guardados?')) return;
          if (Storage && Storage.ClearFavorites) Storage.ClearFavorites();
          self.render();
        });
      }
      this.render();
    },

    render: function() {
      const Storage = global.GematriaStorage;
      const Engine = global.GematriaEngine;
      const container = document.getElementById('favoritesContainer');
      if (!container) return;
      const favs = Storage && Storage.GetFavorites ? Storage.GetFavorites() : [];
      if (!favs.length) {
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
              <span class="favorite-word" style="font-family:var(--font-serif);font-size:1.1rem;">🔎 ${escapeHtml(fav.title || fav.word)}</span>
              <button type="button" data-idx="${idx}" class="fav-remove-btn" title="Eliminar">✕</button>
            </div>
            <div class="favorite-meta">Correlación · ${escapeHtml(fav.verse || data.queryType || 'explore')}</div>
            <div class="favorite-sig sig-mid">
              ${escapeHtml((data.events || []).slice(0, 2).join(' · ') || 'Sin eventos')}${data.primaryHebrew ? ' · ' + escapeHtml(data.primaryHebrew) : ''}
            </div>
            <div class="favorite-date">${new Date(fav.savedAt || fav.timestamp).toLocaleDateString()}</div>
            <button type="button" data-idx="${idx}" class="fav-reload-btn" data-fav-type="explore">🔍 Volver a explorar</button>
          `;
        } else if (fav.type === 'profile') {
          const data = fav.data || {};
          const pr = data.profile || {};
          card.innerHTML = `
            <div class="favorite-card-header">
              <span class="favorite-word" style="font-family:var(--font-serif);font-size:1.1rem;">👤 ${escapeHtml(fav.title || fav.word)}</span>
              <button type="button" data-idx="${idx}" class="fav-remove-btn" title="Eliminar">✕</button>
            </div>
            <div class="favorite-meta">Perfil · ${escapeHtml([pr.givenName, pr.surname].filter(Boolean).join(' '))}${pr.birthDate ? ' · ' + escapeHtml(pr.birthDate) : ''}</div>
            <div class="favorite-sig sig-mid">
              ${escapeHtml((data.events || []).slice(0, 2).join(' · ') || 'Sin eventos')}${data.primaryHebrew ? ' · ' + escapeHtml(data.primaryHebrew) : ''}
            </div>
            <div class="favorite-date">${new Date(fav.savedAt || fav.timestamp).toLocaleDateString()}</div>
            <button type="button" data-idx="${idx}" class="fav-reload-btn" data-fav-type="profile">🔍 Abrir perfil</button>
          `;
        } else {
          const honesty = Engine && Engine.AssessELSHonesty
            ? Engine.AssessELSHonesty(fav, { text: global.TORAH_TEXT || '', minSkip: 2, maxSkip: 120, runControl: false })
            : null;
          const bandClass = honesty
            ? (honesty.band === 'rare' ? 'sig-high' : honesty.band === 'plausible' ? 'sig-mid' : 'sig-low')
            : 'sig-low';
          card.innerHTML = `
            <div class="favorite-card-header">
              <span class="favorite-word">${escapeHtml(fav.word)}</span>
              <button type="button" data-idx="${idx}" class="fav-remove-btn" title="Eliminar">✕</button>
            </div>
            <div class="favorite-meta">
              Salto: <strong>${escapeHtml(fav.skip)}</strong> | Posición: #${escapeHtml(fav.start)} | ${escapeHtml(fav.verse || '')}
            </div>
            <div class="favorite-sig ${bandClass}">
              ${honesty ? escapeHtml(honesty.label) : 'Exploratorio'} · p(salto) ≈ ${(fav.pValue || 1).toExponential(2)}
            </div>
            <div class="favorite-date">${new Date(fav.savedAt || fav.timestamp).toLocaleDateString()}</div>
            <button type="button" data-idx="${idx}" class="fav-reload-btn" data-fav-type="els">🔍 Volver a buscar</button>
          `;
        }
        container.appendChild(card);
      });

      const self = this;
      const Modules = global.AppModules || {};
      container.querySelectorAll('.fav-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Storage && Storage.RemoveFavorite) Storage.RemoveFavorite(parseInt(btn.dataset.idx, 10));
          self.render();
        });
      });
      container.querySelectorAll('.fav-reload-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const fav = (Storage && Storage.GetFavorites ? Storage.GetFavorites() : [])[parseInt(btn.dataset.idx, 10)];
          if (!fav) return;
          const ctx = self._context;
          const explore = Modules.exploreView;
          if (fav.type === 'profile' || btn.getAttribute('data-fav-type') === 'profile') {
            const pr = (fav.data && fav.data.profile) || {};
            if (ctx && ctx.switchTab) ctx.switchTab('explore');
            if (explore) {
              if (explore.setExploreMode) explore.setExploreMode('profile');
              if (explore.fillProfileForm) explore.fillProfileForm(pr);
              if (explore.runProfileBuild) explore.runProfileBuild(pr);
            }
            return;
          }
          if (fav.type === 'explore' || btn.getAttribute('data-fav-type') === 'explore') {
            if (ctx && ctx.switchTab) ctx.switchTab('explore');
            if (explore) {
              if (explore.setExploreMode) explore.setExploreMode('query');
              if (explore.runExploreSearch) explore.runExploreSearch(fav.title || fav.word);
            }
            return;
          }
          if (ctx && ctx.switchTab) ctx.switchTab('biblecode');
          const txtSearchELS = document.getElementById('txtSearchELS');
          if (txtSearchELS) txtSearchELS.value = fav.word || '';
          if (Modules.bibleCodeView && typeof Modules.bibleCodeView.handleSearch === 'function') {
            Modules.bibleCodeView.handleSearch(ctx);
          }
        });
      });
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.favoritesView = FavoritesView;
})(typeof window !== 'undefined' ? window : globalThis);
