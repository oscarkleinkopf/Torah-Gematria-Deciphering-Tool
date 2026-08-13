/**
 * Torah Gematria Deciphering Tool
 * Módulo: shareCard.js - Generador Gráfico de Tarjetas Ceremoniales (Share Card)
 */

(function(global) {
  'use strict';

  const ShareCard = {
    activeData: null,

    open: function(data) {
      const modal = document.getElementById('shareCardModal');
      const canvas = document.getElementById('shareCardCanvas');
      if (!modal || !canvas) return;

      this.activeData = data;
      this.draw(canvas, data);
      modal.style.display = 'flex';
    },

    draw: function(canvas, data) {
      const Engine = global.GematriaEngine;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      // Fondo Gradiente Cósmico Profundo
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#0a0818');
      bgGrad.addColorStop(0.5, '#120d2b');
      bgGrad.addColorStop(1, '#05040e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Polvo cósmico / Estrellas
      for (let i = 0; i < 120; i++) {
        const x = Math.abs(Math.sin(i * 99.7)) * W;
        const y = Math.abs(Math.cos(i * 77.3)) * H;
        const r = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + (i % 5) * 0.15})`;
        ctx.fill();
      }

      // Marco Ceremonial Doble Dorado
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, W - 60, H - 60);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(42, 42, W - 84, H - 84);

      // Acentos de esquinas
      ctx.fillStyle = '#ffd700';
      [[42, 42], [W - 42, 42], [42, H - 42], [W - 42, H - 42]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Encabezado
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
      ctx.font = 'bold 22px "Cinzel", Georgia, serif';
      ctx.fillText('TORAH GEMATRIA & DECIPHERING TOOL', W / 2, 100);

      // Dedicatoria sutil IDF
      ctx.fillStyle = 'rgba(46, 204, 113, 0.85)';
      ctx.font = 'bold 15px "Montserrat", sans-serif';
      ctx.fillText('🛡️ DEDICADO A LOS HÉROES DE LAS FUERZAS DE DEFENSA DE ISRAEL', W / 2, 132);

      // Línea divisoria decorativa
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, 155);
      ctx.lineTo(W / 2 + 200, 155);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.stroke();

      // Palabra Hebrea Gigante Central
      const hebrewText = data.hebrew || 'שלום';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
      ctx.shadowBlur = 25;
      ctx.font = 'bold 110px "Frank Ruhl Libre", "David", serif';
      ctx.fillText(hebrewText, W / 2, 310);
      ctx.shadowBlur = 0; // reset

      // Concepto en Español
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Cinzel", Georgia, serif';
      ctx.fillText(data.title || 'Paz / Integridad', W / 2, 385);

      // Badge Dorado del Valor Numérico Central
      const numVal = data.number !== undefined ? data.number : 376;
      const badgeY = 445;
      const badgeW = 340;
      const badgeH = 80;
      const badgeX = (W - badgeW) / 2;

      ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00ced1';
      ctx.font = 'bold 16px "Montserrat", sans-serif';
      ctx.fillText('VALOR GEMÁTRICO', W / 2, badgeY + 28);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 38px "Montserrat", sans-serif';
      ctx.fillText(`${numVal}`, W / 2, badgeY + 66);

      // Caja de Correspondencia y Análisis Místico
      const boxY = 570;
      const boxW = W - 160;
      const boxH = 320;
      const boxX = 80;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.stroke();

      // Título de la Correspondencia
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 22px "Cinzel", Georgia, serif';
      ctx.fillText(data.subtitle || 'Correspondencia Sagrada & Esencia', W / 2, boxY + 45);

      // Texto Explicativo (Multi-Línea)
      ctx.fillStyle = 'rgba(245, 246, 250, 0.9)';
      ctx.font = '19px "Montserrat", sans-serif';
      const descText = data.context || 'En la Cábala y la tradición bíblica, este número representa una frecuencia de equilibrio perfecto y emanación espiritual.';
      this.wrapText(ctx, descText, W / 2, boxY + 95, boxW - 60, 30);

      // Versículo o Cita si existe
      if (data.verse) {
        ctx.fillStyle = '#c8a2c8';
        ctx.font = 'italic 18px "Montserrat", sans-serif';
        this.wrapText(ctx, `📜 ${data.verse}`, W / 2, boxY + 240, boxW - 60, 26);
      }

      // Footer con Fecha Hebrea
      const todayInfo = Engine ? Engine.GregorianToHebrew(new Date()) : { fullHebrewString: '' };
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '15px "Montserrat", sans-serif';
      ctx.fillText(`Generado el ${todayInfo.fullHebrewString} • Decodificador de Gematria de la Torá`, W / 2, H - 65);
    },

    wrapText: function(ctx, text, x, y, maxWidth, lineHeight) {
      if (!text) return;
      const words = text.split(' ');
      let line = '';
      let currentY = y;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    },

    init: function(context) {
      const self = this;
      const DB = global.GematriaDB;
      const Engine = global.GematriaEngine;

      const btnShareCalc = document.getElementById('btnShareCalc');
      if (btnShareCalc) {
        btnShareCalc.addEventListener('click', () => {
          const res = context && context.appState ? context.appState.gematriaResult : null;
          if (!res || res.lettersCount === 0) {
            alert('Ingresa primero una palabra para compartir.');
            return;
          }

          const matchConcept = DB && DB.KNOWLEDGE_GRAPH ? DB.KNOWLEDGE_GRAPH.find(k => k.hebrew === res.cleanText) : null;
          const matchVerse = DB && DB.TORAH_VERSES ? DB.TORAH_VERSES.find(v => v.gematria === res.absolute) : null;

          self.open({
            type: 'calculator',
            hebrew: res.cleanText,
            title: matchConcept ? (matchConcept.spanish || matchConcept.concept) : 'Frecuencia Sagrada',
            number: res.absolute,
            subtitle: `Absoluto: ${res.absolute} • Ordinal: ${res.ordinal} • Reducido: ${res.reduced}`,
            context: matchConcept ? (matchConcept.mysticalMeaning || matchConcept.meaning) : `Palabra de ${res.lettersCount} letras. Su valor reducido ${res.reduced} representa su esencia primordial en el Árbol de la Vida.`,
            verse: matchVerse ? `${matchVerse.reference}: ${matchVerse.translation}` : null
          });
        });
      }

      const btnShareModalClose = document.getElementById('btnShareModalClose');
      if (btnShareModalClose) {
        btnShareModalClose.addEventListener('click', () => {
          const modal = document.getElementById('shareCardModal');
          if (modal) modal.style.display = 'none';
        });
      }

      const btnDownloadSharePNG = document.getElementById('btnDownloadSharePNG');
      if (btnDownloadSharePNG) {
        btnDownloadSharePNG.addEventListener('click', () => {
          const canvas = document.getElementById('shareCardCanvas');
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = `gematria-${self.activeData ? self.activeData.hebrew : 'hallazgo'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      }

      const btnCopyShareImage = document.getElementById('btnCopyShareImage');
      if (btnCopyShareImage) {
        btnCopyShareImage.addEventListener('click', async () => {
          const canvas = document.getElementById('shareCardCanvas');
          const alertBox = document.getElementById('shareStatusAlert');
          if (!canvas) return;

          try {
            canvas.toBlob(async (blob) => {
              if (!blob) return;
              if (navigator.clipboard && navigator.clipboard.write) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                if (alertBox) {
                  alertBox.className = 'share-status-alert success';
                  alertBox.textContent = '✅ ¡Imagen copiada al portapapeles! Lista para pegar en WhatsApp o redes.';
                  alertBox.style.display = 'block';
                  setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
                }
              } else if (btnDownloadSharePNG) {
                btnDownloadSharePNG.click();
              }
            });
          } catch (err) {
            console.warn('Clipboard write failed:', err);
            if (btnDownloadSharePNG) btnDownloadSharePNG.click();
          }
        });
      }

      const btnCopyShareText = document.getElementById('btnCopyShareText');
      if (btnCopyShareText) {
        btnCopyShareText.addEventListener('click', () => {
          if (!self.activeData) return;
          const alertBox = document.getElementById('shareStatusAlert');
          const textToCopy = `✡️ Decodificador de Gematria de la Torá\nPalabra: ${self.activeData.hebrew} (${self.activeData.title})\nValor Gematria: ${self.activeData.number}\n${self.activeData.context || ''}\n${self.activeData.verse ? '📜 ' + self.activeData.verse : ''}`;
          
          navigator.clipboard.writeText(textToCopy).then(() => {
            if (alertBox) {
              alertBox.className = 'share-status-alert success';
              alertBox.textContent = '✅ ¡Texto copiado al portapapeles!';
              alertBox.style.display = 'block';
              setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
            }
          });
        });
      }
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.shareCard = ShareCard;

})(typeof window !== 'undefined' ? window : globalThis);
