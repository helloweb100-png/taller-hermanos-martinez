/* ==========================================================================
   Taller Hermanos Martínez — script.js
   JavaScript puro (sin dependencias). anime.js 3.2.2 es una mejora opcional:
   si la CDN falla, todo se ve y funciona igual.
   Módulos: configuración · utilidades · WhatsApp · cargador · scroll engine ·
   header/menú · reveal · hero (partículas, tilt 3D) · estado abierto/cerrado ·
   cinta · manifiesto · imagen que se expande · galería · visor · servicios ·
   proceso · formulario · cursor
   ========================================================================== */
(function () {
  'use strict';

  /* ===================== CONFIGURACIÓN ===================== */
  // ÚNICO lugar donde vive el número de WhatsApp: formato 52 + 10 dígitos.
  // Si queda vacío (""), el botón flotante, los CTA y el envío del formulario se ocultan con elegancia.
  var WHATSAPP_NUMBER = '523314192448';
  var NEGOCIO = 'Taller Hermanos Martínez';
  // Catálogo de WhatsApp Business del taller (se deriva del mismo número).
  var CATALOGO_URL = WHATSAPP_NUMBER ? 'https://wa.me/c/521' + WHATSAPP_NUMBER.slice(2) : '';

  // Horario real del taller (horas en formato 24 h). 0 = domingo.
  var HORARIO = {
    0: [],
    1: [[8, 14], [15, 18]], 2: [[8, 14], [15, 18]], 3: [[8, 14], [15, 18]], 4: [[8, 14], [15, 18]], 5: [[8, 14], [15, 18]],
    6: [[9, 13]]
  };
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  /* ===================== UTILIDADES ===================== */
  var doc = document;
  var root = doc.documentElement;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function absTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener: function () {} }; };
  var reduced = mq('(prefers-reduced-motion: reduce)').matches;
  var finePointer = mq('(hover: hover) and (pointer: fine)').matches;
  if (reduced) root.classList.add('rm');

  var geo = { vw: window.innerWidth, vh: window.innerHeight };

  // anime.js es opcional: se usa solo si está disponible.
  var animeEl = $('#anime-js');
  function withAnime(fn) {
    if (reduced) return;
    if (window.anime) { fn(window.anime); return; }
    if (animeEl) animeEl.addEventListener('load', function () { if (window.anime) fn(window.anime); });
  }

  function observeOnce(el, cb, opts) {
    if (!('IntersectionObserver' in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); cb(el); } });
    }, opts || { threshold: 0.3 });
    io.observe(el);
  }

  /* ===================== WHATSAPP ===================== */
  function waUrl(text) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function openUrl(url) {
    var a = doc.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    doc.body.appendChild(a); a.click(); doc.body.removeChild(a);
  }
  function setupWhatsApp() {
    var els = $$('[data-wa]');
    var cats = $$('[data-catalogo]');
    if (!WHATSAPP_NUMBER) {
      els.concat(cats).forEach(function (el) { el.hidden = true; });
      var fl = $('#wa-float'); if (fl) fl.hidden = true;
      var sb = $('#form-submit'); if (sb) sb.hidden = true;
      var note = $('#form-note'); if (note) note.textContent = 'Por ahora nuestro canal de WhatsApp no está disponible. Visítanos en el taller.';
      return;
    }
    els.forEach(function (a) {
      a.href = waUrl(a.getAttribute('data-wa'));
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    });
    cats.forEach(function (a) { a.href = CATALOGO_URL; a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  }

  /* ===================== MOTOR DE SCROLL (suavizado con inercia) ===================== */
  var tasks = [];
  function addTask(fn) { tasks.push(fn); }
  var lastTarget = window.pageYOffset;
  var smooth = lastTarget;
  var raf = 0;
  function loop() {
    raf = 0;
    var target = window.pageYOffset;
    smooth += (target - smooth) * (reduced ? 1 : 0.13);
    if (Math.abs(target - smooth) < 0.3) smooth = target;
    var vel = target - lastTarget;
    lastTarget = target;
    var again = smooth !== target;
    for (var i = 0; i < tasks.length; i++) { if (tasks[i](smooth, target, vel)) again = true; }
    if (again) raf = window.requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = window.requestAnimationFrame(loop); }
  window.addEventListener('scroll', kick, { passive: true });

  /* ===================== CARGADOR ===================== */
  var readyFired = false;
  function onReady() {
    if (readyFired) return; readyFired = true;
    root.classList.add('is-ready');
    withAnime(function (anime) {
      anime({ targets: '.hero__chips li', translateY: [16, 0], opacity: [0, 1], delay: anime.stagger(90, { start: 900 }), duration: 800, easing: 'easeOutCubic' });
    });
    // etiqueta del botón flotante
    var fl = $('#wa-float');
    if (fl && WHATSAPP_NUMBER && geo.vw >= 640 && !reduced) {
      setTimeout(function () { fl.classList.add('is-open'); }, 4200);
      setTimeout(function () { fl.classList.remove('is-open'); }, 10500);
    }
  }
  function runLoader() {
    var loader = $('#cargador');
    var pct = $('#loader-pct');
    if (!loader) { onReady(); return; }
    var dur = reduced ? 120 : 1100;
    var t0 = performance.now();
    var left = false;
    function leave() {
      if (left) return; left = true;
      loader.classList.add('is-leaving');
      onReady();
      setTimeout(function () {
        loader.classList.add('is-done');
        loader.setAttribute('aria-hidden', 'true');
      }, reduced ? 30 : 900);
    }
    function frame(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      if (pct) pct.textContent = String(Math.round(e * 100));
      if (p < 1) window.requestAnimationFrame(frame); else leave();
    }
    window.requestAnimationFrame(frame);
    setTimeout(leave, 1500); // salvaguarda: nunca debe quedarse pegado
  }

  /* ===================== MEDICIÓN DE SECCIONES ===================== */
  var gal = {}, exp = {}, man = {};
  var docH = 0;
  function measure() {
    geo.vw = window.innerWidth; geo.vh = window.innerHeight;
    galleryMeasure();
    if (exp.el) { exp.top = absTop(exp.el); exp.h = exp.el.offsetHeight; exp.p = -1; }
    if (man.el) { man.top = absTop(man.el); man.h = man.el.offsetHeight; man.on = -1; }
    docH = Math.max(doc.body.scrollHeight, root.scrollHeight);
    kick();
  }
  var measureQueued = false;
  function queueMeasure() {
    if (measureQueued) return; measureQueued = true;
    window.requestAnimationFrame(function () { measureQueued = false; measure(); });
  }

  /* ===================== HEADER, MENÚ, PROGRESO ===================== */
  function initHeader() {
    var header = $('#encabezado');
    var bar = $('#scroll-progress');
    var toTop = $('.to-top');
    addTask(function (s, target) {
      if (header) header.classList.toggle('is-scrolled', target > 24);
      if (bar) {
        var max = Math.max(1, docH - geo.vh);
        bar.style.transform = 'scaleX(' + clamp(target / max, 0, 1).toFixed(4) + ')';
      }
      return false;
    });
    if (toTop) toTop.addEventListener('click', function () { /* ancla nativa */ });

    // menú móvil
    var burger = $('#burger');
    var menu = $('#menu-movil');
    if (burger && menu) {
      menu.setAttribute('inert', '');
      var setMenu = function (open) {
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        menu.classList.toggle('is-open', open);
        menu.setAttribute('aria-hidden', String(!open));
        if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
        doc.body.classList.toggle('is-locked', open);
      };
      burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
      window.addEventListener('resize', function () { if (window.innerWidth >= 900 && menu.classList.contains('is-open')) setMenu(false); });
    }

    // enlace activo en el menú de escritorio
    var links = $$('.nav a');
    if (links.length && 'IntersectionObserver' in window) {
      var map = {};
      links.forEach(function (a) { var id = (a.getAttribute('href') || '').slice(1); if (id) map[id] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var a = map[en.target.id]; if (!a) return;
          if (en.isIntersecting) { links.forEach(function (l) { l.classList.remove('is-active'); }); a.classList.add('is-active'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var sec = doc.getElementById(id); if (sec) io.observe(sec); });
    }
  }

  /* ===================== ENTRADAS AL HACER SCROLL ===================== */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });

    // líneas de los títulos pequeños, con anime.js si está disponible
    $$('.eyebrow span').forEach(function (line) {
      observeOnce(line, function () {
        withAnime(function (anime) { anime({ targets: line, scaleX: [0, 1], duration: 900, easing: 'easeOutExpo' }); });
      }, { threshold: 0.6 });
    });
    // etiquetas con vaivén constante
    withAnime(function (anime) {
      anime({ targets: '.mini-tags li', translateY: [0, -4, 0], duration: 2600, loop: true, easing: 'easeInOutSine', delay: anime.stagger(180) });
    });
  }

  /* ===================== HERO: PARTÍCULAS DE ASERRÍN ===================== */
  function initParticles() {
    var canvas = $('#hero-canvas');
    var hero = $('#inicio');
    if (!canvas || !canvas.getContext || !hero) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1, parts = [], running = false, visible = true, mouse = { x: -9999, y: -9999 };

    // sprites pre-renderizados (rápido): punto cálido y halo suave
    function sprite(size, stops) {
      var c = doc.createElement('canvas'); c.width = c.height = size;
      var g = c.getContext('2d');
      var gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
      g.fillStyle = gr; g.fillRect(0, 0, size, size);
      return c;
    }
    var dot = sprite(32, [[0, 'rgba(201,134,86,1)'], [0.45, 'rgba(201,134,86,.55)'], [1, 'rgba(201,134,86,0)']]);
    var halo = sprite(64, [[0, 'rgba(255,214,170,.75)'], [1, 'rgba(255,214,170,0)']]);

    function make(initial) {
      var big = Math.random() < 0.18;
      return {
        x: Math.random() * w, y: initial ? Math.random() * h : h + 20,
        r: big ? Math.random() * 14 + 10 : Math.random() * 2.6 + 1,
        vy: -(Math.random() * 0.32 + 0.07) * (big ? 0.6 : 1), vx: (Math.random() - 0.5) * 0.14,
        ph: Math.random() * 6.283, a: big ? Math.random() * 0.22 + 0.08 : Math.random() * 0.5 + 0.18, big: big
      };
    }
    function resize() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = w < 700 ? 26 : 54;
      parts = []; for (var i = 0; i < n; i++) parts.push(make(true));
      if (reduced) draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!reduced) {
          p.y += p.vy; p.x += p.vx + Math.sin(t * 0.0006 + p.ph) * 0.22;
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 14000) { var f = (1 - d2 / 14000) * 1.6; var d = Math.sqrt(d2) || 1; p.x += (dx / d) * f; p.y += (dy / d) * f; }
          if (p.y < -30 || p.x < -30 || p.x > w + 30) { parts[i] = make(false); p = parts[i]; if (p.x < 0 || p.x > w) p.x = Math.random() * w; }
        }
        var tw = 0.65 + 0.35 * Math.sin(t * 0.0018 + p.ph * 3);
        ctx.globalAlpha = p.a * tw;
        var s = p.r * 2;
        ctx.drawImage(p.big ? halo : dot, p.x - p.r, p.y - p.r, s, s);
      }
      ctx.globalAlpha = 1;
    }
    function tick(t) { if (!running) return; draw(t); window.requestAnimationFrame(tick); }
    function start() { if (running || reduced || !visible || doc.hidden) return; running = true; window.requestAnimationFrame(tick); }
    function stop() { running = false; }

    resize();
    window.addEventListener('resize', resize);
    if (!reduced) {
      hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: 0 }).observe(hero);
      }
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) stop(); else start(); });
      start();
    }
  }

  /* ===================== HERO Y MADERAS: 3D CON EL PUNTERO ===================== */
  function initTilt() {
    $$('[data-depth]').forEach(function (d) { d.style.setProperty('--dp', d.getAttribute('data-depth')); });
    if (!finePointer || reduced) return;
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 8;
      var isStage = el.id === 'hero-stage';
      var host = isStage ? $('#inicio') : el;
      var rafId = 0, nx = 0, ny = 0;
      function apply() {
        rafId = 0;
        el.style.setProperty('--ry', (nx * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-ny * max * 0.7).toFixed(2) + 'deg');
        el.style.setProperty('--mx', nx.toFixed(3));
        el.style.setProperty('--my', ny.toFixed(3));
      }
      host.addEventListener('pointermove', function (e) {
        if (isStage) { nx = (e.clientX / geo.vw - 0.5) * 2; ny = (e.clientY / geo.vh - 0.5) * 2; }
        else { var r = el.getBoundingClientRect(); nx = ((e.clientX - r.left) / r.width - 0.5) * 2; ny = ((e.clientY - r.top) / r.height - 0.5) * 2; }
        if (!rafId) rafId = window.requestAnimationFrame(apply);
      });
      host.addEventListener('pointerleave', function () { nx = ny = 0; if (!rafId) rafId = window.requestAnimationFrame(apply); });
    });
  }

  // desplazamiento suave de capas del hero al hacer scroll
  function initHeroScroll() {
    var hero = $('#inicio');
    if (!hero || reduced) return;
    addTask(function (s) {
      if (s > geo.vh * 1.4) return false;
      hero.style.setProperty('--sy', s.toFixed(1));
      return false;
    });
  }

  /* ===================== ESTADO ABIERTO / CERRADO ===================== */
  function fmtHora(h) {
    var hh = h > 12 ? h - 12 : h;
    return hh + ':00 ' + (h >= 12 ? 'p. m.' : 'a. m.');
  }
  function mexNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: map[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function statusInfo() {
    var n = mexNow(), blocks = HORARIO[n.day] || [], i;
    for (i = 0; i < blocks.length; i++) {
      if (n.min >= blocks[i][0] * 60 && n.min < blocks[i][1] * 60) return { open: true, text: 'Abierto ahora · cierra a las ' + fmtHora(blocks[i][1]), day: n.day };
    }
    for (i = 0; i < blocks.length; i++) {
      if (n.min < blocks[i][0] * 60) return { open: false, text: 'Cerrado ahora · abrimos hoy a las ' + fmtHora(blocks[i][0]), day: n.day };
    }
    for (var k = 1; k <= 7; k++) {
      var d = (n.day + k) % 7, bl = HORARIO[d];
      if (bl && bl.length) return { open: false, text: 'Cerrado ahora · abrimos ' + (k === 1 ? 'mañana' : 'el ' + DIAS[d]) + ' a las ' + fmtHora(bl[0][0]), day: n.day };
    }
    return { open: false, text: 'Cerrado ahora', day: n.day };
  }
  function initStatus() {
    var pill = $('#estado-taller');
    var pillText = pill && $('.status-pill__text', pill);
    var visit = $('#visit-status');
    var rows = $$('#hours-body tr');
    function paint() {
      var s = statusInfo();
      if (pill && pillText) { pill.classList.toggle('is-open', s.open); pillText.textContent = s.text + ' · Zapopan'; }
      if (visit) { visit.classList.toggle('is-open', s.open); visit.textContent = s.text; }
      rows.forEach(function (r) { r.classList.toggle('is-today', Number(r.getAttribute('data-day')) === s.day); });
    }
    paint();
    setInterval(paint, 60000);
  }

  /* ===================== CINTA DE PIEZAS: reacciona a la velocidad del scroll ===================== */
  function initMarquee() {
    if (reduced) return;
    var tracks = $$('.marquee__track');
    if (!tracks.length || !tracks[0].getAnimations) return;
    var rate = 1;
    addTask(function (s, target, vel) {
      var goal = 1 + clamp(Math.abs(vel) * 0.18, 0, 7);
      rate += (goal - rate) * 0.12;
      if (rate < 1.01) rate = 1;
      tracks.forEach(function (t) {
        var a = t.getAnimations()[0];
        if (a) a.playbackRate = rate;
      });
      return rate > 1.01;
    });
  }

  /* ===================== MANIFIESTO: palabras que se encienden ===================== */
  function initManifesto() {
    var p = $('#manifiesto-texto');
    if (!p) return;
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    var spans = words.map(function (w, i) {
      var s = doc.createElement('span'); s.className = 'w'; s.textContent = w;
      p.appendChild(s); if (i < words.length - 1) p.appendChild(doc.createTextNode(' '));
      return s;
    });
    man.el = p; man.top = 0; man.h = 0; man.on = -1;
    addTask(function (s) {
      var prog = clamp((s + geo.vh * 0.85 - man.top) / (man.h + geo.vh * 0.42), 0, 1);
      var count = Math.round(prog * spans.length);
      if (count === man.on) return false;
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('on', i < count);
      man.on = count;
      return false;
    });
  }

  /* ===================== IMAGEN QUE SE EXPANDE CON EL SCROLL ===================== */
  function initExpand() {
    exp.el = $('#medida');
    if (!exp.el) return;
    exp.top = 0; exp.h = 0; exp.p = -1;
    var caption = $('#expand-caption');
    addTask(function (s) {
      var p = clamp((s - exp.top) / Math.max(1, exp.h - geo.vh), 0, 1);
      if (p === exp.p) return false;
      exp.p = p;
      var e = easeInOut(clamp(p / 0.62, 0, 1));
      var t = 1 - clamp(p / 0.26, 0, 1);
      var c = clamp((p - 0.6) / 0.24, 0, 1);
      exp.el.style.setProperty('--e', e.toFixed(4));
      exp.el.style.setProperty('--t', t.toFixed(3));
      exp.el.style.setProperty('--c', c.toFixed(3));
      if (caption) caption.style.pointerEvents = c > 0.5 ? 'auto' : 'none';
      return false;
    });
  }

  /* ===================== COLECCIÓN: galería horizontal fijada ===================== */
  function galleryInit() {
    gal.sec = $('#coleccion');
    if (!gal.sec) return;
    gal.track = $('#gallery-track'); gal.view = $('#gallery-viewport');
    gal.bar = $('#gallery-bar'); gal.count = $('#gallery-count');
    gal.cards = $$('.gcard', gal.track);
    gal.desk = false; gal.dist = 0; gal.top = 0; gal.p = -1; gal.idx = 0;

    function setProgress(p, idx) {
      if (gal.bar) gal.bar.style.setProperty('--gp', Math.max(0.04, p).toFixed(3));
      if (gal.count && idx !== gal.idx) { gal.idx = idx; gal.count.textContent = pad2(idx); }
    }
    gal.native = function () {
      var max = gal.view.scrollWidth - gal.view.clientWidth;
      var p = max > 0 ? gal.view.scrollLeft / max : 0;
      var center = gal.view.scrollLeft + gal.view.clientWidth / 2, best = 0, bd = 1e9;
      gal.cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center); if (d < bd) { bd = d; best = i; } });
      setProgress(p, best + 1);
    };
    gal.view.addEventListener('scroll', function () { if (!gal.desk) gal.native(); }, { passive: true });
    addTask(function (s) {
      if (!gal.desk) return false;
      var p = clamp((s - gal.top - geo.vh * 0.06) / Math.max(1, gal.dist), 0, 1);
      if (p === gal.p) return false;
      gal.p = p;
      gal.track.style.transform = 'translate3d(' + (-p * gal.dist).toFixed(1) + 'px,0,0)';
      setProgress(p, Math.round(p * (gal.cards.length - 1)) + 1);
      return false;
    });
    // con teclado: si una tarjeta recibe foco, llevamos la galería hasta ella
    gal.track.addEventListener('focusin', function (e) {
      if (!gal.desk) return;
      var card = e.target.closest('.gcard'); if (!card) return;
      var want = clamp(card.offsetLeft - geo.vw * 0.12, 0, gal.dist);
      window.scrollTo(0, gal.top + geo.vh * 0.06 + want);
    });
  }
  function galleryMeasure() {
    if (!gal.sec) return;
    gal.desk = root.classList.contains('js') && mq('(min-width: 1024px)').matches;
    if (gal.desk) {
      // en escritorio las tarjetas quedan fuera de pantalla (a la derecha): se cargan sin esperar al scroll
      gal.cards.forEach(function (c) { var im = $('img', c); if (im && im.loading === 'lazy') im.loading = 'eager'; });
      gal.track.style.transform = '';
      gal.dist = Math.max(0, gal.track.offsetWidth - geo.vw);
      gal.sec.style.setProperty('--gh', Math.round(gal.dist + geo.vh * 1.2) + 'px');
    } else {
      gal.sec.style.removeProperty('--gh');
      gal.track.style.transform = '';
      gal.dist = 0;
      if (gal.native) gal.native();
    }
    gal.top = absTop(gal.sec); gal.p = -1;
  }

  /* ===================== VISOR DE IMÁGENES ===================== */
  function initLightbox() {
    var dlg = $('#lightbox');
    var btns = $$('[data-lb]');
    if (!dlg || !btns.length) return;
    var img = $('#lb-img'), cap = $('#lb-cap'), cta = $('#lb-cta');
    var idx = 0;
    function show() {
      var b = btns[idx], im = $('img', b), card = b.closest('.gcard'), title = $('h3', card).textContent.trim();
      img.src = im.currentSrc || im.src; img.alt = im.alt; cap.textContent = title;
      var msg = 'Hola, vi «' + title + '» en su página y quiero una pieza parecida a mi medida.';
      cta.setAttribute('data-wa', msg);
      if (WHATSAPP_NUMBER) { cta.href = waUrl(msg); cta.target = '_blank'; cta.rel = 'noopener noreferrer'; }
    }
    function open(i) {
      idx = i; show();
      if (!dlg.open) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
      doc.body.classList.add('is-locked');
      window.requestAnimationFrame(function () { dlg.classList.add('is-in'); });
    }
    function close() {
      dlg.classList.remove('is-in');
      setTimeout(function () { if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); } doc.body.classList.remove('is-locked'); }, reduced ? 0 : 280);
    }
    function step(d) { idx = (idx + d + btns.length) % btns.length; show(); }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
    $('#lb-close').addEventListener('click', close);
    $('#lb-prev').addEventListener('click', function () { step(-1); });
    $('#lb-next').addEventListener('click', function () { step(1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });
    dlg.addEventListener('close', function () { dlg.classList.remove('is-in'); doc.body.classList.remove('is-locked'); });
  }

  /* ===================== SERVICIOS: índice editorial ===================== */
  function initServices() {
    var rows = $$('.idx__row');
    if (!rows.length) return;
    function staggerTags(row) {
      withAnime(function (anime) {
        anime({ targets: $$('.tags li', row), translateY: [14, 0], opacity: [0, 1], delay: anime.stagger(60, { start: 150 }), duration: 600, easing: 'easeOutCubic' });
      });
    }
    rows.forEach(function (row) {
      var btn = $('.idx__btn', row);
      btn.addEventListener('click', function () {
        var open = row.classList.contains('is-open');
        rows.forEach(function (r) {
          var isThis = r === row;
          var next = isThis ? !open : false;
          r.classList.toggle('is-open', next);
          $('.idx__btn', r).setAttribute('aria-expanded', String(next));
        });
        if (!open) staggerTags(row);
      });
    });

    // vista previa que sigue al cursor (solo con ratón)
    var prev = $('#idx-preview');
    var list = $('#idx');
    if (!prev || !list || !finePointer || reduced) return;
    var pimg = $('img', prev);
    var tx = 0, ty = 0, x = 0, y = 0, on = false, rid = 0;
    rows.forEach(function (r) { var s = r.getAttribute('data-img'); if (s) { var i = new Image(); i.src = s; } });
    function move() {
      rid = 0;
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      prev.style.transform = 'translate3d(' + (x + 28).toFixed(1) + 'px,' + (y - 90).toFixed(1) + 'px,0) rotate(-3deg)';
      if (on || Math.abs(tx - x) > 0.5) rid = window.requestAnimationFrame(move);
    }
    list.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!on) { x = tx; y = ty; } if (!rid) rid = window.requestAnimationFrame(move); });
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () {
        var s = r.getAttribute('data-img');
        if (!s) { prev.classList.remove('is-on'); on = false; return; }
        if (pimg.getAttribute('src') !== s) pimg.setAttribute('src', s);
        prev.classList.add('is-on'); on = true;
      });
    });
    list.addEventListener('mouseleave', function () { prev.classList.remove('is-on'); on = false; });
  }

  /* ===================== PROCESO ===================== */
  function initProcess() {
    var steps = $$('.step');
    var pv = $('#pv');
    if (!steps.length || !pv) return;
    var layers = $$('.pv__layer', pv);
    var num = $('#pv-num');
    var current = 0;
    function setStep(n) {
      if (n === current) return; current = n;
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i + 1 === n); s.classList.toggle('is-past', i + 1 < n); });
      pv.setAttribute('data-step', String(n));
      pv.style.setProperty('--n', String(n));
      layers.forEach(function (l) { l.classList.toggle('is-on', (' ' + l.getAttribute('data-for') + ' ').indexOf(' ' + n + ' ') > -1); });
      if (num) num.textContent = pad2(n);
    }
    setStep(1);
    if (!('IntersectionObserver' in window)) { setStep(5); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setStep(Number(en.target.getAttribute('data-step'))); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ===================== FORMULARIO → WHATSAPP ===================== */
  function initForm() {
    var form = $('#form-cotizacion');
    if (!form) return;
    var note = $('#form-note');
    function fail(id, msg) {
      var err = $('#err-' + id), field = err && err.closest('.field');
      if (err) err.textContent = msg;
      if (field) field.classList.add('has-error');
    }
    function clear() {
      $$('.field__err', form).forEach(function (e) { e.textContent = ''; });
      $$('.field', form).forEach(function (f) { f.classList.remove('has-error'); });
    }
    ['f-nombre', 'f-mueble'].forEach(function (id) {
      var el = $('#' + id);
      el.addEventListener('input', clear); el.addEventListener('change', clear);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clear();
      var nombre = form.elements.nombre.value.trim();
      var mueble = form.elements.mueble.value.trim();
      var madera = (form.querySelector('input[name="madera"]:checked') || {}).value || 'Aún no lo sé';
      var detalles = form.elements.detalles.value.trim();
      var ok = true;
      if (nombre.length < 2) { fail('nombre', 'Escribe tu nombre para saber cómo llamarte.'); ok = false; }
      if (!mueble) { fail('mueble', 'Elige qué mueble te interesa.'); ok = false; }
      if (!ok) { var first = $('.has-error input, .has-error select', form); if (first) first.focus(); return; }
      if (!WHATSAPP_NUMBER) { if (note) note.textContent = 'Por ahora WhatsApp no está disponible. Visítanos en el taller.'; return; }
      var texto = 'Hola, soy ' + nombre + '. Quiero cotizar: ' + mueble + '.\n' +
        'Madera que me gusta: ' + madera + '.' +
        (detalles ? '\nDetalles: ' + detalles : '') +
        '\n\n(Mensaje enviado desde la página web de ' + NEGOCIO + ')';
      openUrl(waUrl(texto));
      form.classList.add('is-sent');
      if (note) note.textContent = '¡Listo, ' + nombre.split(' ')[0] + '! Abrimos WhatsApp con tu mensaje.';
    });
  }

  /* ===================== CURSOR PERSONALIZADO (solo con ratón) ===================== */
  function initCursor() {
    var cur = $('#cursor');
    if (!cur || !finePointer || reduced) return;
    var label = $('.cursor__label', cur);
    var tx = -100, ty = -100, x = -100, y = -100, shown = false, rid = 0;
    function move() {
      rid = 0;
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      cur.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) rid = window.requestAnimationFrame(move);
    }
    doc.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; cur.style.display = 'block'; x = tx; y = ty; }
      if (!rid) rid = window.requestAnimationFrame(move);
    });
    doc.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('.gcard__zoom, .idx__btn');
      if (!t) { cur.classList.remove('is-active'); return; }
      var txt = 'Ver';
      if (t.classList.contains('idx__btn')) txt = t.closest('.idx__row').classList.contains('is-open') ? 'Cerrar' : 'Abrir';
      label.textContent = txt; cur.classList.add('is-active');
    });
    doc.addEventListener('mouseleave', function () { cur.classList.remove('is-active'); });
  }

  /* ===================== ARRANQUE ===================== */
  // Cada módulo corre aislado: si uno falla, el resto del sitio sigue funcionando.
  function safe(fn) {
    try { fn(); } catch (err) { if (window.console && console.warn) console.warn('[taller] módulo omitido:', err && err.message); }
  }

  function init() {
    [setupWhatsApp, initHeader, initReveal, initParticles, initTilt, initHeroScroll, initStatus,
      initMarquee, initManifesto, initExpand, galleryInit, initLightbox, initServices, initProcess,
      initForm, initCursor].forEach(safe);
    safe(measure);
    safe(runLoader);
    setTimeout(onReady, 2200); // último recurso: el hero siempre se revela (onReady es idempotente)
    window.__thmReady = true; // avisa a la red de seguridad del <head> que el script arrancó

    var resizeT = 0;
    window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(queueMeasure, 120); });
    window.addEventListener('load', queueMeasure);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(queueMeasure);
    if ('ResizeObserver' in window) new ResizeObserver(queueMeasure).observe(doc.body);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
