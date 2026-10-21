/* Shotgun Sound Match — app logic (router, screens, flows). Vanilla JS, no build step. */
(function () {
  const { events, songs, byId } = window.DATA;
  const TODAY = '2026-10-21', TOMORROW = '2026-10-22';
  const viewport = document.getElementById('viewport');
  const tabbar = document.getElementById('tabbar');
  const device = document.getElementById('device');
  const sheetLayer = document.getElementById('sheetLayer');
  const toastEl = document.getElementById('toast');

  /* ---------------- helpers ---------------- */
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euro = (n) => '€' + n.toFixed(2);
  const priceLabel = (n) => (n === 0 ? 'Free' : euro(n));
  const relDay = (e) => (e.date === TODAY ? 'Today' : e.date === TOMORROW ? 'Tomorrow' : e.day);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let toastTimer = null;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200); }
  function pop(el, scale = 1.25) { el.animate([{ transform: 'scale(1)' }, { transform: `scale(${scale})` }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
  function burst(el) {
    const r = el.getBoundingClientRect(), d = device.getBoundingClientRect();
    const cx = r.left + r.width / 2 - d.left, cy = r.top + r.height / 2 - d.top;
    const cols = ['#7CFF4F', '#FBED0F', '#F98436', '#FE6E96', '#E325E3'];
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement('i'); const a = (i / 10) * Math.PI * 2; const dist = 18 + Math.random() * 10;
      Object.assign(dot.style, { position: 'absolute', zIndex: 70, left: cx + 'px', top: cy + 'px', width: '5px', height: '5px', borderRadius: '50%', background: cols[i % 5], pointerEvents: 'none' });
      device.appendChild(dot);
      dot.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(.4)`, opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => dot.remove();
    }
  }

  /* ---------------- posters (generated art) ---------------- */
  function poster(e, fs = 16, extra = '') {
    const p = e.poster || {};
    if (p.cls === 'nightdrive') return `<div class="poster nightdrive ${extra}"><div class="pz-bg"></div><div class="pz-top"><span>${esc(e.day)}</span><span>Paris 19e</span></div><div class="pz-title" style="font-size:${fs * 1.15}px">${esc(p.label)}</div></div>`;
    return `<div class="poster ${extra}"><div class="pz-bg" style="background:${p.bg}"></div><div class="pz-top" style="color:${p.ink}"><span>${esc(e.day)}</span><span>${esc(e.venue)}</span></div><div class="pz-title" style="color:${p.ink};font-size:${fs}px">${esc(p.label)}</div></div>`;
  }
  function tagsHTML(e, max = 1) {
    const g = e.genres; const shown = g.slice(0, max); const more = g.length - shown.length + (e.more || 0);
    return shown.map((x) => `<span class="tag">${icon('music')}${esc(x)}</span>`).join('') + (more > 0 ? `<span class="tag">+${more}</span>` : '');
  }
  function heartBtn(e) { return `<button class="heart-btn ${STORE.isInterested(e.id) ? 'on' : ''}" data-heart="${e.id}" aria-label="Interested in ${esc(e.short)}" aria-pressed="${STORE.isInterested(e.id)}">${icon('heart')}</button>`; }
  function listItem(e, variant = 'upcoming') {
    const meta = variant === 'search' ? `${e.time} - ${priceLabel(e.price)}` : `${e.time} • ${priceLabel(e.price)}`;
    return `<div class="list-item" role="button" tabindex="0" data-open="${e.id}">
      ${poster(e, 15)}
      <div class="li-text">
        <p class="t-list-title clamp-2 li-title">${esc(e.title)}</p>
        <div class="meta-row"><span class="t-meta clamp-1">${relDay(e) === 'Today' || relDay(e) === 'Tomorrow' ? relDay(e) + ' • ' : e.day + ' • '}${meta}</span>${heartBtn(e)}</div>
        <span class="t-meta clamp-1">${esc(e.venue)}</span>
        <div class="tags">${tagsHTML(e)}</div>
      </div></div>`;
  }
  // delegate hearts + open
  function wireCommon(root) {
    root.addEventListener('click', (ev) => {
      const hb = ev.target.closest('[data-heart]');
      if (hb) { ev.stopPropagation(); const on = STORE.toggleInterested(hb.dataset.heart); root.querySelectorAll(`[data-heart="${hb.dataset.heart}"]`).forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); pop(hb, 1.35); if (on) burst(hb); return; }
      const op = ev.target.closest('[data-open]');
      if (op) { nav.push('event', { id: op.dataset.open }); }
    });
    root.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.matches('[data-open]')) nav.push('event', { id: ev.target.dataset.open }); });
  }

  /* ---------------- router ---------------- */
  const TAB_SCREENS = ['foryou', 'upcoming', 'tickets', 'search'];
  const nav = {
    stack: [], current: null,
    show(name, params = {}, anim = 'push') {
      const def = SCREENS[name]; const prev = this.current;
      const inst = def(params); inst.name = name; inst.params = params;
      inst.el.classList.add('screen'); if (inst.tab) inst.el.classList.add('has-tabbar');
      viewport.appendChild(inst.el);
      if (prev) { if (prev.leave) prev.leave(); }
      const enter = anim === 'none' ? null : `enter-${anim}`, leave = anim === 'none' ? null : `leave-${anim}`;
      if (enter) inst.el.classList.add(enter);
      if (prev) {
        if (leave) { prev.el.classList.add(leave); setTimeout(() => prev.el.remove(), 400); } else prev.el.remove();
        if (prev.destroy) setTimeout(() => prev.destroy(), 420);
      }
      setTimeout(() => inst.el.classList.remove(enter), 420);
      this.current = inst; device.scrollTop = 0; viewport.scrollTop = 0;
      renderTabbar(inst.tab || null, inst.tabStyle);
      device.classList.toggle('hide-status', !!inst.hideStatus);
      document.querySelector('.status-bar').style.opacity = inst.hideStatus ? 0 : 1;
      if (inst.enter) inst.enter();
      return inst;
    },
    push(name, params) { if (this.current) this.stack.push({ name: this.current.name, params: this.current.params, scroll: this.scrollOf() }); this.show(name, params, 'push'); },
    replace(name, params, anim = 'fade') { this.show(name, params, anim); },
    back(n = 1) {
      let entry = null; for (let i = 0; i < n; i++) entry = this.stack.pop() || entry;
      if (!entry) { this.tab('search'); return; }
      const inst = this.show(entry.name, entry.params, 'pop');
      const sc = inst.el.querySelector('.scroll'); if (sc && entry.scroll) sc.scrollTop = entry.scroll;
    },
    tab(name) { this.stack = []; this.show(name, {}, 'fade'); },
    scrollOf() { const sc = this.current && this.current.el.querySelector('.scroll'); return sc ? sc.scrollTop : 0; },
  };

  function renderTabbar(active, style) {
    if (!active) { tabbar.classList.add('hidden'); return; }
    tabbar.classList.remove('hidden'); tabbar.classList.toggle('translucent', style === 'translucent');
    const tabs = [['foryou', 'For you', 'sparkles'], ['upcoming', 'Upcoming', 'calendar'], ['tickets', 'Tickets', 'ticket'], ['search', 'Search', 'search']];
    const hasTickets = STORE.get().tickets.length > 0;
    tabbar.innerHTML = tabs.map(([id, label, ic]) => `<button class="tab ${id === active ? 'active' : ''}" data-tab="${id}" aria-current="${id === active ? 'page' : 'false'}"><span class="pill">${icon(id === active && ic === 'sparkles' ? 'sparklesFill' : ic)}</span>${label}${id === 'tickets' && hasTickets && active !== 'tickets' ? '<span class="badge"></span>' : ''}</button>`).join('');
  }
  tabbar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    const ic = b.querySelector('.icon'); if (ic) ic.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 300, easing: 'ease-out' });
    if (nav.current && nav.current.name === b.dataset.tab) { const sc = nav.current.el.querySelector('.scroll'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    nav.tab(b.dataset.tab);
  });

  /* ---------------- sheets ---------------- */
  function openSheet(innerHTML, onMount) {
    sheetLayer.innerHTML = `<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true">${innerHTML}</div>`;
    sheetLayer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => sheetLayer.classList.add('open'));
    sheetLayer.querySelector('.scrim').addEventListener('click', closeSheet);
    if (onMount) onMount(sheetLayer.querySelector('.sheet'));
  }
  function closeSheet() { sheetLayer.classList.remove('open'); sheetLayer.setAttribute('aria-hidden', 'true'); setTimeout(() => { if (!sheetLayer.classList.contains('open')) sheetLayer.innerHTML = ''; }, 400); }

  /* ================================================================
     SCREENS
     ================================================================ */
  const SCREENS = {};

  /* ---------- For You ---------- */
  SCREENS.foryou = () => {
    const mv = ['sama', 'legends', 'houseofgroove', 'guygerber'].map(byId);
    const feat = byId('legends'); const top = ['sama', 'antal', 'hunee'].map(byId);
    const el = h(`<section aria-label="For you"><div class="scroll">
      <div class="topbar"><button class="chip selected">${icon('pin')}<span class="t-chip">Paris</span></button>
        <div class="actions"><button class="circle-btn" data-act="liked" aria-label="Interested events">${icon('heart')}</button><button class="circle-btn" data-act="bell" aria-label="Notifications">${icon('bell')}</button><div class="avatar" aria-label="Profile">A</div></div></div>
      <div class="section"><div class="heading-row">${icon('star4')}<h2 class="t-heading-section">Your most viewed</h2></div>
        <div class="tiles">${mv.map((e) => `<button class="tile" data-open="${e.id}">${poster(e, 6)}<span class="t-tile clamp-1">${esc(e.short)}</span></button>`).join('')}</div></div>
      <div class="section"><button class="listen-promo" data-act="listen" style="all:unset;display:block;cursor:pointer;width:100%">
        <div style="position:relative;border-radius:7px;overflow:hidden;height:92px;background:radial-gradient(120% 140% at 0% 0%, rgba(124,255,79,.35), transparent 50%),radial-gradient(120% 140% at 100% 100%, rgba(227,37,227,.35), transparent 55%),radial-gradient(1.2px 1.2px at 50% 50%, rgba(170,205,255,.7) 50%, transparent 51%) 0 0/7px 7px,#0b1220;display:flex;align-items:center;gap:14px;padding:0 16px">
          <span class="circle-btn glass" style="width:46px;height:46px">${icon('audio')}</span>
          <span><span class="t-btn-sm" style="display:block;color:#7CFF4F">New · Sound match</span><span style="font-weight:500;font-size:16px">Got a song in your head? Find events that sound like it.</span></span>
        </div></button></div>
      <div class="section"><div class="heading-row"><span aria-hidden="true">🔥</span><h2 class="t-heading-feed">Blowing up in Paris</h2></div>
        <div class="feature-card" role="button" tabindex="0" data-open="${feat.id}">${poster(feat, 40)}
          <div class="fc-body"><p class="t-list-title clamp-1">${esc(feat.title)}</p><div class="meta-row row" style="gap:8px"><span class="t-meta clamp-1" style="flex:1">${esc(feat.day)} • ${esc(feat.venue)}</span>${heartBtn(feat)}</div><div class="tags">${tagsHTML(feat, 2)}</div></div></div></div>
      <div class="section" style="padding-bottom:24px"><div class="heading-row">${icon('star4')}<h2 class="t-heading-section">Top community</h2></div><p class="t-meta" style="margin:-16px 0 20px">Most shared events in Paris</p></div>
      <div class="carousel">${top.map((e, i) => `<button class="rank-card" data-open="${e.id}">${poster(e, 15)}<span class="rank">${i + 1}</span></button>`).join('')}</div>
      <p class="t-meta pad" style="font-size:12px;margin-top:28px;opacity:.7">Listings from shotgun.live, read 21 Oct 2026. Posters are generated for this prototype.</p>
    </div></section>`);
    wireCommon(el);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'listen') { nav.stack = [{ name: 'search', params: {} }]; nav.show('listen', {}, 'fade'); }
      if (a.dataset.act === 'bell') { pop(a); toast('No new notifications'); }
      if (a.dataset.act === 'liked') { pop(a); const n = STORE.get().interested.length; toast(n ? `${n} event${n > 1 ? 's' : ''} marked as interested` : 'Tap ♡ on an event to save it'); }
    });
    return { el, tab: 'foryou' };
  };

  /* ---------- Upcoming ---------- */
  SCREENS.upcoming = () => {
    const sorted = events.slice().sort((a, b) => a.date.localeCompare(b.date));
    const groups = []; sorted.forEach((e) => { const k = e.date; let g = groups.find((x) => x.k === k); if (!g) { g = { k, label: e.date === TODAY ? 'Today' : e.date === TOMORROW ? 'Tomorrow' : e.day, items: [] }; groups.push(g); } g.items.push(e); });
    const el = h(`<section aria-label="Upcoming"><div class="scroll">
      <div class="chips-row" role="toolbar"><button class="chip selected">${icon('pin')}<span class="t-chip">Paris</span></button><button class="chip" aria-label="Date">${icon('calendar')}</button>
        ${['Music', 'Price', 'Mood'].map((x) => `<button class="chip t-chip" data-filter>${x}</button>`).join('')}</div>
      ${groups.map((g) => `<div class="section"><h2 class="t-heading-section">${esc(g.label)}</h2><div class="list" style="padding:0">${g.items.map((e) => listItem(e)).join('')}</div></div>`).join('')}
    </div></section>`);
    wireCommon(el);
    el.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { b.classList.toggle('selected'); pop(b, 1.06); }));
    return { el, tab: 'upcoming' };
  };

  /* ---------- Tickets ---------- */
  SCREENS.tickets = () => {
    const ts = STORE.get().tickets;
    const el = h(`<section aria-label="Tickets"><div class="scroll">
      <div class="section" style="padding-top:20px"><h1 class="t-title-event">Tickets</h1></div>
      ${ts.length ? `<div class="section tickets-list">${ts.map((t) => { const e = byId(t.eventId); return `<button class="ticket-row" data-ticket="${t.id}">${poster(e, 9)}<span style="flex:1;min-width:0"><span class="t-list-title clamp-2" style="display:block">${esc(e.title)}</span><span class="t-meta" style="display:block">${esc(e.day)} • ${esc(e.time)}</span><span class="t-meta" style="display:block">${t.qty} × Standard · ${esc(e.venue)}</span></span>${icon('chevronLeft', 'flip')}</button>`; }).join('')}</div>`
        : `<div class="empty">${icon('ticket')}<p class="t-list-title" style="color:#fff">No tickets yet</p><p>Find an event in Search, or try Listen to match a song.</p><button class="chip selected" data-go-listen style="margin-top:12px">${icon('ear')}<span class="t-chip">Try Listen</span></button></div>`}
    </div></section>`);
    el.querySelectorAll('.flip svg').forEach((s) => (s.style.transform = 'rotate(180deg)'));
    el.addEventListener('click', (e) => {
      const r = e.target.closest('[data-ticket]'); if (r) nav.push('success', { ticketId: r.dataset.ticket, viewOnly: true });
      if (e.target.closest('[data-go-listen]')) { nav.stack = [{ name: 'search', params: {} }]; nav.show('listen', {}, 'fade'); }
    });
    return { el, tab: 'tickets' };
  };

  /* ---------- Search ---------- */
  SCREENS.search = () => {
    const el = h(`<section aria-label="Search"><div class="scroll">
      <div class="search-tabs"><label class="search-field">${icon('search')}<input type="search" placeholder="Events, artists…" aria-label="Search events" value="${esc(STORE.get().lastQuery)}"></label>
        <button class="chip selected solid-sm" data-act="map">${icon('map')}Map</button><button class="chip selected solid-sm" data-act="listen">${icon('ear')}Listen</button></div>
      <div class="section"><h2 class="t-heading-section" data-head>Events for you</h2><div class="list" style="padding:0" data-list></div></div>
    </div></section>`);
    const input = el.querySelector('input'), list = el.querySelector('[data-list]'), head = el.querySelector('[data-head]');
    const render = () => {
      const q = input.value.trim().toLowerCase(); STORE.setLastQuery(input.value);
      const res = events.filter((e) => !e.fictional && (!q || (e.title + ' ' + e.venue + ' ' + e.genres.join(' ')).toLowerCase().includes(q)));
      head.textContent = q ? `Results (${res.length})` : 'Events for you';
      list.innerHTML = res.length ? res.map((e) => listItem(e, 'search')).join('') : `<div class="empty" style="padding:24px 0">${icon('search')}<p>No event matches “${esc(input.value)}”.</p><p>Know the song but not the event? Try <b style="color:#fff">Listen</b>.</p></div>`;
    };
    input.addEventListener('input', render); render();
    wireCommon(el);
    el.querySelector('[data-act="map"]').addEventListener('click', () => nav.push('map'));
    el.querySelector('[data-act="listen"]').addEventListener('click', () => nav.push('listen'));
    return { el, tab: 'search' };
  };

  /* ---------- shared: songs + NCS tracks ---------- */
  const TRACKS = window.DATA.tracks;
  const findItem = (id) => { const s = songs.find((x) => x.id === id); if (s) return Object.assign({ kind: 'song' }, s); const t = TRACKS.find((x) => x.id === id); return t ? Object.assign({ kind: 'track' }, t) : null; };
  const matchEventFor = (item) => { if (!item || item.kind === 'song') return byId(window.DATA.MATCH_EVENT); return events.find((e) => e.track === item.id) || byId(window.DATA.MATCH_EVENT); };
  const matchScore = (item) => { if (!item) return 94; let h2 = 0; for (const c of item.id) h2 = (h2 * 31 + c.charCodeAt(0)) % 997; return item.id === 's1' ? 94 : 86 + (h2 % 11); };
  const muteBtn = () => `<button class="circle-btn glass mute-btn ${PLAYER.muted ? 'on' : ''}" data-mute aria-label="${PLAYER.muted ? 'Unmute' : 'Mute'}" aria-pressed="${PLAYER.muted}">${icon(PLAYER.muted ? 'volumeX' : 'volume')}</button>`;
  const playBtn = (trackId, cls = '') => `<button class="pbtn ${cls}" data-preview="${trackId}" aria-label="Play preview"><span class="pi">${icon('play')}</span></button>`;
  const venueOfTrack = (tid) => { const e = events.find((x) => x.track === tid); if (!e) return null; const v = window.DATA.venues.find((vv) => vv.events.includes(e.id)); return v ? v.id : null; };
  const GENRE_RX = { Latin: /latin|reggaeton/i, Caribbean: /caribbean|reggae|dancehall/i, Disco: /disco/i, Techno: /techno/i, House: /house/i, 'Hard Music': /hard|industrial|gabber/i, Afro: /afro/i, 'Hip Hop': /hip ?hop|rap/i, Trance: /trance/i, Dance: /dance/i, Pop: /pop/i, Brazilian: /brazil/i, 'Dark Wave': /dark ?wave|synthwave/i, 'Bass Music': /bass|dubstep|garage/i, 'Reggae / Dub': /reggae|dub\b/i, Rock: /rock/i, 'Instrumental / Ambient': /ambient|instrumental/i, Metal: /metal/i, 'Soul / Jazz': /soul|jazz/i };

  /* ---------- shared search filters (Today + music genres), used by Map, Listen and the match ---------- */
  const savedF = STORE.getMapFilters();
  const FILTER = { today: false, genres: new Set(savedF.saved ? savedF.genres : []), saved: !!savedF.saved };
  const passesWith = (e, today, genres) => (!today || e.date === TODAY) && (!genres.size || e.genres.some((g) => [...genres].some((k) => GENRE_RX[k].test(g))));
  const passes = (e) => passesWith(e, FILTER.today, FILTER.genres);
  const filterBar = (right = '') => `<div class="listen-top"><button class="circle-btn glass" data-act="back" aria-label="Back">${icon('chevronLeft')}</button><button class="chip glass solid-sm ${FILTER.today ? 'selected' : ''}" data-act="f-today" aria-pressed="${FILTER.today}">${icon('calendar')}Today</button><button class="chip glass solid-sm" data-act="f-filters">${icon('filters')}Filters<span class="fbadge" ${FILTER.genres.size ? '' : 'hidden'}>${FILTER.genres.size}</span></button><span style="flex:1"></span>${right}</div>`;
  const filterSummary = () => { const parts = []; if (FILTER.today) parts.push('Today'); if (FILTER.genres.size) parts.push([...FILTER.genres].join(', ')); return parts.join(' · '); };
  function syncFilterBars() {
    device.querySelectorAll('[data-act="f-today"]').forEach((b) => { b.classList.toggle('selected', FILTER.today); b.setAttribute('aria-pressed', FILTER.today); });
    device.querySelectorAll('[data-act="f-filters"] .fbadge').forEach((b) => { b.hidden = !FILTER.genres.size; b.textContent = FILTER.genres.size; });
  }
  function filtersChanged() { syncFilterBars(); if (nav.current && nav.current.onFilter) nav.current.onFilter(); }
  function openFilterSheet() {
    const chips = Object.keys(GENRE_RX);
    openSheet(`<div class="grabber"></div><h3 class="sheet-h">Music</h3><div class="fchips">${chips.map((c) => `<button class="fchip ${FILTER.genres.has(c) ? 'on' : ''}" data-g="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="sheet-sep"></div><div class="row between"><h3 class="sheet-h" style="margin:0">Friends</h3><button class="coral-link" data-friends>+ Add friends</button></div><button class="fchip" style="margin-top:12px" data-fi>🩷 Friends interested</button>
      <div class="sheet-sep"></div><label class="row between" style="font-size:16px">Save my filters for later <input type="checkbox" data-save ${FILTER.saved ? 'checked' : ''}></label>
      <div class="row between" style="margin-top:18px"><button class="clear-all" data-clear>Clear all</button><button class="btn-dark" data-see style="width:auto;padding:0 20px">See events</button></div>`, (sheet) => {
      const pick = new Set(FILTER.genres);
      const upd = () => { const n = events.filter((ev) => passesWith(ev, FILTER.today, pick)).length; sheet.querySelector('[data-see]').textContent = `See ${n} event${n === 1 ? '' : 's'}`; };
      sheet.addEventListener('click', (ev) => {
        const c = ev.target.closest('[data-g]'); if (c) { const g = c.dataset.g; if (pick.has(g)) pick.delete(g); else pick.add(g); c.classList.toggle('on'); pop(c, 1.06); upd(); }
        if (ev.target.closest('[data-fi]')) ev.target.closest('[data-fi]').classList.toggle('on');
        if (ev.target.closest('[data-friends]')) toast('Friends are not part of this prototype');
        if (ev.target.closest('[data-clear]')) { pick.clear(); sheet.querySelectorAll('.fchip.on').forEach((x) => x.classList.remove('on')); upd(); }
        if (ev.target.closest('[data-see]')) { FILTER.genres = pick; FILTER.saved = sheet.querySelector('[data-save]').checked; STORE.setMapFilters({ saved: FILTER.saved, genres: FILTER.saved ? [...pick] : [] }); closeSheet(); filtersChanged(); }
      });
      upd();
    });
  }
  // one handler for every screen that shows the filter bar
  device.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act="f-today"], [data-act="f-filters"]'); if (!b) return;
    e.stopPropagation();
    if (b.dataset.act === 'f-today') { FILTER.today = !FILTER.today; pop(b, 1.06); filtersChanged(); toast(FILTER.today ? 'Showing today’s events' : 'Showing all dates'); }
    else openFilterSheet();
  }, true);
  /* best event for a song under the current filters */
  function pickResult(item) {
    const base = matchEventFor(item);
    if (passes(base)) return { ev: base, alt: false };
    const pool = events.filter(passes); if (!pool.length) return null;
    const words = new Set(base.genres.concat(item && item.genre ? [item.genre] : []).join(' ').toLowerCase().split(/\s+/));
    const sc = (e) => e.genres.join(' ').toLowerCase().split(/\s+/).filter((w) => words.has(w)).length;
    pool.sort((a, b) => sc(b) - sc(a) || a.date.localeCompare(b.date));
    return { ev: pool[0], alt: true };
  }

  /* ---------- Map: 3D clubs ---------- */
  SCREENS.map = (params = {}) => {
    let only = params.venue || null;
    const ALL = window.DATA.venues;
    let VEN = only ? ALL.filter((v) => v.id === only) : ALL;
    let map = null; let unsub = null;
    const evsOf = (v) => v.events.map(byId).filter(passes);
    const el = h(`<section aria-label="Search by map" style="background:#111"><canvas class="fx-canvas" style="touch-action:none"></canvas><div class="map-labels"></div>
      ${filterBar(muteBtn())}
      <p class="map-count" aria-live="polite"></p>${only ? `<button class="chip glass solid-sm map-only" data-act="showall">Show all clubs</button>` : ''}
      <button class="circle-btn glass map-locate" data-act="recenter" aria-label="Recenter map">${icon('pin')}</button>
      <p class="map-hint">Tap a club to see its events · drag to move · pinch to zoom</p>
      <div class="map-card" aria-live="polite"></div></section>`);
    const $ = (s) => el.querySelector(s); const card = $('.map-card');
    const refresh = () => {
      const vis = VEN.filter((v) => evsOf(v).length || (only && v.id === only)); const n = vis.reduce((a, v) => a + evsOf(v).length, 0);
      $('.map-count').textContent = `${vis.length} club${vis.length === 1 ? '' : 's'} · ${n} event${n === 1 ? '' : 's'}${FILTER.today ? ' today' : ''}`;
      if (map) map.setVisible(vis.map((v) => v.id), !!only);
      if (map && map.selected) renderCard(map.selected);
    };
    const renderCard = (vid) => {
      if (!vid) { card.classList.remove('in'); $('.map-hint').classList.remove('gone'); return; }
      const v = ALL.find((x) => x.id === vid); const list = evsOf(v).sort((a, b) => (b.id === params.event) - (a.id === params.event));
      card.innerHTML = `<div class="mc-head"><div><h2 class="t-heading-section">${esc(v.name)}</h2><p class="t-meta">${esc(v.address)}</p></div><button class="circle-btn" data-act="close" aria-label="Close">${icon('x')}</button></div>
        <div class="mc-list">${list.map((e) => { const t = window.DATA.trackById(e.track); return `<div class="mcard" role="button" tabindex="0" data-open="${e.id}"><div class="mc-poster">${poster(e, 11)}${playBtn(e.track, 'on-poster')}</div><div class="mc-text"><p class="mc-title clamp-2">${esc(e.title)}</p><p class="t-meta clamp-1">${esc(relDay(e))} • ${esc(e.time)} • ${priceLabel(e.price)}</p><div class="tags" style="padding-top:4px">${tagsHTML(e)}</div></div></div>`; }).join('')}</div>`;
      card.classList.add('in'); $('.map-hint').classList.add('gone'); syncPreviews();
    };
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'back') nav.back();
      if (act === 'recenter') { pop(a); map && map.recenter(); }
      if (act === 'close') map && map.select(null);
      if (act === 'showall') { only = null; VEN = ALL; a.remove(); refresh(); map.recenter(); }
    });
    wireCommon(card);
    return {
      el, hideStatus: false, onFilter: () => refresh(),
      enter() {
        map = new CityMap($('canvas'), $('.map-labels'), { venues: ALL, onSelect: renderCard });
        if (!map.ok) { $('.map-hint').textContent = 'WebGL is not available in this browser.'; return; }
        map.start(); refresh();
        if (only) { const c = map.clubs[only]; map.goal.dist = 9; map.target.set(c.x, 0, c.z); map.select(only, true); }
        unsub = PLAYER.on((p) => map && map.setPlaying(p.current && !p.el.paused ? venueOfTrack(p.current) : null));
      },
      leave() { if (unsub) unsub(); PLAYER.pause(); closeSheet(); },
      destroy() { if (map) map.destroy(); map = null; },
    };
  };

  /* ---------- Listen landing (Search Audio 01 A) ---------- */
  SCREENS.listen = () => {
    const recent = STORE.get().recentSongs.map(findItem).filter(Boolean);
    const el = h(`<section aria-label="Listen" style="background:#000"><canvas class="fx-canvas"></canvas>
      ${filterBar()}
      <div class="listen-center">
        <p class="filter-note" data-fnote hidden></p>
        ${recent.length ? `<div class="recent" style="justify-content:center;margin-bottom:6px">${recent.slice(0, 2).map((s) => `<button class="chip glass solid-sm" data-song="${s.id}" style="text-transform:none;font-weight:500">${icon('music')}${esc(s.title)}</button>`).join('')}</div>` : ''}
        <button class="listen-btn alt" data-act="songs">${icon('search')}Song name, artist</button>
        <span class="or">OR</span>
        <button class="listen-btn primary" data-act="mic">${icon('audio')}Listen audio</button>
      </div></section>`);
    let scene = null;
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); const s = e.target.closest('[data-song]');
      if (s) { const it = findItem(s.dataset.song); startMatch(it.kind === 'track' ? { source: 'track', trackId: it.id } : { source: 'song', songId: it.id }); return; }
      if (!a) return;
      if (a.dataset.act === 'back') nav.back();
      if (a.dataset.act === 'songs') nav.push('songs');
      if (a.dataset.act === 'mic') { pop(a, 1.05); startMatch({ source: 'mic' }); }
    });
    const note = () => { const n = el.querySelector('[data-fnote]'); const sm = filterSummary(); n.hidden = !sm; n.textContent = sm ? `Matching only: ${sm}` : ''; };
    note();
    return {
      el, tab: 'search', tabStyle: 'translucent', onFilter: note,
      enter() { scene = new ParticleScene(el.querySelector('canvas'), { mode: 'ambient' }); scene.start(); const loop = () => { if (!scene) return; scene.feed({ level: 0.05 + 0.04 * Math.sin(performance.now() / 900), beat: false }); requestAnimationFrame(loop); }; loop(); },
      destroy() { if (scene) scene.destroy(); scene = null; },
    };
  };

  /* ---------- Select a song (Search Audio 01 B) + NCS library ---------- */
  SCREENS.songs = () => {
    const el = h(`<section aria-label="Select a song"><div class="songs-top"><button class="circle-btn outline" data-act="back" aria-label="Back">${icon('chevronLeft')}</button>
        <div class="providers" aria-label="Import from another app">${[['Spotify', '#1ED760'], ['Apple Music', '#FA2D55'], ['Deezer', '#A238FF'], ['SoundCloud', '#FF5500']].map(([n, c]) => `<button class="provider" style="background:${c}" data-provider="${n}">${n}</button>`).join('')}</div></div>
      <div class="scroll" style="padding-top:0;padding-bottom:96px"><div class="section" style="padding-top:24px"><h2 class="t-heading-section">Select a song</h2></div>
      <div class="song-list" data-list></div>
      ${PLAYER.synth ? '<div data-ncs hidden></div>' : `<div class="section"><div class="row between"><h2 class="t-heading-section">NCS library</h2><span class="t-meta" style="font-size:12px">30 s previews</span></div></div>
      <div class="song-list" data-ncs></div>
      <p class="t-meta pad" style="font-size:12px;margin-top:16px">Music provided by NoCopyrightSounds (ncs.io). Excerpts used for a class prototype only.</p>`}</div>
      <label class="song-search">${icon('search')}<input type="text" autocomplete="off" spellcheck="false" placeholder="Song, artist" aria-label="Song or artist" value="${esc(STORE.get().lastSongQuery || '')}"></label>
    </section>`);
    const input = el.querySelector('input'), list = el.querySelector('[data-list]'), ncs = el.querySelector('[data-ncs]');
    const hl = (txt, q) => { if (!q) return esc(txt); const i = txt.toLowerCase().indexOf(q); if (i < 0) return esc(txt); return esc(txt.slice(0, i)) + '<mark>' + esc(txt.slice(i, i + q.length)) + '</mark>' + esc(txt.slice(i + q.length)); };
    const songRow = (s, q) => `<div class="song" role="button" tabindex="0" data-song="${s.id}"><span class="cover" style="background:linear-gradient(135deg,${s.cover[0]},${s.cover[1]})"></span><span style="min-width:0;flex:1"><span class="s-title clamp-1" style="display:block">${hl(s.title, q)}</span><span class="s-artist clamp-1" style="display:block">${hl(s.artist, q)}</span></span>${s.srcs && !PLAYER.synth ? playBtn(s.id) : ''}</div>`;
    const trackRow = (t, q) => `<div class="song" role="button" tabindex="0" data-song="${t.id}">${t.cover ? `<img class="cover" src="${t.cover}" alt="" loading="lazy">` : `<span class="cover" style="background:linear-gradient(135deg,#1a1a1a,#7CFF4F)"></span>`}<span style="min-width:0;flex:1"><span class="s-title clamp-1" style="display:block">${hl(t.title, q)}</span><span class="s-artist clamp-1" style="display:block">${hl(t.artist, q)} · ${esc(t.genre)}</span></span>${playBtn(t.id)}</div>`;
    const render = () => {
      const q = input.value.trim().toLowerCase(); STORE.get().lastSongQuery = input.value;
      const res = q ? songs.filter((s) => (s.title + ' ' + s.artist).toLowerCase().includes(q)) : [];
      const tr = TRACKS.filter((t) => !q || (t.title + ' ' + t.artist + ' ' + t.genre).toLowerCase().includes(q));
      if (!q) { const rec = STORE.get().recentSongs.map(findItem).filter((x) => x && x.kind === 'song'); list.innerHTML = rec.length ? `<p class="t-meta">Recent</p>` + rec.map((s) => songRow(s)).join('') : `<p class="t-meta">Type the song you have in your head, for example “leave it al”, or pick one from the NCS library.</p>`; }
      else list.innerHTML = res.length ? res.map((s) => songRow(s, q)).join('') : `<p class="t-meta">No result outside the NCS library for “${esc(input.value)}”.</p>`;
      ncs.innerHTML = tr.length ? tr.map((t) => trackRow(t, q)).join('') : `<p class="t-meta">No NCS track matches.</p>`;
      syncPreviews();
    };
    input.addEventListener('input', render); render();
    el.addEventListener('click', (e) => {
      const s = e.target.closest('[data-song]');
      if (s) { s.animate([{ transform: 'scale(1)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 220 }); const it = findItem(s.dataset.song); STORE.addRecentSong(it.id); setTimeout(() => startMatch(it.kind === 'track' ? { source: 'track', trackId: it.id } : { source: 'song', songId: it.id }), 140); }
      const p = e.target.closest('[data-provider]'); if (p) { pop(p, 1.08); toast(`Connecting ${p.dataset.provider} is not part of this prototype`); }
      if (e.target.closest('[data-act="back"]')) nav.back();
    });
    return { el, enter() { setTimeout(() => input.focus({ preventScroll: true }), 380); }, leave() { PLAYER.pause(); } };
  };

  /* ---------- Matching sequence (Search Audio 02 → 6) ---------- */
  function startMatch(opts) { nav.push('match', opts); }
  SCREENS.match = (params) => {
    const item = params.trackId ? findItem(params.trackId) : params.songId ? findItem(params.songId) : findItem(window.DATA.MIC_RECOGNISED);
    const song = params.source === 'mic' ? null : item;
    const score = matchScore(item); let res = pickResult(item); let shown = false;
    const el = h(`<section aria-label="Finding events" style="background:radial-gradient(120% 80% at 50% 40%, #0d1a33 0%, #060a14 55%, #020306 100%)"><canvas class="fx-canvas"></canvas>
      ${filterBar(params.source === 'mic' ? '' : muteBtn())}
      <p class="sim-note" hidden></p>
      <div class="search-status" aria-live="polite"><div class="mic-meter" hidden>${'<i></i>'.repeat(9)}</div><div class="st-main"></div><div class="st-sub"></div><div class="st-bar"><i></i></div></div>
      <div class="result-card" role="button" tabindex="0" aria-label="Open matched event"></div>
      <button class="chip selected see-all t-btn-sm" data-act="all" style="height:44px;padding:0 22px">See all events</button>
    </section>`);
    const $ = (s) => el.querySelector(s);
    const main = $('.st-main'), sub = $('.st-sub'), bar = $('.st-bar i'), meter = $('.mic-meter'), status = $('.search-status');
    let scene = null, alive = true, raf = 0, recognised = song;
    const renderResult = () => {
      const card = $('.result-card');
      if (!res) { card.removeAttribute('data-open-match'); card.innerHTML = `<span class="fc-body" style="padding:22px 16px"><span class="t-list-title">No event matches your filters</span><span class="t-meta" style="margin:4px 0 12px">${esc(filterSummary())}</span><span><button class="chip selected t-btn-sm" data-act="clear-filters" style="height:38px">Clear filters</button></span></span>`; return; }
      const ev = res.ev; card.setAttribute('data-open-match', '');
      card.innerHTML = `<span class="match-pill"><i></i><span>${res.alt ? `${score - 7}% · closest with your filters` : `${score}% sound match`}</span></span>
        ${poster(ev, 38)}
        <span class="fc-body"><span class="t-list-title clamp-1">${esc(ev.title)}</span><span class="row" style="gap:8px"><span class="t-meta clamp-1" style="flex:1">${esc(relDay(ev))} • ${esc(ev.venue)}</span>${heartBtn(ev)}</span><span class="tags">${tagsHTML(ev, 2)}</span></span>`;
    };
    renderResult();
    const setText = (m, s) => { [main, sub].forEach((n) => n.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'ease-out' })); main.textContent = m; sub.textContent = s || ''; };
    const loop = () => {
      if (!alive) return; const a = AUDIO.read();
      if (scene) scene.feed(a);
      if (!meter.hidden) meter.querySelectorAll('i').forEach((n, i) => { const v = a.bands[Math.min(7, Math.abs(i - 4) * 2)] || 0; n.style.height = 3 + v * 16 + 'px'; });
      raf = requestAnimationFrame(loop);
    };
    async function run() {
      scene = new ParticleScene($('canvas'), { mode: 'wave' }); scene.start(); loop();
      if (params.source === 'mic') {
        setText('Starting microphone…', '');
        const r = await AUDIO.startMic();
        if (!alive) return;
        if (!r.ok) { const n = $('.sim-note'); n.hidden = false; n.textContent = r.reason === 'denied' ? 'Microphone blocked: simulating the audio input.' : 'Microphone unavailable: simulating the audio input.'; AUDIO.startSim(120); }
        meter.hidden = false;
        setText('Listening…', 'Hold your phone close to the music'); bar.style.width = '10%';
        await sleep(4800); if (!alive) return;
        recognised = findItem(window.DATA.MIC_RECOGNISED);
        STORE.addRecentSong(recognised.id);
        setText('Got it', `${recognised.title} — ${recognised.artist}`); bar.style.width = '22%';
        await sleep(1500); if (!alive) return;
        meter.hidden = true;
      } else if (params.source === 'track') {
        AUDIO.useTrack(); PLAYER.play(song.id, song.start || 0); meter.hidden = false;
        setText('Reading the sound', `${song.title} — ${song.artist}`); bar.style.width = '12%';
        await sleep(2200); if (!alive) return; meter.hidden = true;
      } else {
        let playing = false;
        if (song.srcs && !PLAYER.synth) { AUDIO.useTrack(); playing = await PLAYER.play(song.id, song.start || 0); if (!alive) return; }
        if (!playing) { AUDIO.startSim(120); if (song.srcs && !PLAYER.synth) { const n = $('.sim-note'); n.hidden = false; n.textContent = `Add “${song.srcs[0].split('/').pop()}” to assets/audio to hear this song.`; } }
        else meter.hidden = false;
        setText('Reading the sound', `${song.title} — ${song.artist}`); bar.style.width = '12%';
        await sleep(2000); if (!alive) return; meter.hidden = true;
      }
      setText('Reading the sound', 'Tempo · energy · texture'); bar.style.width = '34%'; scene.emitPulse();
      await sleep(1300); if (!alive) return;
      scene.setMode('listenerA'); setText('Finding listeners like you', `People who play “${recognised.title}” also go out to…`); bar.style.width = '52%';
      await sleep(2600); if (!alive) return;
      scene.setMode('listenerB'); setText('Matching the vibe', recognised.kind === 'track' ? `${recognised.genre} · tempo · energy · texture` : 'Melodic house · indie dance · warm synths'); bar.style.width = '70%';
      await sleep(2600); if (!alive) return;
      scene.setMode('crowd'); setText('Looking for events in Paris', filterSummary() ? `Only ${filterSummary()}` : 'Comparing with 2,606 upcoming events'); bar.style.width = '90%';
      await sleep(2800); if (!alive) return;
      bar.style.width = '100%'; scene.setMode('result');
      status.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
      res = pickResult(recognised); renderResult(); shown = true;
      $('.result-card').classList.add('in'); $('.see-all').classList.add('in');
      setTimeout(() => { if (alive) scene.emitPulse(); }, 300);
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-heart]')) { const hb = e.target.closest('[data-heart]'); const on = STORE.toggleInterested(hb.dataset.heart); hb.classList.toggle('on', on); pop(hb, 1.35); if (on) burst(hb); e.stopPropagation(); return; }
      if (e.target.closest('[data-act="clear-filters"]')) { e.stopPropagation(); FILTER.today = false; FILTER.genres = new Set(); filtersChanged(); return; }
      if (e.target.closest('[data-open-match]') && res) nav.push('event', { id: res.ev.id, match: recognised ? recognised.id : null });
      if (e.target.closest('[data-act="back"]')) nav.back();
      if (e.target.closest('[data-act="all"]')) nav.tab('upcoming');
    });
    el.addEventListener('keydown', (k) => { if (k.key === 'Enter' && k.target.matches('[data-open-match]')) k.target.click(); });
    return {
      el, hideStatus: false,
      onFilter() { res = pickResult(recognised || item); if (shown) { renderResult(); const c = $('.result-card'); c.animate([{ transform: 'scale(.97)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' }); if (scene) scene.emitPulse(); } },
      enter() { run(); },
      leave() { alive = false; cancelAnimationFrame(raf); AUDIO.stopInput(); if (!res || PLAYER.current !== res.ev.track) PLAYER.pause(); },
      destroy() { if (scene) scene.destroy(); scene = null; },
    };
  };

  /* ---------- Event page ---------- */
  SCREENS.event = (params) => {
    const e = byId(params.id); const item = params.match ? findItem(params.match) : null;
    const t = e.track ? window.DATA.trackById(e.track) : null;
    const isMain = !!e.fictional;
    const orgs = e.organizers || [{ name: e.organizer, followers: null, line: e.venue }];
    const why = !item ? '' : item.kind === 'song' ? `Sound match with <b>“${esc(item.title)}”</b> — ${esc(item.artist)}. Retro synths over contemporary electronic production, vocal hooks, steady four-to-the-floor.` : `Sound match with <b>“${esc(item.title)}”</b> — ${esc(item.artist)} (${esc(item.genre)}): similar tempo, energy and texture.`;
    const el = h(`<section aria-label="${esc(e.title)}">
      <div class="ev-header"><button class="circle-btn glass" data-act="back" aria-label="Back">${icon('chevronLeft')}</button><span class="ev-mini" aria-hidden="true">${esc(e.short)} · ${esc(e.day)}</span><button class="circle-btn glass" data-act="share" aria-label="Share">${icon('share')}</button></div>
      <div class="scroll" style="padding-top:0;padding-bottom:110px">
        <div class="ev-hero" style="--hero-tint:${isMain ? 'linear-gradient(180deg,#0c1426,#18243a 35%,#1d2029 65%,#1B1B1B)' : 'linear-gradient(180deg,#2a2a2a,#232323 50%,#1B1B1B)'}">${poster(e, 44)}</div>
        <div class="ev-title"><h1 class="t-title-event">${esc(e.title)}</h1><p class="ev-by">By <b>${esc(e.organizer)}</b></p>
          <button class="chip-interested ${STORE.isInterested(e.id) ? 'on' : ''}" data-interest style="margin-top:20px" aria-pressed="${STORE.isInterested(e.id)}">${icon('heart')}<span class="t-btn-sm">Interested</span></button></div>
        ${item ? `<div class="match-banner"><span class="score">${matchScore(item)}%</span><span class="why">${why}</span></div>` : ''}
        <div class="info-rows">
          <div class="info-row">${icon('calendar')}<div class="ir-content t-row"><span><span class="coral">${esc(e.day)}</span> <span class="muted">from</span> ${esc(e.time)}${e.end ? ` <span class="muted">to</span> ${esc(e.end)}` : ''}</span></div></div>
          ${(() => { const v = window.DATA.venueOfEvent(e.id); const addr = e.address || (v && v.address); return v
            ? `<div class="info-row link" role="button" tabindex="0" data-act="location" aria-label="Open ${esc(e.venue)} on the map">${icon('house')}<div class="ir-content t-row" style="justify-content:space-between"><span><span class="venue-link">${esc(e.venue)}</span></span><span class="row muted" style="gap:4px;font-size:13px">${icon('map')}Map</span></div></div>${addr ? `<div class="info-row link" role="button" tabindex="0" data-act="location">${icon('pin')}<div class="ir-content t-row">${esc(addr)}</div></div>` : ''}`
            : `<div class="info-row">${icon('house')}<div class="ir-content t-row">${esc(e.venue)}</div></div>${addr ? `<div class="info-row">${icon('pin')}<div class="ir-content t-row">${esc(addr)}</div></div>` : ''}`; })()}
          <div class="info-row">${icon('repeat')}<div class="ir-content t-row" style="justify-content:space-between">Ticket resale available<button data-act="resale" aria-label="About resale">${icon('info')}</button></div></div>
        </div>
        <div class="section"><h2 class="t-heading-section">Description</h2>
          <div class="desc-wrap ${e.description.length < 240 ? 'open short' : ''}"><p class="desc t-body">${esc(e.description)}</p></div>
          ${e.description.length < 240 ? '' : `<button class="desc-toggle" data-act="desc" aria-label="Read more">${icon('chevronDown')}</button>`}
          ${e.copyNote ? '<p class="copy-note">Prototype copy based on the public Shotgun listing (read 21 Oct 2026).</p>' : ''}</div>
        ${t ? `<div class="section"><h2 class="t-heading-section">What to expect?</h2>
          <div class="player"><div class="track" data-track role="slider" aria-label="Preview position" aria-valuemin="0" aria-valuemax="30" tabindex="0"><span class="rail"></span><span class="fill"></span><span class="knob"></span></div><button class="play" data-act="play" aria-label="Play preview">${icon('playOutline')}</button></div>
          <div class="player-meta"><span data-time>0:00</span><span class="clamp-1" style="text-align:right;margin-left:12px">${PLAYER.synth ? `Generated preview · ${esc(t.genre)}` : `Preview: ${esc(t.artist)} – ${esc(t.title)} [NCS]`}</span></div>
          <p class="t-meta" style="font-size:12px;margin-top:4px">${PLAYER.synth ? 'Sound generated in the browser for this demo, not the lineup’s music.' : 'NCS track in a similar genre, not the lineup’s music.'}</p></div>` : ''}
        ${e.lineup ? `<div class="section"><h2 class="t-heading-section">Lineup</h2><div class="lineup">${e.lineup.map((a) => `<div class="artist"><span class="a-img">${artistArt(a)}${a.track ? playBtn(a.track, 'a-play') : ''}</span><span class="a-name">${esc(a.name)}${a.note ? `<span class="t-meta" style="display:block;font-size:13px">${esc(a.note)}</span>` : ''}</span></div>`).join('')}</div></div>` : ''}
        <div class="section"><h2 class="t-heading-section">Organized by</h2>${orgs.map((o) => `<div class="org"><span class="o-av">${artistArt({ seed: o.name.length })}</span><span class="o-text"><span class="o-name" style="display:block">${esc(o.name)}</span>${o.followers ? `<span class="t-meta" style="display:block" data-fcount="${esc(o.name)}">${(o.followers + (STORE.isFollowing(o.name) ? 1 : 0)).toLocaleString('en')} followers</span>` : ''}<span style="display:block;font-size:15px">${esc(o.line)}</span></span><button class="btn-small t-btn-sm ${STORE.isFollowing(o.name) ? 'on' : ''}" data-follow="${esc(o.name)}" data-base="${o.followers || 0}">${STORE.isFollowing(o.name) ? 'Following' : 'Follow'}</button></div>`).join('')}</div>
        ${e.genres.length ? `<div class="section"><h2 class="t-heading-section">Mood</h2><div class="mood">${e.genres.map((g) => `<span class="chip">${esc(g)}</span>`).join('')}</div></div>` : ''}
        <div class="section"><h2 class="t-heading-section">Location</h2><div class="loc-card" role="button" tabindex="0" data-act="location" aria-label="Open ${esc(e.venue)} on the map"><img class="map-img" src="assets/img/location-map.svg" alt="Illustrative map"><span class="loc-pill">${icon('map')}View on map</span></div></div>
      </div>
      <div class="buy-bar"><button class="btn-primary t-btn" data-act="buy">${e.price === 0 ? 'Get a free ticket' : `Now at ${euro(e.price)}`}</button></div>
    </section>`);
    function artistArt(a) { const hues = [['#7CFF4F', '#0e2a12'], ['#FE6E96', '#2a0b18'], ['#FBED0F', '#2a2805'], ['#E325E3', '#200826'], ['#F98436', '#2a1305'], ['#6ea8ff', '#0b1730']]; const c = hues[(a.seed || 0) % hues.length]; return `<span class="poster" style="width:100%;height:100%;border-radius:0;display:block"><span class="pz-bg" style="background:radial-gradient(60% 50% at 50% 38%, ${c[0]}aa, transparent 70%), radial-gradient(80% 45% at 50% 100%, ${c[0]}66, transparent 70%), ${c[1]}"></span></span>`; }
    const $ = (s) => el.querySelector(s);
    const hdr = $('.ev-header'); $('.scroll').addEventListener('scroll', (ev) => hdr.classList.toggle('solid', ev.target.scrollTop > 240), { passive: true });
    let unsub = null;
    if (t) {
      const fill = $('.fill'), knob = $('.knob'), tcur = $('[data-time]'), mainBtn = $('[data-act="play"]'), track = $('[data-track]');
      const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
      const paint = (p) => { const mine = p.current === t.id; const f = mine ? p.progress() : 0; fill.style.width = f * 100 + '%'; knob.style.left = f * 100 + '%'; tcur.textContent = fmt(mine ? p.el.currentTime : 0); mainBtn.innerHTML = icon(mine && !p.el.paused ? 'pause' : 'playOutline'); };
      unsub = PLAYER.on(paint); paint(PLAYER);
      const seekFrom = async (clientX) => { const r = track.getBoundingClientRect(); const f = (clientX - r.left) / r.width; if (PLAYER.current !== t.id) await PLAYER.play(t.id); PLAYER.seek(f); };
      track.addEventListener('pointerdown', (ev) => { track.setPointerCapture(ev.pointerId); seekFrom(ev.clientX); const mv = (m) => seekFrom(m.clientX); track.addEventListener('pointermove', mv); track.addEventListener('pointerup', () => track.removeEventListener('pointermove', mv), { once: true }); });
      track.addEventListener('keydown', (k) => { if (PLAYER.current !== t.id) return; if (k.key === 'ArrowRight') PLAYER.seek(PLAYER.progress() + 0.1); if (k.key === 'ArrowLeft') PLAYER.seek(PLAYER.progress() - 0.1); });
    }
    el.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-act]');
      if (a) {
        const act = a.dataset.act;
        if (act === 'back') nav.back();
        if (act === 'share') { pop(a); if (navigator.share) navigator.share({ title: e.title, text: `${e.title} · ${e.day}` }).catch(() => {}); else toast('Link copied'); }
        if (act === 'resale') toast('Can’t make it? Resell your ticket safely in the app.');
        if (act === 'desc') { $('.desc-wrap').classList.toggle('open'); }
        if (act === 'location') { const v = window.DATA.venueOfEvent(e.id); if (v) { PLAYER.pause(); nav.push('map', { venue: v.id, event: e.id }); } else toast(`${e.venue} is not on the prototype map (address not confirmed)`); }
        if (act === 'play' && t) { PLAYER.toggle(t.id); pop(a, 1.15); }
        if (act === 'buy') { PLAYER.pause(); nav.push('checkout', { id: e.id, match: params.match }); }
        return;
      }
      const it = ev.target.closest('[data-interest]');
      if (it) { const on = STORE.toggleInterested(e.id); it.classList.toggle('on', on); it.setAttribute('aria-pressed', on); pop(it.querySelector('.icon'), 1.4); if (on) { burst(it.querySelector('.icon')); toast('Saved to your interested events'); } return; }
      const fb = ev.target.closest('[data-follow]');
      if (fb) { const on = STORE.toggleFollowing(fb.dataset.follow); fb.classList.toggle('on', on); fb.textContent = on ? 'Following' : 'Follow'; pop(fb, 1.06); const c = el.querySelector(`[data-fcount="${CSS.escape(fb.dataset.follow)}"]`); if (c) c.textContent = (+fb.dataset.base + (on ? 1 : 0)).toLocaleString('en') + ' followers'; }
    });
    return { el, enter() { syncPreviews(); }, leave() { if (unsub) unsub(); PLAYER.pause(); } };
  };

  /* ---------- Checkout header tint from the event colour ---------- */
  const hexRgb = (hx) => [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  function coTint(e) {
    const a = hexRgb(e.accent || '#C9C46A'), k = [0, 0, 0], w = [246, 246, 244];
    const s0 = mix(a, k, 0.78), s1 = mix(a, k, 0.42), s2 = mix(a, w, 0.35), s3 = mix(a, w, 0.82);
    const css = (c) => `rgb(${c.join(',')})`;
    return { bg: `linear-gradient(180deg, ${css(s0)} 0%, ${css(s1)} 32%, ${css(s2)} 64%, ${css(s3)} 86%, #F6F6F4 100%)`, topLight: lum(s1) < 0.18, titleDark: lum(s2) > 0.25 };
  }
  const coHeadAttrs = (e) => { const t = coTint(e); return `class="co-head ${t.topLight ? 'dark-top' : ''}" style="background:${t.bg};--co-top:${t.topLight ? '#fff' : '#1B1B1B'};--co-title:${t.titleDark ? '#1B1B1B' : '#fff'}"`; };

  /* ---------- Checkout: tickets ---------- */
  SCREENS.checkout = (params) => {
    const e = byId(params.id); let qty = STORE.draftQty(e.id); let discount = params.discount || 0;
    const el = h(`<section class="co" aria-label="Tickets"><div class="scroll">
      <div ${coHeadAttrs(e)}><div class="row"><button class="circle-btn" data-act="back" aria-label="Back">${icon('chevronLeft')}</button><button class="code-link" data-act="code">I have a code</button></div><h1 class="co-title">Tickets</h1></div>
      <div class="co-card"><div class="row between"><div><div style="font-weight:500;font-size:19px">Standard</div><div style="font-size:16px">${priceLabel(e.price)}</div></div>
        <div class="qty"><button data-q="-1" aria-label="Remove one ticket">${icon('minus')}</button><span class="n" aria-live="polite">${qty}</span><button data-q="1" aria-label="Add one ticket">${icon('plus')}</button></div></div></div>
      <p class="t-meta" style="color:#555;font-size:13px;padding:14px 23px 0">${esc(e.title)} · ${esc(e.day)}</p>
    </div>
    <div class="co-foot"><p style="margin:0 0 6px" data-sel></p><div class="row between"><span class="co-total">Total</span><span class="co-total" data-total></span></div>
      <div class="row between" style="color:#555;font-size:16px;margin:2px 0 14px"><span>User service fees ${icon('info')}</span><span data-fees></span></div>
      <div data-disc class="row between" style="color:#2a8a2a;font-size:15px;margin:-8px 0 12px" hidden><span>Promo SOUNDMATCH</span><span>−10%</span></div>
      <button class="btn-dark" data-act="pay">Go to payment</button></div></section>`);
    el.querySelectorAll('.co-foot .icon').forEach((i) => { i.style.width = '14px'; i.style.height = '14px'; i.style.verticalAlign = '-2px'; });
    const $ = (s) => el.querySelector(s);
    const totals = () => { const sub = qty * e.price * (1 - discount); const fees = qty * e.price * window.DATA.FEE_RATE; return { sub, fees, total: sub + fees }; };
    const render = () => {
      const t = totals(); $('.qty .n').textContent = qty; $('[data-sel]').textContent = `${qty} ticket${qty === 1 ? '' : 's'} selected`;
      $('[data-total]').textContent = euro(t.total); $('[data-fees]').textContent = euro(t.fees);
      $('[data-q="-1"]').disabled = qty <= 0; $('[data-q="1"]').disabled = qty >= 6; $('[data-act="pay"]').disabled = qty === 0; $('[data-disc]').hidden = !discount;
    };
    render();
    el.addEventListener('click', (ev) => {
      const q = ev.target.closest('[data-q]'); if (q) { qty = Math.max(0, Math.min(6, qty + +q.dataset.q)); STORE.setDraftQty(e.id, qty); render(); pop($('.qty .n'), 1.3); return; }
      const a = ev.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'back') nav.back();
      if (a.dataset.act === 'pay') nav.push('review', { id: e.id, qty, discount, match: params.match });
      if (a.dataset.act === 'code') openPromo();
    });
    function openPromo() {
      openSheet(`<div class="grabber"></div><h4>Apply a promo code 🎁</h4><input class="field" placeholder="Promo code (e.g. PROMO987)" aria-label="Promo code" autocomplete="off"><p class="muted-sm" data-msg style="min-height:18px;margin:6px 0 10px">Tip for the demo: SOUNDMATCH</p><button class="btn-dark" data-apply disabled style="text-transform:uppercase">${icon('lock')} Apply coupon</button>`, (sheet) => {
        const inp = sheet.querySelector('input'), btn = sheet.querySelector('[data-apply]'), msg = sheet.querySelector('[data-msg]');
        btn.querySelector('.icon').style.cssText = 'width:16px;height:16px;display:inline-block;vertical-align:-3px;margin-right:6px';
        setTimeout(() => inp.focus(), 300);
        inp.addEventListener('input', () => { btn.disabled = !inp.value.trim(); msg.style.color = '#666'; });
        btn.addEventListener('click', () => {
          if (inp.value.trim().toUpperCase() === 'SOUNDMATCH') { discount = 0.1; render(); closeSheet(); toast('Promo applied: −10%'); }
          else { msg.textContent = 'This code isn’t valid for this event.'; msg.style.color = '#c0392b'; inp.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }
        });
      });
    }
    return { el, leave: closeSheet };
  };

  /* ---------- Checkout: review & pay ---------- */
  SCREENS.review = (params) => {
    const e = byId(params.id); const qty = params.qty; const discount = params.discount || 0;
    let method = { label: 'Google Pay', kind: 'gpay' }; let open = false;
    const sub = qty * e.price * (1 - discount), fees = qty * e.price * window.DATA.FEE_RATE, total = sub + fees;
    const el = h(`<section class="co" aria-label="Review and pay"><div class="scroll">
      <div ${coHeadAttrs(e)}><div class="row"><button class="circle-btn" data-act="back" aria-label="Back">${icon('chevronLeft')}</button></div><h1 class="co-title">Review &amp; pay</h1></div>
      <div class="co-card"><div class="item-card">${poster(e, 10)}<div style="flex:1;min-width:0"><div class="clamp-2" style="font-weight:500;font-size:17px">${esc(e.short)}</div><div style="font-size:15px">${qty} item${qty > 1 ? 's' : ''}</div></div><button class="circle-btn" style="background:none;color:#1B1B1B;border:1px solid #ccc;width:28px;height:28px" data-act="toggle" aria-label="Show details">${icon('chevronDown')}</button></div>
        <div class="item-detail" data-detail hidden><span>${qty}× &nbsp;Standard</span><span>${euro(qty * e.price)}</span></div></div>
      <div class="co-section"><h3>Pay with</h3><div class="pay-row"><span class="badge-pay" data-badge>G Pay</span><span data-method>Google Pay</span><button data-act="change">Change</button></div></div>
    </div>
    <div class="co-foot"><div class="row between" style="margin-bottom:10px"><span class="co-total">Total</span><span class="co-total">${euro(total)}</span></div>
      <button class="btn-gpay" data-act="buy">Buy with Google Pay</button>
      <p class="legal">By confirming your order, you agree to <b>Shotgun General Terms and Conditions</b> and <b>Privacy Policy</b></p>
      <p class="legal" style="color:#888;font-size:11px;margin-top:4px">Prototype: no payment is made.</p></div></section>`);
    const $ = (s) => el.querySelector(s);
    el.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'back') nav.back();
      if (a.dataset.act === 'toggle') { open = !open; $('[data-detail]').hidden = !open; a.querySelector('svg').style.transform = open ? 'rotate(180deg)' : ''; }
      if (a.dataset.act === 'change') openPay();
      if (a.dataset.act === 'buy') buy(a);
    });
    function openPay() {
      openSheet(`<div class="row between" style="margin-bottom:14px"><button data-close aria-label="Close" style="width:28px;height:28px">${icon('x')}</button><span class="muted-sm">Demo · nothing is charged or stored</span></div>
        <button class="btn-gpay" data-gpay>Pay with Google Pay</button>
        <button class="btn-link" data-linkpay>link <span style="font-weight:500">you@example.com</span></button>
        <p class="muted-sm" style="text-align:center;margin:16px 0 12px">— Or pay with a card —</p>
        <div class="row between" style="font-size:14px;margin-bottom:6px"><span>Card information</span><span class="row" style="gap:4px">${icon('camera')} Scan card</span></div>
        <input class="field" inputmode="numeric" placeholder="Card number" aria-label="Card number" data-num maxlength="19" autocomplete="off">
        <div class="field-group"><input class="field" placeholder="MM / YY" aria-label="Expiry" data-exp maxlength="7" autocomplete="off"><input class="field" placeholder="CVC" aria-label="CVC" data-cvc maxlength="4" autocomplete="off"></div>
        <p style="font-size:14px;margin:14px 0 6px">Billing address</p><select class="field" aria-label="Country"><option>France</option><option>Belgique</option><option>Schweiz</option><option>Colombia</option></select>
        <label class="row" style="gap:8px;font-size:14px;margin-top:12px;color:#555"><input type="checkbox"> Save payment details for future purchases</label>
        <button class="btn-dark" data-continue style="margin-top:18px;text-transform:none;font-weight:500">Continue</button>`, (sheet) => {
        sheet.querySelectorAll('.icon').forEach((i) => { i.style.width = '16px'; i.style.height = '16px'; });
        const num = sheet.querySelector('[data-num]'), exp = sheet.querySelector('[data-exp]');
        num.addEventListener('input', () => { num.value = num.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); });
        exp.addEventListener('input', () => { const d = exp.value.replace(/\D/g, '').slice(0, 4); exp.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; });
        sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
        sheet.querySelector('[data-gpay]').addEventListener('click', () => setMethod({ label: 'Google Pay', kind: 'gpay' }));
        sheet.querySelector('[data-linkpay]').addEventListener('click', () => setMethod({ label: 'Link', kind: 'link' }));
        sheet.querySelector('[data-continue]').addEventListener('click', () => {
          const digits = num.value.replace(/\D/g, '');
          if (digits.length < 12) { num.focus(); num.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); num.style.borderColor = '#c0392b'; return; }
          setMethod({ label: `Card •••• ${digits.slice(-4)}`, kind: 'card' }); // only the last 4 digits are kept, in memory
        });
      });
    }
    function setMethod(m) { method = m; $('[data-method]').textContent = m.label; $('[data-badge]').textContent = m.kind === 'gpay' ? 'G Pay' : m.kind === 'link' ? 'Link' : 'Card'; $('[data-act="buy"]').textContent = m.kind === 'gpay' ? 'Buy with Google Pay' : `Pay ${euro(total)}`; $('[data-act="buy"]').className = m.kind === 'gpay' ? 'btn-gpay' : 'btn-dark'; closeSheet(); pop($('.pay-row'), 1.03); }
    async function buy(btn) {
      btn.disabled = true; btn.innerHTML = '<span class="spin" style="display:inline-block;width:18px;height:18px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%"></span>';
      btn.querySelector('.spin').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 700, iterations: Infinity });
      await sleep(1300);
      const ticket = { id: 'T' + Date.now().toString(36).toUpperCase(), eventId: e.id, qty, total: Math.round(total * 100) / 100, method: method.label, at: new Date().toISOString(), match: params.match || null };
      STORE.addTicket(ticket);
      nav.stack = []; nav.show('success', { ticketId: ticket.id }, 'fade');
    }
    return { el, leave: closeSheet };
  };

  /* ---------- Success / ticket view ---------- */
  SCREENS.success = (params) => {
    const t = STORE.get().tickets.find((x) => x.id === params.ticketId); const e = byId(t.eventId);
    let seed = 0; for (const ch of t.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const cells = []; for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      let on; if (finder) { const fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y; on = fx === 0 || fy === 0 || fx === 6 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); }
      else { seed = (seed * 1103515245 + 12345) >>> 0; on = (seed >> 16) % 2 === 0; }
      cells.push(`<i class="${on ? '' : 'o'}"></i>`);
    }
    const el = h(`<section class="success" aria-label="Your ticket"><canvas class="confetti"></canvas><div class="scroll" style="position:relative;z-index:2;padding-bottom:30px">
      <div class="topbar" style="padding-top:6px"><button class="circle-btn" data-act="close" aria-label="Close">${icon(params.viewOnly ? 'chevronLeft' : 'x')}</button><span></span></div>
      <div class="pad" style="margin:14px 0 18px">${params.viewOnly ? '' : '<p class="t-btn-sm" style="color:#7CFF4F;margin:0 0 6px">Payment confirmed</p>'}<h1 class="t-title-event" style="font-size:26px">${params.viewOnly ? 'Your ticket' : 'You’re in!'}</h1></div>
      <div class="ticket"><div class="t-top">${poster(e, 30)}</div><div class="t-body">
        <div style="font-weight:500;font-size:18px">${esc(e.title)}</div>
        <div class="t-row"><span>Date</span><b>${esc(e.day)} · ${esc(e.time)}</b></div>
        <div class="t-row"><span>Venue</span><b>${esc(e.venue)}</b></div>
        <div class="t-row"><span>Tickets</span><b>${t.qty} × Standard</b></div>
        <div class="t-row"><span>Paid</span><b>${euro(t.total)} · ${esc(t.method)}</b></div>
        ${t.match ? `<div class="t-row"><span>Found with</span><b>Sound match</b></div>` : ''}
        <div class="qr" aria-label="Ticket QR code (demo)">${cells.join('')}</div>
        <p style="text-align:center;font-size:12px;color:#777;margin:8px 0 0">${t.id} · demo ticket, not valid for entry</p></div></div>
      <div class="pad" style="margin-top:20px;display:grid;gap:10px">${params.viewOnly ? '' : `<button class="btn-primary t-btn" data-act="tickets">View in Tickets</button>`}<button class="chip" style="justify-content:center" data-act="event">Event page</button></div>
    </div></section>`);
    el.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'close') { if (params.viewOnly) nav.back(); else nav.tab('tickets'); }
      if (a.dataset.act === 'tickets') nav.tab('tickets');
      if (a.dataset.act === 'event') nav.push('event', { id: e.id });
    });
    let raf = 0;
    return {
      el,
      enter() {
        if (params.viewOnly) return;
        const cv = el.querySelector('.confetti'); const g = cv.getContext('2d'); const W = cv.width = el.clientWidth, H = cv.height = el.clientHeight;
        const cols = ['#7CFF4F', '#FBED0F', '#F98436', '#FE6E96', '#E325E3'];
        const ps = Array.from({ length: 120 }, () => ({ x: W / 2, y: H * 0.3, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3, r: Math.random() * Math.PI, c: cols[(Math.random() * 5) | 0], s: 4 + Math.random() * 5 }));
        const t0 = performance.now();
        const loop = (now) => { g.clearRect(0, 0, W, H); ps.forEach((p) => { p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.r += 0.1; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }); if (now - t0 < 3500) raf = requestAnimationFrame(loop); else g.clearRect(0, 0, W, H); };
        raf = requestAnimationFrame(loop);
        const tk = el.querySelector('.ticket'); tk.animate([{ transform: 'translateY(40px) rotateX(20deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
      },
      leave() { cancelAnimationFrame(raf); },
    };
  };

  /* ---------------- preview buttons (global) ---------------- */
  function syncPreviews() {
    device.querySelectorAll('[data-preview]').forEach((b) => {
      const id = b.dataset.preview; const on = PLAYER.isPlaying(id); const mine = PLAYER.current === id;
      b.classList.toggle('playing', on); b.style.setProperty('--p', mine ? PLAYER.progress() : 0);
      const pi = b.querySelector('.pi'); const want = on ? 'pause' : 'play'; if (pi && pi.dataset.icon !== want) { pi.innerHTML = icon(want); pi.dataset.icon = want; }
      b.setAttribute('aria-label', on ? 'Pause preview' : 'Play preview');
    });
  }
  PLAYER.on(syncPreviews);
  PLAYER.setMuted(STORE.isMuted());
  const syncMute = () => device.querySelectorAll('[data-mute]').forEach((b) => { b.classList.toggle('on', PLAYER.muted); b.setAttribute('aria-pressed', PLAYER.muted); b.setAttribute('aria-label', PLAYER.muted ? 'Unmute' : 'Mute'); b.innerHTML = icon(PLAYER.muted ? 'volumeX' : 'volume'); });
  device.addEventListener('click', (e) => { const b = e.target.closest('[data-mute]'); if (!b) return; e.stopPropagation(); PLAYER.setMuted(!PLAYER.muted); STORE.setMuted(PLAYER.muted); syncMute(); pop(b, 1.12); toast(PLAYER.muted ? 'Sound off' : 'Sound on'); }, true);
  window.addEventListener('player-missing', (ev) => { const f = ev.detail.tried[0]; toast(`Audio file not found: add “${f.split('/').pop()}” to assets/audio`); });
  device.addEventListener('click', (e) => { const b = e.target.closest('[data-preview]'); if (!b) return; e.stopPropagation(); e.preventDefault(); PLAYER.toggle(b.dataset.preview); pop(b, 1.12); }, true);

  /* ---------------- poster title fitting ---------------- */
  function fitTitles(root) {
    root.querySelectorAll('.pz-title:not([data-fit])').forEach((t) => {
      const box = t.parentElement; if (!box.clientWidth) return;
      let fs = parseFloat(getComputedStyle(t).fontSize); let guard = 0;
      while ((t.scrollWidth > t.clientWidth + 1 || t.offsetHeight > box.clientHeight * 0.6) && fs > 5 && guard++ < 60) { fs -= 1; t.style.fontSize = fs + 'px'; }
      t.dataset.fit = '1';
    });
  }
  let fitQueued = false;
  const queueFit = () => { if (fitQueued) return; fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fitTitles(device); }); };
  new MutationObserver(queueFit).observe(device, { childList: true, subtree: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { device.querySelectorAll('.pz-title[data-fit]').forEach((t) => { t.removeAttribute('data-fit'); t.style.fontSize = ''; }); queueFit(); });

  /* ---------------- boot ---------------- */
  const clock = () => { const d = new Date(); document.getElementById('sbTime').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  clock(); setInterval(clock, 20000);
  document.getElementById('resetDemo').addEventListener('click', () => { STORE.reset(); location.reload(); });
  // deep links for testing: index.html#screen=search
  const hp = new URLSearchParams(location.hash.slice(1));
  const start = hp.get('screen');
  if (start && SCREENS[start]) { if (!TAB_SCREENS.includes(start)) nav.stack = [{ name: 'search', params: {} }]; nav.show(start, Object.fromEntries(hp.entries()), 'none'); }
  else nav.show('foryou', {}, 'none');
  window.NAV = nav;
})();
