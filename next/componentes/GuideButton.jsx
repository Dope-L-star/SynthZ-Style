'use client';

import { useCallback } from 'react';

/**
 * React owns the Guide button event. The existing guide engine is invoked through
 * a narrow bridge exposed by chat.js, so it keeps its walkthrough and topic picker.
 */
export default function GuideButton({ children, ...attributes }) {
  const onClick = useCallback(() => {
    if (typeof window === 'undefined') return;
    const openGuide = window.SymphoriaOpenGuide;
    if (typeof openGuide === 'function') {
      window.__symphoriaGuideQueued = false;
      openGuide();
      return;
    }
    // Set the durable flag before dispatch: a React click can happen just before
    // LegacyRuntime subscribes to the custom event during hydration.
    window.__symphoriaGuideQueued = true;
    window.dispatchEvent(new CustomEvent('symphoria:guide-request'));
  }, []);

  return <button {...attributes} data-react-component="guide" onClick={onClick}>{children}</button>;
}
