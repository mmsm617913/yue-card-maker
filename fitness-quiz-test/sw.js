const BUILD="20260905-v08";
const CACHE=`yue-fit-personal-${BUILD}`;
const ASSETS=["./", "./index.html", "./style.css", "./app.js", "./loader.js", "./manifest.webmanifest", "./data-01.js", "./data-02.js", "./data-03.js", "./data-04.js", "./data-05.js", "./data-06.js", "../icon-192.png", "../icon-512.png"];

self.addEventListener("install",e=>{e.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  for(const path of ASSETS){
    const url=new URL(path,self.location.href);
    url.searchParams.set("v",BUILD);
    const response=await fetch(new Request(url,{cache:"reload"}));
    if(!response.ok)throw new Error(`cache install failed: ${path}`);
    await cache.put(new Request(path),response);
  }
  await self.skipWaiting();
})())});

self.addEventListener("activate",e=>{e.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith("yue-fit-personal-")&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})())});

self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
    const fresh=await fetch(e.request);
    if(fresh.ok&&new URL(e.request.url).origin===self.location.origin)await cache.put(e.request,fresh.clone());
    return fresh;
  }catch(err){
    const cached=await cache.match(e.request,{ignoreSearch:true});
    if(cached)return cached;
    if(e.request.mode==="navigate")return cache.match("./index.html");
    throw err;
  }
})())});
