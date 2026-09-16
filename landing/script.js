(() => {
  const INSTALL = 'npx os20-cli';
  const toast = document.querySelector('[data-toast]');
  let toastTimer;

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(INSTALL);
        toast.innerHTML = `Copied <code>${INSTALL}</code>. Paste it in your terminal.`;
      } catch {
        toast.innerHTML = `Run <code>${INSTALL}</code> in your terminal.`;
      }
      toast.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
    });
  });

  document.querySelectorAll('.track').forEach((track) => {
    track.append(...[...track.children].map((node) => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    }));
  });

  const groups = new Map();
  document.querySelectorAll('.reveal').forEach((el) => {
    const parent = el.parentElement;
    const index = groups.get(parent) ?? 0;
    groups.set(parent, index + 1);
    el.style.setProperty('--delay', `${Math.min(index, 6) * 0.1}s`);
  });

  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

  const menu = document.querySelector('[data-chapters]');
  const links = [...menu.querySelectorAll('a')];
  const chapters = [...document.querySelectorAll('.chapter')];

  const updateMenu = () => {
    const probe = innerHeight * 0.6;
    const current = chapters.find((chapter) => {
      const { top, bottom } = chapter.getBoundingClientRect();
      return top <= probe && bottom >= probe;
    });
    menu.classList.toggle('is-visible', Boolean(current));
    if (!current) return;
    menu.dataset.on = current.id;
    menu.classList.toggle('on-dark', current.classList.contains('dark'));
    links.forEach((link) => link.classList.toggle('is-active', link.dataset.chapter === current.id));
  };

  addEventListener('scroll', updateMenu, { passive: true });
  addEventListener('resize', updateMenu);
  updateMenu();
})();
