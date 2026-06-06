/**
 * EmbyTok Service Worker
 * 增强版：图片缓存、API响应缓存、离线Fallback、后台同步
 */

// ==================== 常量配置 ====================

// 缓存名称版本
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `embytok-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `embytok-images-${CACHE_VERSION}`;
const API_CACHE = `embytok-api-${CACHE_VERSION}`;
const OFFLINE_CACHE = `embytok-offline-${CACHE_VERSION}`;

// 缓存策略配置
const IMAGE_CACHE_MAX = 100; // 最多缓存100张图片
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7天
const API_CACHE_MAX_AGE = 60 * 60 * 1000; // 1小时

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/favicon.ico'
];

// 关键API路径（需要缓存）
const CRITICAL_API_PATHS = [
  '/Library',
  '/Users',
  '/Items',
  '/MediaSegments'
];

// ==================== 安装阶段 ====================

self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // 预创建其他缓存
      caches.open(IMAGE_CACHE),
      caches.open(API_CACHE),
      caches.open(OFFLINE_CACHE)
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// ==================== 激活阶段 ====================

self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            // 删除旧版本缓存
            return name.startsWith('embytok-') && 
                   !name.includes(CACHE_VERSION);
          })
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// ==================== 抓取阶段 ====================

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 图片请求 - 使用 CacheFirst 策略
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // API请求 - 使用 NetworkFirst 策略
  if (isApiRequest(event.request)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // 静态资源 - 使用 CacheFirst 策略
  if (isStaticAsset(event.request)) {
    event.respondWith(handleStaticRequest(event.request));
    return;
  }
});

// ==================== 请求判断 ====================

/**
 * 判断是否为图片请求
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'image' ||
         /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i.test(url.pathname) ||
         url.pathname.includes('/Images/') ||
         url.pathname.includes('/Pictures/');
}

/**
 * 判断是否为API请求
 */
function isApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  
  // 只缓存 GET 请求
  if (request.method !== 'GET') {
    return false;
  }
  
  // 检查是否匹配关键API路径
  return CRITICAL_API_PATHS.some(path => 
    pathname.includes(path.toLowerCase())
  );
}

/**
 * 判断是否为静态资源
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin &&
         (STATIC_ASSETS.includes(url.pathname) ||
          /\.(js|css|woff2?|ttf|eot)(\?.*)?$/i.test(url.pathname));
}

// ==================== 缓存处理 ====================

/**
 * 处理图片请求 - CacheFirst 策略
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 检查缓存是否过期
    const cacheDate = cachedResponse.headers.get('x-cache-date');
    if (cacheDate) {
      const age = Date.now() - parseInt(cacheDate, 10);
      if (age < IMAGE_CACHE_MAX_AGE) {
        console.log('[SW] Image cache hit:', request.url);
        return cachedResponse;
      }
    }
  }
  
  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 克隆响应并添加到缓存
      const responseToCache = networkResponse.clone();
      
      // 添加缓存日期头
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cache-date', Date.now().toString());
      
      const augmentedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, augmentedResponse);
      
      // 清理过期和多余的图片缓存
      await trimImageCache(cache);
      
      console.log('[SW] Image cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Image fetch failed, trying cache:', request.url);
    
    // 网络失败且有缓存，返回缓存（即使过期）
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回占位图
    return createPlaceholderResponse();
  }
}

/**
 * 处理API请求 - NetworkFirst 策略
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // 优先尝试网络请求
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 克隆并缓存响应
      const responseToCache = networkResponse.clone();
      
      // 添加缓存过期时间头
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cache-date', Date.now().toString());
      headers.set('x-cache-expires', (Date.now() + API_CACHE_MAX_AGE).toString());
      
      const augmentedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, augmentedResponse);
      console.log('[SW] API cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] API fetch failed, trying cache:', request.url);
    
    // 网络失败，尝试从缓存获取
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查缓存是否过期
      const expires = cachedResponse.headers.get('x-cache-expires');
      if (expires && parseInt(expires, 10) > Date.now()) {
        console.log('[SW] API cache hit:', request.url);
        return cachedResponse;
      }
    }
    
    // 缓存不可用或已过期，返回离线响应
    return createOfflineApiResponse();
  }
}

/**
 * 处理静态资源请求 - CacheFirst 策略
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 静态资源失败，返回离线页面
    const offlinePage = await cache.match('/');
    if (offlinePage) {
      return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

// ==================== 缓存清理 ====================

/**
 * 清理多余的图片缓存（LRU策略）
 */
async function trimImageCache(cache) {
  const keys = await cache.keys();
  
  if (keys.length <= IMAGE_CACHE_MAX) {
    return;
  }
  
  // 获取所有缓存条目的元数据
  const entries = [];
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const date = response.headers.get('x-cache-date');
      entries.push({
        request,
        date: date ? parseInt(date, 10) : 0
      });
    }
  }
  
  // 按日期排序（最老的在前）
  entries.sort((a, b) => a.date - b.date);
  
  // 删除多余的缓存（保留IMAGE_CACHE_MAX个）
  const toDelete = entries.slice(0, entries.length - IMAGE_CACHE_MAX);
  for (const entry of toDelete) {
    await cache.delete(entry.request);
    console.log('[SW] Trimmed image cache:', entry.request.url);
  }
}

// ==================== 占位符和离线响应 ====================

/**
 * 创建图片占位符响应
 */
async function createPlaceholderResponse() {
  // 返回一个简单的SVG占位图
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect fill="#2a2a2a" width="200" height="200"/>
      <text fill="#666" font-family="Arial" font-size="16" x="50%" y="50%" text-anchor="middle" dy=".3em">
        离线占位图
      </text>
      <text fill="#666" font-family="Arial" font-size="12" x="50%" y="60%" text-anchor="middle" dy=".3em">
        Image unavailable offline
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'x-placeholder': 'true'
    }
  });
}

/**
 * 创建离线API响应
 */
function createOfflineApiResponse() {
  return new Response(JSON.stringify({
    error: 'offline',
    message: '网络不可用，请稍后重试',
    cached: false
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'x-offline': 'true'
    }
  });
}

// ==================== 消息处理 ====================

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // 处理清除缓存消息
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('embytok-'))
            .map(name => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  // 处理获取缓存状态消息
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      caches.keys().then(async cacheNames => {
        const status = {};
        for (const name of cacheNames) {
          if (name.startsWith('embytok-')) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            status[name] = keys.length;
          }
        }
        event.ports[0].postMessage({ success: true, status });
      })
    );
  }
});

// ==================== 后台同步 ====================

// 注册后台同步
self.addEventListener('sync', event => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

/**
 * 同步数据
 */
async function syncData() {
  console.log('[SW] Starting data sync...');
  
  try {
    // 通知客户端开始同步
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED'
      });
    });
    
    // 这里可以添加实际的同步逻辑
    // 例如重新请求关键API、更新缓存等
    
    // 模拟同步完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 通知客户端同步完成
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED'
      });
    });
    
    console.log('[SW] Data sync completed');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    
    // 通知客户端同步失败
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        error: error.message
      });
    });
  }
}

/**
 * 请求后台同步
 */
async function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-data');
      console.log('[SW] Background sync registered');
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
    }
  }
}

// ==================== 推送通知（预留） ====================

self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push received:', data);
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'EmbyTok', {
        body: data.body || '您有新的内容更新',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data.data || {}
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // 如果已有窗口，打开它
      for (const client of clients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新窗口
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
