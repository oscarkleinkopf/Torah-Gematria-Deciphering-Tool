/**
 * Torah Gematria Deciphering Tool
 * Módulo: mysticAudio.js - Motor de Sonificación Mística y Web Audio API
 */

(function(global) {
  'use strict';

  // Frecuencias Sagradas de las 22 Letras Hebreas (Afinación Pitagórica 432 Hz y Solfeggio)
  const LETTER_FREQUENCIES = {
    'א': 432.0,  // Alef - Frecuencia Fundamental (Unidad Cósmica)
    'ב': 458.0,  // Bet - Creación y Casa
    'ג': 486.0,  // Guimel - Expansión
    'ד': 514.0,  // Dalet - Puerta
    'ה': 528.0,  // Hei - Respiración Divina & Transformación (Solfeggio MI)
    'ו': 576.0,  // Vav - Conexión & Alianza
    'ז': 612.0,  // Zayin - Espada de Luz
    'ח': 648.0,  // Jet - Vida y Dinamismo
    'ט': 688.0,  // Tet - Bondad Oculta
    'י': 720.0,  // Yod - Semilla Divina
    'כ': 768.0,  // Kaf - Manifestación
    'ך': 768.0,
    'ל': 816.0,  // Lamed - Elevación & Enseñanza
    'מ': 864.0,  // Mem - Aguas Primordiales
    'ם': 864.0,
    'נ': 918.0,  // Nun - El Alma
    'ן': 918.0,
    'ס': 972.0,  // Samej - Apoyo & Protección
    'ע': 1032.0, // Ayin - Visión Interior
    'פ': 1088.0, // Pei - Palabra Creadora
    'ף': 1088.0,
    'צ': 1152.0, // Tzadik - Rectitud
    'ץ': 1152.0,
    'ק': 1224.0, // Kof - Santidad
    'ר': 1296.0, // Resh - Comienzo
    'ש': 1376.0, // Shin - Fuego Sagrado
    'ת': 1440.0  // Tav - Perfección y Sello
  };

  const MysticAudio = {
    audioCtx: null,
    isMuted: false,
    currentDrone: null,
    droneGain: null,

    getAudioContext: function() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    },

    // Reproducir tono suave de una sola letra
    playLetterTone: function(char) {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const freq = LETTER_FREQUENCIES[char] || 432.0;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Envolvente suave estilo campana
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    },

    // Reproducir acorde polifónico / arpegio armónico de una palabra
    playWordHarmonics: function(word, type = 'arpeggio') {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const cleanLetters = String(word || '').replace(/[^א-ת]/g, '').split('');
      if (cleanLetters.length === 0) return;

      const now = ctx.currentTime;
      const baseDelay = type === 'chord' ? 0.02 : 0.12;

      cleanLetters.forEach((char, index) => {
        const freq = LETTER_FREQUENCIES[char] || 432.0;
        const noteStart = now + (index * baseDelay);

        // Oscilador Principal (Fundamental)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, noteStart);

        // Oscilador Secundario (Armónico suave de octava/cuenco)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.5, noteStart);

        // Envolvente ADSR
        gain1.gain.setValueAtTime(0.0001, noteStart);
        gain1.gain.exponentialRampToValueAtTime(0.15, noteStart + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.8);

        gain2.gain.setValueAtTime(0.0001, noteStart);
        gain2.gain.exponentialRampToValueAtTime(0.04, noteStart + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);

        osc1.start(noteStart);
        osc2.start(noteStart);
        osc1.stop(noteStart + 1.9);
        osc2.stop(noteStart + 1.3);
      });
    },

    // Modo Meditación Sonora (Tono armónico continuo / Drone de Sefirot)
    toggleMeditationDrone: function(baseFreq = 432.0, btnElement) {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (this.currentDrone) {
        this.stopMeditationDrone();
        if (btnElement) {
          btnElement.classList.remove('active');
          btnElement.innerHTML = '🧘 Tono de Meditación';
        }
        return false;
      } else {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const masterGain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);

        // Ligero batimiento binaural de 4 Hz (Ondas Theta para meditación profunda)
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq + 4.32, now);

        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.exponentialRampToValueAtTime(0.08, now + 2.0);

        osc1.connect(masterGain);
        osc2.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);

        this.currentDrone = [osc1, osc2];
        this.droneGain = masterGain;

        if (btnElement) {
          btnElement.classList.add('active');
          btnElement.innerHTML = '⏹️ Detener Meditación';
        }
        return true;
      }
    },

    stopMeditationDrone: function() {
      if (this.currentDrone && this.audioCtx) {
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        if (this.droneGain) {
          this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
          this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
        }
        setTimeout(() => {
          if (this.currentDrone) {
            this.currentDrone.forEach(osc => {
              try { osc.stop(); osc.disconnect(); } catch (e) {}
            });
            this.currentDrone = null;
            this.droneGain = null;
          }
        }, 1050);
      }
    },

    init: function(context) {
      const self = this;
      const btnPlayAudio = document.getElementById('btnPlayWordAudio');
      const btnMeditationAudio = document.getElementById('btnMeditationAudio');
      const kbdKeys = document.querySelectorAll('.kbd-key');

      if (btnPlayAudio) {
        btnPlayAudio.addEventListener('click', () => {
          const res = context && context.appState ? context.appState.gematriaResult : null;
          const text = res && res.cleanText ? res.cleanText : 'שלום';
          self.playWordHarmonics(text, 'arpeggio');
        });
      }

      if (btnMeditationAudio) {
        btnMeditationAudio.addEventListener('click', () => {
          const res = context && context.appState ? context.appState.gematriaResult : null;
          const absVal = res && res.absolute ? res.absolute : 432;
          // Normalizar frecuencia a rango audible de meditación (108 Hz - 432 Hz)
          let freq = absVal % 432;
          if (freq < 108) freq += 216;
          self.toggleMeditationDrone(freq, btnMeditationAudio);
        });
      }

      // Sonido sutil en el teclado virtual hebreo
      document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('kbd-key')) {
          const char = e.target.getAttribute('data-char') || e.target.textContent.trim();
          if (char && LETTER_FREQUENCIES[char]) {
            self.playLetterTone(char);
          }
        }
      });
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.mysticAudio = MysticAudio;

})(typeof window !== 'undefined' ? window : globalThis);
