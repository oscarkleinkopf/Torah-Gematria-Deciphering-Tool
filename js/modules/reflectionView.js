/**
 * Módulo: reflectionView.js — temas de reflexión diaria y handoff desde Explorar.
 */
(function(global) {
  'use strict';

  const ReflectionView = {
    activeIndex: 0,

    init: function(context) {
      this._context = context;
      this.renderTopics();
    },

    renderTopics: function() {
      const DB = global.GematriaDB;
      const container = document.getElementById('reflectionTopicsContainer');
      if (!container || !DB || !DB.DAILY_REFLECTIONS) return;
      const self = this;
      container.innerHTML = '';
      DB.DAILY_REFLECTIONS.forEach((topic, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `reflection-topic-btn${idx === self.activeIndex ? ' active' : ''}`;
        btn.setAttribute('data-reflection-index', String(idx));
        btn.innerHTML = `
          <span class="ref-topic-title">${topic.title}</span>
          <span class="ref-topic-preview">${topic.text}</span>
        `;
        btn.addEventListener('click', () => self.selectIndex(idx));
        container.appendChild(btn);
      });
      if (DB.DAILY_REFLECTIONS.length) {
        this.showContent(DB.DAILY_REFLECTIONS[this.activeIndex]);
      }
    },

    selectIndex: function(idx) {
      const DB = global.GematriaDB;
      const topics = (DB && DB.DAILY_REFLECTIONS) || [];
      if (!topics[idx]) return;
      this.activeIndex = idx;
      document.querySelectorAll('.reflection-topic-btn').forEach(btn => {
        const on = parseInt(btn.getAttribute('data-reflection-index'), 10) === idx;
        btn.classList.toggle('active', on);
      });
      this.showContent(topics[idx]);
    },

    showContent: function(topic) {
      const el = document.getElementById('reflectionContent');
      if (!el || !topic) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(5px)';
      setTimeout(() => {
        el.innerHTML = `
          <h3 class="input-title" style="margin-bottom: 1.5rem;">${topic.title}</h3>
          <blockquote class="reflection-quote">${topic.text}</blockquote>
          <div class="reflection-prompt">
            <div class="reflection-prompt-title">Punto de introspección:</div>
            <p style="color: var(--text-primary); line-height: 1.5;">
              Escribe palabras relacionadas con este tema en la Calculadora (modo español si no sabes hebreo)
              y observa si los valores de gematria despiertan alguna correlación.
            </p>
          </div>
        `;
        el.style.transition = 'all 0.3s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 120);
    },

    openFromQuery: function(query) {
      const Explore = global.GematriaExplore;
      const DB = global.GematriaDB;
      const picker = Explore && Explore.PickDailyReflection;
      const picked = picker ? picker(DB.DAILY_REFLECTIONS, query || '') : null;
      if (picked && typeof picked.index === 'number') {
        this.selectIndex(picked.index);
      }
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.reflectionView = ReflectionView;
})(typeof window !== 'undefined' ? window : globalThis);
