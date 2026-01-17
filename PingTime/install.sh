#!/bin/bash

# Ottieni la directory corrente (dove si trova lo script)
CURR_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Current Directory: $CURR_DIR"

# Vai nella directory corrente
cd "$CURR_DIR" || exit 1

# Installa le dipendenze backend in un altro terminale
echo "Installing required backend dependencies..."

if command -v gnome-terminal >/dev/null 2>&1; then
  # Linux (GNOME)
  gnome-terminal -- bash -c "cd \"$CURR_DIR/backend\" && npm install; echo 'Backend dependencies installed successfully.'; exec bash"
elif command -v x-terminal-emulator >/dev/null 2>&1; then
  # Debian/Ubuntu alternative
  x-terminal-emulator -e bash -c "cd \"$CURR_DIR/backend\" && npm install"
elif command -v open >/dev/null 2>&1; then
  # macOS
  open -a Terminal "$CURR_DIR/backend"
else
  echo "Terminale non supportato. Installazione backend nella stessa shell."
  (cd "$CURR_DIR/backend" && npm install)
fi

echo "Backend dependencies installation initiated in a new window."

# Installa le dipendenze frontend
echo "Installing required frontend dependencies..."
cd "$CURR_DIR/frontend" || exit 1
npm install
cd ..

echo "Frontend dependencies installed successfully."