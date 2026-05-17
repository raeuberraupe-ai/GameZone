/**
 * GameZone Touch Controls
 * Automatische Touch-Steuerung für mobile Geräte
 */

(function() {
  // Nur auf Touch-Geräten laden
  if (!('ontouchstart' in window)) return;

  // CSS einfügen
  const style = document.createElement('style');
  style.textContent = `
    #touch-controls {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 200px;
      pointer-events: none;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 16px 16px;
    }

    /* Linker Joystick (Bewegung) */
    #joystick-area {
      width: 140px;
      height: 140px;
      position: relative;
      pointer-events: all;
    }

    #joystick-base {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.3);
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
    }

    #joystick-knob {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(233,69,96,0.8);
      border: 2px solid #e94560;
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      transition: none;
      box-shadow: 0 0 12px rgba(233,69,96,0.5);
    }

    /* Pfeiltasten (Alternative) */
    #dpad {
      width: 140px;
      height: 140px;
      position: relative;
      pointer-events: all;
      display: none;
    }

    .dpad-btn {
      position: absolute;
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #fff;
      user-select: none;
      -webkit-user-select: none;
      pointer-events: all;
      active-background: rgba(233,69,96,0.5);
    }

    .dpad-btn:active { background: rgba(233,69,96,0.5); }

    #dpad-up    { top: 0;    left: 50%; transform: translateX(-50%); }
    #dpad-down  { bottom: 0; left: 50%; transform: translateX(-50%); }
    #dpad-left  { left: 0;   top: 50%;  transform: translateY(-50%); }
    #dpad-right { right: 0;  top: 50%;  transform: translateY(-50%); }
    #dpad-center {
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      width: 30px; height: 30px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }

    /* Rechte Aktions-Buttons */
    #action-btns {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
      pointer-events: all;
    }

    .action-row {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
      background: rgba(0,0,0,0.5);
      color: #fff;
      font-size: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-user-select: none;
      pointer-events: all;
      backdrop-filter: blur(4px);
    }

    .action-btn:active { transform: scale(0.9); }

    #btn-shoot {
      background: rgba(233,69,96,0.6);
      border-color: #e94560;
      width: 68px;
      height: 68px;
      font-size: 1.6rem;
      box-shadow: 0 0 16px rgba(233,69,96,0.4);
    }

    #btn-reload {
      background: rgba(255,215,0,0.3);
      border-color: #ffd700;
    }

    #btn-jump {
      background: rgba(0,212,255,0.3);
      border-color: #00d4ff;
    }

    #btn-enter-car {
      background: rgba(46,204,113,0.3);
      border-color: #2ecc71;
    }

    /* Canvas-Swipe für Kamera */
    #swipe-area {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: calc(100% - 200px);
      pointer-events: all;
      z-index: 999;
    }
  `;
  document.head.appendChild(style);

  // HTML einfügen
  const controls = document.createElement('div');
  controls.id = 'touch-controls';
  controls.innerHTML = `
    <div id="joystick-area">
      <div id="joystick-base"></div>
      <div id="joystick-knob"></div>
    </div>
    <div id="action-btns">
      <div class="action-row">
        <div class="action-btn" id="btn-reload">🔄</div>
        <div class="action-btn" id="btn-enter-car">🚗</div>
      </div>
      <div class="action-row">
        <div class="action-btn" id="btn-jump">⬆️</div>
        <div class="action-btn" id="btn-shoot">🔫</div>
      </div>
    </div>
  `;
  document.body.appendChild(controls);

  // Swipe-Bereich für Kamera
  const swipe = document.createElement('div');
  swipe.id = 'swipe-area';
  document.body.appendChild(swipe);

  // ── Joystick Logik ──────────────────────────────
  const joystickArea = document.getElementById('joystick-area');
  const knob = document.getElementById('joystick-knob');
  const base = document.getElementById('joystick-base');
  const MAX_DIST = 45;

  let joystickActive = false;
  let joystickOrigin = {x: 0, y: 0};
  let joystickDelta = {x: 0, y: 0};

  joystickArea.addEventListener('touchstart', e => {
    e.preventDefault();
    joystickActive = true;
    const t = e.touches[0];
    const rect = joystickArea.getBoundingClientRect();
    joystickOrigin = {
      x: rect.left + rect.width/2,
      y: rect.top + rect.height/2
    };
  }, {passive: false});

  joystickArea.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!joystickActive) return;
    const t = e.touches[0];
    let dx = t.clientX - joystickOrigin.x;
    let dy = t.clientY - joystickOrigin.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > MAX_DIST) {
      dx = dx/dist * MAX_DIST;
      dy = dy/dist * MAX_DIST;
    }
    joystickDelta = {x: dx/MAX_DIST, y: dy/MAX_DIST};
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    updateKeys();
  }, {passive: false});

  joystickArea.addEventListener('touchend', e => {
    e.preventDefault();
    joystickActive = false;
    joystickDelta = {x: 0, y: 0};
    knob.style.transform = 'translate(-50%, -50%)';
    clearKeys();
  }, {passive: false});

  function updateKeys() {
    const threshold = 0.3;
    // Tastatur-Events simulieren
    setKey('KeyW', joystickDelta.y < -threshold);
    setKey('KeyS', joystickDelta.y > threshold);
    setKey('KeyA', joystickDelta.x < -threshold);
    setKey('KeyD', joystickDelta.x > threshold);
    setKey('ArrowUp',    joystickDelta.y < -threshold);
    setKey('ArrowDown',  joystickDelta.y > threshold);
    setKey('ArrowLeft',  joystickDelta.x < -threshold);
    setKey('ArrowRight', joystickDelta.x > threshold);
  }

  function clearKeys() {
    ['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].forEach(k => setKey(k, false));
  }

  function setKey(code, pressed) {
    const event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', {code, bubbles: true});
    document.dispatchEvent(event);
  }

  // ── Aktions-Buttons ─────────────────────────────
  function holdBtn(id, code) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', {code, bubbles: true}));
    }, {passive: false});
    btn.addEventListener('touchend', e => {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keyup', {code, bubbles: true}));
    }, {passive: false});
  }

  // Schießen — Klick simulieren
  const shootBtn = document.getElementById('btn-shoot');
  if (shootBtn) {
    shootBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      // Canvas-Klick simulieren
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.dispatchEvent(new MouseEvent('click', {
          clientX: rect.left + rect.width/2,
          clientY: rect.top + rect.height/2,
          bubbles: true
        }));
      }
      // Auch als Leertaste
      document.dispatchEvent(new KeyboardEvent('keydown', {code: 'Space', bubbles: true}));
      setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', {code: 'Space', bubbles: true})), 100);
    }, {passive: false});
  }

  holdBtn('btn-jump', 'Space');
  holdBtn('btn-reload', 'KeyR');

  const carBtn = document.getElementById('btn-enter-car');
  if (carBtn) {
    carBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyF', bubbles: true}));
      setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyF', bubbles: true})), 100);
    }, {passive: false});
  }

  // ── Kamera-Swipe ────────────────────────────────
  let swipeStart = null;
  let lastSwipe = null;

  swipe.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      swipeStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
      lastSwipe = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    }
  }, {passive: true});

  swipe.addEventListener('touchmove', e => {
    if (!lastSwipe || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastSwipe.x;
    const dy = e.touches[0].clientY - lastSwipe.y;
    lastSwipe = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    // MouseMove-Event simulieren für Kamera
    document.dispatchEvent(new MouseEvent('mousemove', {
      movementX: dx * 2,
      movementY: dy * 2,
      bubbles: true
    }));
    // Für Pointer-Lock Spiele
    if (typeof yaw !== 'undefined') {
      yaw -= dx * 0.005;
    }
    if (typeof pitch !== 'undefined') {
      pitch -= dy * 0.005;
      pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, pitch));
    }
  }, {passive: true});

  swipe.addEventListener('touchend', e => {
    swipeStart = null;
    lastSwipe = null;
  }, {passive: true});

  // Shoot on swipe-area tap
  swipe.addEventListener('click', e => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: true
      }));
    }
  });

  // Buttons je nach Spiel anpassen
  window.addEventListener('load', () => {
    const url = window.location.href;
    const jumpBtn = document.getElementById('btn-jump');
    const carBtnEl = document.getElementById('btn-enter-car');

    // Spiele ohne Sprung
    if (url.includes('snake') || url.includes('tetris') || url.includes('2048') ||
        url.includes('memory') || url.includes('quiz') || url.includes('minesweeper')) {
      controls.style.display = 'none';
      swipe.style.display = 'none';
      return;
    }

    // Geometry Dash — nur Sprung
    if (url.includes('geometry-dash') || url.includes('flappy')) {
      document.getElementById('joystick-area').style.display = 'none';
      if (carBtnEl) carBtnEl.style.display = 'none';
      if (jumpBtn) {
        jumpBtn.style.width = '100px';
        jumpBtn.style.height = '100px';
        jumpBtn.style.fontSize = '2.5rem';
      }
      return;
    }

    // Spiele ohne Auto
    if (!url.includes('waffentest')) {
      if (carBtnEl) carBtnEl.style.display = 'none';
    }

    // Spiele ohne Sprung
    if (!url.includes('geometry-dash') && !url.includes('flappy') && !url.includes('waffentest')) {
      if (jumpBtn) jumpBtn.style.display = 'none';
    }
  });

})();
