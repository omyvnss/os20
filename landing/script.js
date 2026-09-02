(() => {
  // ===== Theme (light/dark, respects system preference) =====
  const root = document.documentElement;
  const KEY = 'od-theme';
  const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  const apply = (t) => { root.dataset.theme = t; root.style.colorScheme = t; };
  const current = () => {
    const saved = localStorage && localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return media && media.matches ? 'dark' : 'light';
  };
  apply(current());
  window.setTheme = (t) => { if (localStorage) localStorage.setItem(KEY, t); apply(t); };
  if (media) {
    media.addEventListener('change', (e) => {
      if (!localStorage || !localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light');
    });
  }
})();

(() => {
  // ===== Header scrolled state =====
  const hdr = document.querySelector('.site-header');
  if (hdr) {
    addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 8), { passive: true });
  }

  // ===== FAQ accordion (a11y) =====
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    btn.setAttribute('aria-expanded', btn.closest('.faq-item').classList.contains('open') ? 'true' : 'false');
  });

  // ===== Stepper / flow highlight =====
  const steps = document.querySelectorAll('.step, .flow-step');
  if (steps.length) {
    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (e.isIntersecting) {
            steps.forEach((s) => s.classList.remove('active'));
            e.target.classList.add('active');
          }
        });
      },
      { threshold: 0.55, rootMargin: '-20% 0px -60% 0px' },
    );
    steps.forEach((s) => io.observe(s));
  }

  // ===== Testimonial carousel =====
  const quotes = [
    {
      t: '“The flexibility is really what made the difference. Our needs evolve very fast. I discover a new need and in two clicks I address it.”',
      n: 'We didn’t want to patch — we wanted to own',
      r: 'Founding team, NetZero',
      img: 'assets/images/twenty.com/ray-damm-7e8235a7d4.webp',
    },
    {
      t: '“We shipped W3Grads in weeks, not quarters. OS20 gave us the operational backbone without the lock-in.”',
      n: 'VP of Engineering',
      r: 'W3villa Technologies',
      img: 'assets/images/twenty.com/ping-li-d73dfe5c63.webp',
    },
    {
      t: '“From Salesforce to self-hosted in days — AI did the mapping, we kept the control.”',
      n: 'Principal and Founder',
      r: 'Alternative Partners',
      img: 'assets/images/twenty.com/anonymous-laura-66d18df0a2.webp',
    },
  ];
  const qEl = document.querySelector('.t-quote');
  const nEl = document.querySelector('.t-person b');
  const rEl = document.querySelector('.t-person div div:last-child');
  const imgEl = document.querySelector('.t-person img');
  const badge = document.querySelector('.t-badge');
  let qi = 0;
  function renderQ(i) {
    const q = quotes[i];
    if (qEl) qEl.textContent = q.t;
    if (nEl) nEl.textContent = q.n;
    if (rEl) rEl.textContent = q.r;
    if (imgEl) imgEl.src = q.img;
    if (badge) badge.textContent = (i + 1) + ' / 3 — REAL CUSTOMER STORIES';
  }
  document.querySelectorAll('.t-nav button').forEach((b, idx) => {
    b.addEventListener('click', () => {
      qi = idx === 0 ? (qi + 2) % 3 : (qi + 1) % 3;
      renderQ(qi);
    });
  });

  // ===== Command palette =====
  const palette = document.getElementById('cmd-palette');
  function openPalette() {
    if (!palette) return;
    palette.style.display = 'flex';
    const input = palette.querySelector('input');
    if (input) input.focus();
  }
  function closePalette() {
    if (palette) palette.style.display = 'none';
  }
  document.querySelector('[data-od-id="nav-command"]')?.addEventListener('click', openPalette);
  palette?.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
    }
    if (e.key === 'Escape') closePalette();
  });
})();

(() => {
  // ===== Reactive vertical bars behind hero =====
  const canvas = document.getElementById('vbars');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let time = 0;
  const mouse = { x: -9999, y: -9999, isDown: false };
  const ripples = [];
  const bg = '#f4f4f4';
  const line = '#1c1c1c18';
  const bar = '#1c1c1c';
  const lineW = 1;
  const speed = 0.00096;
  const hexToRgb = (h) => {
    h = h.replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  };
  const lineRgb = hexToRgb(line.slice(0, 7));
  const barRgb = hexToRgb(bar);
  const noise = (x, y, t) => (Math.sin(x * 0.012 + t) * Math.cos(y * 0.012 + t) + Math.sin(x * 0.018 - t) * Math.cos(y * 0.006 + t) + 1) / 2;
  const getMouse = (x, y) => { const d = Math.hypot(x - mouse.x, y - mouse.y); return Math.max(0, 1 - d / 260); };
  const getRipple = (x, y, now) => {
    let s = 0;
    ripples.forEach((r) => {
      const a = now - r.time;
      if (a < 1400) {
        const d = Math.hypot(x - r.x, y - r.y);
        const rad = (a / 1400) * 340;
        const w = 60;
        if (Math.abs(d - rad) < w) s += (1 - a / 1400) * r.intensity * (1 - Math.abs(d - rad) / w);
      }
    });
    return Math.min(s, 2.5);
  };
  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.8);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  hero.addEventListener('mousemove', (e) => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  hero.addEventListener('mousedown', (e) => {
    mouse.isDown = true;
    const r = hero.getBoundingClientRect();
    ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, time: Date.now(), intensity: 2.2 });
  });
  window.addEventListener('mouseup', () => (mouse.isDown = false));
  hero.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const r = hero.getBoundingClientRect();
    mouse.x = t.clientX - r.left;
    mouse.y = t.clientY - r.top;
  }, { passive: true });
  function frame() {
    time += speed;
    const now = Date.now();
    const W = hero.clientWidth;
    const H = hero.clientHeight;
    const lines = Math.floor(H / 5);
    const gap = H / lines;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < lines; i++) {
      const y = i * gap + gap / 2;
      const mi = getMouse(W / 2, y);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${lineRgb.r},${lineRgb.g},${lineRgb.b},${Math.max(0.18, 0.22 + mi * 0.6)})`;
      ctx.lineWidth = lineW + mi * 2.4;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      for (let x = 0; x < W; x += 3) {
        const n = noise(x, y, time);
        const m = getMouse(x, y);
        const rp = getRipple(x, y, now);
        const tot = m + rp;
        const thr = Math.max(0.18, 0.46 - m * 0.22 - Math.abs(rp) * 0.12);
        if (n > thr) {
          const w = 3 + n * 11 + tot * 7;
          const h = 2 + n * 3 + tot * 4;
          const base = Math.sin(time + y * 0.04) * 18 * n;
          const mm = mouse.isDown ? Math.sin(time * 3.2 + x * 0.012) * 12 * m : 0;
          const ra = rp * Math.sin(time * 2.4 + x * 0.022) * 18;
          const ax = x + base + mm + ra;
          const a = Math.min(1, 0.68 + tot * 0.32);
          ctx.fillStyle = `rgba(${barRgb.r},${barRgb.g},${barRgb.b},${a})`;
          ctx.fillRect(ax - w / 2, y - h / 2, w, h);
        }
      }
    }
    ripples.forEach((r) => {
      const a = now - r.time;
      if (a < 1400) {
        const p = a / 1400;
        const rad = p * 340;
        const al = (1 - p) * 0.28 * r.intensity;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(28,28,28,${al})`;
        ctx.lineWidth = 1.5;
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    for (let i = ripples.length - 1; i >= 0; i--) {
      if (Date.now() - ripples[i].time > 1400) ripples.splice(i, 1);
    }
    requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  resize();
  frame();
  window.addEventListener('resize', resize);
})();

(() => {
  // ===== Lightweight halftone (perf: drawn once) =====
  const c = document.getElementById('halftone');
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  function draw() {
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!w || !h) return;
    c.width = w * dpr;
    c.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const dot = 2.2;
    const gap = 13;
    for (let y = 0; y < h; y += gap) {
      for (let x = 0; x < w; x += gap) {
        const dx = (x - w / 2) / w;
        const dy = (y - h / 2) / h;
        const d = Math.hypot(dx, dy);
        const a = Math.max(0, 0.16 - d * 0.22);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, dot / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1c1c1c';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  const ro = new ResizeObserver(draw);
  ro.observe(c);
  draw();
})();
