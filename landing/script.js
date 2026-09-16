(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const whenVisible = (node, fn, threshold = 0.3) => {
    new IntersectionObserver(([e]) => fn(e.isIntersecting), { threshold }).observe(node);
  };
  const tint = ['#f8d1c9', '#dcf', '#ffcf87', '#9dffca', '#ccedff', '#fee7ac', '#ffae95', '#c9a9ff'];
  const icon = {
    building: '<svg viewBox="0 0 16 16"><path d="M3 13V4l5-1.5V13M8 6h5v7"/></svg>',
    link: '<svg viewBox="0 0 16 16"><path d="M7 9a2.5 2.5 0 003.5 0l2-2A2.5 2.5 0 009 3.5l-.5.5M9 7a2.5 2.5 0 00-3.5 0l-2 2A2.5 2.5 0 007 12.5l.5-.5"/></svg>',
    user: '<svg viewBox="0 0 16 16"><circle cx="8" cy="5.5" r="2.5"/><path d="M3.5 13c.6-2.6 2.4-3.8 4.5-3.8s3.9 1.2 4.5 3.8"/></svg>',
    history: '<svg viewBox="0 0 16 16"><path d="M3 8a5 5 0 105-5 5 5 0 00-3.5 1.5M3 3v2.5h2.5M8 5.5V8l1.5 1"/></svg>',
    calendar: '<svg viewBox="0 0 16 16"><rect x="3" y="3.5" width="10" height="9.5" rx="1.5"/><path d="M3 6.5h10M6 2.5v2M10 2.5v2"/></svg>',
    linkedin: '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="2"/><path d="M6 7v3.5M6 5.2v.1M8.5 10.5V8.3a1.3 1.3 0 012.6 0v2.2"/></svg>',
    map: '<svg viewBox="0 0 16 16"><path d="M3 4.5l3-1.5 4 1.5 3-1.5v8.5l-3 1.5-4-1.5-3 1.5z"/></svg>',
    dollar: '<svg viewBox="0 0 16 16"><path d="M8 2.5v11M10.5 5c-.4-.9-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.6-2.5-1.5"/></svg>',
    check: '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="2"/><path d="M6 8l1.5 1.5L10.5 6.5"/></svg>',
  };
  const chipName = (name, i, round) => `<span class="chip"><span class="ini${round ? ' round' : ''}" style="--c:${tint[i % tint.length]}">${name[0]}</span>${name}</span>`;
  const actor = '<span class="chip"><span class="ini round" style="--c:#e9ddff">A</span>Admin User</span>';

  /* Copy + toast */
  const INSTALL = 'npx os20-cli';
  const toast = $('[data-toast]');
  let toastTimer;
  const showToast = (html) => {
    toast.innerHTML = html;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied <code>${text.length > 40 ? `${text.slice(0, 40)}...` : text}</code>. Paste it in your terminal.`);
    } catch {
      showToast(`Run <code>${text}</code> in your terminal.`);
    }
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(INSTALL)));
  $$('[data-copy-text]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copyText)));
  const cmdOut = $('[data-cmd-out]');
  $$('.cmd-tabs button').forEach((tab, _, tabs) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('is-on', t === tab));
    cmdOut.textContent = tab.dataset.cmd;
  }));
  $('[data-copy-cmd]').addEventListener('click', () => copy(cmdOut.textContent));

  /* Pause looping animations while offscreen */
  $$('.integrations, .scard').forEach((node) => whenVisible(node, (v) => node.classList.toggle('is-paused', !v), 0));

  /* Island + chapter menu */
  const island = $('[data-island]');
  const darkZones = $$('.chapter.dark, .cta, .footer');
  const menu = $('[data-chapters]');
  const menuLinks = $$('a', menu);
  const chapters = $$('.chapter');
  const panels = $$('.panel');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    island.classList.toggle('is-compact', scrollY > 40);
    island.classList.toggle('on-dark', darkZones.some((z) => {
      const r = z.getBoundingClientRect();
      return r.top <= 30 && r.bottom >= 30;
    }));
    const probe = innerHeight * 0.6;
    const current = chapters.find((c) => {
      const r = c.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    const overPanel = panels.some((p) => {
      const r = p.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > innerHeight - 240;
    });
    menu.classList.toggle('is-visible', Boolean(current) && !overPanel);
    if (!current) return;
    menu.classList.toggle('on-dark', current.classList.contains('dark'));
    menuLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.chapter === current.id));
  };
  addEventListener('scroll', () => {
    if (!ticking) requestAnimationFrame(onScroll);
    ticking = true;
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* Marquee */
  $$('.track').forEach((track) => {
    track.append(...[...track.children].map((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      return c;
    }));
  });

  /* Reveal */
  const groups = new Map();
  $$('.reveal').forEach((n) => {
    const i = groups.get(n.parentElement) ?? 0;
    groups.set(n.parentElement, i + 1);
    n.style.setProperty('--delay', `${Math.min(i, 6) * 0.1}s`);
  });
  const revealer = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    revealer.unobserve(e.target);
  }), { threshold: 0.15 });
  $$('.reveal').forEach((n) => revealer.observe(n));

  /* ---------- Lead engine: Companies + Ask AI ---------- */
  const lead = $('[data-lead-demo]');
  const existing = [
    ['Fold Studio', 'foldstudio.design', '6 hours ago', 'Copenhagen'],
    ['Quill Recruiting', 'quillrecruit.com', '6 hours ago', 'Paris'],
    ['Orbit Energy Data', 'orbitenergy.de', 'yesterday', 'Hamburg'],
    ['Lumen Logistics', 'lumenlogistics.com', '2 days ago', 'Rotterdam'],
  ];
  const found = [
    ['Northwind Dental Cloud', 'northwinddental.io', 92],
    ['Sable Security', 'sablesec.io', 90],
    ['Harbor Analytics', 'harboranalytics.co', 87],
    ['Atlas Field Service', 'atlasfield.io', 84],
    ['Kite Payments', 'kitepay.eu', 81],
    ['Meridian Health OS', 'meridianhealth.app', 77],
    ['Pinecrest Legal', 'pinecrestlegal.de', 74],
    ['Verde Commerce', 'verdecommerce.shop', 71],
  ];
  const navIco = (view) => $(`.os-nav[data-view="${view}"] .os-ico`, lead).outerHTML;
  const views = {
    companies: {
      title: 'Companies', add: 'Company',
      head: [['Name', icon.building], ['Domain', icon.link], ['Created by', icon.history], ['Account Owner', icon.user], ['Creation date', icon.calendar], ['LinkedIn', icon.linkedin], ['Address', icon.map]],
      rows: () => companyRows.map(([n, d, t, a], i) => [chipName(n, i), `<span class="link">${d}</span>`, actor, '', t, '', a || '']),
    },
    people: {
      title: 'People', add: 'Person',
      head: [['Name', icon.user], ['Emails', icon.link], ['Created by', icon.history], ['Company', icon.building], ['Job Title', icon.check], ['City', icon.map]],
      rows: () => [
        ['Lena Brandt', 'lena@northwinddental.io', 'Northwind Dental Cloud', 'Head of Sales', 'Berlin'],
        ['Tomas Ruiz', 'tomas@kitepay.eu', 'Kite Payments', 'COO', 'Lisbon'],
        ['Aiko Sato', 'aiko@harboranalytics.co', 'Harbor Analytics', 'Founder', 'Amsterdam'],
        ['Noah Keller', 'noah@foldstudio.design', 'Fold Studio', 'Design Lead', 'Copenhagen'],
      ].map(([n, e, c, j, city], i) => [chipName(n, i + 3, true), `<span class="link">${e}</span>`, actor, chipName(c, i), j, city]),
    },
    opportunities: {
      title: 'Opportunities', add: 'Opportunity',
      head: [['Name', icon.check], ['Amount', icon.dollar], ['Stage', icon.history], ['Close date', icon.calendar], ['Company', icon.building]],
      rows: () => [
        ['Clinic rollout', '$60k', 'Proposal', '30 Oct, 2026', 'Meridian Health OS'],
        ['Payments pilot', '$25k', 'Meeting', '14 Nov, 2026', 'Kite Payments'],
        ['Security audit', '$40k', 'Screening', '2 Dec, 2026', 'Sable Security'],
      ].map(([n, a, s, d, c], i) => [chipName(n, i + 1), a, `<span class="chip">${s}</span>`, d, chipName(c, i + 4)]),
    },
    tasks: {
      title: 'Tasks', add: 'Task',
      head: [['Title', icon.check], ['Status', icon.history], ['Due Date', icon.calendar], ['Assignee', icon.user]],
      rows: () => [
        ['Call Northwind Dental', 'To do', 'Fri, 18 Sep', 'Om Yaduvanshi'],
        ['Send pilot proposal to Kite', 'In progress', 'Mon, 21 Sep', 'Om Yaduvanshi'],
      ].map(([t, s, d, a], i) => [chipName(t, i + 5), `<span class="chip">${s}</span>`, d, chipName(a, 7, true)]),
    },
    notes: {
      title: 'Notes', add: 'Note',
      head: [['Title', icon.check], ['Created by', icon.history], ['Creation date', icon.calendar]],
      rows: () => [['Discovery call notes', 'today'], ['Pricing questions', 'yesterday']].map(([t, d], i) => [chipName(t, i + 2), actor, d]),
    },
    dashboards: {
      title: 'Dashboards', add: 'Dashboard',
      head: [['Name', icon.check], ['Created by', icon.history], ['Creation date', icon.calendar]],
      rows: () => [['Pipeline overview', 'last week']].map(([t, d], i) => [chipName(t, i + 6), actor, d]),
    },
    workflows: {
      title: 'Workflows', add: 'Workflow',
      head: [['Name', icon.check], ['Status', icon.history], ['Created by', icon.user]],
      rows: () => [['Create company when adding a new person'], ['Quick Lead']].map(([n], i) => [chipName(n, i + 3), '<span class="chip" style="background:#e5f8ee;color:#1a8f57">Active</span>', actor]),
    },
  };
  let companyRows = [...existing];
  let current = 'companies';
  const head = $('[data-head]', lead);
  const body = $('[data-rows]', lead);

  const render = (freshCount = 0) => {
    const v = views[current];
    const rows = v.rows();
    $('[data-crumb]', lead).textContent = v.title;
    $('[data-crumb-ico]', lead).outerHTML = navIco(current).replace('os-ico', 'os-ico sm" data-crumb-ico="');
    $('[data-viewname]', lead).textContent = `All ${v.title}`;
    $('[data-count]', lead).textContent = ` · ${rows.length}`;
    $('[data-new]', lead).textContent = `+ New ${v.add}`;
    head.innerHTML = `<tr><th class="cb"><span class="box"></span></th>${v.head.map(([l, ic]) => `<th>${ic}${l}</th>`).join('')}</tr>`;
    body.innerHTML = rows.map((cells, i) => `<tr class="${i < freshCount ? 'is-new' : ''}" style="--rd:${i * 70}ms"><td class="cb"><span class="box"></span></td>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
    $('[data-foot]', lead).innerHTML = `<span>Calculate</span><span>Count all <b>${rows.length}</b></span>`;
  };

  const navs = $$('.os-nav[data-view]', lead);
  const switchView = (name) => {
    current = name;
    navs.forEach((n) => n.classList.toggle('is-on', n.dataset.view === name));
    render();
  };
  navs.forEach((n) => n.addEventListener('click', () => switchView(n.dataset.view)));
  render();

  const log = $('[data-log]', lead);
  const form = $('[data-form]', lead);
  const input = $('[data-input]', lead);
  const send = $('[data-send]', lead);
  const sendLabel = $('[data-send-label]', lead);
  const orbit = '<svg viewBox="0 0 14 14"><path d="M3.1 7C3.1 4.4 6 4.4 7 7s3.9 2.6 3.9 0S8 4.4 7 7 3.1 9.6 3.1 7" pathLength="100" stroke-dasharray="14 86"><animate attributeName="stroke-dashoffset" values="0;-100" dur="1.05s" repeatCount="indefinite"/><animate attributeName="stroke-dasharray" values="10 90;16 84;10 90" dur="1.05s" repeatCount="indefinite"/></path></svg>';
  const toolIcon = '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>';
  let running = false;

  const push = (node) => {
    log.append(node);
    log.scrollTop = log.scrollHeight;
    return node;
  };

  const streamText = async (node, html) => {
    const words = html.split(/(\s+)/);
    for (let i = 0; i < words.length; i += 2) {
      node.innerHTML = words.slice(0, i + 1).join('');
      log.scrollTop = log.scrollHeight;
      await sleep(reduced ? 0 : 28);
    }
  };

  const runLeadSearch = async (text) => {
    running = true;
    send.disabled = true;
    input.disabled = true;
    sendLabel.textContent = 'Working';
    const empty = $('[data-empty]', lead);
    if (empty) empty.remove();
    push(el('div', 'u-msg')).textContent = text;

    const thinking = push(el('div', 'think', `${orbit}<span>Thinking</span>`));
    await sleep(1400);
    thinking.remove();

    const tool = push(el('div', 'tool', `<span>${toolIcon}<span class="tool-text shimmer">Running Find Leads</span></span><span class="tool-name">find_leads</span>`));
    await sleep(4200);

    if (current !== 'companies') switchView('companies');
    const fresh = found.filter(([n]) => !companyRows.some(([m]) => m === n));
    companyRows = [...fresh.map(([n, d]) => [n, d, 'less than a minute ago', '']), ...companyRows];
    render(fresh.length);

    $('.tool-text', tool).className = 'tool-text';
    $('.tool-text', tool).textContent = `Found ${found.length} lead(s) in 9s; saved ${fresh.length} to the CRM${fresh.length < found.length ? `, ${found.length - fresh.length} already there` : ''}.`;
    tool.classList.add('done');
    const out = el('div', 'tool-out');
    out.textContent = found.map(([n, d, s]) => `${String(s).padStart(3)}  ${n}  https://${d}`).join('\n');
    tool.after(out);
    tool.addEventListener('click', () => tool.classList.toggle('open'));

    await sleep(500);
    const answer = push(el('div', 'a-msg'));
    await streamText(answer, fresh.length
      ? `I found ${found.length} SaaS companies in Berlin and saved them to Companies. Best fits: Northwind Dental Cloud (92), Sable Security (90) and Harbor Analytics (87).`
      : 'These companies are already in your Companies, so nothing new was saved.');

    const reset = push(el('button', 'os-reset', 'Reset demo'));
    reset.type = 'button';
    reset.addEventListener('click', () => {
      companyRows = [...existing];
      log.innerHTML = '<div class="os-empty" data-empty><p>What can I help you with?</p><span>Create a workflow</span><span>Create a record</span></div>';
      input.value = 'Find SaaS companies in Berlin with 10 to 200 people';
      input.disabled = false;
      send.disabled = false;
      sendLabel.textContent = 'Press Enter';
      running = false;
      switchView('companies');
    }, { once: true });
    sendLabel.textContent = 'Done';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || running) return;
    input.value = '';
    runLeadSearch(text);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  /* ---------- Workflow preview (autoplay) ---------- */
  const wf = $('[data-wf]');
  const stage = $('[data-wf-stage]', wf);
  const canvas = $('[data-wf-canvas]', wf);
  const lines = $('[data-wf-lines]', wf);
  const bubble = $('[data-wf-bubble]', wf);
  const cursor = $('[data-wf-cursor]', wf);
  const ghost = $('[data-wf-ghost]', wf);
  const panel = $('[data-wf-panel]', wf);
  const testBtn = $('[data-wf-test]', wf);
  const status = $('[data-wf-status]', wf);
  const wfIcons = {
    trigger: '<path d="M3 13l1-3 7-7 2 2-7 7z"/>',
    code: '<path d="M6 4L2 8l4 4M10 4l4 4-4 4"/>',
    filter: '<path d="M2 3h12L9.5 8.5V13l-3-1.5v-3z"/>',
    search: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>',
    branch: '<circle cx="4" cy="3" r="1.5"/><circle cx="4" cy="13" r="1.5"/><circle cx="12" cy="6" r="1.5"/><path d="M4 4.5v7M4 9c0-2 8-1 8-1.5"/>',
    update: '<path d="M13 8A5 5 0 113.5 5.5M3 2v3.5h3.5"/>',
    create: '<path d="M8 3v10M3 8h10"/>',
  };
  const X = 380, GAP = 66, Y0 = 20;
  const wfNodes = [
    { id: 't', kind: 'Trigger', ic: 'trigger', c: '#3e63dd', name: 'Record is created or updated', x: X, row: 0, say: 'Alex Kim was added with alex@brightlane.dev' },
    { id: 'n1', kind: 'Action', ic: 'code', c: '#e5484d', name: 'Is this a personal email?', x: X, row: 1, from: 't', say: 'Not a personal address' },
    { id: 'n2', kind: 'Action', ic: 'filter', c: '#666', name: 'If business email', x: X, row: 2, from: 'n1', say: 'Business email, so it continues' },
    { id: 'n3', kind: 'Action', ic: 'code', c: '#e5484d', name: 'Extract domain from email', x: X, row: 3, from: 'n2', say: 'Domain is brightlane.dev' },
    { id: 'n4', kind: 'Action', ic: 'search', c: '#666', name: 'Search Company', x: X, row: 4, from: 'n3', say: 'No company with this domain yet' },
    { id: 'n5', kind: 'Action', ic: 'code', c: '#e5484d', name: 'Find exact company match', x: X, row: 5, from: 'n4', say: 'No exact match found' },
    { id: 'n6', kind: 'Action', ic: 'branch', c: '#666', name: 'If a company already exists', x: X, row: 6, from: 'n5', say: 'It does not, so take the create path' },
    { id: 'n7', kind: 'Action', ic: 'update', c: '#666', name: 'Attach person to existing company', x: X - 190, row: 7, from: 'n6' },
    { id: 'n8', kind: 'Action', ic: 'create', c: '#666', name: 'Create a new company', x: X + 170, row: 7, from: 'n6', say: 'Company brightlane.dev created' },
    { id: 'n9', kind: 'Action', ic: 'update', c: '#666', name: 'Attach person to this company', x: X + 170, row: 8, from: 'n8', say: 'Alex Kim is linked to brightlane.dev' },
  ];
  const nodeEl = {};
  const pathEl = {};
  const svgNS = 'http://www.w3.org/2000/svg';
  const placeholder = el('div', 'wnode placeholder', '<span class="ni"><svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg></span><span><small>Trigger</small><b>Add a Trigger</b></span>');
  placeholder.style.left = `${X}px`;
  placeholder.style.top = `${Y0}px`;
  stage.append(placeholder);

  wfNodes.forEach((n) => {
    n.x0 = n.x;
    n.y = Y0 + n.row * GAP;
    const node = el('div', 'wnode', `<span class="ni" style="--nc:${n.c}"><svg viewBox="0 0 16 16">${wfIcons[n.ic]}</svg></span><span><small>${n.kind}</small><b>${n.name}</b></span>`);
    node.style.left = `${n.x}px`;
    node.style.top = `${n.y}px`;
    stage.append(node);
    nodeEl[n.id] = node;
    if (n.from) {
      const p = document.createElementNS(svgNS, 'path');
      lines.append(p);
      pathEl[n.id] = p;
    }
  });

  let compact = null;
  const layoutNodes = () => {
    const next = canvas.clientWidth < 600;
    if (next === compact) return false;
    compact = next;
    const cx = compact ? 170 : X;
    stage.style.width = compact ? '340px' : '760px';
    wfNodes.forEach((n) => {
      n.x = compact ? cx : n.x0;
      if (compact && n.id === 'n7') nodeEl.n7.style.display = 'none';
      else nodeEl[n.id].style.display = '';
      nodeEl[n.id].style.left = `${n.x}px`;
    });
    placeholder.style.left = `${cx}px`;
    if (pathEl.n7) pathEl.n7.style.display = compact ? 'none' : '';
    return true;
  };

  const drawPaths = () => {
    wfNodes.filter((n) => n.from).forEach((n) => {
      const p = wfNodes.find((m) => m.id === n.from);
      const y1 = p.y + 42, y2 = n.y, mid = (y1 + y2) / 2;
      const path = pathEl[n.id];
      path.setAttribute('d', `M${p.x} ${y1} C${p.x} ${mid} ${n.x} ${mid} ${n.x} ${y2}`);
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.dataset.len = len;
    });
  };

  const fit = () => {
    const width = compact ? 360 : 800;
    const s = Math.min(1, canvas.clientWidth / width, (canvas.clientHeight - 10) / 620);
    stage.style.setProperty('--s', s.toFixed(3));
  };

  const at = (target, dx = 0.5, dy = 0.5) => {
    const w = wf.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    return [r.left - w.left + r.width * dx, r.top - w.top + r.height * dy];
  };
  const moveCursor = async (target, ms = 800, dx, dy) => {
    const [x, y] = at(target, dx, dy);
    cursor.style.setProperty('--ct', `${ms}ms`);
    cursor.style.setProperty('--cx', `${x}px`);
    cursor.style.setProperty('--cy', `${y}px`);
    await sleep(ms);
  };
  const click = async () => {
    cursor.classList.remove('click');
    void cursor.offsetWidth;
    cursor.classList.add('click');
    await sleep(260);
  };

  const resetWf = () => {
    layoutNodes();
    fit();
    drawPaths();
    placeholder.classList.add('in');
    Object.values(nodeEl).forEach((n) => { n.className = 'wnode'; });
    Object.values(pathEl).forEach((p) => {
      p.classList.remove('lit');
      p.style.transition = 'none';
      p.style.strokeDashoffset = p.dataset.len;
    });
    bubble.classList.remove('on');
    panel.classList.remove('on');
    ghost.classList.remove('on');
    status.textContent = 'Draft';
    status.classList.remove('is-active');
    cursor.style.setProperty('--ct', '0ms');
    cursor.style.setProperty('--cx', `${wf.clientWidth * 0.82}px`);
    cursor.style.setProperty('--cy', `${wf.clientHeight * 0.86}px`);
  };

  const showNode = (id, ms = 450) => {
    nodeEl[id].classList.add('in');
    const p = pathEl[id];
    if (p) {
      p.style.transition = `stroke-dashoffset ${ms}ms ease`;
      p.style.strokeDashoffset = '0';
    }
  };

  const say = (n) => {
    const node = nodeEl[n.id];
    bubble.textContent = n.say;
    if (compact) {
      bubble.style.left = '20px';
      bubble.style.top = `${n.y + 46}px`;
      bubble.style.borderRadius = '3px 12px 12px 12px';
    } else {
      const rightSpace = n.x < X + 60;
      bubble.style.left = `${rightSpace ? n.x + node.offsetWidth / 2 + 14 : n.x - node.offsetWidth / 2 - 234}px`;
      bubble.style.top = `${n.y + 4}px`;
      bubble.style.borderRadius = rightSpace ? '12px 12px 12px 3px' : '12px 12px 3px 12px';
    }
    bubble.classList.add('on');
  };

  let runId = 0;
  const playWorkflow = async () => {
    const id = ++runId;
    const alive = () => id === runId;
    while (alive()) {
      resetWf();
      await sleep(400);
      if (!alive()) return;
      await moveCursor(placeholder, 700);
      await click();
      panel.classList.add('on');
      await sleep(450);
      const pick = $('[data-wf-pick]', panel);
      await moveCursor(pick, 650, 0.35);
      pick.classList.add('hover');
      await sleep(250);
      if (!alive()) return;
      const [gx, gy] = at(pick, 0.35);
      ghost.style.transform = `translate(${gx - 20}px, ${gy - 16}px) rotate(-3deg)`;
      ghost.classList.add('on');
      const [px, py] = at(placeholder);
      ghost.style.transition = 'transform 900ms cubic-bezier(0.65, 0, 0.35, 1)';
      cursor.style.setProperty('--ct', '900ms');
      cursor.style.setProperty('--cx', `${px}px`);
      cursor.style.setProperty('--cy', `${py}px`);
      requestAnimationFrame(() => { ghost.style.transform = `translate(${px - 20}px, ${py - 16}px) rotate(2deg)`; });
      panel.classList.remove('on');
      await sleep(950);
      pick.classList.remove('hover');
      ghost.classList.remove('on');
      ghost.style.transition = 'none';
      placeholder.classList.remove('in');
      showNode('t');
      await sleep(500);
      if (!alive()) return;

      await moveCursor(nodeEl.t, 600, 0.5, 1);
      for (const nid of ['n1', 'n2']) {
        await moveCursor(nodeEl[nid], 650, 0.5, 0.2);
        showNode(nid, 600);
        await sleep(300);
        if (!alive()) return;
        await moveCursor(nodeEl[nid], 300, 0.5, 1);
      }
      for (const nid of ['n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9']) {
        showNode(nid, 320);
        await sleep(170);
      }
      await sleep(400);
      if (!alive()) return;

      await moveCursor(testBtn, 750);
      await click();
      testBtn.classList.add('press');
      await sleep(160);
      testBtn.classList.remove('press');
      status.textContent = 'Active';
      status.classList.add('is-active');
      await moveCursor(canvas, 700, 0.92, 0.95);

      for (const n of wfNodes) {
        if (n.id === 'n7') continue;
        if (compact && pathEl[n.id] && n.id === 'n8') pathEl.n8.classList.add('lit');
        if (!alive()) return;
        if (pathEl[n.id]) pathEl[n.id].classList.add('lit');
        nodeEl[n.id].classList.add('run');
        say(n);
        await sleep(1150);
        nodeEl[n.id].classList.remove('run');
        nodeEl[n.id].classList.add('ok');
        if (n.id === 'n6') nodeEl.n7.classList.add('skip');
      }
      bubble.classList.remove('on');
      await sleep(1800);
    }
  };

  const wfStatic = () => {
    resetWf();
    placeholder.classList.remove('in');
    wfNodes.forEach((n) => { showNode(n.id, 0); nodeEl[n.id].classList.add(n.id === 'n7' ? 'skip' : 'ok'); if (pathEl[n.id] && n.id !== 'n7') pathEl[n.id].classList.add('lit'); });
    status.textContent = 'Active';
    status.classList.add('is-active');
  };

  resetWf();
  whenVisible(wf, (v) => {
    if (reduced) return wfStatic();
    if (v) playWorkflow();
    else runId++;
  }, 0.35);
  addEventListener('resize', () => {
    if (layoutNodes()) {
      runId++;
      resetWf();
      if (!reduced) playWorkflow();
    }
    fit();
  });

  /* ---------- Board ---------- */
  const kanban = $('[data-kanban]');
  const stages = [
    ['New', '#ffe5e5', '#e5484d'],
    ['Screening', '#f3e8ff', '#8e4ec6'],
    ['Meeting', '#e1f3fe', '#0d74ce'],
    ['Proposal', '#dff7f2', '#0f8a74'],
    ['Customer', '#fff4c7', '#9e6c00'],
  ];
  const deals = [
    ['New', 'Dental clinics bundle', 32000, '2 Dec, 2026', 'Northwind Dental Cloud', 'Lena Brandt'],
    ['New', 'Freight tracking', 21000, '9 Dec, 2026', 'Lumen Logistics', 'Sam Okafor'],
    ['Screening', 'Security audit', 40000, '2 Dec, 2026', 'Sable Security', 'Priya Nair'],
    ['Meeting', 'Payments pilot', 25000, '14 Nov, 2026', 'Kite Payments', 'Tomas Ruiz'],
    ['Proposal', 'Clinic rollout', 60000, '30 Oct, 2026', 'Meridian Health OS', 'Aiko Sato'],
    ['Customer', 'Analytics seats', 18000, '12 Sep, 2026', 'Harbor Analytics', 'Aiko Sato'],
  ];
  const cols = $('[data-kb-cols]', kanban);
  const k = (n) => `${Math.round(n / 1000)}k`;
  stages.forEach(([name, bg, fg]) => {
    const col = el('div', 'kb-col', `<header><span class="kb-stage" style="--sc:${bg};--st:${fg}">${name}</span><span class="kb-sum"></span></header><span class="kb-add">+ New</span>`);
    col.dataset.stage = name;
    cols.append(col);
  });
  deals.forEach(([stageName, name, amount, close, company, contact], i) => {
    const card = el('div', 'kb-card', `<div class="kc-name">${chipName(name, i).replace('class="chip"', 'class="chip" style="background:none;padding:0"')}</div><div class="kc-row">${icon.dollar}$ ${k(amount)}</div><div class="kc-row">${icon.calendar}${close}</div><div class="kc-row">${icon.building}${chipName(company, i + 2)}</div><div class="kc-row">${icon.user}${chipName(contact, i + 4, true)}</div>`);
    card.dataset.amount = amount;
    const col = $(`.kb-col[data-stage="${stageName}"]`, cols);
    col.insertBefore(card, $('.kb-add', col));
  });
  const totals = () => {
    $$('.kb-col', cols).forEach((col) => {
      $('.kb-sum', col).textContent = k($$('.kb-card', col).reduce((a, c) => a + Number(c.dataset.amount), 0));
    });
    $('[data-kb-count]', kanban).textContent = ` · ${$$('.kb-card', cols).length}`;
  };
  totals();

  let drag = null;
  cols.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.kb-card');
    if (!card || e.button > 0) return;
    e.preventDefault();
    const r = card.getBoundingClientRect();
    const g = card.cloneNode(true);
    g.classList.add('kb-ghost');
    Object.assign(g.style, { width: `${r.width}px`, left: `${r.left}px`, top: `${r.top}px`, transform: 'rotate(-3deg) scale(1.04)' });
    document.body.append(g);
    card.classList.add('is-placeholder');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    drag = { card, g, dx: e.clientX - r.left, dy: e.clientY - r.top, lastX: e.clientX, tilt: -3, from: card.parentElement };
  });
  let hoverFrame = 0;
  addEventListener('pointermove', (e) => {
    if (!drag) {
      if (reduced || hoverFrame) return;
      const card = e.target.closest?.('.kb-card');
      if (!card) return;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
        card.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 12}deg`);
      });
      return;
    }
    drag.tilt += (Math.max(-14, Math.min(14, (e.clientX - drag.lastX) * 1.2)) - drag.tilt) * 0.25;
    drag.lastX = e.clientX;
    Object.assign(drag.g.style, { left: `${e.clientX - drag.dx}px`, top: `${e.clientY - drag.dy}px`, transform: `rotate(${drag.tilt}deg) scale(1.05)` });
    const col = document.elementsFromPoint(e.clientX, e.clientY).map((n) => n.closest?.('.kb-col')).find(Boolean);
    $$('.kb-col', cols).forEach((c) => c.classList.toggle('is-over', c === col));
    if (!col) return;
    const after = $$('.kb-card:not(.is-placeholder)', col).find((c) => {
      const r = c.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    col.insertBefore(drag.card, after || $('.kb-add', col));
  });
  const endDrag = () => {
    if (!drag) return;
    const { card, g, from } = drag;
    g.remove();
    card.classList.remove('is-placeholder', 'is-dropped');
    void card.offsetWidth;
    card.classList.add('is-dropped');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    $$('.kb-col', cols).forEach((c) => c.classList.remove('is-over'));
    const to = card.parentElement;
    if (to !== from) [from, to].forEach((c) => { c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump'); });
    totals();
    drag = null;
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  cols.addEventListener('pointerleave', () => {
    if (drag) return;
    $$('.kb-card', cols).forEach((c) => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* ---------- Bring your own AI ---------- */
  const byo = $('[data-byo]');
  const note = $('[data-byo-note]', byo);
  const tiles = $$('.byo-tile', byo);
  tiles.forEach((t) => t.addEventListener('click', () => {
    tiles.forEach((x) => x.classList.toggle('is-picked', x === t));
    note.textContent = `${t.dataset.name}: ${t.dataset.note}`;
    note.classList.remove('flash');
    void note.offsetWidth;
    note.classList.add('flash');
  }));
  let byoFrame = 0;
  byo.addEventListener('pointermove', (e) => {
    if (reduced || byoFrame || e.pointerType === 'touch') return;
    byoFrame = requestAnimationFrame(() => {
      byoFrame = 0;
      const r = byo.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      tiles.forEach((t, i) => {
        const depth = 10 + (i % 3) * 8;
        t.style.setProperty('--mx', (nx * depth).toFixed(1));
        t.style.setProperty('--my', (ny * depth).toFixed(1));
      });
    });
  });
  byo.addEventListener('pointerleave', () => tiles.forEach((t) => { t.style.setProperty('--mx', 0); t.style.setProperty('--my', 0); }));

  /* ---------- Search the live web ---------- */
  const webCard = $('[data-search-card]');
  const qEl = $('[data-web-query]', webCard);
  const engineEl = $('[data-web-engine]', webCard);
  const results = $('[data-web-results]', webCard);
  const engines = $$('[data-engine]', webCard);
  const searches = [
    ['dental practice software Berlin', [['northwinddental.io', 'Company site'], ['meridianhealth.app', 'Company site'], ['top 10 dental tools', 'Article, skipped']]],
    ['field service startups Dublin', [['atlasfield.io', 'Company site'], ['startup directory', 'Directory, skipped'], ['sablesec.io', 'Company site']]],
    ['payments companies Lisbon', [['kitepay.eu', 'Company site'], ['harboranalytics.co', 'Company site'], ['news article', 'Article, skipped']]],
  ];
  let webRun = 0;
  let webVisible = false;
  const playSearch = async (engineIndex) => {
    const id = ++webRun;
    engines.forEach((b, i) => b.classList.toggle('is-on', i === engineIndex));
    engineEl.textContent = engines[engineIndex].dataset.engine;
    const [query, rows] = searches[engineIndex];
    results.innerHTML = '';
    qEl.textContent = '';
    for (const ch of query) {
      if (id !== webRun) return;
      qEl.textContent += ch;
      await sleep(reduced ? 0 : 35);
    }
    await sleep(350);
    for (const [d, kind] of rows) {
      if (id !== webRun) return;
      results.append(el('li', '', `<span>${d}</span><small>${kind}</small>`));
      await sleep(260);
    }
  };
  engines.forEach((b, i) => b.addEventListener('click', () => { autoWeb = false; playSearch(i); }));
  let autoWeb = true;
  let webIndex = 0;
  whenVisible(webCard, (v) => {
    webVisible = v;
    if (v && !results.children.length) playSearch(0);
  });
  setInterval(() => {
    if (!autoWeb || !webVisible || reduced) return;
    webIndex = (webIndex + 1) % engines.length;
    playSearch(webIndex);
  }, 5200);

  /* ---------- Objects card ---------- */
  const objects = $('[data-objects]');
  const objData = {
    Companies: [['Name', 'Northwind Dental Cloud'], ['Domain', 'northwinddental.io'], ['Account Owner', 'Om Yaduvanshi'], ['LinkedIn', 'linkedin.com/company/...'], ['Address', 'Berlin, Germany']],
    People: [['Name', 'Lena Brandt'], ['Emails', 'lena@northwinddental.io'], ['Phones', '+49 30 ...'], ['Company', 'Northwind Dental Cloud'], ['Job Title', 'Head of Sales']],
    Opportunities: [['Name', 'Clinic rollout'], ['Amount', '$60k'], ['Stage', 'Proposal'], ['Close date', '30 Oct, 2026'], ['Point of Contact', 'Lena Brandt']],
    Tasks: [['Title', 'Call Northwind Dental'], ['Due Date', 'Fri, 18 Sep'], ['Assignee', 'Om Yaduvanshi'], ['Status', 'To do']],
    Notes: [['Title', 'Discovery call notes'], ['Body', 'Uses 3 clinic tools today...'], ['Linked to', 'Northwind Dental Cloud']],
  };
  const objIcons = { Companies: icon.building, People: icon.user, Opportunities: icon.dollar, Tasks: icon.check, Notes: icon.calendar };
  const tabs = $('.obj-tabs', objects);
  const showObj = (name) => {
    $$('button', tabs).forEach((b) => b.classList.toggle('is-on', b.textContent === name));
    $('[data-obj-icon]', objects).innerHTML = objIcons[name];
    $('[data-obj-name]', objects).textContent = name;
    $('[data-obj-fields]', objects).innerHTML = objData[name].map(([key, v], i) => `<li style="animation-delay:${i * 50}ms"><span>${key}</span>${v}</li>`).join('');
  };
  let autoObj = true;
  Object.keys(objData).forEach((name) => {
    const b = el('button', '', name);
    b.type = 'button';
    b.addEventListener('click', () => { autoObj = false; showObj(name); });
    tabs.append(b);
  });
  showObj('Companies');
  let objVisible = false;
  let objIndex = 0;
  whenVisible(objects, (v) => { objVisible = v; });
  setInterval(() => {
    if (!autoObj || !objVisible || reduced) return;
    objIndex = (objIndex + 1) % 5;
    showObj(Object.keys(objData)[objIndex]);
  }, 2600);

  /* ---------- Dashboards ---------- */
  const dash = $('[data-dash]');
  let counted = false;
  whenVisible(dash, (v) => {
    dash.classList.toggle('is-on', v);
    if (!v || counted) return;
    counted = true;
    $$('[data-num]', dash).forEach((n) => {
      const end = Number(n.dataset.num);
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
        n.textContent = Math.round(end * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });

  /* ---------- Sieve + talk ---------- */
  const sieve = $('[data-sieve]');
  let sieveVisible = false;
  whenVisible(sieve, (v) => { sieveVisible = v; if (v) sieve.classList.add('is-on'); });
  setInterval(() => { if (sieveVisible && !reduced) sieve.classList.toggle('is-on'); }, 3200);

  const talk = $('[data-talk]');
  const talkLines = $$('.cl', talk);
  let talkVisible = false;
  let talkStep = 0;
  whenVisible(talk, (v) => { talkVisible = v; });
  setInterval(() => {
    if (!talkVisible) return;
    if (talkStep < talkLines.length) talkLines[talkStep].classList.add('is-in');
    talkStep += 1;
    if (talkStep > talkLines.length + 2) {
      talkLines.forEach((l) => l.classList.remove('is-in'));
      talkStep = 0;
    }
  }, 1200);
})();
