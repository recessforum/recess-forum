#!/bin/bash
# Renders a card-news HTML file to a 1080x1350 PNG using headless Chrome.
# Usage: render_card.sh <input.html> <output.png>
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <input.html> <output.png>" >&2
  exit 1
fi

IN="$1"
OUT="$2"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "Google Chrome not found at $CHROME — this script assumes macOS with Chrome installed." >&2
  exit 1
fi

ABS_IN="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"

"$CHROME" \
  --headless --disable-gpu --hide-scrollbars \
  --window-size=1080,1350 \
  --screenshot="$OUT" \
  "file://$ABS_IN" 2>/dev/null

echo "Rendered $OUT"
file "$OUT"
