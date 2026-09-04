const CACHE="yue-fit-v04-20260905";
const ASSETS=["./", "./index.html", "./style.css", "./app-1.js", "./app-2.js", "./questions-loader.js", "./manifest.webmanifest", "../icon-192.png", "../icon-512.png", "./qd-01.js", "./qd-02.js", "./qd-03.js", "./qd-04.js", "./qd-05.js", "./qd-06.js", "./qd-07.js", "./qd-08.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith((async()=>{const c=await caches.match(e.request);if(c)return c;try{const r=await fetch(e.request);if(new URL(e.request.url).origin===self.location.origin){const cache=await caches.open(CACHE);cache.put(e.request,r.clone())}return r}catch(err){return caches.match("./index.html")}})())});
