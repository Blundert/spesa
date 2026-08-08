#!/usr/bin/env bash
# Setup automatico: rende `claude` usabile dall'utente non-root `node` nel container.
# Basato su docs/claude-setup.md. Pensato per essere richiamato da /root/.bashrc
# ogni volta che si entra nel container come root: e' idempotente, quindi si puo'
# rieseguire senza rischi (skippa i passi gia' completi).

set -euo pipefail

CLAUDE_VERSIONS_DIR="/root/.local/share/claude/versions"
CLAUDE_LIB_DIR="/usr/local/lib/claude-code"
CLAUDE_BIN="$CLAUDE_LIB_DIR/claude"
NODE_HOME="/home/node"
WORKSPACE="/workspace"

log() { echo "[claude-setup] $*"; }

# Deve girare da root: e' lui che ha accesso a /root/.claude* e ai permessi di chown.
if [[ "$(id -u)" -ne 0 ]]; then
  log "questo script va eseguito come root, esco."
  exit 0
fi

# --- 1. Rendere il binario claude eseguibile anche da altri utenti ---
if [[ -d "$CLAUDE_VERSIONS_DIR" ]]; then
  latest_version="$(ls -1 "$CLAUDE_VERSIONS_DIR" | sort -V | tail -n1)"
  if [[ -n "${latest_version:-}" ]]; then
    src_bin="$CLAUDE_VERSIONS_DIR/$latest_version"
    if [[ ! -f "$CLAUDE_BIN" ]] || ! cmp -s "$src_bin" "$CLAUDE_BIN"; then
      mkdir -p "$CLAUDE_LIB_DIR"
      cp "$src_bin" "$CLAUDE_BIN"
      chmod 755 "$CLAUDE_LIB_DIR" "$CLAUDE_BIN"
      ln -sf "$CLAUDE_BIN" /usr/local/bin/claude
      log "binario claude aggiornato a versione $latest_version"
    fi
  fi
else
  log "attenzione: $CLAUDE_VERSIONS_DIR non trovata, salto lo step 1"
fi

# --- 2. Copiare configurazione/credenziali all'utente non-root ---
if [[ -d /root/.claude ]]; then
  mkdir -p "$NODE_HOME/.claude"
  cp -r /root/.claude/. "$NODE_HOME/.claude/"
fi
if [[ -f /root/.claude.json ]]; then
  cp /root/.claude.json "$NODE_HOME/.claude.json"
fi
chown -R node:node "$NODE_HOME/.claude" "$NODE_HOME/.claude.json" 2>/dev/null || true

# --- 3. Permessi sulla cartella di lavoro ---
if [[ -d "$WORKSPACE" ]]; then
  current_owner="$(stat -c '%U' "$WORKSPACE" 2>/dev/null || echo '')"
  if [[ "$current_owner" != "node" ]]; then
    chown -R node:node "$WORKSPACE"
    log "ownership di $WORKSPACE impostata a node:node"
  fi
fi

log "setup completato. Uso: su - node -c 'cd $WORKSPACE && claude --dangerously-skip-permissions'"
