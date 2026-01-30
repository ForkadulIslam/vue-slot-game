import { ref, onMounted, onUnmounted } from 'vue';

/**
 * A Vue 3 composable to manage the Screen Wake Lock API.
 * This prevents the device screen from dimming or locking while the app is active.
 */
export function useScreenWakeLock() {
  // Check if the Screen Wake Lock API is supported by the browser
  const isSupported = 'wakeLock' in navigator;
  let wakeLock = null;
  
  // A reactive reference to track the lock status
  const isLocked = ref(false);

  // Function to request the screen wake lock
  const requestLock = async () => {
    if (!isSupported) {
      console.warn('Screen Wake Lock API is not supported on this browser.');
      return;
    }
    try {
      // Request a 'screen' wake lock
      wakeLock = await navigator.wakeLock.request('screen');
      isLocked.value = true;
      console.log('Screen Wake Lock is active.');

      // Listen for the 'release' event, which can happen when the tab is hidden
      wakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock was released automatically.');
        isLocked.value = false;
        wakeLock = null;
      });
    } catch (err) {
      console.error(`Screen Wake Lock failed: ${err.name}, ${err.message}`);
      isLocked.value = false;
    }
  };

  // Function to manually release the lock
  const releaseLock = async () => {
    if (!wakeLock || !isSupported) {
      return;
    }
    try {
      await wakeLock.release();
      isLocked.value = false;
      wakeLock = null;
      console.log('Screen Wake Lock was released manually.');
    } catch (err) {
      console.error(`Failed to release Screen Wake Lock: ${err.name}, ${err.message}`);
    }
  };
  
  // This function is called when the page visibility changes.
  // If the page becomes visible again, we should try to re-acquire the lock.
  const handleVisibilityChange = () => {
    if (wakeLock === null && document.visibilityState === 'visible') {
      requestLock();
    }
  };

  onMounted(() => {
    // We no longer request the lock automatically on mount.
    // It must be triggered by a user action.
    // We only add the listener to re-acquire the lock if the page loses visibility.
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    // Release the lock when the component is unmounted to save battery
    releaseLock();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    isSupported,
    isLocked,
    requestLock,
    releaseLock,
  };
}
