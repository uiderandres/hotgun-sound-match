# Shotgun · Sound Match (concept prototype)

Student concept for ESD M2 “Prototypage avancé” by Andres Martinez. **Not affiliated with Shotgun.**

Live: open the GitHub Pages URL of this repository on a phone (HTTPS is needed for the microphone).

## Try it
For you → **Search** → **Listen**: type “leave it al” and pick *Leave It Alone*, or tap **Listen audio** and allow the microphone. Particles react to the sound, morph into listeners and a crowd, then show a matching event. Buy a ticket (simulated, nothing is charged) and find it in **Tickets** after reloading.
**Search → Map**: 3D map of Paris clubs; tap a building to see its events and play a preview.

## What is real and what is not
- Club events: real public listings on shotgun.live, read on 21 Oct 2026 (titles, dates, venues, prices, genres). Descriptions are prototype copy based on them; posters are generated artwork.
- “Nightdrive” and “La Serre Électrique” are fictional.
- Song recognition and matching are scripted. In this public version previews are **generated in the browser**; no music files are published.
- Payment is simulated; card numbers are not stored.

## Tech
Plain HTML/CSS/JS, three.js r149 (MIT) for the particle scene and the 3D map, Web Audio for microphone analysis and generated previews, localStorage for persistent inputs. Fonts: Space Grotesk and Zalando Sans Expanded (SIL OFL).
