#!/bin/bash
# Opens the Sound Match prototype on http://localhost (needed for the microphone and audio analysis).
cd "$(dirname "$0")"
PORT=8765
if command -v python3 >/dev/null 2>&1 && python3 -c 'import http.server' >/dev/null 2>&1; then
  ( sleep 1; open "http://localhost:$PORT/index.html" ) &
  python3 serve.py $PORT
else
  echo "python3 not found: opening the file directly (microphone may fall back to simulation)."
  open "index.html"
fi
