/* Public build: no music files are published; previews are generated in the browser. */
window.CONFIG = { music: new URLSearchParams(location.search).get('music') || 'synth' };
