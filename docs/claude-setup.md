## Setup: usare Claude Code come utente non-root nel container

  Problema: `--dangerously-skip-permissions` (e anche `defaultMode: "bypassPermissions"` nel settings.json) sono bloccati quando Claude Code gira come root/sudo, per sicurezza. Serve un utente non-root.

  ### 1. Rendere `claude` eseguibile anche da altri utenti
  Il binario reale vive sotto `/root/.local/share/claude/versions/<VERSIONE>`, non accessibile ad altri utenti perché `/root` ha permessi `700`.

  ```bash
  mkdir -p /usr/local/lib/claude-code
  cp /root/.local/share/claude/versions/<VERSIONE> /usr/local/lib/claude-code/claude
  chmod 755 /usr/local/lib/claude-code /usr/local/lib/claude-code/claude
  ln -sf /usr/local/lib/claude-code/claude /usr/local/bin/claude

  Verifica: su - node -c "claude --version"

  2. Copiare la configurazione/credenziali all'utente non-root

  cp -r /root/.claude /home/node/.claude
  cp /root/.claude.json /home/node/.claude.json
  chown -R node:node /home/node/.claude /home/node/.claude.json

  3. Permessi sulla cartella di lavoro

  chown -R node:node /workspace

  4. Uso quotidiano

  Dall'host (fuori dal container):
  docker exec -u node -it <nome_o_id_container> bash
  Dentro:
  cd /workspace
  claude --dangerously-skip-permissions

  Note

  - L'utente non-root usato è node (uid 1000, già presente nelle immagini Docker Node-based).
  - I permessi allowlist in settings.json ("allow": [...]) restano utili per restare selettivi anche Jump to bottom (ctrl+End) ↓  da solo non è valido — servono regole tipo "Bash", "Bash(git *)", ecc.

## Menu `/` (slash commands) senza evidenziazione della selezione

**Sintomo:** aprendo il menu `/` in Claude Code, la voce attualmente selezionata non
appare evidenziata visivamente.

**Causa:** `TERM` era impostato a `xterm` invece di `xterm-256color`, quindi il
terminale dichiarava un supporto colori limitato (8/16 colori) e l'highlight
risultava invisibile o a basso contrasto. `NO_COLOR` e `COLORTERM` non erano
impostate.

**Diagnosi:**

```bash
echo "TERM=$TERM"
echo "NO_COLOR=${NO_COLOR:-<non impostata>}"
echo "COLORTERM=${COLORTERM:-<non impostata>}"
```

**Fix applicato:** aggiunto `export TERM=xterm-256color` in fondo a `~/.bashrc`
(nessun export esplicito di `TERM` era già presente, solo dei blocchi `case "$TERM"`
condizionali).

Per applicare la modifica in un terminale già aperto: `source ~/.bashrc`.
Per i nuovi terminali/nuove sessioni bash prende effetto automaticamente.