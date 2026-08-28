const CACHE = "yue-card-maker-v8-tv-sound-pages";
const SCOPE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const scoped = path => `${SCOPE}${path}`;
const CORE = [
  "/", "/games", "/manifest.webmanifest", "/favicon.svg", "/icon-192.png", "/icon-512.png",
  "/balls/football.png", "/balls/shuttlecock.png", "/balls/bowling.png", "/balls/tennis.png", "/balls/golf.png", "/balls/basketball.png", "/balls/billiard.png", "/balls/baseball.png", "/balls/soccer.png",
  "/space/sun.png", "/space/mercury.png", "/space/venus.png", "/space/earth.png", "/space/moon.png", "/space/mars.png", "/space/jupiter.png", "/space/saturn.png", "/space/neptune.png",
  "/animals/dog.png", "/animals/cat.png", "/animals/rabbit.png", "/animals/elephant.png", "/animals/lion.png", "/animals/giraffe.png", "/animals/panda.png", "/animals/monkey.png", "/animals/cow.png",
  "/animals-v2/eagle.webp", "/animals-v2/parrot.webp", "/animals-v2/butterfly.webp", "/animals-v2/dolphin.webp", "/animals-v2/sea-turtle.webp", "/animals-v2/clownfish.webp",
  "/space-v2/sun.webp", "/space-v2/earth.webp", "/space-v2/moon.webp", "/space-v2/mercury.webp", "/space-v2/venus.webp", "/space-v2/mars.webp", "/space-v2/jupiter.webp", "/space-v2/saturn.webp", "/space-v2/neptune.webp",
  "/hakka/hakka-rice-noodles.webp", "/hakka/cabbage-pork-knuckle.webp", "/hakka/stir-fried-water-snowflake.webp", "/hakka/ginger-pork-intestine.webp", "/hakka/pickled-mustard-tripe-soup.webp", "/hakka/pickled-white-radish.webp", "/hakka/red-bean-ice.webp", "/hakka/brown-sugar-sweet-rice-cake.webp", "/hakka/peanut-mochi.webp"
].map(scoped);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    const page = await fetch(scoped("/"));
    const html = await page.clone().text();
    await cache.put(scoped("/"), page);
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(match => match[1])
      .filter(url => url.startsWith(SCOPE || "/") && !CORE.includes(url));
    await Promise.allSettled(assets.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(url.pathname, copy)); return response;
    }).catch(() => caches.match(url.pathname).then(cached => cached || caches.match(scoped("/")))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  })));
});
