/**
 * Torah Gematria Deciphering Tool
 * Módulo: galaxyCanvas.js - Mapa Estelar Galáctico (Galaxy View & Constelaciones)
 */

(function(global) {
  'use strict';

  const GalaxyCanvas = {
    canvas: null,
    ctx: null,
    nodes: [],
    links: [],
    camera: { x: 0, y: 0, zoom: 1.0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    hoveredNode: null,
    activeConstellation: 'all',
    dustParticles: [],

    init: function(context) {
      const self = this;
      this.canvas = document.getElementById('galaxyCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');

      // Inicializar partículas de polvo estelar
      this.dustParticles = [];
      for (let i = 0; i < 75; i++) {
        this.dustParticles.push({
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 2000,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.6 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.005
        });
      }

      // Eventos de arrastre y cámara
      this.canvas.addEventListener('mousedown', (e) => {
        self.isDragging = true;
        self.dragStart = { x: e.clientX - self.camera.x, y: e.clientY - self.camera.y };
      });

      window.addEventListener('mousemove', (e) => {
        if (self.isDragging) {
          self.camera.x = e.clientX - self.dragStart.x;
          self.camera.y = e.clientY - self.dragStart.y;
        } else if (self.canvas) {
          const rect = self.canvas.getBoundingClientRect();
          const mouseX = (e.clientX - rect.left - self.canvas.width / 2 - self.camera.x) / self.camera.zoom;
          const mouseY = (e.clientY - rect.top - self.canvas.height / 2 - self.camera.y) / self.camera.zoom;
          
          self.hoveredNode = null;
          for (let node of self.nodes) {
            const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
            if (dist <= node.radius + 6) {
              self.hoveredNode = node;
              break;
            }
          }
        }
      });

      window.addEventListener('mouseup', () => {
        self.isDragging = false;
      });

      // Zoom con rueda
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
        self.camera.zoom = Math.min(2.5, Math.max(0.4, self.camera.zoom * zoomDelta));
        self.updateZoomBadge();
      });

      // Clic en nodo
      this.canvas.addEventListener('click', () => {
        if (self.hoveredNode && context && context.processInputText) {
          const txtInput = document.getElementById('txtInput');
          if (txtInput) {
            txtInput.value = self.hoveredNode.hebrew;
            context.setLanguage('hebrew');
            context.processInputText(self.hoveredNode.hebrew);
          }
        }
      });

      // Botones de Zoom UI
      const btnZoomIn = document.getElementById('btnGalaxyZoomIn');
      const btnZoomOut = document.getElementById('btnGalaxyZoomOut');
      const btnZoomReset = document.getElementById('btnGalaxyResetZoom');

      if (btnZoomIn) btnZoomIn.addEventListener('click', () => { self.camera.zoom = Math.min(2.5, self.camera.zoom * 1.2); self.updateZoomBadge(); });
      if (btnZoomOut) btnZoomOut.addEventListener('click', () => { self.camera.zoom = Math.max(0.4, self.camera.zoom / 1.2); self.updateZoomBadge(); });
      if (btnZoomReset) btnZoomReset.addEventListener('click', () => { self.camera.x = 0; self.camera.y = 0; self.camera.zoom = 1.0; self.updateZoomBadge(); });

      // Filtros de Constelaciones
      const constellationPills = document.querySelectorAll('.constellation-pill');
      constellationPills.forEach(pill => {
        pill.addEventListener('click', () => {
          constellationPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          self.activeConstellation = pill.getAttribute('data-constellation') || 'all';
        });
      });

      this.resize();
      this.animate();
    },

    updateZoomBadge: function() {
      const lbl = document.getElementById('lblGalaxyZoomLevel');
      if (lbl) lbl.textContent = `${Math.round(this.camera.zoom * 100)}%`;
    },

    resize: function() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = (rect.height || 380) * dpr;
      if (this.ctx) this.ctx.scale(dpr, dpr);
    },

    updateNodes: function(activeResult, correlations) {
      const DB = global.GematriaDB;
      const Engine = global.GematriaEngine;
      if (!DB) return;

      this.nodes = [];
      this.links = [];

      // Nodo Central
      if (activeResult && activeResult.cleanText) {
        this.nodes.push({
          id: 'center',
          hebrew: activeResult.cleanText,
          title: 'Término Actual',
          val: activeResult.absolute,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: 26,
          color: '#ffd700',
          isCenter: true,
          category: 'divine'
        });
      }

      // Nodos del Grafo
      DB.KNOWLEDGE_GRAPH.forEach((entry, idx) => {
        const angle = (idx / DB.KNOWLEDGE_GRAPH.length) * Math.PI * 2;
        const dist = 140 + (idx % 4) * 55;
        const gem = entry.gematria || (Engine ? Engine.CalculateGematria(entry.hebrew) : { absolute: 0 });

        let color = '#00ced1';
        if (entry.category === 'divine') color = '#ffd700';
        else if (entry.category === 'sefirah') color = '#9b59b6';
        else if (entry.category === 'zionism') color = '#2ecc71';
        else if (entry.category === 'patriarchs') color = '#e67e22';

        this.nodes.push({
          id: `k_${idx}`,
          hebrew: entry.hebrew,
          title: entry.spanish || entry.concept,
          val: gem.absolute,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: 14 + (gem.absolute % 8),
          color: color,
          isCenter: false,
          category: entry.category || 'concepts'
        });

        // Enlace si hay resonancia
        if (activeResult && (activeResult.absolute === gem.absolute || (activeResult.absolute > 0 && gem.absolute > 0 && (activeResult.absolute % gem.absolute === 0 || gem.absolute % activeResult.absolute === 0)))) {
          this.links.push({ source: 'center', target: `k_${idx}`, color: color });
        }
      });
    },

    animate: function() {
      const self = this;
      this.draw();
      requestAnimationFrame(() => self.animate());
    },

    draw: function() {
      if (!this.canvas || !this.ctx) return;
      const ctx = this.ctx;
      const w = this.canvas.offsetWidth;
      const h = this.canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2 + this.camera.x, h / 2 + this.camera.y);
      ctx.scale(this.camera.zoom, this.camera.zoom);

      // Dibujar Polvo Estelar
      this.dustParticles.forEach(p => {
        p.alpha += p.pulseSpeed;
        if (p.alpha > 0.8 || p.alpha < 0.15) p.pulseSpeed = -p.pulseSpeed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, p.alpha)})`;
        ctx.fill();
      });

      // Dibujar Órbitas Concéntricas
      [140, 200, 260, 320].forEach(r => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Dibujar Enlaces
      this.links.forEach(l => {
        const s = this.nodes.find(n => n.id === l.source);
        const t = this.nodes.find(n => n.id === l.target);
        if (s && t) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = l.color || 'rgba(0, 206, 209, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Dibujar Nodos
      this.nodes.forEach(n => {
        const isDimmed = (this.activeConstellation !== 'all' && n.category !== this.activeConstellation && !n.isCenter);
        const alpha = isDimmed ? 0.2 : 1.0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = n.isCenter ? 20 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        // Texto en el nodo
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${n.isCenter ? 14 : 11}px "David", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.hebrew, n.x, n.y);

        if (!isDimmed) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '9px "Montserrat", sans-serif';
          ctx.fillText(n.val, n.x, n.y + n.radius + 10);
        }
      });

      ctx.restore();
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.galaxyCanvas = GalaxyCanvas;

})(typeof window !== 'undefined' ? window : globalThis);
