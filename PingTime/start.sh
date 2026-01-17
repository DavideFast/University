#!/bin/bash

# Ottieni la directory corrente (dove si trova lo script)
CURR_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Current Directory: $CURR_DIR"

# Vai nella directory corrente
cd "$CURR_DIR" || exit 1

# Avvia il backend in un altro terminale
echo "Starting backend server..."
if command -v gnome-terminal >/dev/null 2>&1; then
  gnome-terminal -- bash -c "cd \"$CURR_DIR/backend\" && node index.js; exec bash"
elif command -v x-terminal-emulator >/dev/null 2>&1; then
  x-terminal-emulator -e bash -c "cd \"$CURR_DIR/backend\" && node index.js"
elif command -v open >/dev/null 2>&1; then
  # macOS
  open -a Terminal "$CURR_DIR/backend"
else
  echo "Terminale non supportato. Avvio backend nella stessa shell."
  cd "$CURR_DIR/backend" && node index.js &
fi

echo "Backend server avviato."

# Avvia il frontend
echo "Starting frontend server..."
cd "$CURR_DIR/frontend" || exit 1
npm start
