// Advanced PWA Service Worker with offline support
const CACHE_NAME = 'workflow-ats-v2.0.0';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const IMAGE_CACHE = 'images-v2';

// 캐시할 정적 자원들
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/manifest.json',
  
  // CSS
  '/src/assets/css/base/reset.css',
  '/src/assets/css/base/variables.css',
  '/src/assets/css/base/typography.css',
  '/src/assets/css/base/accessibility.css',
  '/src/assets/css/layout/header.css',
  '/src/assets/css/layout/sidebar.css',
  '/src/assets/css/layout/main.css',
  '/src/assets/css/components/buttons.css',
  '/src/assets/css/components/forms.css',
  '/src/assets/css/components/modals.css',
  '/src/assets/css/components/tables.css',
  '/src/assets/css/components/cards.css',
  '/src/assets/css/components/badges.css',
  '/src/assets/css/components/navigation.css',
  '/src/assets/css/components/calendar.css',
  '/src/assets/css/components/file-upload.css',
  '/src/assets/css/themes/light.css',
  '/src/assets/css/themes/dark.css',
  
  // JS 핵심 파일들
  '/src/js/main.js',
  '/src/js/core/app.js',
  '/src/js/core/router.js',
  '/src/js/services/auth-service.js',
  '/src/js/services/storage-service.js'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 페치 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;
  
  if (method !== 'GET') return;
  
  const urlObj = new URL(url);
  const isHttp = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  const isSameOrigin = urlObj.origin === self.location.origin;
  
  if (!isHttp || !isSameOrigin) return;

  // 캐시 전략 결정
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImageAsset(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// 캐시 우선 전략
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone()).catch(() => {});
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// 네트워크 우선 전략
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(DYNAMIC_CACHE);
      // 동적 캐시 크기 제한
      const keys = await cache.keys();
      if (keys.length >= 50) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone()).catch(() => {});
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Network error', { status: 503 });
  }
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

// 푸시 알림
self.addEventListener('push', (event) => {
  const options = {
    body: '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'ats-notification',
    requireInteraction: false
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'WorkFlow ATS';
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title || 'WorkFlow ATS', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard.html');
      }
    })
  );
});

// 메시지 이벤트
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 유틸리티 함수들
function isStaticAsset(url) {
  return url.includes('/src/assets/') || 
         url.includes('/src/js/') || 
         url.includes('/src/templates/') ||
         url.includes('.html') ||
         url.includes('fonts.googleapis.com');
}

function isImageAsset(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url);
}

async function syncOfflineData() {
  try {
    // 오프라인 중 저장된 데이터 동기화 로직
    console.log('[SW] Syncing offline data...');
    
    // LocalStorage에서 대기 중인 데이터 확인
    const syncData = await getSyncData();
    if (syncData.length > 0) {
      await uploadSyncData(syncData);
      await clearSyncData();
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function getSyncData() {
  // 실제 구현에서는 IndexedDB 사용
  return [];
}

async function uploadSyncData(data) {
  // 서버로 데이터 전송
  return fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

async function clearSyncData() {
  // 동기화된 데이터 정리
}


