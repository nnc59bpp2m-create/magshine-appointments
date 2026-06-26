#!/bin/bash
set -euo pipefail

log_file="learning-loop-light.log"
echo "[$(date -Iseconds)] learning-loop-light started" | tee -a "$log_file"

changes=0
# Placeholder for vault recent change count
if [ -d "/home/hermes/.obsidian/vault" ]; then
  changes=$(find "/home/hermes/.obsidian/vault" -mmin -10 -type f | wc -l || echo 0)
else
  echo "[$(date -Iseconds)] vault path not found" | tee -a "$log_file"
fi

status="unknown"
# Placeholder for MemPalace status
if [ -f "/home/hermes/.local/state/memplace/status" ]; then
  status="$(cat /home/hermes/.local/state/memplace/status 2>/dev/null || echo unknown)"
else
  status="absent"
fi

echo "[$(date -Iseconds)] vault_recent_changes=${changes} memplace_status=${status}" | tee -a "$log_file"
