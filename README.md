# Shotgun · Sound Match — vibe-coded prototype

Student concept for ESD M2 “Prototypage avancé” (Andres Martinez). Not affiliated with Shotgun.

## Open it
- **Live:** https://uiderandres.github.io/hotgun-sound-match/ (same files as this folder; HTTPS, so the microphone works on a phone).
- **Video of the flow (79 s, no sound):** https://uiderandres.github.io/hotgun-sound-match/demo/ (`demo/sound-match-demo.mp4`, `demo/sound-match-demo.gif`).
- **Mac:** double-click `Abrir prototipo.command`. It starts a small local server (`python3 serve.py`, a small server with audio seeking) and opens `http://localhost:8765`. The microphone needs `localhost` or HTTPS in most browsers.
- **Any computer with Python:** run `python3 serve.py` in this folder and open `http://localhost:8765`.
- **Without a server:** opening `index.html` directly works too; if the browser blocks the microphone, “Listen audio” switches to a simulated input and says so on screen.
- Best in Chrome. On a laptop the app shows inside a phone frame; on a phone it fills the screen.
- “Reset demo data” (top-right corner, on a computer) clears saved tickets, hearts and follows.

## Flow
For you → tab bar → **Search** → three entries at the top:
1. **Search field**: filters “Events for you” as you type.
2. **Map**: interactive 3D map (three.js) of a stylised Paris (Seine, canal, boulevards, city blocks) with five club buildings in the Shotgun colours. Drag to move, pinch or scroll to zoom, tap a building or its label: the camera flies to it and a card lists the club's events. Each event has a ▶ preview (an NCS track); while it plays the building pulses and sends sound rings on the beat. **Today** and **Filters** (music genres, “Save my filters for later”) hide clubs with no matching event. Tap an event card to open its page.
3. **Listen**: particle wave screen with two options:
   - **Song name, artist**: type (e.g. “leave it al”), pick *Leave It Alone — Vandelux, Tyler Mann*.
   - **Listen audio**: real microphone; particles react to the sound; the song is recognised as *Leave It Alone* (scripted).
   - **NCS library**: 10 playable tracks (30-second previews). Tap ▶ to listen, tap the row to match it: the track plays during the search and the particles react to the real audio; the result is the event that uses a similar track.
   Both run the matching animation: pulse wave → listener with headphones → second listener (profile) → crowd → result card.
Result card → event page (with “94% sound match” explanation, “What to expect?” sample songs, lineup previews) → **Now at €18.00** → Tickets → (I have a code) → Review & pay → (Change: Google Pay / Link / card sheet) → Buy → ticket with QR → **Tickets** tab.

## What is real and what is not
- **Real:** the filler events (titles, dates, times, venues, prices, genres) come from shotgun.live Paris listings read on 21 Oct 2026 (Rex Club venue page, Paris techno and house pages). Posters are generated artwork, not the real posters.
- **Fictional:** “Nightdrive: Melodic House & Indie Dance” (Sat 14 Nov, La Serre Électrique), its lineup (Lumen Coast, Marin Vale) and organisers. It is the sound-match result and the event bought at checkout.
- **Simulated:** song recognition and matching are scripted; match scores are illustrative; event previews are NCS tracks in a similar genre, not the lineup's music; no payment is made and card numbers are never stored (only the last 4 digits are kept in memory to show the method).
- The song list reproduces the four results shown in the Figma screen “Search Audio 01 B”. Streaming apps are shown as labelled buttons, not logos.

## Persistent inputs (saved in the browser, survive reload)
Purchased tickets (Tickets tab), Interested hearts, Follow buttons, recent song searches (shown as shortcuts on the Listen screen), last search query, draft ticket quantity, map filters (when “Save my filters for later” is ticked).

## Map: venues
Rex Club (5 Bd Poissonnière, 75002), Silencio Club (142 Rue Montmartre, 75002), Studio 56 (56 Rue de la Fontaine au Roi, 75011), La Gare / Le Gore (1 Av. Corentin Cariou, 75019), La Machine du Moulin Rouge (90 Bd de Clichy, 75018), Panic Room (101 Rue Amelot, 75011), Point Éphémère (200 Quai de Valmy, 75010), Petit Bain (7 Port de la Gare, 75013), Glazart (7-15 Av. de la Porte de la Villette, 75019), Monkey Pigalle (53 Rue Jean-Baptiste Pigalle, 75009) and the fictional La Serre Électrique. Addresses and events come from the clubs' shotgun.live pages (21 Oct 2026); map positions are approximate and the city is stylised. Radio Radio is not placed because its address was not confirmed.

## One version
This folder, the GitHub repository (uiderandres/hotgun-sound-match) and the live site hold the same files. Every change is pushed to GitHub and copied to this folder. `js/config.js` can still switch to previews generated in the browser with `?music=synth` in the URL.

## Sound controls
Every preview has its own ▶/❚❚ button; the matching screen and the map have a speaker button to mute or unmute all sound (remembered after reload).

## Songs added by Andres
- `assets/audio/leaveitalone.mp4` (Leave It Alone — Vandelux, Tyler Mann) plays when this song is selected in "Select a song" (from 0:50). `leaveitalone.mp3` is the same file converted for browsers that don't play MP4 audio. Commercial track, published with the prototype at the author's choice for the class demo (22 Oct 2026); remove it if the rights holder asks.
- `Custody, Just Isac, MADZI, SFRNG - No Way Back [NCS Release].mp3` appears in the NCS library.

## Music credits (NoCopyrightSounds)
30-second excerpts (No Way Back: full track). NCS's terms cover use in videos and streams on platforms such as YouTube; use inside a website or app is not covered. The files are published with this class prototype at the author's choice (22 Oct 2026) and will be removed if NCS asks.
- Hester - KYOTO [NCS Release] · Music provided by NoCopyrightSounds · https://ncs.io/kyoto
- LÖVI - virtual love 2001 [NCS Release] · https://ncs.io/virtuallove
- gabriawll - Recall [NCS Release] · https://ncs.io/Recall
- gabriawll, Ada Petcu - Desire [NCS Release] · https://ncs.io/g_desire
- Zack Griffin - Feel It [NCS Release] · https://ncs.io/z_feelit
- onte - halcyon [NCS Release] · https://ncs.io/o_halcyon
- jonty - fired up [NCS Release] · https://ncs.io/FiredUp
- Hester - I Need An Angel [NCS Release] · https://ncs.io/ineedanangel
- DJ PUMA - ALL BEFORE [NCS Release] · https://ncs.io/allbefore
- Reece Rosé - Defect [NCS Release] · https://ncs.io/Defect
- Custody, Just Isac, MADZI, SFRNG - No Way Back [NCS Release] · Music provided by NoCopyrightSounds

## Why this can't be done with Figma's standard prototyping
Live microphone and music analysis (Web Audio) driving 9 000 GPU particles; a 3D map you can pan, zoom and tap; real audio previews with progress rings; free text search that filters lists; quantities, promo code validation and totals computed live; data kept between sessions.

## Tech
Plain HTML, CSS and JavaScript (no build step). three.js r149 (`js/vendor/three.min.js`, MIT) for the particle scene with custom shaders; Web Audio API for mic analysis and the synthesised previews; Web Animations API and CSS for micro-interactions; localStorage for persistence. Fonts: Space Grotesk and Zalando Sans Expanded (SIL OFL, bundled in `assets/fonts`). Icons: Lucide-style paths (ISC).

Files: `index.html`, `css/app.css` (tokens mirror the Figma variables), `js/data.js` (content), `js/store.js` (persistence), `js/audio.js`, `js/particles.js`, `js/map3d.js` (3D club map), `js/app.js` (screens and flows), `assets/audio` + `assets/covers` (NCS previews and artwork).

## Sources
- Shotgun, Rex Club upcoming events: https://shotgun.live/en/venues/rex-club
- Shotgun, Techno events in Paris: https://shotgun.live/en/cities/paris/techno
- Shotgun, House events in Paris: https://r.shotgun.live/en/cities/paris/house
- Vandelux & Tyler Mann, “Leave It Alone” (Spotify): https://open.spotify.com/track/4FexSEETu1NQFC6yGplWV8
- Vandelux bio (“retro nostalgia with contemporary electronic production”): https://musicboxsd.com/event/13295198/vandelux-tyler-mann
- Studio 56 address: https://songkick.com/venues/4586493-studio-56
- La Gare / Le Gore address: https://www.visitparisregion.com/en/la-gare-le-gore
- NCS usage policy and terms: https://ncs.io/usage-policy , https://ncs.io/usage-policy/terms
