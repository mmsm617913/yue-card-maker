const CACHE="yue-fit-personal-v07-20260905";
const ASSETS=["./", "./index.html", "./style.css", "./app.js", "./loader.js", "./manifest.webmanifest", "./data-01.js", "./data-02.js", "./data-03.js", "./data-04.js", "./data-05.js", "./data-06.js", "../icon-192.png", "../icon-512.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith((async()=>{const cached=await caches.match(e.request);if(cached)return cached;try{const fresh=await fetch(e.request);if(new URL(e.request.url).origin===self.location.origin){const c=await caches.open(CACHE);c.put(e.request,fresh.clone())}return fresh}catch(err){if(e.request.mode==="navigate")return caches.match("./index.html");throw err}})())});
