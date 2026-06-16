const colors = {
  globe: "#0a1a2f",
  globeEmissive: "#0d3b66",
  land: "rgba(24, 214, 196, 0.85)",
  atmosphere: "#18d6c4",
  pointNew: "#00e5ff",
  pointOld: "#ff3df0",
  arcStart: "#00e5ff",
  arcEnd: "#ff3df0",
  label: "#e6fbff",
};

let dataBuffer = [];
const dataRetentionTime = 5 * 60 * 1000;
const maxArcSpokes = 6;
let arcsArray = [];

let ringsArray = [];
const ringLifetime = 2400;

let lastUpdateTime = 0;
const updateInterval = 1000;

const maxDataRows = 100;
let feedTimes = [];

const prefersReducedMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const lerp = (a, b, t) => a + (b - a) * t;
const parseRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const ringRgb = parseRgb(colors.pointNew).join(', ');
const pointNewRgb = parseRgb(colors.pointNew);
const pointOldRgb = parseRgb(colors.pointOld);

const heatColor = (age) => {
  const t = Math.min(1, Math.max(0, age));
  const dim = lerp(1, 0.5, t);
  const r = Math.round(lerp(pointNewRgb[0], pointOldRgb[0], t) * dim);
  const g = Math.round(lerp(pointNewRgb[1], pointOldRgb[1], t) * dim);
  const b = Math.round(lerp(pointNewRgb[2], pointOldRgb[2], t) * dim);
  return `rgb(${r}, ${g}, ${b})`;
};

const arcAltFor = (aLat, aLng, bLat, bLng) => {
  const toR = Math.PI / 180;
  const dLat = (bLat - aLat) * toR;
  const dLng = (bLng - aLng) * toR;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2;
  const ang = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return lerp(0.3, 0.7, ang / Math.PI);
};

const fetchAssets = async () => {
  try {
    const countriesResponse = await fetch('./assets/custom.geo.json');
    const mapResponse = await fetch('./assets/map.json');
    const linesResponse = await fetch('./assets/lines.json');

    const countries = await countriesResponse.json();
    const map = await mapResponse.json();
    const lines = await linesResponse.json();

    initGlobe(countries, map, lines);
  } catch (error) {
    console.error("Error loading assets:", error);
  }
};

let scene, globe, camera, renderer;

const initGlobe = (countries, map, lines) => {
  if (typeof THREE === 'undefined' || typeof ThreeGlobe === 'undefined') {
    console.error("Globe libraries failed to load (THREE or ThreeGlobe missing). Stream text will still render.");
    return;
  }
  try {
  scene = new THREE.Scene();

  globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: true })
    .hexPolygonsData(countries.features)
    .hexPolygonResolution(3)
    .hexPolygonMargin(0.8)
    .hexPolygonColor(() => colors.land)
    .showAtmosphere(true)
    .atmosphereColor(colors.atmosphere)
    .atmosphereAltitude(0.2)
    .arcColor(() => [colors.arcStart, colors.arcEnd])
    .arcAltitude('arcAlt')
    .arcStroke(0.5)
    .arcDashLength(1)
    .arcDashGap(6)
    .arcDashInitialGap(1)
    .arcDashAnimateTime(2000)
    .ringColor(() => (t) => `rgba(${ringRgb}, ${1 - t})`)
    .ringMaxRadius(4)
    .ringPropagationSpeed(4)
    .ringRepeatPeriod(600)
    .onGlobeReady(() => {
      setTimeout(() => {
        const loadingElem = document.querySelector("#loading");
        const containerElem = document.querySelector("#container");
        if (loadingElem) loadingElem.classList.replace("display", "hidden");
        if (containerElem) containerElem.classList.replace("hidden", "display");
      }, 100);
    });

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    './154750.jpg',
    function (texture) {
      scene.background = texture;
    },
    undefined,
    function (error) {
      console.error('Error loading background texture:', error);
    }
  );

  const globeMaterial = globe.globeMaterial();
  globeMaterial.color = new THREE.Color(colors.globe);
  globeMaterial.emissive = new THREE.Color(colors.globeEmissive);
  globeMaterial.emissiveIntensity = 1.4;
  globeMaterial.shininess = 30;

  scene.add(globe);

  const sizes = {
    w: window.innerWidth,
    h: window.innerHeight,
  };

  camera = new THREE.PerspectiveCamera(45, sizes.w / sizes.h);
  if (window.innerWidth < 768) {
    camera.position.set(0, 0, 800); 
  } else {
    camera.position.set(60, 10, 20); 
  }
  scene.add(camera);

  const dlight = new THREE.DirectionalLight(0xffffff, 1.2);
  dlight.position.set(-900, 10, 400);
  camera.add(dlight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const canvas = document.querySelector(".webgl");
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
  });
  renderer.setSize(sizes.w, sizes.h);
  renderer.setPixelRatio(window.devicePixelRatio);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 400;
  controls.maxDistance = 500;

  window.addEventListener("resize", () => {
    sizes.w = window.innerWidth;
    sizes.h = window.innerHeight;

    if (window.innerWidth < 768) {
      camera.position.set(0, 0, 800); 
    } else {
      camera.position.set(60, 10, 20); 
    }

    renderer.setSize(sizes.w, sizes.h);
    camera.aspect = sizes.w / sizes.h;
    camera.updateProjectionMatrix();
  });

  const loop = () => {
    globe.rotation.x = 0;
    globe.rotation.y += 0.0005;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();

  setInterval(() => {
    if (!globe) return;
    const now = Date.now();

    if (ringsArray.length) {
      const before = ringsArray.length;
      ringsArray = ringsArray.filter(r => now - r.ts < ringLifetime);
      if (ringsArray.length !== before) globe.ringsData(ringsArray);
    }

    if (dataBuffer.length) {
      dataBuffer = dataBuffer.filter(item => now - item.timestamp < dataRetentionTime);
      renderHeatLayers();
      if (!dataBuffer.length && arcsArray.length) {
        arcsArray = [];
        globe.arcsData(arcsArray);
      }
    }
  }, 1000);
  } catch (error) {
    console.error("Globe initialization failed; stream text will still render:", error);
    globe = undefined;
  }
};

const connectToStream = () => {
  const streamUrl = 'https://streamer-test-325858668484.us-west1.run.app/stream';
  let eventSource;

  const establishConnection = () => {
    eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => console.log("Stream connection established.");

    eventSource.onmessage = (event) => {
      const raw = event.data;
      if (!raw || raw.charAt(0) === ':') return;
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        return;
      }
      updateGlobeWithStreamData(data);
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      if (eventSource.readyState === EventSource.CLOSED) {
        setTimeout(establishConnection, 5000);
      }
    };
  };

  establishConnection();
};

const relativeTime = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const updateFeedCount = () => {
  const el = document.getElementById('feed-count');
  if (!el) return;
  const now = Date.now();
  feedTimes = feedTimes.filter(t => now - t < dataRetentionTime);
  el.textContent = `${feedTimes.length} in last 5 min`;
};

const renderConnCard = (data) => {
  const dataContent = document.getElementById('data-content');
  if (!dataContent) return;
  const city = (data.city || '').trim();
  if (!city || city.toLowerCase() === 'unknown') return;

  const ts = Date.now();
  feedTimes.push(ts);

  const card = document.createElement('div');
  card.className = 'conn-card';
  card.dataset.ts = ts;

  const dot = document.createElement('span');
  dot.className = 'conn-dot';

  const name = document.createElement('span');
  name.className = 'conn-city';
  name.textContent = city;

  const time = document.createElement('span');
  time.className = 'conn-time';
  time.textContent = relativeTime(ts);

  card.append(dot, name, time);
  dataContent.prepend(card);

  while (dataContent.childElementCount > maxDataRows) {
    dataContent.removeChild(dataContent.lastElementChild);
  }

  updateFeedCount();
};

const startFeedTicker = () => {
  setInterval(() => {
    document.querySelectorAll('#data-content .conn-card').forEach(card => {
      const t = card.querySelector('.conn-time');
      if (t) t.textContent = relativeTime(Number(card.dataset.ts));
    });
    updateFeedCount();
  }, 1000);
};

const hasCity = (item) => {
  const c = (item.city || '').trim().toLowerCase();
  return c && c !== 'unknown';
};

const renderHeatLayers = () => {
  if (!globe) return;
  const now = Date.now();

  globe.pointsData(dataBuffer.map(item => {
    const age = Math.min(1, Math.max(0, (now - item.timestamp) / dataRetentionTime));
    return {
      lat: item.lat,
      lng: item.lon,
      radius: lerp(0.55, 0.18, age),
      alt: lerp(0.1, 0.005, age),
      color: heatColor(age)
    };
  }))
    .pointColor('color')
    .pointRadius('radius')
    .pointAltitude('alt');

  globe.labelsData(dataBuffer.filter(hasCity).map(item => ({
    lat: item.lat + 0.5,
    lng: item.lon,
    text: item.city
  })))
    .labelText('text')
    .labelSize(2)
    .labelColor(() => colors.label)
    .labelAltitude(0.2)
    .labelsTransitionDuration(0);
};

const rebuildArcs = (focusLat, focusLng) => {
  if (!globe || prefersReducedMotion) return;
  const spokes = dataBuffer
    .filter(item => item.lat !== focusLat || item.lon !== focusLng)
    .slice(-maxArcSpokes);
  arcsArray = spokes.map(src => ({
    startLat: src.lat,
    startLng: src.lon,
    endLat: focusLat,
    endLng: focusLng,
    arcAlt: arcAltFor(src.lat, src.lon, focusLat, focusLng)
  }));
  globe.arcsData(arcsArray);
};

const updateGlobeWithStreamData = (data) => {
  if (!data || typeof data !== 'object') return;

  renderConnCard(data);

  const lat = parseFloat(data.lat);
  const lon = parseFloat(data.lon);
  if (isNaN(lat) || isNaN(lon)) return;

  const timestamp = Date.now();
  dataBuffer.push({ ...data, lat, lon, timestamp });
  dataBuffer = dataBuffer.filter(item => timestamp - item.timestamp < dataRetentionTime);

  if (!globe) return;

  if (!prefersReducedMotion) {
    ringsArray.push({ lat, lng: lon, ts: timestamp });
    ringsArray = ringsArray.filter(r => timestamp - r.ts < ringLifetime);
    globe.ringsData(ringsArray);
  }

  if (timestamp - lastUpdateTime >= updateInterval) {
    renderHeatLayers();
    lastUpdateTime = timestamp;
  }

  rebuildArcs(lat, lon);
};

fetchAssets();
connectToStream();
startFeedTicker();
