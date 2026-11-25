(() => {
  'use strict';

  const DEFAULT_VIDEO = 'tskL3a7jxxE';
  const YOUTUBE_ASPECT = 16 / 9;
  // Each copy is rotated so its top points away from the center of the cross.
  const ANGLES = [0, 90, 180, 270];
  const STORAGE_KEY = 'holographicator.settings';
  const SYNC_INTERVAL_MS = 1000;
  const SYNC_TOLERANCE_S = 0.35;

  const $ = (id) => document.getElementById(id);
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  const ytStage = $('yt-stage');
  const statusEl = $('status');
  const sizeInput = $('size');
  const gapInput = $('gap');
  const mirrorInput = $('mirror');
  const inwardInput = $('inward');
  const fileInput = $('file-input');
  const fileName = $('file-name');

  const isApp = typeof window.HoloApp !== 'undefined';

  const settings = Object.assign({
    mode: 'youtube',
    videoId: DEFAULT_VIDEO,
    size: 1,
    gap: 0.2,
    mirror: false,
    inward: false,
    auto: true,
  }, loadSettings());

  let aspect = YOUTUBE_ASPECT;
  let canvasSource = null;
  let needsDraw = true;

  let fileSource = null;
  let fileAspect = 1;
  let fileUrl = null;
  const fileVideo = createVideoElement();
  fileVideo.loop = true;

  let cameraStream = null;
  let cameraFacing = 'environment';
  const cameraVideo = createVideoElement();
  cameraVideo.muted = true;

  let ytApiPromise = null;
  let playersPromise = null;
  let players = [];
  const slots = [];

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage can be unavailable (private mode); settings just won't persist.
    }
  }

  function createVideoElement() {
    const video = document.createElement('video');
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    return video;
  }

  function setStatus(message) {
    statusEl.textContent = message || '';
  }

  // ---------------------------------------------------------------- layout

  function geometry() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const shortSide = Math.min(width, height);
    const copyHeight = settings.size * shortSide / 2;
    return {
      cx: width / 2,
      cy: height / 2,
      gap: settings.gap * shortSide,
      height: copyHeight,
      width: copyHeight * aspect,
      reach: Math.max(width, height) * 2,
    };
  }

  // Largest size where each copy fits completely inside its triangular sector.
  function autoFit() {
    settings.size = 2 / (aspect + 2);
    settings.gap = aspect / (2 * (aspect + 2));
  }

  function applyLayout() {
    if (settings.auto) autoFit();
    sizeInput.value = settings.size;
    gapInput.value = settings.gap;
    mirrorInput.checked = settings.mirror;
    inwardInput.checked = settings.inward;

    if (settings.mode === 'youtube') {
      layoutYouTube();
    } else {
      resizeCanvas();
      needsDraw = true;
    }
  }

  function copyTransform() {
    const parts = [];
    if (settings.inward) parts.push('rotate(180deg)');
    if (settings.mirror) parts.push('scaleX(-1)');
    return parts.join(' ') || 'none';
  }

  function layoutYouTube() {
    const g = geometry();
    const half = g.reach / 2;
    slots.forEach((slot, i) => {
      Object.assign(slot.style, {
        left: `${g.cx - half}px`,
        top: `${g.cy - half}px`,
        width: `${g.reach}px`,
        height: `${g.reach}px`,
        transform: `rotate(${ANGLES[i]}deg)`,
      });
      Object.assign(slot.firstChild.style, {
        left: `${half - g.width / 2}px`,
        top: `${half - g.gap - g.height}px`,
        width: `${g.width}px`,
        height: `${g.height}px`,
        transform: copyTransform(),
      });
    });
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function render() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    if (!canvasSource) return;

    const g = geometry();
    for (const angle of ANGLES) {
      ctx.save();
      ctx.translate(g.cx, g.cy);
      ctx.rotate(angle * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-g.reach, -g.reach);
      ctx.lineTo(g.reach, -g.reach);
      ctx.closePath();
      ctx.clip();
      ctx.translate(0, -g.gap - g.height / 2);
      if (settings.inward) ctx.rotate(Math.PI);
      if (settings.mirror) ctx.scale(-1, 1);
      ctx.drawImage(canvasSource, -g.width / 2, -g.height / 2, g.width, g.height);
      ctx.restore();
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    if (settings.mode === 'youtube') return;
    const isVideo = canvasSource instanceof HTMLVideoElement;
    if (isVideo && canvasSource.readyState < 2) return;
    if (isVideo || needsDraw) {
      needsDraw = false;
      render();
    }
  }

  function setCanvasSource(source, sourceAspect) {
    canvasSource = source;
    if (source) aspect = sourceAspect;
    applyLayout();
  }

  // --------------------------------------------------------------- youtube

  function parseYouTubeId(text) {
    const value = text.trim();
    if (/^[\w-]{11}$/.test(value)) return value;
    let url;
    try {
      url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    } catch {
      return null;
    }
    const host = url.hostname.replace(/^(www|m|music)\./, '');
    let id = null;
    if (host === 'youtu.be') {
      id = url.pathname.split('/')[1];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = url.searchParams.get('v');
      if (!id) {
        const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
        if (match) id = match[1];
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }

  function loadYouTubeApi() {
    if (!ytApiPromise) {
      ytApiPromise = new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
          resolve(window.YT);
          return;
        }
        window.onYouTubeIframeAPIReady = () => resolve(window.YT);
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onerror = () => {
          script.remove();
          ytApiPromise = null;
          reject(new Error('No se pudo conectar con YouTube. Revisá la conexión a internet.'));
        };
        document.head.appendChild(script);
      });
    }
    return ytApiPromise;
  }

  function buildSlots() {
    for (let i = 0; i < ANGLES.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      const copy = document.createElement('div');
      copy.className = 'copy';
      const host = document.createElement('div');
      copy.appendChild(host);
      slot.appendChild(copy);
      ytStage.appendChild(slot);
      slots.push(slot);
    }
  }

  function youTubeErrorMessage(code) {
    switch (code) {
      case 2: return 'El link o ID de YouTube no es válido.';
      case 5: return 'Este video no se puede reproducir en este dispositivo.';
      case 100: return 'El video no existe o es privado.';
      case 101:
      case 150: return 'El dueño del video no permite verlo fuera de YouTube. Probá con otro.';
      case 153: return location.protocol === 'file:'
        ? 'YouTube no funciona abriendo el archivo directo: usá la app o servilo desde un servidor web.'
        : 'YouTube rechazó la configuración del reproductor (error 153).';
      default: return `YouTube devolvió un error (${code}).`;
    }
  }

  function playerVars() {
    const vars = {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      playsinline: 1,
      rel: 0,
    };
    if (location.protocol.startsWith('http')) vars.origin = location.origin;
    return vars;
  }

  function ensurePlayers() {
    if (!playersPromise) {
      playersPromise = loadYouTubeApi().then((YT) => Promise.all(slots.map((slot, i) => new Promise((resolve) => {
        const isMaster = i === 0;
        const player = new YT.Player(slot.firstChild.firstChild, {
          width: '100%',
          height: '100%',
          videoId: settings.videoId,
          playerVars: playerVars(),
          events: {
            onReady: () => {
              if (!isMaster) player.mute();
              resolve(player);
            },
            onStateChange: isMaster ? onMasterStateChange : undefined,
            onError: isMaster ? (event) => setStatus(youTubeErrorMessage(event.data)) : undefined,
          },
        });
      })))).then((ready) => {
        players = ready;
        layoutYouTube();
        return ready;
      }, (error) => {
        playersPromise = null;
        throw error;
      });
    }
    return playersPromise;
  }

  function followers() {
    return players.slice(1);
  }

  function onMasterStateChange(event) {
    const { PlayerState } = window.YT;
    if (event.data === PlayerState.PLAYING) {
      setStatus('');
      followers().forEach((p) => {
        p.seekTo(players[0].getCurrentTime(), true);
        p.playVideo();
      });
    } else if (event.data === PlayerState.PAUSED) {
      followers().forEach((p) => p.pauseVideo());
    } else if (event.data === PlayerState.ENDED) {
      players.forEach((p) => {
        p.seekTo(0, true);
        p.playVideo();
      });
    }
  }

  function syncFollowers() {
    if (settings.mode !== 'youtube' || players.length !== ANGLES.length) return;
    const { PlayerState } = window.YT;
    const master = players[0];
    if (master.getPlayerState() !== PlayerState.PLAYING) return;
    const time = master.getCurrentTime();
    for (const player of followers()) {
      const state = player.getPlayerState();
      if (state === PlayerState.BUFFERING) continue;
      if (state !== PlayerState.PLAYING) player.playVideo();
      if (Math.abs(player.getCurrentTime() - time) > SYNC_TOLERANCE_S) player.seekTo(time, true);
    }
  }

  async function startYouTube() {
    try {
      const ready = await ensurePlayers();
      if (settings.mode === 'youtube') ready.forEach((p) => p.playVideo());
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function loadYouTubeVideo(id) {
    settings.videoId = id;
    saveSettings();
    setStatus('');
    try {
      const ready = await ensurePlayers();
      ready.forEach((p) => p.loadVideoById(id));
    } catch (error) {
      setStatus(error.message);
    }
  }

  function pauseYouTube() {
    players.forEach((p) => p.pauseVideo());
  }

  // ----------------------------------------------------------- local file

  function clearFileSource() {
    fileVideo.pause();
    fileVideo.removeAttribute('src');
    fileVideo.load();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    fileUrl = null;
    fileSource = null;
  }

  function loadFile(file) {
    clearFileSource();
    fileName.textContent = file.name;
    fileUrl = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      const image = new Image();
      image.onload = () => {
        fileSource = image;
        fileAspect = image.naturalWidth / image.naturalHeight;
        if (settings.mode === 'file') setCanvasSource(image, fileAspect);
      };
      image.onerror = () => setStatus('No se pudo abrir la imagen.');
      image.src = fileUrl;
      return;
    }

    fileVideo.onloadedmetadata = () => {
      fileSource = fileVideo;
      fileAspect = fileVideo.videoWidth / fileVideo.videoHeight || 16 / 9;
      if (settings.mode === 'file') {
        setCanvasSource(fileVideo, fileAspect);
        fileVideo.play().catch(() => setStatus('Tocá Play / Pausa para empezar.'));
      }
    };
    fileVideo.onerror = () => setStatus('Este formato de video no es compatible con el dispositivo.');
    fileVideo.src = fileUrl;
  }

  // ---------------------------------------------------------------- camera

  function stopCamera() {
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraVideo.srcObject = null;
  }

  async function startCamera() {
    stopCamera();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('Este dispositivo no permite usar la cámara desde aquí.');
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (error) {
      setStatus(error.name === 'NotAllowedError'
        ? 'Sin permiso para usar la cámara.'
        : 'No se pudo abrir la cámara.');
      return;
    }
    if (settings.mode !== 'camera') {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    cameraStream = stream;
    cameraVideo.srcObject = stream;
    cameraVideo.onloadedmetadata = () => {
      setCanvasSource(cameraVideo, cameraVideo.videoWidth / cameraVideo.videoHeight || 4 / 3);
    };
    cameraVideo.play().catch(() => {});
  }

  // ----------------------------------------------------------------- modes

  function setMode(mode) {
    settings.mode = mode;
    saveSettings();
    setStatus('');

    document.querySelectorAll('.tabs button').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
    });
    document.querySelectorAll('section[data-for]').forEach((section) => {
      section.hidden = section.dataset.for !== mode;
    });

    if (mode !== 'youtube') pauseYouTube();
    if (mode !== 'file') fileVideo.pause();
    if (mode !== 'camera') stopCamera();

    ytStage.hidden = mode !== 'youtube';
    canvas.hidden = mode === 'youtube';
    canvasSource = null;

    if (mode === 'youtube') {
      aspect = YOUTUBE_ASPECT;
      applyLayout();
      startYouTube();
    } else if (mode === 'file') {
      if (fileSource) {
        setCanvasSource(fileSource, fileAspect);
        if (fileSource === fileVideo) fileVideo.play().catch(() => {});
      } else {
        applyLayout();
        setStatus('Elegí un video o una imagen del dispositivo.');
      }
    } else {
      applyLayout();
      startCamera();
    }
  }

  function togglePlay() {
    if (settings.mode === 'youtube') {
      if (!players.length) return;
      const playing = players[0].getPlayerState() === window.YT.PlayerState.PLAYING;
      players.forEach((p) => (playing ? p.pauseVideo() : p.playVideo()));
      return;
    }
    if (canvasSource instanceof HTMLVideoElement) {
      if (canvasSource.paused) canvasSource.play().catch(() => {});
      else canvasSource.pause();
    }
  }

  // ------------------------------------------------------------ panel / UI

  function setPanelOpen(open) {
    document.body.classList.toggle('panel-open', open);
  }

  // Called by the Android app when the back button is pressed.
  window.holoBack = () => {
    if (document.body.classList.contains('panel-open')) return false;
    setPanelOpen(true);
    return true;
  };

  function bindRange(input, key) {
    input.addEventListener('input', () => {
      settings[key] = Number(input.value);
      settings.auto = false;
      saveSettings();
      applyLayout();
    });
  }

  function bindCheckbox(input, key) {
    input.addEventListener('change', () => {
      settings[key] = input.checked;
      saveSettings();
      applyLayout();
    });
  }

  $('tap-layer').addEventListener('click', () => {
    setPanelOpen(!document.body.classList.contains('panel-open'));
  });
  $('close-panel').addEventListener('click', () => setPanelOpen(false));

  document.querySelectorAll('.tabs button').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.mode !== settings.mode) setMode(tab.dataset.mode);
    });
  });

  $('yt-url').value = settings.videoId === DEFAULT_VIDEO ? '' : `https://youtu.be/${settings.videoId}`;
  $('yt-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const id = parseYouTubeId($('yt-url').value);
    if (!id) {
      setStatus('No reconozco ese link. Pegá un link de YouTube o el ID del video.');
      return;
    }
    loadYouTubeVideo(id);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      setStatus('');
      loadFile(file);
    }
    fileInput.value = '';
  });

  $('camera-switch').addEventListener('click', () => {
    cameraFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera();
  });

  $('play').addEventListener('click', togglePlay);
  $('auto-fit').addEventListener('click', () => {
    settings.auto = true;
    saveSettings();
    applyLayout();
  });

  const fullscreenButton = $('fullscreen');
  if (isApp || !document.documentElement.requestFullscreen) {
    fullscreenButton.hidden = true;
  } else {
    fullscreenButton.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    });
  }

  bindRange(sizeInput, 'size');
  bindRange(gapInput, 'gap');
  bindCheckbox(mirrorInput, 'mirror');
  bindCheckbox(inwardInput, 'inward');

  window.addEventListener('resize', applyLayout);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseYouTube();
      fileVideo.pause();
      stopCamera();
    } else if (settings.mode === 'camera') {
      startCamera();
    }
  });

  buildSlots();
  setInterval(syncFollowers, SYNC_INTERVAL_MS);
  requestAnimationFrame(frame);
  setMode(['youtube', 'file', 'camera'].includes(settings.mode) ? settings.mode : 'youtube');
})();
