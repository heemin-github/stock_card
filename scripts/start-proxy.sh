#!/bin/bash
# Pull TWELVEDATA_KEY from macOS keychain and start the proxy server.
# Save the key first (one-time) by running:
#   security add-generic-password -s twelvedata -a "$USER" -w 'YOUR_KEY'

set -e

KEY="$(security find-generic-password -s twelvedata -a "$USER" -w 2>/dev/null || true)"

if [ -z "$KEY" ]; then
  echo "[start-proxy] keychain entry 'twelvedata' not found." >&2
  echo "             save it with:" >&2
  echo "             security add-generic-password -s twelvedata -a \"\$USER\" -w 'YOUR_KEY'" >&2
  exit 1
fi

export TWELVEDATA_KEY="$KEY"
exec node server/proxy.js
