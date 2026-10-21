/* Content for the prototype.
   - Filler events: real listings on shotgun.live (Paris techno/house pages and Rex Club venue page),
     read on 21 Oct 2026. Titles, dates, times, venues, prices and genres as shown there.
     Posters are generated artwork, not the real posters.
   - "nightdrive" is FICTIONAL: the concept's sound-match result. */
(function () {
  const G = {
    lime: '#7CFF4F', yellow: '#FBED0F', orange: '#F98436', pink: '#FE6E96', magenta: '#E325E3', coral: '#F16C3F', violet: '#7B4DFF', ink: '#111111'
  };
  const grad = (a, b, c) => `radial-gradient(120% 80% at 20% 15%, ${a} 0%, transparent 60%), radial-gradient(110% 90% at 85% 80%, ${b} 0%, transparent 62%), ${c}`;

  const SRC_REX = 'https://shotgun.live/en/venues/rex-club';
  const SRC_TECHNO = 'https://shotgun.live/en/cities/paris/techno';

  const events = [
    { id: 'nightdrive', accent: '#3D6FE0', track: 'o_halcyon', fictional: true,
      title: 'Nightdrive: Melodic House & Indie Dance', short: 'Nightdrive',
      organizer: 'Nightdrive Collective', day: 'Sat 14 Nov', date: '2026-11-14', time: '11:00 PM', end: '5:00 AM',
      venue: 'La Serre Électrique', address: 'Quai de la Loire, 75019 Paris, France',
      price: 18.00, genres: ['Melodic House', 'Indie Dance', 'Synthwave'],
      lineup: [{ name: 'Lumen Coast', note: 'live', seed: 3, track: 'virtuallove' }, { name: 'Marin Vale', seed: 7, track: 'g_desire' }],
      organizers: [{ name: 'Nightdrive Collective', followers: 1240, line: '6 events' }, { name: 'La Serre Électrique', followers: 3810, line: 'Venue' }],
      description: 'A night for songs that sit between nostalgia and the dancefloor: warm analogue synths, vocal hooks and steady four-to-the-floor grooves. Lumen Coast plays live with drum machines and a synth wall, then Marin Vale takes the decks until close with melodic house and indie dance. Expect a slow build from 118 to 124 BPM, a terrace for breaks and a crowd that comes to listen as much as to dance. This event is fictional: it was created for the Sound Match concept prototype.',
      poster: { cls: 'nightdrive', label: 'Nightdrive' }, preview: { bpm: 120, root: 45, mood: 'warm' } },

    { id: 'because', accent: '#FBED0F', description: "Because Music and Rex Club take over Radio Radio for an early-evening session with Busy P, Chloé, Miley Serious and more names on the bill. Doors open at 8 PM, which makes it one of the rare weeknight parties you can catch straight after work. Expect a bill that moves between techno, house and electro, each DJ bringing a different energy to the booth. Arrive early if you want a good spot near the decks.", copyNote: true, track: 'allbefore', title: 'Because Music X Rex Club: Busy P, Chloé, Miley Serious & More', short: 'Because Music',
      organizer: 'Rex Club', day: 'Wed 21 Oct', date: '2026-10-21', time: '8:00 PM', venue: 'Radio Radio', price: 21.79,
      genres: ['Techno', 'House', 'Electro'], source: SRC_REX,
      poster: { bg: grad(G.yellow, G.orange, '#1a1a1a'), ink: '#111', label: 'Busy P · Chloé · Miley Serious' } },
    { id: 'resurrection', accent: '#D61F1F', description: "Resurrection is back at Rex Club with Vinka Wydro b2b Highvoltage and more. Hard techno and industrial from midnight.", copyNote: true, track: 'recall', title: 'Resurrection Rebirth: Vinka Wydro B2b Highvoltage & More', short: 'Resurrection',
      organizer: 'Rex Club', day: 'Wed 21 Oct', date: '2026-10-21', time: '11:59 PM', venue: 'Rex Club', price: 8.80,
      genres: ['Techno', 'Industrial', 'Hard Techno'], more: 1, source: SRC_REX,
      poster: { bg: 'linear-gradient(160deg,#f2f2f2 0%,#f2f2f2 55%,#d61f1f 55%,#d61f1f 62%,#f2f2f2 62%)', ink: '#111', label: 'Resurrection Rebirth' } },
    { id: 'guygerber', accent: '#E325E3', description: "Guy Gerber, Hen Yanni and Niv Yefet on the decks, with Noémie playing live, in the intimate rooms of Silencio Club. A Thursday night of electro, house and techno.", copyNote: true, track: 'kyoto', title: 'Guy Gerber, Hen Yanni, Noémie (Live), Niv Yefet', short: 'Guy Gerber',
      organizer: 'Silencio Club', day: 'Thu 22 Oct', date: '2026-10-22', time: '11:00 PM', venue: 'Silencio Club', price: 20.00,
      genres: ['Electro', 'House', 'Techno'], more: 1, source: SRC_TECHNO,
      poster: { bg: grad(G.magenta, G.violet, '#0d0716'), ink: '#fff', label: 'Guy Gerber' } },
    { id: 'fightclub', accent: '#7CFF4F', description: "Boticka, Dewilde, Luke Noize. Hard techno, industrial, gabber. No breaks.", copyNote: true, track: 'recall', title: 'Fightclub Techno: Boticka, Dewilde, Luke Noize', short: 'Fightclub Techno',
      organizer: 'Rex Club', day: 'Thu 22 Oct', date: '2026-10-22', time: '11:59 PM', venue: 'Rex Club', price: 9.80,
      genres: ['Hard Techno', 'Industrial', 'Gabber'], source: SRC_REX,
      poster: { bg: 'linear-gradient(180deg,#0b0b0b,#2b2b2b)', ink: G.lime, label: 'Fightclub Techno' } },
    { id: 'belrecords', accent: '#F98436', description: "59 Bel Records hosts Vosse and Sarima at La Gare / Le Gore, the club below the former railway station by the Canal de l'Ourcq. A techno night that starts at midnight and takes its time.", copyNote: true, track: 'z_feelit', title: '59 Bel Records W/ Vosse & Sarima 22/10/26', short: '59 Bel Records',
      organizer: 'La Gare / Le Gore', day: 'Thu 22 Oct', date: '2026-10-22', time: '11:59 PM', venue: 'La Gare / Le Gore', price: 10.99,
      genres: ['Techno'], source: SRC_TECHNO,
      poster: { bg: grad(G.orange, G.coral, '#2a0f06'), ink: '#fff', label: 'Vosse & Sarima' } },
    { id: 'ravexperience', accent: '#7CFF4F', description: "Discovery presents Ravexperience at Studio 56: techno, hard techno and trance until late.", copyNote: true, track: 'ineedanangel', title: 'Discovery Présente : Ravexperience', short: 'Ravexperience',
      organizer: 'STUDIO 56 PARIS', day: 'Thu 22 Oct', date: '2026-10-22', time: '11:59 PM', venue: 'STUDIO 56 PARIS', price: 7.99,
      genres: ['Techno', 'Hard Techno', 'Trance'], more: 2, source: SRC_TECHNO,
      poster: { bg: grad(G.lime, G.yellow, '#07160a'), ink: '#0b0b0b', label: 'Ravexperience' } },
    { id: 'sama', accent: '#FE6E96', description: "Rex Club gives the whole night to Sama' Abdulhadi. An all-night-long set means one DJ from opening to closing: time to build slowly, take detours and bring the room somewhere it would not reach in a two-hour slot. Expect techno throughout, with the long arc that only this format allows. Come early to hear the warm-up; it is part of the story.", copyNote: true, track: 'z_feelit', title: "Rex Club Presents: Sama' Abdulhadi All Night Long", short: "Sama' Abdulhadi",
      organizer: 'Rex Club', day: 'Fri 23 Oct', date: '2026-10-23', time: '11:59 PM', venue: 'Rex Club', price: 22.80,
      genres: ['Techno'], source: SRC_REX,
      poster: { bg: grad(G.pink, G.magenta, '#14040e'), ink: '#fff', label: "Sama' Abdulhadi" } },
    { id: 'houseofgroove', accent: '#FBED0F', description: "House Of Groove invites Dan Ghenacia and Melody for a night of deep, micro and tech house. Groove first, all night.", copyNote: true, track: 'firedup', title: 'House Of Groove Invite: Dan Ghenacia, Melody', short: 'House Of Groove',
      organizer: 'Rex Club', day: 'Sat 24 Oct', date: '2026-10-24', time: '11:59 PM', venue: 'Rex Club', price: 15.80,
      genres: ['Deep House', 'Micro House', 'Tech House'], more: 2, source: SRC_REX,
      poster: { bg: grad(G.yellow, G.lime, '#101005'), ink: '#111', label: 'House of Groove' } },
    { id: 'legends', accent: '#F98436', description: "Legends brings Moodymann, Jovonn and Dj Deep to Rex Club on a Sunday night: three names tied to the history of house and techno, sharing one booth. Sunday parties have their own pace, with fewer people checking the time and more people dancing. If you only go out once this month, this is a strong candidate.", copyNote: true, track: 'defect', title: 'Legends: Moodymann, Jovonn, Dj Deep', short: 'Legends',
      organizer: 'Rex Club', day: 'Sun 25 Oct', date: '2026-10-25', time: '11:59 PM', venue: 'Rex Club', price: 36.80,
      genres: ['Techno', 'House'], source: SRC_REX,
      poster: { bg: grad(G.orange, G.magenta, '#120808'), ink: '#fff', label: 'Moodymann · Jovonn · Dj Deep' } },
    { id: 'antal', accent: '#F16C3F', description: "Antal all night long: house, disco and deep house.", copyNote: true, track: 'g_desire', title: 'Rex Club Presents: Antal All Night Long', short: 'Antal',
      organizer: 'Rex Club', day: 'Sat 7 Nov', date: '2026-11-07', time: '11:59 PM', venue: 'Rex Club', price: 15.80,
      genres: ['House', 'Disco', 'Deep House'], source: SRC_REX,
      poster: { bg: grad(G.coral, G.yellow, '#1d0d05'), ink: '#fff', label: 'Antal' } },
    { id: 'hunee', accent: '#7B4DFF', description: "Hunee plays Hunchin' all night long at Rex Club: a long night of house, disco and disco house for a crowd that came to dance.", copyNote: true, track: 'virtuallove', title: "Rex Club Presents Hunee - Hunchin' All Night Long", short: 'Hunee',
      organizer: 'Rex Club', day: 'Fri 20 Nov', date: '2026-11-20', time: '11:59 PM', venue: 'Rex Club', price: 15.80,
      genres: ['House', 'Disco', 'Disco House'], source: SRC_REX,
      poster: { bg: grad(G.violet, G.pink, '#0a0716'), ink: '#fff', label: 'Hunee' } },

    /* Added 21 Oct 2026 (15:40): more clubs for the map. Real listings on shotgun.live venue pages read that day. */
    { id: 'chronologic', track: 'allbefore', accent: '#FE6E96', title: "Chronologic + We Are The 90's", short: 'Chronologic',
      organizer: 'La Machine du Moulin Rouge', day: 'Fri 23 Oct', date: '2026-10-23', time: '11:59 PM', venue: 'La Machine du Moulin Rouge', price: 22.40,
      genres: [], source: 'https://shotgun.live/en/venues/la-machine-du-moulin-rouge', copyNote: true,
      description: "Chronologic and We Are The 90's share the night at La Machine du Moulin Rouge, next to the Moulin Rouge on Boulevard de Clichy.",
      poster: { bg: grad(G.pink, G.yellow, '#1a0710'), ink: '#fff', label: "We Are The 90's" } },
    { id: 'vasopression', track: 'firedup', accent: '#7CFF4F', title: 'Vasopression', short: 'Vasopression',
      organizer: 'Panic Room', day: 'Wed 21 Oct', date: '2026-10-21', time: '7:00 PM', venue: 'Panic Room', price: 0,
      genres: ['Deep House', 'Tech House', 'Acid House'], more: 1, source: 'https://shotgun.live/en/venues/panic-room', copyNote: true,
      description: 'A free midweek session at Panic Room: deep house, tech house and acid house from 7 PM. Good for an after-work drink that turns into dancing.',
      poster: { bg: grad(G.lime, G.violet, '#08140a'), ink: '#fff', label: 'Vasopression' } },
    { id: 'mirabelle', track: 'defect', accent: '#FBED0F', title: 'Mirabelle Club', short: 'Mirabelle Club',
      organizer: 'Panic Room', day: 'Thu 22 Oct', date: '2026-10-22', time: '7:00 PM', venue: 'Panic Room', price: 0,
      genres: ['House', 'Hard Groove'], source: 'https://shotgun.live/en/venues/panic-room', copyNote: true,
      description: 'Mirabelle Club: house and hard groove, free entry.',
      poster: { bg: grad(G.yellow, G.orange, '#191103'), ink: '#111', label: 'Mirabelle Club' } },
    { id: 'inaerem', track: 'z_feelit', accent: '#F98436', title: 'In Aerem Take Over Point Éphémère', short: 'In Aerem',
      organizer: 'Point Éphémère', day: 'Fri 23 Oct', date: '2026-10-23', time: '10:00 PM', venue: 'Point Éphémère', price: 0,
      genres: ['Tech House', 'House', 'Minimal House'], source: 'https://shotgun.live/en/venues/point-ephemere', copyNote: true,
      description: "In Aerem takes over Point Éphémère on the banks of the Canal Saint-Martin for a free Friday night. Tech house, house and minimal house from 10 PM: the kind of night where the canal-side terrace and the dancefloor trade people all evening. Entry is free, so expect it to fill up; arriving before midnight is the safe bet.",
      poster: { bg: grad(G.orange, G.pink, '#1c0b05'), ink: '#fff', label: 'In Aerem' } },
    { id: 'loveintheendz', track: 'recall', accent: '#E325E3', title: '5 Years Of Love In The Endz', short: 'Love In The Endz',
      organizer: 'Point Éphémère', day: 'Sat 24 Oct', date: '2026-10-24', time: '11:59 PM', venue: 'Point Éphémère', price: 13.20,
      genres: ['Bass', 'Latin', 'Techno'], source: 'https://shotgun.live/en/venues/point-ephemere', copyNote: true,
      description: 'Love In The Endz celebrates five years with a night of bass, latin and techno at Point Éphémère.',
      poster: { bg: grad(G.magenta, G.lime, '#13041a'), ink: '#fff', label: '5 Years of Love in the Endz' } },
    { id: 'freakshow', track: 'ineedanangel', accent: '#7B4DFF', title: 'La Scarlette X Stargurlrituals : The Freakshow', short: 'The Freakshow',
      organizer: 'Point Éphémère', day: 'Fri 30 Oct', date: '2026-10-30', time: '11:00 PM', venue: 'Point Éphémère', price: 16.50,
      genres: ['Techno', 'Trance'], source: 'https://shotgun.live/en/venues/point-ephemere', copyNote: true,
      description: 'La Scarlette and Stargurlrituals host The Freakshow the night before Halloween. Techno and trance, costumes encouraged.',
      poster: { bg: grad(G.violet, G.magenta, '#0b0618'), ink: '#fff', label: 'The Freakshow' } },
    { id: 'gasolina', track: 'allbefore', accent: '#2FA7FF', title: 'Jetlag : Gasolina Vol.23', short: 'Gasolina Vol.23',
      organizer: 'Petit Bain', day: 'Fri 23 Oct', date: '2026-10-23', time: '11:59 PM', venue: 'Petit Bain', price: 21.00,
      genres: ['Reggaeton'], source: 'https://shotgun.live/en/venues/petit-bain', copyNote: true,
      description: 'Jetlag brings Gasolina back for a 23rd volume on Petit Bain, the boat moored on the Seine by the Bibliothèque François-Mitterrand. A full night of reggaeton, from the classics everyone knows the words to, to the new releases. If the queue on the quay looks long, it moves.',
      poster: { bg: 'linear-gradient(160deg,#2FA7FF 0%,#6f3cff 60%,#13063a 100%)', ink: '#fff', label: 'Gasolina Vol.23' } },
    { id: 'afteroclock1', track: 'recall', accent: '#FBED0F', title: "After O'clock X La Plage Open Air: Litoshka, Casimir & More", short: "After O'clock",
      organizer: 'Glazart', day: 'Sat 24 Oct', date: '2026-10-24', time: '6:00 AM', venue: 'Glazart', price: 9.50,
      genres: ['Techno'], source: 'https://shotgun.live/en/venues/glazart', copyNote: true,
      description: "After O'clock picks up where the night ends: an open-air techno after-party at Glazart's La Plage from 6 AM, with Litoshka, Casimir and more.",
      poster: { bg: grad(G.yellow, G.coral, '#120c02'), ink: '#111', label: "After O'clock" } },
    { id: 'afteroclock2', track: 'z_feelit', accent: '#F16C3F', title: "After O'clock X La Plage Open Air: Lunr, Kheli & More", short: "After O'clock",
      organizer: 'Glazart', day: 'Sun 25 Oct', date: '2026-10-25', time: '6:00 AM', venue: 'Glazart', price: 9.50,
      genres: ['Techno'], source: 'https://shotgun.live/en/venues/glazart', copyNote: true,
      description: "Sunday-morning techno at La Plage with Lunr, Kheli and more.",
      poster: { bg: grad(G.coral, G.magenta, '#160705'), ink: '#fff', label: 'Lunr · Kheli' } },
    { id: 'midweek33', track: 'recall', accent: '#7CFF4F', title: 'Midweek Techno 33', short: 'Midweek Techno 33',
      organizer: 'Monkey Pigalle', day: 'Wed 21 Oct', date: '2026-10-21', time: '9:00 PM', venue: 'Monkey Pigalle', price: 0,
      genres: ['Techno', 'Minimal House', 'Hardcore'], more: 1, source: 'https://shotgun.live/en/venues/monkey-pigalle', copyNote: true,
      description: 'Free techno in Pigalle every Wednesday. Number 33 goes from minimal house to hardcore.',
      poster: { bg: 'linear-gradient(180deg,#0b0b0b,#1f1f1f)', ink: G.lime, label: 'Midweek Techno 33' } },
    { id: 'midweek34', track: 'g_desire', accent: '#7CFF4F', title: 'Midweek Techno 34', short: 'Midweek Techno 34',
      organizer: 'Monkey Pigalle', day: 'Wed 28 Oct', date: '2026-10-28', time: '9:00 PM', venue: 'Monkey Pigalle', price: 0,
      genres: ['Techno', 'House', 'Melodic House & Techno'], more: 3, source: 'https://shotgun.live/en/venues/monkey-pigalle', copyNote: true,
      description: 'Midweek Techno 34 at Monkey Pigalle: techno, house and melodic house & techno, free entry.',
      poster: { bg: 'linear-gradient(180deg,#0b0b0b,#232323)', ink: G.yellow, label: 'Midweek Techno 34' } },
  ];

  /* Song catalogue for "Select a song" (as shown in Andres's Search Audio 01 B screen). */
  const songs = [
    { id: 's1', title: 'Leave It Alone', artist: 'Vandelux, Tyler Mann', cover: ['#0e1a33', '#5b8cff'], srcs: ['assets/audio/leaveitalone.mp4', 'assets/audio/leaveitalone.mp3'], start: 50 },
    { id: 's2', title: 'Leave It All Behind', artist: 'Cult to Follow', cover: ['#2a0b0b', '#ff5a3c'] },
    { id: 's3', title: 'Leave It All to Me', artist: 'Miranda Cosgrove, Drake Bell', cover: ['#2b1a35', '#ff7ac8'] },
    { id: 's4', title: 'Leave it Alone', artist: 'Broken Bells, Danger Mouse, James Mercer', cover: ['#13241a', '#9be15d'] },
  ];

  /* NCS tracks: 30-second excerpts, used only inside this unpublished class prototype.
     Credit format follows NCS: Artist - Title [NCS Release], Music provided by NoCopyrightSounds. */
  const tracks = [
    { id: 'kyoto', title: 'KYOTO', artist: 'Hester', genre: 'Progressive House', slug: 'kyoto' },
    { id: 'virtuallove', title: 'virtual love 2001', artist: 'LÖVI', genre: 'House', slug: 'virtuallove' },
    { id: 'recall', title: 'Recall', artist: 'gabriawll', genre: 'Electro', slug: 'Recall' },
    { id: 'g_desire', title: 'Desire', artist: 'gabriawll, Ada Petcu', genre: 'House', slug: 'g_desire' },
    { id: 'z_feelit', title: 'Feel It', artist: 'Zack Griffin', genre: 'Tech House', slug: 'z_feelit' },
    { id: 'o_halcyon', title: 'halcyon', artist: 'onte', genre: 'House', slug: 'o_halcyon' },
    { id: 'firedup', title: 'fired up', artist: 'jonty', genre: 'Deep House', slug: 'FiredUp' },
    { id: 'ineedanangel', title: 'I Need An Angel', artist: 'Hester', genre: 'Trance', slug: 'ineedanangel' },
    { id: 'allbefore', title: 'ALL BEFORE', artist: 'DJ PUMA', genre: 'Garage', slug: 'allbefore' },
    { id: 'defect', title: 'Defect', artist: 'Reece Rosé', genre: 'House', slug: 'Defect' },
  ].map((t) => Object.assign(t, { src: `assets/audio/${t.id}.mp3`, cover: `assets/covers/${t.id}.jpg`, url: `https://ncs.io/${t.slug}` }));
  // Added by Andres (full track in assets/audio)
  tracks.push({ id: 'nowayback', title: 'No Way Back', artist: 'Custody, Just Isac, MADZI, SFRNG', genre: 'Electronic', src: encodeURI('assets/audio/Custody, Just Isac, MADZI, SFRNG - No Way Back [NCS Release].mp3'), cover: null, url: 'https://ncs.io/', start: 60 });

  /* Venues on the 3D map. Addresses from public listings; coordinates approximate.
     Radio Radio is not placed (address not confirmed). La Serre Électrique is fictional. */
  const venues = [
    { id: 'rex', name: 'Rex Club', address: '5 Bd Poissonnière, 75002 Paris', lat: 48.8707, lon: 2.3475, color: 'yellow', events: ['resurrection', 'fightclub', 'sama', 'houseofgroove', 'legends', 'antal', 'hunee'] },
    { id: 'silencio', name: 'Silencio Club', address: '142 Rue Montmartre, 75002 Paris', lat: 48.8686, lon: 2.3433, color: 'magenta', events: ['guygerber'] },
    { id: 'studio56', name: 'Studio 56', address: '56 Rue de la Fontaine au Roi, 75011 Paris', lat: 48.8691, lon: 2.3728, color: 'lime', events: ['ravexperience'] },
    { id: 'lagare', name: 'La Gare / Le Gore', address: '1 Av. Corentin Cariou, 75019 Paris', lat: 48.8946, lon: 2.3858, color: 'orange', events: ['belrecords'] },
    { id: 'machine', name: 'La Machine du Moulin Rouge', address: '90 Bd de Clichy, 75018 Paris', lat: 48.8841, lon: 2.3322, color: 'pink', events: ['chronologic'] },
    { id: 'panic', name: 'Panic Room', address: '101 Rue Amelot, 75011 Paris', lat: 48.8615, lon: 2.3667, color: 'lime', events: ['vasopression', 'mirabelle'] },
    { id: 'pointeph', name: 'Point Éphémère', address: '200 Quai de Valmy, 75010 Paris', lat: 48.8818, lon: 2.3686, color: 'orange', events: ['inaerem', 'loveintheendz', 'freakshow'] },
    { id: 'petitbain', name: 'Petit Bain', address: '7 Port de la Gare, 75013 Paris', lat: 48.8357, lon: 2.3768, color: 'magenta', events: ['gasolina'] },
    { id: 'glazart', name: 'Glazart', address: '7-15 Av. de la Porte de la Villette, 75019 Paris', lat: 48.8977, lon: 2.3872, color: 'yellow', events: ['afteroclock1', 'afteroclock2'] },
    { id: 'monkey', name: 'Monkey Pigalle', address: '53 Rue Jean-Baptiste Pigalle, 75009 Paris', lat: 48.8812, lon: 2.3373, color: 'lime', events: ['midweek33', 'midweek34'] },
    { id: 'serre', name: 'La Serre Électrique', address: 'Quai de la Loire, 75019 Paris (fictional)', lat: 48.8862, lon: 2.3722, color: 'pink', events: ['nightdrive'], fictional: true },
  ];

  window.DATA = {
    events, songs, tracks, venues, G,
    trackById: (id) => tracks.find((t) => t.id === id),
    playableById: (id) => tracks.find((t) => t.id === id) || songs.find((x) => x.id === id && x.srcs),
    venueOfEvent: (eid) => venues.find((v) => v.events.includes(eid)) || null,
    byId: (id) => events.find((e) => e.id === id),
    MATCH_EVENT: 'nightdrive',
    MIC_RECOGNISED: 's1',
    FEE_RATE: 0.05,
  };
})();
