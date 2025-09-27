// Script to clear service worker and caches
// Run this in browser console if needed

async function clearServiceWorker() {
  console.log('🧹 Starting Service Worker cleanup...');

  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        const success = await registration.unregister();
        console.log(`✅ Unregistered service worker:`, registration.scope, success);
      }
    }

    // 2. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const success = await caches.delete(cacheName);
        console.log(`🗑️ Deleted cache:`, cacheName, success);
      }
    }

    // 3. Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('📦 Cleared local and session storage');

    console.log('✨ Service Worker cleanup complete!');
    console.log('🔄 Please reload the page to continue');

    // Optional: Auto reload after 1 second
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  clearServiceWorker();
}