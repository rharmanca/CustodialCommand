/**
 * Keyboard Navigation Detector
 * Detects keyboard navigation and adds appropriate class to body
 * Enhances accessibility by showing focus indicators only for keyboard users
 */

export function initKeyboardNavigationDetector(): () => void {
  let isKeyboardNavigation = false;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Tab, Arrow keys, Enter, Space indicate keyboard navigation
    if (
      e.key === 'Tab' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Enter' ||
      e.key === ' '
    ) {
      if (!isKeyboardNavigation) {
        isKeyboardNavigation = true;
        document.body.classList.add('keyboard-navigation');
      }
    }
  };

  const handleMouseDown = () => {
    if (isKeyboardNavigation) {
      isKeyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    }
  };

  const handleTouchStart = () => {
    if (isKeyboardNavigation) {
      isKeyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    }
  };

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('touchstart', handleTouchStart);

  // Cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('touchstart', handleTouchStart);
  };
}
