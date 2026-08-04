import { useEffect, useRef, useCallback } from 'react';
import { stripEphemeralMediaFields } from '../utils/mediaUrl';

const DRAFT_DEBOUNCE_MS = 500;

/**
 * Brouillon auto-sauvegardé dans localStorage (règle UX #5).
 * Les URLs data:/blob: ne sont jamais persistées (évite un submit cassé après refresh).
 * @param {string} storageKey - clé unique (ex. afboxing_draft_news)
 * @param {object} data - données du formulaire
 * @param {{ enabled?: boolean, onRestore?: (data: object) => void, mediaKeys?: string[] }} options
 */
export function useFormDraft(storageKey, data, options = {}) {
  const { enabled = true, onRestore, mediaKeys = ['image', 'photo', 'src'] } = options;
  const restoredRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    restoredRef.current = false;
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw && onRestore) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          onRestore(stripEphemeralMediaFields(parsed, mediaKeys));
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, enabled, onRestore, mediaKeys]);

  useEffect(() => {
    if (!enabled) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      try {
        const safe = stripEphemeralMediaFields(data, mediaKeys);
        localStorage.setItem(storageKey, JSON.stringify(safe));
      } catch {
        /* quota dépassé — ignoré */
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [storageKey, data, enabled, mediaKeys]);

  const clearDraft = useCallback(() => {
    skipNextSaveRef.current = true;
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { clearDraft };
}
