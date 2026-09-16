(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = $('[data-nav]');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const out = $('[data-cmd-out]');
  $$('.install-tabs button').forEach((tab, _, tabs) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', t === tab));
      out.textContent = tab.dataset.cmd;
    });
  });

  const copyBtn = $('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    const text = out.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(out);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      document.execCommand('copy');
    }
    copyBtn.textContent = 'Copied';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1600);
  });

  const shotTabs = $$('.shot-tabs button');
  const shots = $$('.shot-stack img');
  let shotIndex = 0;
  let shotTimer;
  const showShot = (i) => {
    shotIndex = i;
    shotTabs.forEach((t, n) => t.setAttribute('aria-selected', n === i));
    shots.forEach((img, n) => img.classList.toggle('is-on', n === i));
  };
  const autoplay = () => {
    clearInterval(shotTimer);
    if (!reduced) shotTimer = setInterval(() => showShot((shotIndex + 1) % shots.length), 5000);
  };
  shotTabs.forEach((t, i) => t.addEventListener('click', () => { showShot(i); autoplay(); }));
  autoplay();

  const countUp = (el) => {
    const end = Number(el.dataset.count);
    if (reduced || end === 0) { el.textContent = end; return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1100, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const runAgent = (card) => {
    const steps = $$('li', card);
    const live = $('.live', card);
    steps.forEach((li, i) => setTimeout(() => {
      li.classList.add('done');
      if (i === steps.length - 1) live.textContent = 'done';
    }, reduced ? 0 : 450 * (i + 1)));
  };

  const staggerChat = (chat) => {
    $$('.msg, .fit tr', chat).forEach((el, i) => (el.style.transitionDelay = `${i * 140}ms`));
    chat.classList.add('is-in');
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      target.classList.add('is-in');
      if (target.matches('[data-board]')) setTimeout(() => target.classList.add('is-tidy'), reduced ? 0 : 900);
      if (target.matches('[data-chat]')) staggerChat(target);
      if (target.matches('[data-agent]')) runAgent(target);
      const count = target.querySelector('[data-count]');
      if (count) countUp(count);
      io.unobserve(target);
    });
  }, { threshold: 0.2 });
  $$('.reveal, [data-board]').forEach((el) => io.observe(el));

  const canvas = $('[data-pixels]');
  const drawPixels = () => {
    const glyphs = {
      O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
      S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
      2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
      0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    };
    const rows = ['O', 'S', '2', '0'].map((c) => glyphs[c]);
    const cols = rows.length * 5 + (rows.length - 1);
    const w = canvas.clientWidth;
    const cell = w / cols;
    const dpr = devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = cell * 7 * dpr;
    canvas.style.height = `${cell * 7}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const hue = getComputedStyle(document.documentElement).getPropertyValue('--hue').trim() || '224';
    const t = performance.now() / 1000;
    rows.forEach((glyph, g) => glyph.forEach((line, y) => [...line].forEach((bit, x) => {
      const cx = (g * 6 + x) * cell;
      const wave = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(t * 1.6 - (g * 6 + x) * 0.35 + y * 0.4);
      ctx.fillStyle = bit === '1' ? `hsla(${hue}, 98%, 58%, ${wave})` : 'rgba(255,255,255,0.035)';
      ctx.fillRect(cx + 1, y * cell + 1, cell - 2, cell - 2);
    })));
  };
  let pixelsVisible = false;
  new IntersectionObserver(([e]) => (pixelsVisible = e.isIntersecting)).observe(canvas);
  const loop = () => {
    if (pixelsVisible) drawPixels();
    if (!reduced) requestAnimationFrame(loop);
  };
  drawPixels();
  loop();
  addEventListener('resize', drawPixels);
})();
