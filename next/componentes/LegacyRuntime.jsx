'use client';

import { useEffect } from 'react';

/*
 * Adaptador temporal de compatibilidad durante la migración a React.
 * El marcado lo renderiza ReactTree. Estos scripts conservan temporalmente la lógica
 * imperativa de la aplicación mientras se migra por módulos sin perder funciones.
 */
export default function LegacyRuntime({ page, scripts = [], puter = false }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Acciones de compatibilidad que antes venían en atributos inline del HTML.
    // Se delegan una sola vez y nunca se evalúa código JavaScript recibido como texto.
    if (!window.__symphoriaReactDelegates) {
      document.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target.closest('[data-legacy-action]') : null;
        if (target?.dataset.legacyAction === 'reload') window.location.reload();
      });
      document.addEventListener('error', (event) => {
        const target = event.target;
        if (target instanceof HTMLImageElement && target.dataset.legacyOnerror === 'remove') target.remove();
      }, true);
      window.__symphoriaReactDelegates = true;
    }
    const key = `${window.location.pathname}:${page}`;
    window.__symphoriaLegacyBoots ||= Object.create(null);
    if (window.__symphoriaLegacyBoots[key]) return;
    window.__symphoriaLegacyBoots[key] = true;

    const load = (src, { async = false, onload, onerror } = {}) => new Promise((resolve) => {
      // Solo reutilizamos scripts que este adaptador ya añadió. Los <script src> del
      // HTML heredado entran mediante dangerouslySetInnerHTML y son inertes; intentar
      // esperar sus eventos carga indefinidamente y deja el chat sin inicializar.
      const existing = [...document.scripts].find((s) => s.dataset.symphoriaSrc === src);
      if (existing?.dataset.symphoriaLoaded === '1') {
        resolve(true);
        return;
      }
      const script = existing || document.createElement('script');
      script.src = src;
      script.async = async;
      script.dataset.symphoriaSrc = src;
      script.onload = () => {
        script.dataset.symphoriaLoaded = '1';
        onload?.();
        resolve(true);
      };
      script.onerror = () => {
        onerror?.();
        window.dispatchEvent(new CustomEvent('symphoria:script-error', { detail: { src, page } }));
        console.warn(`[SymphorIA] No se pudo cargar ${src}; se continúa con el resto de la interfaz.`);
        resolve(false);
      };
      if (!existing) document.body.appendChild(script);
    });

    const run = async () => {
      // Los pequeños preámbulos del HTML antiguo se expresan como código React/JS seguro.
      try {
        if (page === 'inicio' && window.sessionStorage.getItem('synthz:back')) {
          document.documentElement.classList.add('backin');
        } else if (page === 'chat') {
          document.documentElement.classList.add('enter');
          if (window.sessionStorage.getItem('synthz:portal')) document.documentElement.classList.add('po');
        } else if (page === 'alias') {
          let scheme = window.localStorage.getItem('synthz:alias:scheme');
          if (scheme !== 'light' && scheme !== 'dark') {
            scheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
          }
          document.documentElement.dataset.scheme = scheme;
        }
      } catch {
        if (page === 'alias') document.documentElement.dataset.scheme = 'dark';
      }

      if (puter) {
        void load('https://js.puter.com/v2/', {
          async: true,
          onload: () => {
            window.__puterOK = 1;
            window.dispatchEvent(new Event('puter-ready'));
          },
          onerror: () => {
            window.__puterBlocked = 1;
            window.dispatchEvent(new Event('puter-blocked'));
          }
        });
      }

      for (const src of scripts) {
        await load(new URL(src, window.location.origin + '/').href);
      }

      // ayuda.js se escribió originalmente para cargarse durante el parseo.
      // Como su script se monta desde React, se emite su evento de inicialización una vez.
      if (page === 'ayuda') {
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
      }
      // El script original registraba el Service Worker desde el evento `load` del navegador.
      // La página React hidrata después de ese evento, así que registramos lo mismo aquí.
      if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('symphoria:react-page-ready', { detail: { page } }));
    };

    void run();
    return undefined;
  }, [page, puter, scripts]);

  return null;
}
