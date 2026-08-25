/**
 * Torah Gematria Deciphering Tool
 * Módulo: pwaManager.js - Gestión de PWA, Instalación y Estado Offline
 */

(function(global) {
  'use strict';

  const PWAManager = {
    deferredPrompt: null,

    init: function(context) {
      const self = this;
      const btnInstallApp = document.getElementById('btnInstallApp');
      const offlineBanner = document.getElementById('offlineBanner');

      // 1. Registro del Service Worker
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
              console.log('[PWA] ServiceWorker registrado con alcance:', registration.scope);
            })
            .catch((error) => {
              console.warn('[PWA] Error al registrar ServiceWorker:', error);
            });
        });
      }

      // 2. Captura del evento beforeinstallprompt (Instalación nativa)
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        self.deferredPrompt = e;
        if (btnInstallApp) {
          btnInstallApp.style.display = 'inline-flex';
        }
      });

      if (btnInstallApp) {
        btnInstallApp.addEventListener('click', async () => {
          if (!self.deferredPrompt) {
            alert('La aplicación ya está instalada o tu navegador no soporta instalación directa.');
            return;
          }
          self.deferredPrompt.prompt();
          const { outcome } = await self.deferredPrompt.userChoice;
          console.log(`[PWA] Elección de instalación: ${outcome}`);
          self.deferredPrompt = null;
          btnInstallApp.style.display = 'none';
        });
      }

      window.addEventListener('appinstalled', () => {
        console.log('[PWA] ¡Aplicación instalada exitosamente!');
        if (btnInstallApp) btnInstallApp.style.display = 'none';
      });

      // 3. Monitoreo de Conexión Online / Offline
      function updateOnlineStatus() {
        if (!offlineBanner) return;
        if (!navigator.onLine) {
          offlineBanner.style.display = 'flex';
        } else {
          offlineBanner.style.display = 'none';
        }
      }

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      updateOnlineStatus();
    }
  };

  global.AppModules = global.AppModules || {};
  global.AppModules.pwaManager = PWAManager;

})(typeof window !== 'undefined' ? window : globalThis);
