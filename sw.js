// 1. Mude esta versão sempre que alterar o index, script, db ou css!
const CACHE_NAME = 'dellys-app-v2'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './db.js',
  './manifest.json',
  './logo.png'
];

// Instalação: Salva a nova versão dos arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Força o novo SW a assumir imediatamente sem esperar fechar a aba
  self.skipWaiting();
});

// Ativação: LIMPA OS CACHES ANTIGOS automaticamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições (Cache First / Network Fallback)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
