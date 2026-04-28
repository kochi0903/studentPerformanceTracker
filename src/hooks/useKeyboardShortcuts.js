import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle keyboard shortcuts.
 * @param {Object.<string, function>} shortcuts - Object mapping key combinations to handlers.
 * Example: { '/': () => searchRef.current.focus(), '?': () => setHelpOpen(true) }
 */
export const useKeyboardShortcuts = (shortcuts) => {
  // Use a ref to store handlers to avoid re-registering the event listener
  // whenever the shortcuts object (often an object literal) changes.
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const activeElement = document.activeElement;
      const isInput = activeElement.tagName === 'INPUT' || 
                      activeElement.tagName === 'TEXTAREA' || 
                      activeElement.isContentEditable;
      
      // Allow Escape key to always fire (e.g., to close modals)
      if (isInput && event.key !== 'Escape') {
        return;
      }

      const handler = shortcutsRef.current[event.key];
      if (handler) {
        // Prevent default browser behavior if needed (e.g., search focus)
        // We handle this inside the handler if needed, but common ones are here
        if (['/', '?'].includes(event.key)) {
          event.preventDefault();
        }
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Only register once
};
