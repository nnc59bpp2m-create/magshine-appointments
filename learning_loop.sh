#!/usr/bin/env bash
set -euo pipefail
TS="$(date '+%Y-%m-%d %H:%M:%S')"
LOG="/tmp/magshine_learning_loop.log"
MEM="mempalace"
VAULT="/home/hermes/magshine-booking/learning_vault"
VAULT_RECENT="${VAULT}/recent"
MEM_STATE="/tmp/${MEM}_state.pid"
MEM_LOG="/tmp/${MEM}_log.out"

vault_recent_change_count() {
  if [ ! -d "$VAULT_RECENT" ]; then
    echo 0
    return
  fi
  find "$VAULT_RECENT" -type f -mmin -10 | wc -l | tr -d ' '
}

mempalace_status() {
  if [ -f "$MEM_STATE" ] && kill -0 "$(cat "$MEM_STATE")" 2>/dev/null; then
    echo "running (pid $(cat "$MEM_STATE"))"
  else
    echo "not_running_or_no_pidfile"
  fi
}

if [ -f ./gate ] && grep -qi 'off\|disabled\|stop\|halt' ./gate 2>/dev/null; then
  echo "${TS} gate_mode=off skipping" | tee -a "$LOG"
  exit 0
fi

CHANGES="$(vault_recent_change_count)"
STATUS="$(mempalace_status)"

LINE="${TS} vault_recent_changes=${CHANGES} mempalace_status=${STATUS}"
echo "$LINE" | tee -a "$LOG"
printf '%s\n' "$LINE" >> /tmp/learning_loop_report.txt
