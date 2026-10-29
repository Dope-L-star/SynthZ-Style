'use client';

import { useCallback, useEffect, useState } from 'react';

/*
 * Microsoft Clarity se incluye como integración opcional, pero NO se activa en
 * esta versión: los términos públicos permiten el uso por personas de 13–17 años
 * con permiso de un adulto, mientras que Microsoft indica que Clarity no debe
 * usarse en sitios dirigidos a menores de 18 años. Para evitar una activación
 * accidental hacen falta dos flags explícitos en tiempo de build y una decisión
 * de producto que cambie ese público objetivo. También se requiere consentimiento.
 */
const CLARITY_ENABLED = process.env.NEXT_PUBLIC_CLARITY_ENABLED === 'true';
const ADULT_ONLY_AUDIENCE = process.env.NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS === 'true';
const ALLOWED = CLARITY_ENABLED && ADULT_ONLY_AUDIENCE;
const PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'z5es3kuqoz';
const CONSENT_KEY = 'symphoria:clarity-consent:v1';

function queueClarity() {
  if (typeof window === 'undefined') return null;
  if (typeof window.clarity === 'function') return window.clarity;
  const clarity = function (...args) {
    clarity.q = clarity.q || [];
    clarity.q.push(args);
  };
  window.clarity = clarity;
  return clarity;
}

function startClarity() {
  if (!ALLOWED || typeof document === 'undefined') return;
  const clarity = queueClarity();
  // Queue the consent state before loading Microsoft's script.
  clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  const existing = document.querySelector('script[data-symphoria-clarity="true"]');
  if (existing) return;
  const script = document.createElement('script');
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(PROJECT_ID)}`;
  script.async = true;
  script.dataset.symphoriaClarity = 'true';
  script.onerror = () => {
    // An analytics provider failing must not affect the app or its chat runtime.
    script.remove();
    delete window.clarity;
  };
  document.head.appendChild(script);
}

function stopClarity() {
  try {
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      // Clear previously granted Clarity cookies as well; retained for compatibility
      // with Microsoft's documented cookie-erasure API.
      window.clarity('consent', false);
    }
    localStorage.setItem(CONSENT_KEY, 'denied');
  } catch {
    // Storage can be unavailable in strict/private browser modes.
  }
}

export default function ClarityConsent() {
  const [open, setOpen] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);

  useEffect(() => {
    if (!ALLOWED) return undefined;
    let choice = null;
    try { choice = localStorage.getItem(CONSENT_KEY); } catch {}
    if (choice === 'granted') {
      setHasChoice(true);
      startClarity();
    } else if (choice === 'denied') {
      setHasChoice(true);
    } else {
      setOpen(true);
    }
    const showSettings = () => setOpen(true);
    window.addEventListener('symphoria:analytics-settings', showSettings);
    return () => window.removeEventListener('symphoria:analytics-settings', showSettings);
  }, []);

  const accept = useCallback(() => {
    try { localStorage.setItem(CONSENT_KEY, 'granted'); } catch {}
    setHasChoice(true);
    setOpen(false);
    startClarity();
  }, []);

  const reject = useCallback(() => {
    stopClarity();
    setHasChoice(true);
    setOpen(false);
    // If this is a revocation after an accepted visit, reload once so the tracker
    // is not re-initialized during the current page lifetime.
    if (typeof window !== 'undefined' && window.clarity) window.location.reload();
  }, []);

  if (!ALLOWED) return null;

  return (
    <>
      {hasChoice && !open ? (
        <button className="clarity-preferences" type="button" onClick={() => setOpen(true)} aria-label="Cambiar preferencias de analítica">
          Privacidad
        </button>
      ) : null}
      {open ? (
        <section className="clarity-consent" role="dialog" aria-modal="false" aria-labelledby="clarity-consent-title">
          <div className="clarity-consent__eyebrow"><span aria-hidden="true" className="clarity-consent__dot" /> PRIVACIDAD Y MEJORA
          </div>
          <h2 id="clarity-consent-title">¿Nos ayudas a mejorar SymphorIA?</h2>
          <p>Microsoft Clarity mide clics y desplazamientos y puede crear reproducciones de la interfaz. No usa esto para responder tus mensajes; el chat, los títulos de conversaciones y los resultados personales están marcados para ocultarse. Los campos de texto también se enmascaran.</p>
          <div className="clarity-consent__actions">
            <button type="button" className="clarity-consent__accept" onClick={accept}>Permitir analítica</button>
            <button type="button" className="clarity-consent__reject" onClick={reject}>No permitir</button>
          </div>
          <a className="clarity-consent__privacy" href="/privacidad.html">Leer la política de privacidad</a>
        </section>
      ) : null}
    </>
  );
}

export function ClaritySettingsLink() {
  if (!ALLOWED) return null;
  return (
    <button
      type="button"
      className="clarity-settings-link"
      onClick={() => window.dispatchEvent(new Event('symphoria:analytics-settings'))}
    >
      Cambiar preferencias de analítica
    </button>
  );
}
