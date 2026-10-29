'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CLARITY_PROJECT_ID_DEFAULT,
  clearFirstPartyClarityCookies,
  isClarityAllowed,
  loadClarity,
  readClarityChoice,
  revokeClarity,
  writeClarityChoice,
} from '../lib/clarity-client.mjs';

/*
 * Clarity remains inactive unless every release gate is true and a visitor opts in.
 * These flags are deployment assertions, not an age verification mechanism. The
 * adult-only product, access policy and legal copy must be reviewed independently.
 */
const PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || CLARITY_PROJECT_ID_DEFAULT;
const ALLOWED = isClarityAllowed({
  enabled: process.env.NEXT_PUBLIC_CLARITY_ENABLED === 'true',
  audience18Plus: process.env.NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS === 'true',
  privacyReviewed: process.env.NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED === 'true',
  adultOnlyRelease: process.env.NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE === 'true',
  ageControlVerified: process.env.NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED === 'true',
  projectId: PROJECT_ID,
});

function getStorageSafely() {
  try { return window.localStorage; } catch { return null; }
}

function startClarity() {
  if (!ALLOWED || typeof window === 'undefined' || typeof document === 'undefined') return false;
  return loadClarity({ windowObject: window, documentObject: document, projectId: PROJECT_ID });
}

export default function ClarityConsent() {
  const [open, setOpen] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);

  useEffect(() => {
    if (!ALLOWED) return undefined;
    const choice = readClarityChoice(getStorageSafely());
    if (choice === 'granted') {
      setHasChoice(true);
      startClarity();
    } else if (choice === 'denied') {
      clearFirstPartyClarityCookies(document);
      setHasChoice(true);
    } else {
      // Also remove first-party Clarity cookies if a previous grant expired.
      clearFirstPartyClarityCookies(document);
      setOpen(true);
    }
    const showSettings = () => setOpen(true);
    window.addEventListener('symphoria:analytics-settings', showSettings);
    return () => window.removeEventListener('symphoria:analytics-settings', showSettings);
  }, []);

  const accept = useCallback(() => {
    writeClarityChoice(getStorageSafely(), 'granted');
    setHasChoice(true);
    setOpen(false);
    startClarity();
  }, []);

  const reject = useCallback(() => {
    revokeClarity({ windowObject: window, documentObject: document, storage: getStorageSafely() });
    setHasChoice(true);
    setOpen(false);
  }, []);

  if (!ALLOWED) return null;

  return (
    <>
      {hasChoice && !open ? (
        <button
          className="clarity-preferences"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Cambiar preferencias de analítica"
        >
          Privacidad
        </button>
      ) : null}
      {open ? (
        <section className="clarity-consent" role="dialog" aria-modal="false" aria-labelledby="clarity-consent-title" aria-describedby="clarity-consent-description">
          <div className="clarity-consent__eyebrow">
            <span aria-hidden="true" className="clarity-consent__dot" /> PRIVACIDAD Y MEJORA
          </div>
          <h2 id="clarity-consent-title">¿Nos ayudas a mejorar SymphorIA?</h2>
          <p id="clarity-consent-description">
            Si aceptas, Microsoft Clarity medirá interacciones como clics y desplazamientos y podrá generar
            reproducciones visuales de la interfaz para detectar problemas de usabilidad. La analítica no es
            necesaria para usar SymphorIA. La publicidad permanece desactivada. Los mensajes, títulos de chats,
            datos de cuenta, resultados de A.L.I.A.S. y paneles con información personal están marcados para
            ocultarse; aun así, el enmascaramiento no es una garantía absoluta: no escribas datos sensibles en una
            interfaz que pueda grabarse. Puedes retirar tu consentimiento desde el botón «Privacidad».
          </p>
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
