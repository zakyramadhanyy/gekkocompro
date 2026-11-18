/* Gekko.co.id: interactions. Everything here enhances a page that already reads without it. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- shared: carry a choice into the contact form ---- */
  const form = $('[data-form]');
  function prefill({ kebutuhan, pesan }) {
    if (!form) return;
    if (kebutuhan) form.elements.kebutuhan.value = kebutuhan;
    if (pesan) form.elements.pesan.value = pesan;
    const typed = $('[data-try-name]');
    if (typed && typed.value.trim() && !form.elements.usaha.value) form.elements.usaha.value = typed.value.trim();
    setTimeout(() => form.elements.nama.focus({ preventScroll: true }), 600);
  }

  /* ---- the header: menu toggle and scroll-spy (aria-current marks the section being read) ---- */
  const dock = $('[data-dock]');
  const menuBtn = $('[data-menu]');
  const links = $$('.dock__panel a:not(.btn)');
  function setMenu(open) { dock.classList.toggle('is-open', open); menuBtn.setAttribute('aria-expanded', String(open)); }
  menuBtn.addEventListener('click', () => setMenu(!dock.classList.contains('is-open')));
  $$('.dock__panel a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  function spy(id) {
    links.forEach((a) => { if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  const spyIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) spy(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach((s) => spyIO.observe(s));

  /* ---- hero: type a name, the profile builds ---- */
  const SECTORS = {
    klinik: { scheme: 'mist', sub: 'Perawatan yang tenang untuk keluarga.', links: ['Layanan', 'Dokter', 'Kontak'], cta: 'Buat janji', cards: ['Pemeriksaan', 'Perawatan', 'Konsultasi'], photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Stethoscope_and_Laptop_Computer_-_Nci-vol-9713-300.jpg/1280px-Stethoscope_and_Laptop_Computer_-_Nci-vol-9713-300.jpg' },
    kontraktor: { scheme: 'blue', sub: 'Pembangunan yang terencana, hasil yang rapi.', links: ['Layanan', 'Proyek', 'Kontak'], cta: 'Minta penawaran', cards: ['Renovasi', 'Bangun baru', 'Interior'], photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Hallstadt_Bahnhof_ABS_N%C3%BCrnberg-Ebensfeld-20210328-RM-111554.jpg/1280px-Hallstadt_Bahnhof_ABS_N%C3%BCrnberg-Ebensfeld-20210328-RM-111554.jpg' },
    kafe: { scheme: 'turq', sub: 'Kopi enak, tempat yang nyaman.', links: ['Menu', 'Cerita', 'Lokasi'], cta: 'Lihat menu', cards: ['Kopi', 'Makanan', 'Pesan antar'], photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Almond_croissant_-_Workshop_Coffee_Lab_2025-06-27.jpg/1280px-Almond_croissant_-_Workshop_Coffee_Lab_2025-06-27.jpg' },
  };
  const tryForm = $('[data-try]');
  if (tryForm) {
    const nameIn = $('[data-try-name]', tryForm);
    const pv = $('[data-pv]');
    const set = (sel, text) => { const el = $(sel, pv); if (el) el.textContent = text; };
    const render = (animate) => {
      const key = (tryForm.elements.sektor.value || 'klinik');
      const s = SECTORS[key];
      const name = nameIn.value.trim() || 'Nama usahamu';
      pv.dataset.scheme = s.scheme;
      const ph = $('[data-pv-photo]', pv); if (ph && ph.getAttribute('src') !== s.photo) ph.src = s.photo;
      set('[data-pv-brand]', name); set('[data-pv-h]', name); set('[data-pv-sub]', s.sub); set('[data-pv-cta]', s.cta);
      $('[data-pv-links]', pv).replaceChildren(...s.links.map((t) => Object.assign(document.createElement('span'), { textContent: t })));
      $('[data-pv-cards]', pv).replaceChildren(...s.cards.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
      if (animate && !reduced) { pv.classList.remove('pv-swap'); void pv.offsetWidth; pv.classList.add('pv-swap'); }
    };
    nameIn.addEventListener('input', () => render(false));
    $$('input[name="sektor"]', tryForm).forEach((r) => r.addEventListener('change', () => render(true)));
  }

  /* ---- layanan: choose, and the summary writes itself ---- */
  const svc = $('[data-svc]');
  if (svc) {
    const line = $('[data-sum-line]'), pages = $('[data-sum-pages]');
    const boxes = $$('input[name="halaman"]');
    const summary = () => {
      const service = svc.querySelector('input:checked').value;
      const picked = boxes.filter((b) => b.checked).map((b) => b.value);
      line.textContent = service;
      pages.textContent = picked.length ? `${picked.length} halaman: ${picked.join(', ')}.` : 'Belum ada halaman yang dipilih.';
      return { service, picked };
    };
    svc.addEventListener('change', summary);
    boxes.forEach((b) => b.addEventListener('change', summary));
    $('[data-carry]').addEventListener('click', () => {
      const { service, picked } = summary();
      prefill({ kebutuhan: service, pesan: picked.length ? `Saya butuh ${service} dengan ${picked.length} halaman: ${picked.join(', ')}.` : `Saya butuh ${service}.` });
    });
  }

  /* ---- portofolio: filter, then open one ---- */
  const grid = $('[data-grid]');
  if (grid) {
    const items = $$(':scope > li', grid);
    const SPANS = { 1: [12], 2: [7, 5], 3: [4, 4, 4], 4: [7, 5, 6, 6], 5: [7, 5, 4, 4, 4] };
    const layout = (kind) => {
      const shown = items.filter((li) => !kind || li.dataset.kind === kind);
      items.forEach((li) => { li.hidden = !shown.includes(li); });
      shown.forEach((li, i) => li.style.setProperty('--span', String((SPANS[shown.length] || [4])[i] ?? 4)));
    };
    layout('');
    $$('[data-filter] input').forEach((r) => r.addEventListener('change', () => layout(r.value)));

    const dlg = $('[data-detail]');
    const slot = $('.detail__slot', dlg);
    let opener = null;
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('[data-card]');
      if (!card) return;
      opener = $('.card__t', card);
      const pv = $('.pv', card).cloneNode(true);
      pv.classList.remove('pv--compact');
      slot.replaceChildren(pv);
      $('[data-detail-title]', dlg).textContent = `Contoh rancangan: ${card.dataset.title}`;
      dlg.dataset.title = card.dataset.title; dlg.dataset.kind = card.dataset.kindLabel;
      dlg.showModal();
    });
    $('[data-detail-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => opener && opener.focus());
    $('[data-detail-use]', dlg).addEventListener('click', () => {
      prefill({ kebutuhan: dlg.dataset.kind, pesan: `Saya tertarik dengan rancangan seperti contoh ${dlg.dataset.title}.` });
      dlg.close();
    });
  }

  /* ---- klien: try your own name on the wall (this browser only) ---- */
  const wall = $('[data-wall]');
  if (wall) {
    const f = $('[data-wall-form]', wall), input = $('input', f), help = $('[data-wall-help]', wall);
    let tile = null;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (tile) { tile.remove(); tile = null; }
      if (!name) { help.textContent = 'Ketik namamu dulu, lalu tekan Enter.'; input.focus(); return; }
      tile = document.createElement('li');
      const span = document.createElement('span'); span.className = 'wall__tile'; span.textContent = name;
      const small = document.createElement('small'); small.textContent = 'Pratinjau, hanya di layarmu.';
      span.append(small); tile.append(span);
      $('.wall__try', wall).before(tile);
      help.textContent = 'Kosongkan kolom dan tekan Enter untuk menghapus.';
    });
  }

  /* ---- kontak: validates, posts nowhere until an endpoint exists ---- */
  if (form) {
    const help = $('[data-form-help]', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const req = $$('[required]', form);
      req.forEach((i) => i.removeAttribute('aria-invalid'));
      const bad = req.find((i) => !i.value.trim());
      if (bad) {
        bad.setAttribute('aria-invalid', 'true');
        help.textContent = 'Lengkapi dulu kolom yang kosong.';
        bad.focus();
        return;
      }
      if (!form.dataset.endpoint) { help.textContent = 'Belum terkirim: formulir ini belum terhubung ke penerima.'; return; }
      const btn = $('button[type="submit"]', form);
      btn.setAttribute('aria-busy', 'true');
      fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form) })
        .then((r) => { help.textContent = r.ok ? 'Terkirim. Kami hubungi lewat kontak yang kamu tulis.' : 'Belum berhasil terkirim. Coba lagi sebentar lagi.'; })
        .catch(() => { help.textContent = 'Belum berhasil terkirim. Coba lagi sebentar lagi.'; })
        .finally(() => btn.removeAttribute('aria-busy'));
    });
  }

  /* ---- the one reveal ---- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]').forEach((el) => io.observe(el));
})();
