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
let feedLog = [];

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

const hideLoading = () => {
  const loadingElem = document.querySelector("#loading");
  if (loadingElem) loadingElem.classList.replace("display", "hidden");
};

const fetchAssets = async () => {
  try {
    const countriesResponse = await fetch('./assets/custom.geo.json');
    const countries = await countriesResponse.json();
    initGlobe(countries);
  } catch (error) {
    hideLoading();
  }
};

let scene, globe, camera, renderer, controls;
let autoRotateTimer;

const stopAutoRotate = () => {
  clearTimeout(autoRotateTimer);
  if (controls) controls.autoRotate = false;
};

const queueAutoRotateResume = () => {
  clearTimeout(autoRotateTimer);
  if (prefersReducedMotion) return;
  autoRotateTimer = setTimeout(() => {
    if (controls) controls.autoRotate = true;
  }, 5000);
};

const initGlobe = (countries) => {
  if (typeof THREE === 'undefined' || typeof ThreeGlobe === 'undefined') {
    hideLoading();
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
      setTimeout(hideLoading, 100);
    });

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('./background.webp', function (texture) {
    scene.background = texture;
  });

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

  controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 400;
  controls.maxDistance = 500;
  controls.autoRotate = !prefersReducedMotion;
  controls.autoRotateSpeed = 0.3;
  controls.addEventListener('start', stopAutoRotate);
  controls.addEventListener('end', queueAutoRotateResume);

  canvas.addEventListener('keydown', (e) => {
    if (!globe) return;
    const step = 0.12;
    if (e.key === 'ArrowLeft') {
      globe.rotation.y -= step;
    } else if (e.key === 'ArrowRight') {
      globe.rotation.y += step;
    } else if (e.key === 'ArrowUp') {
      globe.rotation.x = Math.max(globe.rotation.x - step, -0.6);
    } else if (e.key === 'ArrowDown') {
      globe.rotation.x = Math.min(globe.rotation.x + step, 0.6);
    } else {
      return;
    }
    e.preventDefault();
  });

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
    hideLoading();
    globe = undefined;
  }
};

const pulseAt = (lat, lng) => {
  if (!globe || prefersReducedMotion) return;
  ringsArray.push({ lat, lng, ts: Date.now() });
  globe.ringsData(ringsArray);
  rebuildArcs(lat, lng);
};

const focusLocation = (lat, lng) => {
  if (!globe || !camera || !controls) return;
  const c = globe.getCoords(lat, lng, 0);
  const p = new THREE.Vector3(c.x, c.y, c.z).applyEuler(globe.rotation);
  const dist = Math.min(Math.max(camera.position.length(), controls.minDistance), controls.maxDistance);
  camera.position.copy(p.normalize().multiplyScalar(dist));
  stopAutoRotate();
  queueAutoRotateResume();
  controls.update();
  pulseAt(lat, lng);
};

let eventSource;
let retryDelay = 2000;
let retryTimer;
const retryDelayMax = 60000;
const streamUrl = 'https://streamer-test-325858668484.us-west1.run.app/stream';

const establishConnection = () => {
  if (document.hidden) return;
  eventSource = new EventSource(streamUrl);

  eventSource.onopen = () => {
    retryDelay = 2000;
  };

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

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(establishConnection, retryDelay);
      retryDelay = Math.min(retryDelay * 2, retryDelayMax);
    }
  };
};

const connectToStream = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(retryTimer);
      if (eventSource) eventSource.close();
    } else if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
      retryDelay = 2000;
      establishConnection();
    }
  });
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

const updateFeedStats = () => {
  const now = Date.now();
  feedLog = feedLog.filter(e => now - e.ts < dataRetentionTime);

  const countEl = document.getElementById('feed-count');
  if (countEl) countEl.textContent = `${feedLog.length} in last 5 min`;

  const topEl = document.getElementById('feed-top');
  if (topEl) {
    const tally = {};
    let top = '';
    let max = 0;
    feedLog.forEach(e => {
      tally[e.city] = (tally[e.city] || 0) + 1;
      if (tally[e.city] > max) {
        max = tally[e.city];
        top = e.city;
      }
    });
    topEl.textContent = max > 1 ? `Most active: ${top}` : '';
  }
};

const renderConnCard = (data, lat, lon) => {
  const dataContent = document.getElementById('data-content');
  if (!dataContent) return;
  const city = (data.city || '').trim();
  if (!city || city.toLowerCase() === 'unknown') return;

  const ts = Date.now();
  feedLog.push({ ts, city });

  const first = dataContent.firstElementChild;
  if (first && first.dataset.city === city) {
    const n = Number(first.dataset.count) + 1;
    first.dataset.count = n;
    first.dataset.ts = ts;
    const countEl = first.querySelector('.conn-count');
    if (countEl) countEl.textContent = `x${n}`;
    const timeEl = first.querySelector('.conn-time');
    if (timeEl) timeEl.textContent = relativeTime(ts);
    updateFeedStats();
    return;
  }

  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'conn-card';
  card.dataset.ts = ts;
  card.dataset.city = city;
  card.dataset.count = 1;

  const dot = document.createElement('span');
  dot.className = 'conn-dot';

  const name = document.createElement('span');
  name.className = 'conn-city';
  name.textContent = city;

  const count = document.createElement('span');
  count.className = 'conn-count';

  const time = document.createElement('span');
  time.className = 'conn-time';
  time.textContent = relativeTime(ts);

  card.append(dot, name, count, time);

  if (lat !== null && lon !== null) {
    card.dataset.lat = lat;
    card.dataset.lon = lon;
    card.addEventListener('click', () => {
      focusLocation(parseFloat(card.dataset.lat), parseFloat(card.dataset.lon));
    });
  }

  dataContent.prepend(card);

  while (dataContent.childElementCount > maxDataRows) {
    dataContent.removeChild(dataContent.lastElementChild);
  }

  updateFeedStats();
};

const startFeedTicker = () => {
  setInterval(() => {
    document.querySelectorAll('#data-content .conn-card').forEach(card => {
      const t = card.querySelector('.conn-time');
      if (t) t.textContent = relativeTime(Number(card.dataset.ts));
    });
    updateFeedStats();
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

  const lat = parseFloat(data.lat);
  const lon = parseFloat(data.lon);
  const valid = Number.isFinite(lat) && Number.isFinite(lon) &&
    Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  renderConnCard(data, valid ? lat : null, valid ? lon : null);

  if (!valid) return;

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
