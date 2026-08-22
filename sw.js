const CACHE_NAME = "training-checkin-v10";
const EXERCISE_PAIRS = [
  "bicep-curl",
  "chest-press-machine",
  "chest-supported-db-row",
  "crunches",
  "dumbbell-reverse-fly",
  "hack-squat",
  "hip-abduction",
  "hip-thrust",
  "lat-pulldown",
  "lateral-raise",
  "leg-press",
  "machine-calf-raise",
  "seated-dumbbell-lateral-raise",
  "seated-leg-curl",
  "smith-machine-incline-bench-press",
  "tricep-pushdown",
  "v-bar-lat-pulldown",
  "wide-grip-seated-cable-row",
].flatMap((slug) => [
  `./assets/exercises/${slug}-start.webp`,
  `./assets/exercises/${slug}-peak.webp`,
]);
const EXERCISE_SINGLES = [
  "./assets/exercises/air-bike-main.webp",
  "./assets/exercises/breaststroke.gif",
  "./assets/exercises/butterfly-stretch-main.webp",
  "./assets/exercises/plank-main.webp",
  "./assets/exercises/walking-treadmill-start.jpg",
  "./assets/exercises/walking-treadmill-peak.jpg",
];
const FREE_DB_PAIRS = [
  "assisted-dip",
  "hammer-curl",
  "leg-extension",
  "low-cable-fly",
  "narrow-neutral-row",
  "overhead-triceps",
  "rear-delt-extension",
  "reverse-grip-pulldown",
  "shoulder-press",
  "straight-arm-pulldown",
  "upper-back-row",
].flatMap((slug) => [
  `./assets/exercises/${slug}-start.jpg`,
  `./assets/exercises/${slug}-peak.jpg`,
]);
const MUSCLE_MAPS = [
  "back-pull",
  "biceps",
  "calves",
  "cardio-lower",
  "chest-push",
  "core",
  "glutes",
  "hamstrings",
  "hip-abductors",
  "mobility",
  "quads-glutes",
  "rear-delts",
  "recovery",
  "side-delts",
  "swim-full",
  "triceps",
].map((slug) => `./assets/muscles/${slug}.svg`);
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=10",
  "./app.js?v=10",
  "./guides.js?v=10",
  "./experience.js?v=10",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  ...EXERCISE_PAIRS,
  ...EXERCISE_SINGLES,
  ...FREE_DB_PAIRS,
  ...MUSCLE_MAPS,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
