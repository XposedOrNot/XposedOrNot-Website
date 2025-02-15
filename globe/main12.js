const colors = {
  green: "#FF55A3",
  red: "#ff0000",
  yellow: "#00ff00",
  fluorescentGreen: "#FF55A3",
};

let dataBuffer = [];
const dataRetentionTime = 5 * 60 * 1000;

let lastDataPoint = null;
let arcsArray = [];

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

let scene, globe;

const initGlobe = (countries, map, lines) => {
  scene = new THREE.Scene();

  globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: true })
    .hexPolygonsData(countries.features)
    .hexPolygonResolution(3)
    .hexPolygonMargin(0.8)
    .showAtmosphere(true)
    .atmosphereColor(colors.green)
    .atmosphereAltitude(0.2)
    .arcColor(() => colors.green)
    .arcAltitude('arcAlt')
    .arcStroke(0.5)
    .arcDashLength(1)
    .arcDashGap(6)
    .arcDashInitialGap(1)
    .arcDashAnimateTime(4000)
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
  globeMaterial.color = new THREE.Color(0x002330);
  globeMaterial.emissive = new THREE.Color("#102669");
  globeMaterial.emissiveIntensity = 2;
  globeMaterial.shininess = 30;

  scene.add(globe);

  const sizes = {
    w: window.innerWidth,
    h: window.innerHeight,
  };
  const camera = new THREE.PerspectiveCamera(45, sizes.w / sizes.h);
  camera.position.set(60, 10, 20);
  scene.add(camera);

  const dlight = new THREE.DirectionalLight(0xffffff, 1.2);
  dlight.position.set(-900, 10, 400);
  camera.add(dlight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const canvas = document.querySelector(".webgl");
  const renderer = new THREE.WebGLRenderer({
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
};

const connectToStream = () => {
  const streamUrl = 'https://streamer-test-325858668484.us-west1.run.app/stream';
  let eventSource;

  const establishConnection = () => {
    fetch(streamUrl, { method: 'HEAD' })
      .then(response => {
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => console.log("Stream connection established.");

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            updateGlobeWithStreamData(data);
          } catch (err) {
            console.error("Error parsing stream data:", err);
          }
        };

        eventSource.onerror = (err) => {
          console.error("EventSource error:", err);
          if (eventSource.readyState === EventSource.CLOSED) {
          } else if (eventSource.readyState === EventSource.CONNECTING) {
            console.warn("EventSource is reconnecting...");
          }
          eventSource.close();
          setTimeout(establishConnection, 5000);
        };

      })
      .catch(error => {
        setTimeout(establishConnection, 5000);
      });
  };

  establishConnection();
};

const updateGlobeWithStreamData = (data) => {
  if (globe && data.lat !== undefined && data.lon !== undefined) {
    console.log(`Updating globe with data: ${data.city}, (${data.lat}, ${data.lon})`);

    const timestamp = Date.now();
    dataBuffer.push({ ...data, timestamp, isNew: true });
    dataBuffer = dataBuffer.filter(item => timestamp - item.timestamp < dataRetentionTime);

    globe.pointsData(dataBuffer.map(item => ({
      lat: item.lat,
      lng: item.lon,
      size: 6,
      color: item.isNew ? colors.fluorescentGreen : colors.red
    })));

    globe.labelsData(dataBuffer.map(item => ({
      lat: item.lat + 0.5,
      lng: item.lon,
      text: item.city || "Unknown"
    })))
      .labelText('text')
      .labelSize(2)
      .labelColor(() => "#FFFFFF")
      .labelAltitude(0.2);

    const dataContent = document.getElementById('data-content');
    const dataElement = document.createElement('p');
    dataElement.textContent = `${new Date().toLocaleString()} - ${data.city}`;
    dataContent.prepend(dataElement);

    if (data.isNew) {
      animateNewDataPoint(data);
    }

    // Check if source and destination are the same
    if (lastDataPoint && 
        (lastDataPoint.lat !== data.lat || lastDataPoint.lon !== data.lon)) {
      const newArc = {
        startLat: parseFloat(lastDataPoint.lat),
        startLng: parseFloat(lastDataPoint.lon),
        endLat: parseFloat(data.lat),
        endLng: parseFloat(data.lon),
        arcAlt: 0.5
      };
      arcsArray.push(newArc);
      globe.arcsData(arcsArray); // Update the globe with the new arcs data
    }
    lastDataPoint = data;

    dataBuffer.forEach(item => {
      if (Date.now() - item.timestamp > dataRetentionTime) {
        item.isNew = false;
      }
    });
  } else {
    console.warn("Globe not initialized or incomplete data received:", data);
  }
};

const animateNewDataPoint = (data) => {
  const point = globe.pointsData().find(p => p.lat === data.lat && p.lng === data.lon);
  if (point) {
    let scale = 1;
    const animate = () => {
      scale += 0.05;
      point.size = 6 * scale;
      if (scale < 1.5) {
        requestAnimationFrame(animate);
      } else {
        point.size = 6;
      }
    };
    animate();
  }
};

fetchAssets();
connectToStream();
