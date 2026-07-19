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
const maxLiveArcs = 12;
const arcFlightTime = 2000;
let arcsArray = [];
let lastEventCoords = null;

const hotspots = new Map();
const maxLabels = 8;

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

const utf8Decoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder('utf-8', { fatal: true });

const fixEncoding = (s) => {
  if (!s || !utf8Decoder) return s;
  let hasLead = false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c > 0xFF) return s;
    if (c >= 0xC2 && c <= 0xF4) hasLead = true;
  }
  if (!hasLead) return s;
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  try {
    return utf8Decoder.decode(bytes);
  } catch (err) {
    return s;
  }
};

const translitMap = {
  '\u00df': 'ss', '\u00f8': 'o', '\u00d8': 'O', '\u0111': 'd', '\u0110': 'D', '\u00f0': 'd', '\u00d0': 'D',
  '\u00fe': 'th', '\u00de': 'Th', '\u0142': 'l', '\u0141': 'L', '\u00e6': 'ae', '\u00c6': 'Ae',
  '\u0153': 'oe', '\u0152': 'Oe', '\u0131': 'i', '\u0127': 'h', '\u0126': 'H', '\u0167': 't', '\u0166': 'T'
};

const asciiLabel = (name) => {
  const t = (name || '').trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, ch => translitMap[ch] || ch);
  if (!t || t.toLowerCase() === 'unknown') return '';
  return /^[\x20-\x7E]+$/.test(t) ? t : '';
};

const hotspotKey = (city, lat, lon) => {
  const c = (city || '').trim().toLowerCase();
  if (c && c !== 'unknown') return `c:${c}`;
  return `g:${lat.toFixed(1)},${lon.toFixed(1)}`;
};

const ringRadiusFor = (count) => Math.min(8, 3 + (count || 1) * 0.5);

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
    .arcDashLength(0.4)
    .arcDashGap(2)
    .arcDashInitialGap(1)
    .arcDashAnimateTime(arcFlightTime)
    .arcsTransitionDuration(0)
    .pointColor('color')
    .pointRadius('radius')
    .pointAltitude('alt')
    .pointsTransitionDuration(prefersReducedMotion ? 0 : 700)
    .labelText('labelText')
    .labelLat(d => d.lat + 0.5)
    .labelSize(d => Math.min(2.6, 1.7 + 0.25 * Math.sqrt(d.count || 1)))
    .labelColor(() => colors.label)
    .labelAltitude('alt')
    .labelsTransitionDuration(0)
    .ringColor(() => (t) => `rgba(${ringRgb}, ${1 - t})`)
    .ringMaxRadius('maxR')
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
    }
  }, 1000);
  } catch (error) {
    hideLoading();
    globe = undefined;
  }
};

const emitArc = (startLat, startLng, endLat, endLng) => {
  if (!globe || prefersReducedMotion) return;
  if (startLat === endLat && startLng === endLng) return;
  const arc = {
    startLat,
    startLng,
    endLat,
    endLng,
    arcAlt: arcAltFor(startLat, startLng, endLat, endLng)
  };
  arcsArray.push(arc);
  if (arcsArray.length > maxLiveArcs) {
    arcsArray.splice(0, arcsArray.length - maxLiveArcs);
  }
  globe.arcsData([...arcsArray]);
  setTimeout(() => {
    const i = arcsArray.indexOf(arc);
    if (i !== -1) {
      arcsArray.splice(i, 1);
      if (globe) globe.arcsData([...arcsArray]);
    }
  }, arcFlightTime * 2);
};

const emitSpokes = (lat, lng) => {
  [...hotspots.values()]
    .filter(h => h.lat !== lat || h.lng !== lng)
    .sort((a, b) => b.lastTs - a.lastTs)
    .slice(0, maxArcSpokes)
    .forEach(h => emitArc(h.lat, h.lng, lat, lng));
};

const pulseAt = (lat, lng) => {
  if (!globe || prefersReducedMotion) return;
  const hot = [...hotspots.values()].find(h =>
    Math.abs(h.lat - lat) < 0.05 && Math.abs(h.lng - lng) < 0.05);
  ringsArray.push({ lat, lng, ts: Date.now(), maxR: ringRadiusFor(hot && hot.count) });
  globe.ringsData(ringsArray);
  emitSpokes(lat, lng);
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

const renderHeatLayers = () => {
  if (!globe) return;
  const now = Date.now();

  const stats = new Map();
  dataBuffer.forEach(item => {
    const s = stats.get(item.key);
    if (s) {
      s.count += 1;
      if (item.timestamp > s.lastTs) s.lastTs = item.timestamp;
    } else {
      stats.set(item.key, { count: 1, lastTs: item.timestamp, item });
    }
  });

  hotspots.forEach((h, key) => {
    if (!stats.has(key)) hotspots.delete(key);
  });

  stats.forEach((s, key) => {
    let h = hotspots.get(key);
    if (!h) {
      h = {
        lat: s.item.lat,
        lng: s.item.lon,
        labelObj: s.item.labelText
          ? { lat: s.item.lat, lng: s.item.lon, labelText: s.item.labelText, count: 1, alt: 0.2 }
          : null
      };
      hotspots.set(key, h);
    }
    const age = Math.min(1, Math.max(0, (now - s.lastTs) / dataRetentionTime));
    const decay = age * age;
    const boost = Math.min(3, Math.sqrt(s.count));
    h.count = s.count;
    h.lastTs = s.lastTs;
    h.radius = Math.min(1.4, (0.3 + 0.25 * boost) * lerp(1, 0.55, decay));
    h.alt = Math.min(0.35, (0.05 + 0.06 * boost) * lerp(1, 0.15, decay));
    h.color = heatColor(decay);
    if (h.labelObj) {
      h.labelObj.count = s.count;
      h.labelObj.alt = Math.max(0.2, h.alt + 0.06);
    }
  });

  const points = [...hotspots.values()];
  globe.pointsData(points);

  const labeled = points.filter(h => h.labelObj);
  const top = labeled
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, maxLabels);
  const newest = labeled.reduce((m, h) => (!m || h.lastTs > m.lastTs ? h : m), null);
  if (newest && !top.includes(newest)) top.push(newest);
  globe.labelsData(top.map(h => h.labelObj));
};

const updateGlobeWithStreamData = (data) => {
  if (!data || typeof data !== 'object') return;

  if (typeof data.city === 'string') data.city = fixEncoding(data.city);
  if (typeof data.country === 'string') data.country = fixEncoding(data.country);

  const lat = parseFloat(data.lat);
  const lon = parseFloat(data.lon);
  const valid = Number.isFinite(lat) && Number.isFinite(lon) &&
    Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  renderConnCard(data, valid ? lat : null, valid ? lon : null);

  if (!valid) return;

  const timestamp = Date.now();
  const key = hotspotKey(data.city, lat, lon);
  const labelText = asciiLabel(data.city) || asciiLabel(data.country);
  dataBuffer.push({ lat, lon, timestamp, key, labelText });
  dataBuffer = dataBuffer.filter(item => timestamp - item.timestamp < dataRetentionTime);

  if (!globe) return;

  if (!prefersReducedMotion) {
    const hot = hotspots.get(key);
    ringsArray.push({ lat, lng: lon, ts: timestamp, maxR: ringRadiusFor(hot ? hot.count + 1 : 1) });
    ringsArray = ringsArray.filter(r => timestamp - r.ts < ringLifetime);
    globe.ringsData(ringsArray);
  }

  if (timestamp - lastUpdateTime >= updateInterval) {
    renderHeatLayers();
    lastUpdateTime = timestamp;
  }

  if (lastEventCoords) {
    emitArc(lastEventCoords.lat, lastEventCoords.lng, lat, lon);
  }
  lastEventCoords = { lat, lng: lon };
};

fetchAssets();
connectToStream();
startFeedTicker();
