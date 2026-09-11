/**
 * Google Translate Programmatic Controller
 * Drives the hidden Google Translate widget without showing Google's
 * default yellow toolbar — uses our own language selector UI instead.
 */

import { SupportedLanguage } from '@/types/domain';

/** Maps our app's SupportedLanguage codes to Google Translate language codes */
export const GT_LANG_MAP: Record<SupportedLanguage, string> = {
  EN: 'en',
  HI: 'hi',
  MR: 'mr',
  SA: 'sa',
};

/**
 * Sets the `googtrans` cookie used by Google Translate to pick the target language.
 * The cookie format is `/sourceLanguage/targetLanguage`.
 */
function setGoogTransCookie(targetLang: string) {
  const value = `/en/${targetLang}`;
  const hostname = window.location.hostname;
  document.cookie = `googtrans=${value}; path=/; domain=${hostname}`;
  document.cookie = `googtrans=${value}; path=/`;
}

/**
 * Clears the googtrans cookie and restores the original (English) page.
 */
function clearGoogTransCookie() {
  const hostname = window.location.hostname;
  document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `googtrans=; path=/; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Programmatically changes the Google Translate selected language.
 * Finds the hidden <select> injected by the GT widget and fires a change event.
 */
export function applyGoogleTranslate(language: SupportedLanguage): void {
  if (typeof window === 'undefined') return;

  const gtLang = GT_LANG_MAP[language];

  // ── Restore to English ────────────────────────────────────────────────────
  if (gtLang === 'en') {
    clearGoogTransCookie();

    // Try GT's restore API first (no reload needed)
    const win = window as any;
    if (win.google?.translate?.TranslateElement) {
      try {
        const el = document.getElementById('google_translate_element');
        if (el) {
          const selectEl = document.querySelector<HTMLSelectElement>('.goog-te-combo');
          if (selectEl) {
            selectEl.value = 'en';
            selectEl.dispatchEvent(new Event('change'));
            return;
          }
        }
      } catch { /* ignore */ }
    }

    // Fallback: reload (cookie cleared, so page comes back in English)
    window.location.reload();
    return;
  }

  // ── Switch to target language ─────────────────────────────────────────────
  setGoogTransCookie(gtLang);

  // Method 1: Manipulate the hidden combo box Google injects
  const selectEl = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (selectEl) {
    selectEl.value = gtLang;
    selectEl.dispatchEvent(new Event('change'));
    return;
  }

  // Method 2: Fallback — reload; cookie triggers auto-translate on load
  window.location.reload();
}

/** Returns true if the Google Translate script has fully initialised */
export function isGoogleTranslateLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).google?.translate?.TranslateElement;
}
