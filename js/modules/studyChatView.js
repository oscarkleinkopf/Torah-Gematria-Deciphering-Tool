/**
 * Estudio IA — compañero de estudio (Netlify AI Gateway + texto local).
 * No presenta matrices Drosnin/WRR como hallazgos de esta app.
 */
(function (global) {
  'use strict';

  const API = '/api/estudio-chat';
  const MAX_TURNS = 20;

  const SUGGESTIONS = [
    { id: 'els', label: '¿Qué es ELS?', prompt: '¿Qué es ELS y qué dice esta herramienta sobre el método?' },
    { id: 'tora50', label: 'תורה cada 50', prompt: 'Explícame el patrón clásico de תורה cada 50 letras en Génesis y Éxodo.' },
    { id: 'corpus', label: '¿Qué texto hay?', prompt: '¿Qué texto hebreo incluye esta herramienta y qué no incluye?' },
    {
      id: 'prophecy',
      label: '«El código predijo a Rabin»',
      prompt: '¿El código predijo el asesinato de Rabin y el 11-S?'
    }
  ];

  const StudyChatView = {
    _context: null,
    history: [],
    busy: false,

    init: function (context) {
      this._context = context || null;
      const self = this;
      const form = document.getElementById('study-chat-form');
      const chips = document.getElementById('study-chat-chips');
      if (form) form.addEventListener('submit', function (ev) { self.onSubmit(ev); });
      if (chips) {
        chips.innerHTML = SUGGESTIONS.map(function (s) {
          return (
            '<button type="button" class="study-chat-chip" data-study-chip="' +
            self.escapeHtml(s.id) +
            '">' +
            self.escapeHtml(s.label) +
            '</button>'
          );
        }).join('');
        chips.addEventListener('click', function (ev) {
          const btn = ev.target.closest('[data-study-chip]');
          if (!btn) return;
          const id = btn.getAttribute('data-study-chip');
          const found = SUGGESTIONS.filter(function (s) { return s.id === id; })[0];
          if (found) self.sendText(found.prompt);
        });
      }
      document.querySelectorAll('[data-open-study-chat]').forEach(function (el) {
        el.addEventListener('click', function () {
          const id = el.getAttribute('data-open-study-chat');
          const found = SUGGESTIONS.filter(function (s) { return s.id === id; })[0];
          self.openWithPrompt(found ? found.prompt : '¿Qué se puede estudiar con honestidad en esta app?');
        });
      });
      this.render();
    },

    escapeHtml: function (s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    render: function () {
      const log = document.getElementById('study-chat-log');
      if (!log) return;
      if (!this.history.length) {
        log.innerHTML =
          '<p class="study-chat-empty">Elige una pregunta o escribe la tuya. Las respuestas no son hallazgos de la app: si la pasarela IA no está activa, verás un texto local fijo.</p>';
        return;
      }
      const self = this;
      log.innerHTML = this.history.map(function (m) {
        const cls = m.role === 'user' ? 'study-chat-msg user' : 'study-chat-msg assistant';
        let meta = '';
        if (m.role === 'assistant' && m.source) {
          meta =
            '<span class="study-chat-source" data-source="' +
            self.escapeHtml(m.source) +
            '">' +
            (m.source === 'gateway' ? 'IA (pasarela Netlify)' : 'texto local') +
            '</span>';
        }
        return (
          '<div class="' + cls + '">' +
          meta +
          '<p>' +
          self.escapeHtml(m.content).replace(/\n/g, '<br>') +
          '</p></div>'
        );
      }).join('');
      log.scrollTop = log.scrollHeight;
    },

    setBusy: function (on) {
      this.busy = on;
      const btn = document.getElementById('study-chat-send');
      const input = document.getElementById('study-chat-input');
      if (btn) btn.disabled = on;
      if (input) input.disabled = on;
    },

    append: function (role, content, source) {
      this.history.push({ role: role, content: content, source: source || '' });
      if (this.history.length > MAX_TURNS) this.history = this.history.slice(-MAX_TURNS);
      this.render();
    },

    messagesForApi: function () {
      return this.history
        .filter(function (m) { return m.role === 'user' || m.role === 'assistant'; })
        .map(function (m) { return { role: m.role, content: m.content }; });
    },

    localFallback: function (text) {
      if (global.StudyChatPolicy && typeof global.StudyChatPolicy.localReply === 'function') {
        return global.StudyChatPolicy.localReply(text);
      }
      return 'No hay respuesta de estudio. Prueba un chip de arriba o abre Código ELS.';
    },

    sendText: function (text) {
      const t = String(text || '').trim();
      if (!t || this.busy) return;
      const self = this;
      this.append('user', t);
      this.setBusy(true);
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.messagesForApi() })
      })
        .then(function (res) {
          return res.text().then(function (raw) {
            let body = {};
            try { body = JSON.parse(raw); } catch (_) { body = {}; }
            return { ok: res.ok, body: body };
          });
        })
        .then(function (out) {
          let reply = out.body && out.body.reply;
          let source = (out.body && out.body.source) || 'local';
          if (!reply) {
            reply = self.localFallback(t);
            source = 'local';
          }
          self.append('assistant', reply, source);
        })
        .catch(function () {
          self.append('assistant', self.localFallback(t), 'local');
        })
        .then(function () {
          self.setBusy(false);
        });
    },

    onSubmit: function (ev) {
      if (ev) ev.preventDefault();
      const input = document.getElementById('study-chat-input');
      if (!input) return;
      const t = input.value;
      input.value = '';
      this.sendText(t);
    },

    openWithPrompt: function (text) {
      if (this._context && typeof this._context.switchTab === 'function') {
        this._context.switchTab('studychat');
      }
      this.sendText(text);
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.studyChatView = StudyChatView;
})(typeof window !== 'undefined' ? window : globalThis);
