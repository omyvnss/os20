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
  const whenVisible = (node, fn, threshold = 0.35) => {
    const io = new IntersectionObserver(([e]) => fn(e.isIntersecting), { threshold });
    io.observe(node);
  };

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
      showToast(`Copied <code>${text.length > 40 ? text.slice(0, 40) + '...' : text}</code>. Paste it in your terminal.`);
    } catch {
      showToast(`Run <code>${text}</code> in your terminal.`);
    }
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(INSTALL)));
  const cmdOut = $('[data-cmd-out]');
  $$('.cmd-tabs button').forEach((tab, _, tabs) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('is-on', t === tab));
    cmdOut.textContent = tab.dataset.cmd;
  }));
  $('[data-copy-cmd]').addEventListener('click', () => copy(cmdOut.textContent));

  /* Island */
  const island = $('[data-island]');
  const darkZones = $$('.chapter.dark, .cta, .footer');
  const onScroll = () => {
    island.classList.toggle('is-compact', scrollY > 40);
    const y = 30;
    island.classList.toggle('on-dark', darkZones.some((z) => {
      const r = z.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    }));
  };

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

  /* Chapter menu */
  const menu = $('[data-chapters]');
  const menuLinks = $$('a', menu);
  const chapters = $$('.chapter');
  const panels = $$('.panel');
  const updateMenu = () => {
    const probe = innerHeight * 0.6;
    const current = chapters.find((c) => {
      const r = c.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    const menuTop = innerHeight - 240;
    const overPanel = panels.some((pn) => {
      const r = pn.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > menuTop;
    });
    menu.classList.toggle('is-visible', Boolean(current) && !overPanel);
    if (!current) return;
    menu.classList.toggle('on-dark', current.classList.contains('dark'));
    menuLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.chapter === current.id));
  };

  addEventListener('scroll', () => { onScroll(); updateMenu(); }, { passive: true });
  addEventListener('resize', updateMenu);
  onScroll();
  updateMenu();

  /* ---------- Lead engine demo ---------- */
  const lead = $('[data-lead-demo]');
  const tint = ['#f8d1c9', '#dcf', '#ffcf87', '#9dffca', '#ccedff', '#fee7ac', '#ffae95', '#c9a9ff'];
  const ini = (name, i) => `<span class="cell-name"><span class="ini" style="--c:${tint[i % tint.length]}">${name[0]}</span>${name}</span>`;
  const fitCell = (s) => (s == null ? '<span style="color:#bbb">None</span>' : `<span class="fit"><i style="--s:${s}"></i>${s}</span>`);

  const existing = [
    { name: 'Fold Studio', domain: 'foldstudio.design', city: 'Copenhagen', fit: null, source: 'Manual' },
    { name: 'Quill Recruiting', domain: 'quillrecruit.com', city: 'Paris', fit: null, source: 'Manual' },
    { name: 'Orbit Energy Data', domain: 'orbitenergy.de', city: 'Hamburg', fit: null, source: 'Import' },
    { name: 'Lumen Logistics', domain: 'lumenlogistics.com', city: 'Rotterdam', fit: null, source: 'Manual' },
  ];
  const found = [
    { name: 'Northwind Dental Cloud', domain: 'northwinddental.io', city: 'Berlin', fit: 92 },
    { name: 'Sable Security', domain: 'sablesec.io', city: 'Berlin', fit: 90 },
    { name: 'Harbor Analytics', domain: 'harboranalytics.co', city: 'Berlin', fit: 87 },
    { name: 'Atlas Field Service', domain: 'atlasfield.io', city: 'Berlin', fit: 84 },
    { name: 'Kite Payments', domain: 'kitepay.eu', city: 'Berlin', fit: 81 },
    { name: 'Meridian Health OS', domain: 'meridianhealth.app', city: 'Berlin', fit: 77 },
    { name: 'Pinecrest Legal', domain: 'pinecrestlegal.de', city: 'Berlin', fit: 74 },
    { name: 'Verde Commerce', domain: 'verdecommerce.shop', city: 'Berlin', fit: 71 },
  ].map((r) => ({ ...r, source: 'Ask AI' }));

  const views = {
    companies: {
      title: 'Companies', add: 'Company',
      cols: [['Name', 'name'], ['Domain', 'domain'], ['City', 'city'], ['Fit', 'fit'], ['Source', 'source']],
      rows: [...existing],
      cell: (k, v, i) => k === 'name' ? ini(v, i) : k === 'domain' ? `<span class="pillv">${v}</span>` : k === 'fit' ? fitCell(v) : k === 'source' && v === 'Ask AI' ? `<span class="src">Ask AI</span>` : v,
    },
    people: {
      title: 'People', add: 'Person',
      cols: [['Name', 'name'], ['Email', 'email'], ['Company', 'company'], ['Job title', 'job'], ['City', 'city']],
      rows: [
        { name: 'Lena Brandt', email: 'lena@northwinddental.io', company: 'Northwind Dental Cloud', job: 'Head of Sales', city: 'Berlin' },
        { name: 'Tomas Ruiz', email: 'tomas@kitepay.eu', company: 'Kite Payments', job: 'COO', city: 'Lisbon' },
        { name: 'Aiko Sato', email: 'aiko@harboranalytics.co', company: 'Harbor Analytics', job: 'Founder', city: 'Amsterdam' },
        { name: 'Noah Keller', email: 'noah@foldstudio.design', company: 'Fold Studio', job: 'Design Lead', city: 'Copenhagen' },
        { name: 'Priya Nair', email: 'priya@sablesec.io', company: 'Sable Security', job: 'CTO', city: 'Tallinn' },
      ],
      cell: (k, v, i) => k === 'name' ? ini(v, i + 3) : k === 'email' ? `<span class="pillv">${v}</span>` : v,
    },
    opportunities: {
      title: 'Opportunities', add: 'Opportunity',
      cols: [['Name', 'name'], ['Amount', 'amount'], ['Stage', 'stage'], ['Close date', 'close'], ['Company', 'company']],
      rows: [
        { name: 'Clinic rollout', amount: 60000, stage: 'Proposal', close: '30 Oct 2026', company: 'Northwind Dental Cloud' },
        { name: 'Payments pilot', amount: 25000, stage: 'Meeting', close: '14 Nov 2026', company: 'Kite Payments' },
        { name: 'Security audit', amount: 40000, stage: 'Screening', close: '2 Dec 2026', company: 'Sable Security' },
        { name: 'Analytics seats', amount: 18000, stage: 'Customer', close: '12 Sep 2026', company: 'Harbor Analytics' },
      ],
      cell: (k, v, i) => k === 'name' ? ini(v, i + 1) : k === 'amount' ? `$${(v / 1000).toFixed(0)}k` : k === 'stage' ? `<span class="pillv">${v}</span>` : v,
    },
    tasks: {
      title: 'Tasks', add: 'Task',
      cols: [['Title', 'title'], ['Due', 'due'], ['Assignee', 'who'], ['Status', 'status']],
      rows: [
        { title: 'Call Northwind Dental', due: 'Fri 18 Sep', who: 'Om Y.', status: 'To do' },
        { title: 'Send pilot proposal to Kite', due: 'Mon 21 Sep', who: 'Shreyash R.', status: 'In progress' },
        { title: 'Review Berlin lead list', due: 'Tue 15 Sep', who: 'Om Y.', status: 'Done' },
      ],
      cell: (k, v, i) => k === 'title' ? ini(v, i + 5) : k === 'status' ? `<span class="pillv">${v}</span>` : v,
    },
    notes: {
      title: 'Notes', add: 'Note',
      cols: [['Title', 'title'], ['Linked to', 'link'], ['Updated', 'updated']],
      rows: [
        { title: 'Discovery call notes', link: 'Northwind Dental Cloud', updated: '2 hours ago' },
        { title: 'Pricing questions', link: 'Kite Payments', updated: 'Yesterday' },
      ],
      cell: (k, v, i) => k === 'title' ? ini(v, i + 2) : v,
    },
    workflows: {
      title: 'Workflows', add: 'Workflow',
      cols: [['Name', 'name'], ['Trigger', 'trigger'], ['Status', 'status']],
      rows: [
        { name: 'Create company when adding a new person', trigger: 'Record is created or updated', status: 'Active' },
        { name: 'Quick Lead', trigger: 'Manual', status: 'Active' },
      ],
      cell: (k, v, i) => k === 'name' ? ini(v, i + 6) : k === 'status' ? `<span class="pillv" style="background:#e5f8ee;color:#1a8f57">${v}</span>` : v,
    },
  };

  let current = 'companies';
  let sort = null;
  const head = $('[data-head]', lead);
  const body = $('[data-rows]', lead);

  const render = (freshNames = []) => {
    const v = views[current];
    $('[data-crumb]', lead).textContent = v.title;
    $('[data-viewname]', lead).textContent = `All ${v.title}`;
    $('[data-count]', lead).textContent = `· ${v.rows.length}`;
    $('[data-new]', lead).textContent = `+ New ${v.add}`;
    head.innerHTML = `<tr>${v.cols.map(([label, key]) => `<th data-key="${key}">${label}${sort && sort.key === key ? `<span class="arrow">${sort.dir > 0 ? '↑' : '↓'}</span>` : ''}</th>`).join('')}</tr>`;
    let rows = [...v.rows];
    if (sort) {
      rows.sort((a, b) => {
        const x = a[sort.key] ?? -1, y = b[sort.key] ?? -1;
        return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir;
      });
    }
    body.innerHTML = rows.map((r, i) => `<tr class="${freshNames.includes(r.name) ? 'is-new' : ''}" style="animation-delay:${freshNames.indexOf(r.name) * 90}ms">${v.cols.map(([, k]) => `<td>${v.cell(k, r[k], i)}</td>`).join('')}</tr>`).join('');
  };

  head.addEventListener('click', (e) => {
    const th = e.target.closest('th');
    if (!th) return;
    const key = th.dataset.key;
    const numeric = views[current].rows.some((r) => typeof r[key] === 'number');
    const first = numeric ? -1 : 1;
    sort = sort && sort.key === key ? (sort.dir === first ? { key, dir: -first } : null) : { key, dir: first };
    render();
  });

  const navs = $$('.app-nav', lead);
  const switchView = (name) => {
    current = name;
    sort = null;
    navs.forEach((n) => n.classList.toggle('is-on', n.dataset.view === name));
    render();
  };
  navs.forEach((n) => n.addEventListener('click', () => switchView(n.dataset.view)));
  render();

  const log = $('[data-log]', lead);
  const form = $('[data-form]', lead);
  const input = $('[data-input]', lead);
  const hint = $('[data-hint]', lead);
  const sendBtn = $('button', form);
  let running = false;

  const pushLog = (node) => {
    log.append(node);
    log.scrollTop = log.scrollHeight;
    return node;
  };

  const runSearch = async (text) => {
    running = true;
    sendBtn.disabled = true;
    hint.textContent = 'Running the lead search...';
    hint.classList.add('is-muted');
    pushLog(el('div', 'msg me', text.replace(/</g, '&lt;')));
    await sleep(500);

    const card = pushLog(el('div', 'tool-card', '<header><code>find_leads</code><span>running</span></header>'));
    const steps = [
      ['Searching the web', '4 queries, 38 results', 1100],
      ['Dropping directories and articles', '22 removed', 900],
      ['Reading company websites', '16 sites read', 1900, 16],
      ['Scoring fit with your AI model', '8 above 70', 1300],
      ['Saving to Companies', '8 saved', 800],
    ];
    for (const [label, result, ms, total] of steps) {
      const row = el('div', 'step run', `<span class="dot"></span><span>${label}</span><small></small>`);
      card.append(row);
      let bar;
      if (total) {
        bar = el('div', 'progress', '<i></i>');
        card.append(bar);
      }
      log.scrollTop = log.scrollHeight;
      if (total) {
        for (let i = 1; i <= total; i++) {
          await sleep(ms / total);
          $('i', bar).style.width = `${(i / total) * 100}%`;
          $('small', row).textContent = `${i}/${total}`;
        }
      } else {
        await sleep(ms);
      }
      row.className = 'step done';
      $('small', row).textContent = result;
    }
    $('header span', card).textContent = 'done in 6.0s';

    if (current !== 'companies') switchView('companies');
    const fresh = found.filter((f) => !views.companies.rows.some((r) => r.name === f.name));
    views.companies.rows = [...fresh, ...views.companies.rows];
    sort = null;
    render(fresh.map((f) => f.name));

    await sleep(600);
    pushLog(el('div', 'msg ai', fresh.length
      ? `Saved ${fresh.length} companies to Companies. Best fit: Northwind Dental Cloud (92). Directories and articles were skipped.`
      : 'These companies are already in your CRM, so nothing new was saved.'));
    const again = pushLog(el('button', 'run-again', 'Reset demo'));
    again.type = 'button';
    again.addEventListener('click', () => {
      views.companies.rows = [...existing];
      log.innerHTML = '<div class="msg ai">Tell me who you sell to. I will search the web and save the companies that fit.</div>';
      input.value = 'Find SaaS companies in Berlin with 10 to 200 people';
      hint.textContent = 'Press Enter to run the lead search';
      hint.classList.remove('is-muted');
      switchView('companies');
    });
    hint.textContent = 'Done. Click a column header to sort.';
    sendBtn.disabled = false;
    running = false;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || running) return;
    input.value = '';
    runSearch(text);
  });

  /* ---------- Workflow demo ---------- */
  const wf = $('[data-wf]');
  const icons = {
    trigger: '<path d="M3 13l1-3 7-7 2 2-7 7z"/><path d="M9.5 4.5l2 2"/>',
    code: '<path d="M6 4L2 8l4 4M10 4l4 4-4 4"/>',
    filter: '<path d="M2 3h12L9.5 8.5V13l-3-1.5v-3z"/>',
    search: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>',
    branch: '<circle cx="4" cy="3" r="1.5"/><circle cx="4" cy="13" r="1.5"/><circle cx="12" cy="6" r="1.5"/><path d="M4 4.5v7M4 9c0-2 8-1 8-1.5"/>',
    update: '<path d="M13 8A5 5 0 113.5 5.5M3 2v3.5h3.5"/>',
    create: '<path d="M8 3v10M3 8h10"/>',
  };
  const nodes = [
    { id: 't', kind: 'Trigger', icon: 'trigger', color: '#3b5bdb', name: 'Record is created or updated', desc: 'Runs when a person is created or their Emails field changes.', col: 0, row: 0 },
    { id: 'n1', kind: 'Action', icon: 'code', color: '#e5484d', name: 'Is this a personal email?', desc: 'Code step that checks the address against personal providers such as Gmail or Outlook.', col: 0, row: 1, from: 't' },
    { id: 'n2', kind: 'Action', icon: 'filter', color: '#555', name: 'If business email', desc: 'Filter that only continues when the email is not personal.', col: 0, row: 2, from: 'n1' },
    { id: 'n3', kind: 'Action', icon: 'code', color: '#e5484d', name: 'Extract domain from email', desc: 'Code step that turns the email into a domain, like northwinddental.io.', col: 0, row: 3, from: 'n2' },
    { id: 'n4', kind: 'Action', icon: 'search', color: '#555', name: 'Search Company', desc: 'Finds companies whose Domain Name matches, up to 25 records.', col: 0, row: 4, from: 'n3' },
    { id: 'n5', kind: 'Action', icon: 'code', color: '#e5484d', name: 'Find exact company match', desc: 'Code step that picks the company with exactly this domain.', col: 0, row: 5, from: 'n4' },
    { id: 'n6', kind: 'Action', icon: 'branch', color: '#555', name: 'If a company already exists', desc: 'If / else branch on whether a matching company was found.', col: 0, row: 6, from: 'n5' },
    { id: 'n7', kind: 'Action', icon: 'update', color: '#555', name: 'Attach person to existing company', desc: 'Update record: sets the person’s Company to the match.', col: -1, row: 7, from: 'n6' },
    { id: 'n8', kind: 'Action', icon: 'create', color: '#555', name: 'Create a new company', desc: 'Create record: a company named after the domain, with the domain as its website.', col: 1, row: 7, from: 'n6' },
    { id: 'n9', kind: 'Action', icon: 'update', color: '#555', name: 'Attach person to this company', desc: 'Update record: links the person to the company just created.', col: 1, row: 8, from: 'n8' },
  ];
  const canvas = $('[data-wf-canvas]', wf);
  const nodeEls = {};
  const svgNS = 'http://www.w3.org/2000/svg';
  const lines = document.createElementNS(svgNS, 'svg');
  lines.classList.add('wf-lines');
  canvas.append(lines);
  const pathEls = {};

  nodes.forEach((n) => {
    const b = el('button', 'node', `<span class="ni" style="--nc:${n.color}"><svg viewBox="0 0 16 16">${icons[n.icon]}</svg></span><span><small>${n.kind}</small><b>${n.name}</b></span><span class="badge-ok"></span>`);
    b.type = 'button';
    b.addEventListener('click', () => select(n.id));
    canvas.append(b);
    nodeEls[n.id] = b;
    if (n.from) {
      const p = document.createElementNS(svgNS, 'path');
      lines.append(p);
      pathEls[n.id] = p;
    }
  });

  const layout = () => {
    const w = canvas.clientWidth;
    const small = w < 560;
    const gapY = small ? 60 : 64;
    const spread = small ? w * 0.25 : Math.min(190, w * 0.24);
    const cx = w / 2;
    let maxBottom = 0;
    nodes.forEach((n) => {
      const x = cx + n.col * spread;
      const y = 22 + n.row * gapY;
      Object.assign(nodeEls[n.id].style, { left: `${x}px`, top: `${y}px` });
      n.x = x;
      n.y = y;
      maxBottom = Math.max(maxBottom, y + 60);
    });
    lines.setAttribute('width', w);
    lines.setAttribute('height', maxBottom + 20);
    nodes.filter((n) => n.from).forEach((n) => {
      const p = nodes.find((m) => m.id === n.from);
      const h = nodeEls[p.id].offsetHeight;
      const y1 = p.y + h, y2 = n.y, mid = (y1 + y2) / 2;
      pathEls[n.id].setAttribute('d', `M${p.x} ${y1} C${p.x} ${mid} ${n.x} ${mid} ${n.x} ${y2}`);
    });
    const spacer = canvas.querySelector('.wf-spacer') || canvas.appendChild(el('div', 'wf-spacer'));
    Object.assign(spacer.style, { position: 'absolute', top: `${maxBottom + 10}px`, width: '1px', height: '1px' });
  };

  const select = (id) => {
    const n = nodes.find((m) => m.id === id);
    Object.values(nodeEls).forEach((e) => e.classList.remove('sel'));
    nodeEls[id].classList.add('sel');
    $('[data-wf-kind]', wf).textContent = n.kind;
    $('[data-wf-title]', wf).textContent = n.name;
    $('[data-wf-desc]', wf).textContent = n.desc;
  };

  const wfLog = $('[data-wf-log]', wf);
  const runBtn = $('[data-wf-run]', wf);
  const emailSel = $('[data-wf-email]', wf);
  emailSel.innerHTML = [
    ['jane@northwinddental.io', 'company exists'],
    ['alex@brightlane.dev', 'new company'],
    ['sam.lee@gmail.com', 'personal email'],
  ].map(([v, t]) => `<option value="${v}">${v} (${t})</option>`).join('');

  const scenario = (email) => {
    const domain = email.split('@')[1];
    const personal = /gmail|outlook|yahoo|hotmail|icloud/.test(domain);
    const exists = domain === 'northwinddental.io';
    const s = [
      ['t', `Person created with ${email}`],
      ['n1', personal ? 'Personal email: yes' : 'Personal email: no'],
    ];
    if (personal) return [...s, ['n2', 'Stopped: not a business email', true]];
    s.push(['n2', 'Business email, continuing'], ['n3', `Domain: ${domain}`], ['n4', exists ? '1 company found' : '0 companies found'], ['n5', exists ? 'Match: Northwind Dental Cloud' : 'No exact match']);
    if (exists) return [...s, ['n6', 'Company exists: yes'], ['n7', 'Person attached to Northwind Dental Cloud']];
    return [...s, ['n6', 'Company exists: no'], ['n8', `Company created: ${domain}`], ['n9', `Person attached to ${domain}`]];
  };

  const resetRun = () => {
    Object.values(nodeEls).forEach((e) => e.classList.remove('run', 'ok', 'skip'));
    Object.values(pathEls).forEach((p) => p.classList.remove('lit'));
  };

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    emailSel.disabled = true;
    resetRun();
    wfLog.innerHTML = '';
    const steps = scenario(emailSel.value);
    const ran = new Set(steps.map(([id]) => id));
    for (const [id, text, stop] of steps) {
      const node = nodeEls[id];
      if (pathEls[id]) pathEls[id].classList.add('lit');
      node.classList.add('run');
      node.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      select(id);
      await sleep(650);
      node.classList.remove('run');
      node.classList.add('ok');
      const n = nodes.find((m) => m.id === id);
      const li = el('li', stop ? 'stop' : '', `<b>${n.name}</b><span>${text}</span>`);
      wfLog.append(li);
      li.scrollIntoView({ block: 'nearest' });
    }
    nodes.forEach((n) => { if (!ran.has(n.id)) nodeEls[n.id].classList.add('skip'); });
    runBtn.disabled = false;
    emailSel.disabled = false;
  });
  emailSel.addEventListener('change', () => {
    resetRun();
    wfLog.innerHTML = '<li class="muted">Press Test run.</li>';
  });

  layout();
  select('t');
  addEventListener('resize', layout);

  /* ---------- Kanban demo ---------- */
  const kanban = $('[data-kanban]');
  const stages = [
    { name: 'New', bg: '#eef0f3', fg: '#4b5563' },
    { name: 'Screening', bg: '#f1e8ff', fg: '#6d28d9' },
    { name: 'Meeting', bg: '#e0f2fe', fg: '#0369a1' },
    { name: 'Proposal', bg: '#fef3c7', fg: '#a16207' },
    { name: 'Customer', bg: '#dcfce7', fg: '#15803d' },
  ];
  const deals = [
    ['New', 'Dental clinics bundle', 'Northwind Dental Cloud', 32000, '2 Dec'],
    ['New', 'Freight tracking', 'Lumen Logistics', 21000, '9 Dec'],
    ['Screening', 'Security audit', 'Sable Security', 40000, '2 Dec'],
    ['Screening', 'Recruiting seats', 'Quill Recruiting', 12000, '20 Nov'],
    ['Meeting', 'Payments pilot', 'Kite Payments', 25000, '14 Nov'],
    ['Proposal', 'Clinic rollout', 'Meridian Health OS', 60000, '30 Oct'],
    ['Proposal', 'Energy data feed', 'Orbit Energy Data', 48000, '6 Nov'],
    ['Customer', 'Analytics seats', 'Harbor Analytics', 18000, '12 Sep'],
  ];
  const colsWrap = $('[data-kb-cols]', kanban);
  const fmt = (n) => `$${(n / 1000).toFixed(0)}k`;

  stages.forEach((s) => {
    const col = el('div', 'kb-col');
    col.dataset.stage = s.name;
    col.innerHTML = `<header><span class="kb-stage" style="--sc:${s.bg};--st:${s.fg}">${s.name}</span><span class="kb-meta"></span></header>`;
    colsWrap.append(col);
  });
  deals.forEach(([stage, name, company, amount, close], i) => {
    const card = el('div', 'kb-card', `<b>${name}</b><div class="kb-row"><span class="cell-name"><span class="ini" style="--c:${tint[i % tint.length]}">${company[0]}</span>${company}</span></div><div class="kb-row"><span class="amt">${fmt(amount)}</span><span>Close ${close}</span></div>`);
    card.dataset.amount = amount;
    $(`.kb-col[data-stage="${stage}"]`, colsWrap).append(card);
  });

  const updateTotals = () => {
    let total = 0;
    $$('.kb-col', colsWrap).forEach((col) => {
      const cards = $$('.kb-card', col);
      const sum = cards.reduce((a, c) => a + Number(c.dataset.amount), 0);
      if (col.dataset.stage !== 'Customer') total += sum;
      $('.kb-meta', col).textContent = `${cards.length} · ${fmt(sum)}`;
    });
    $('[data-kb-total]', kanban).textContent = `Open pipeline ${fmt(total)}`;
  };
  updateTotals();

  let drag = null;
  colsWrap.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.kb-card');
    if (!card || e.button > 0) return;
    e.preventDefault();
    const r = card.getBoundingClientRect();
    const ghost = card.cloneNode(true);
    ghost.classList.add('kb-ghost');
    Object.assign(ghost.style, { width: `${r.width}px`, left: `${r.left}px`, top: `${r.top}px`, transform: 'rotate(-3deg) scale(1.04)' });
    document.body.append(ghost);
    card.classList.add('is-placeholder');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    drag = { card, ghost, dx: e.clientX - r.left, dy: e.clientY - r.top, lastX: e.clientX, tilt: -3, from: card.parentElement };
    card.setPointerCapture?.(e.pointerId);
  });

  addEventListener('pointermove', (e) => {
    if (!drag) {
      const card = e.target.closest?.('.kb-card');
      if (card && !reduced) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
        card.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 14}deg`);
      }
      return;
    }
    const vx = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    drag.tilt += (Math.max(-14, Math.min(14, vx * 1.2)) - drag.tilt) * 0.25;
    Object.assign(drag.ghost.style, { left: `${e.clientX - drag.dx}px`, top: `${e.clientY - drag.dy}px`, transform: `rotate(${drag.tilt}deg) scale(1.05)` });
    const col = document.elementsFromPoint(e.clientX, e.clientY).map((n) => n.closest?.('.kb-col')).find(Boolean);
    $$('.kb-col', colsWrap).forEach((c) => c.classList.toggle('is-over', c === col));
    if (!col) return;
    const after = $$('.kb-card:not(.is-placeholder)', col).find((c) => {
      const r = c.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    if (after) col.insertBefore(drag.card, after);
    else col.append(drag.card);
  });

  const endDrag = () => {
    if (!drag) return;
    const { card, ghost, from } = drag;
    ghost.remove();
    card.classList.remove('is-placeholder');
    card.classList.remove('is-dropped');
    void card.offsetWidth;
    card.classList.add('is-dropped');
    $$('.kb-col', colsWrap).forEach((c) => c.classList.remove('is-over'));
    const to = card.parentElement;
    if (to !== from) {
      [from, to].forEach((c) => { c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump'); });
      if (to.dataset.stage === 'Customer') showToast(`Moved to Customer. ${$('b', card).textContent} is won.`);
    }
    updateTotals();
    drag = null;
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  colsWrap.addEventListener('pointerleave', (e) => {
    if (drag) return;
    $$('.kb-card', colsWrap).forEach((c) => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* ---------- Objects card ---------- */
  const objects = $('[data-objects]');
  const objIcons = {
    Companies: '<path d="M4 17V5l6-2v14M10 8h6v9"/>',
    People: '<circle cx="10" cy="7" r="3.2"/><path d="M4 17c.8-3.4 3.2-5 6-5s5.2 1.6 6 5"/>',
    Opportunities: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5"/>',
    Tasks: '<rect x="4" y="4" width="12" height="12" rx="2.5"/><path d="M7.5 10l2 2 3.5-4"/>',
    Notes: '<rect x="5" y="3" width="10" height="14" rx="2"/><path d="M8 7h4M8 10h4M8 13h2"/>',
    Workflows: '<circle cx="10" cy="10" r="2.5"/><path d="M10 3v2.5M10 14.5V17M3 10h2.5M14.5 10H17"/>',
  };
  const objData = {
    Companies: [['Name', 'Northwind Dental Cloud'], ['Domain', 'northwinddental.io'], ['Account owner', 'Om Y.'], ['LinkedIn', 'linkedin.com/company/...'], ['Address', 'Berlin, Germany']],
    People: [['Name', 'Lena Brandt'], ['Emails', 'lena@northwinddental.io'], ['Phones', '+49 30 ...'], ['Company', 'Northwind Dental Cloud'], ['Job title', 'Head of Sales']],
    Opportunities: [['Name', 'Clinic rollout'], ['Amount', '$60k'], ['Stage', 'Proposal'], ['Close date', '30 Oct 2026'], ['Point of contact', 'Lena Brandt']],
    Tasks: [['Title', 'Call Northwind Dental'], ['Due date', 'Fri 18 Sep'], ['Assignee', 'Om Y.'], ['Status', 'To do']],
    Notes: [['Title', 'Discovery call notes'], ['Body', 'Uses 3 clinic tools today...'], ['Linked to', 'Northwind Dental Cloud']],
    Workflows: [['Trigger', 'Record is created or updated'], ['Steps', '9'], ['Status', 'Active'], ['Versions', '1']],
  };
  const tabs = $('.obj-tabs', objects);
  const showObj = (name) => {
    $$('button', tabs).forEach((b) => b.classList.toggle('is-on', b.textContent === name));
    $('[data-obj-icon]', objects).innerHTML = `<svg viewBox="0 0 20 20">${objIcons[name]}</svg>`;
    $('[data-obj-name]', objects).textContent = name;
    $('[data-obj-fields]', objects).innerHTML = objData[name].map(([k, v], i) => `<li style="animation-delay:${i * 50}ms"><span>${k}</span>${v}</li>`).join('');
  };
  Object.keys(objData).forEach((name) => {
    const b = el('button', '', name);
    b.type = 'button';
    b.addEventListener('click', () => { showObj(name); autoObj = false; });
    tabs.append(b);
  });
  showObj('Companies');
  let autoObj = true;
  let objIndex = 0;
  let objVisible = false;
  whenVisible(objects, (v) => { objVisible = v; });
  setInterval(() => {
    if (!autoObj || !objVisible || reduced) return;
    objIndex = (objIndex + 1) % 6;
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
        n.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });

  /* ---------- Sieve + talk loops ---------- */
  const sieve = $('[data-sieve]');
  let sieveVisible = false;
  whenVisible(sieve, (v) => { sieveVisible = v; if (v) sieve.classList.add('is-on'); });
  setInterval(() => { if (sieveVisible && !reduced) sieve.classList.toggle('is-on'); }, 3200);

  const talk = $('[data-talk]');
  const lines2 = $$('.cl', talk);
  let talkVisible = false;
  let talkStep = 0;
  whenVisible(talk, (v) => { talkVisible = v; });
  setInterval(() => {
    if (!talkVisible) return;
    if (talkStep < lines2.length) lines2[talkStep].classList.add('is-in');
    talkStep++;
    if (talkStep > lines2.length + 2) {
      lines2.forEach((l) => l.classList.remove('is-in'));
      talkStep = 0;
    }
  }, 1200);
})();
