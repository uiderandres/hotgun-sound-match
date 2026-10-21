/* Persistent inputs (localStorage, wrapped so the app still works when storage is blocked). */
(function () {
  const KEY = 'sg-soundmatch-v1';
  const blank = () => ({ tickets: [], interested: [], following: [], recentSongs: [], lastQuery: '', draftQty: {}, mapFilters: { saved: false, genres: [] }, muted: false });
  let mem = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) mem = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ } };
  const toggleIn = (list, id) => { const i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); save(); return i < 0; };

  window.STORE = {
    get: () => mem,
    isInterested: (id) => mem.interested.includes(id),
    toggleInterested: (id) => toggleIn(mem.interested, id),
    isFollowing: (name) => mem.following.includes(name),
    toggleFollowing: (name) => toggleIn(mem.following, name),
    addRecentSong: (songId) => { mem.recentSongs = [songId, ...mem.recentSongs.filter((s) => s !== songId)].slice(0, 4); save(); },
    setLastQuery: (q) => { mem.lastQuery = q; save(); },
    setDraftQty: (eventId, n) => { mem.draftQty[eventId] = n; save(); },
    draftQty: (eventId) => mem.draftQty[eventId] || 1,
    addTicket: (t) => { mem.tickets.unshift(t); delete mem.draftQty[t.eventId]; save(); },
    getMapFilters: () => Object.assign({ saved: false, genres: [] }, mem.mapFilters),
    setMapFilters: (f) => { mem.mapFilters = f; save(); },
    isMuted: () => !!mem.muted,
    setMuted: (m) => { mem.muted = !!m; save(); },
    reset: () => { mem = blank(); save(); },
  };
})();
