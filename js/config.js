/* Build settings. 'files' = play the audio files in assets/audio (local version).
   'synth' = generate previews in the browser (public version, no music files). Override with ?music=synth */
window.CONFIG = { music: new URLSearchParams(location.search).get('music') || 'files' };
