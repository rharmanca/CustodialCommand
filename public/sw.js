const CACHE_NAME = 'custodial-command-v3';
const OFFLINE_FORMS_KEY = 'offline-forms';
const SYNC_QUEUE_KEY = 'sync-queue';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/src/assets/assets_task_01k0ah80j5ebdamsccd7rpnaeh_1752700412_img_0_1752768056345.webp',
  '/src/assets/assets_task_01k0ahgtr1egvvpjk9qvwtzvyg_1752700690_img_1_1752767788234.webp'
];

// Enhanced offline form storage
class OfflineFormManager {
  static async storeForm(formData, endpoint) {
    const forms = await this.getStoredForms();
    const formId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    forms[formId] = {
      id: formId,
      data: formData,
      endpoint: endpoint,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };
    
    await this.saveForms(forms);
    return formId;
  }
  
  static async getStoredForms() {
    try {
      const forms = await self.registration.sync.get(OFFLINE_FORMS_KEY);
      return forms || {};
    } catch (error) {
      console.error('Error getting stored forms:', error);
      return {};
    }
  }
  
  static async saveForms(forms) {
    try {
      await self.registration.sync.set(OFFLINE_FORMS_KEY, forms);
    } catch (error) {
      console.error('Error saving forms:', error);
    }
  }
  
  static async removeForm(formId) {
    const forms = await this.getStoredForms();
    delete forms[formId];
    await this.saveForms(forms);
  }
}

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell and assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('App shell cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Background sync for offline forms
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(syncOfflineForms());
  }
});

// Sync offline forms when connection is restored
async function syncOfflineForms() {
  try {
    const forms = await OfflineFormManager.getStoredForms();
    const formIds = Object.keys(forms);
    
    console.log(`Syncing ${formIds.length} offline forms`);
    
    for (const formId of formIds) {
      const form = forms[formId];
      if (form.status === 'pending' && form.retryCount < 3) {
        try {
          const response = await fetch(form.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(form.data)
          });
          
          if (response.ok) {
            console.log(`Successfully synced form ${formId}`);
            await OfflineFormManager.removeForm(formId);
            
            // Notify client of successful sync
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              client.postMessage({
                type: 'FORM_SYNC_SUCCESS',
                formId: formId,
                data: form.data
              });
            });
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`Failed to sync form ${formId}:`, error);
          form.retryCount++;
          if (form.retryCount >= 3) {
            form.status = 'failed';
            console.error(`Form ${formId} failed after 3 retries`);
          }
          await OfflineFormManager.saveForms(forms);
        }
      }
    }
  } catch (error) {
    console.error('Error during background sync:', error);
  }
}

// Enhanced fetch event with offline form handling
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests with offline form storage
  if (event.request.url.includes('/api/') && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            return response;
          }
          throw new Error(`HTTP ${response.status}`);
        })
        .catch(async () => {
          // Network failed, store form for later sync
          try {
            const formData = await event.request.clone().json();
            const formId = await OfflineFormManager.storeForm(formData, event.request.url);
            
            console.log(`Stored form offline: ${formId}`);
            
            // Register for background sync
            await self.registration.sync.register('background-sync');
            
            // Return success response to user
            return new Response(JSON.stringify({
              success: true,
              message: 'Form saved offline and will be submitted when connection is restored',
              offline: true,
              formId: formId
            }), {
              status: 202,
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.error('Error storing form offline:', error);
            return new Response(JSON.stringify({
              success: false,
              message: 'Failed to save form offline'
            }), {
              status: 503,
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // For navigation requests, return the cached index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // Return offline page for other requests
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Offline - Custodial Command</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      margin: 0;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                    }
                    .offline-container {
                      text-align: center;
                      padding: 2rem;
                      background: rgba(255,255,255,0.1);
                      border-radius: 1rem;
                      backdrop-filter: blur(10px);
                    }
                    .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
                    .offline-title { font-size: 1.5rem; margin-bottom: 1rem; }
                    .offline-message { opacity: 0.9; margin-bottom: 2rem; }
                    .retry-btn {
                      background: rgba(255,255,255,0.2);
                      border: 2px solid rgba(255,255,255,0.3);
                      color: white;
                      padding: 0.75rem 1.5rem;
                      border-radius: 0.5rem;
                      cursor: pointer;
                      font-size: 1rem;
                    }
                    .retry-btn:hover { background: rgba(255,255,255,0.3); }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <div class="offline-icon">📱</div>
                    <div class="offline-title">You're Offline</div>
                    <div class="offline-message">
                      Don't worry! Your forms are saved locally and will be submitted when you're back online.
                    </div>
                    <button class="retry-btn" onclick="window.location.reload()">
                      Try Again
                    </button>
                  </div>
                </body>
              </html>
            `, {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            });
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_OFFLINE_FORMS') {
    OfflineFormManager.getStoredForms().then(forms => {
      event.ports[0].postMessage({
        type: 'OFFLINE_FORMS_RESPONSE',
        forms: forms
      });
    });
  }
});