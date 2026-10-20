#!/bin/bash
# reinicia el servidor de pruebas; uso: srv.sh [simple]
[ -f /tmp/dev.pid ] && kill $(cat /tmp/dev.pid) 2>/dev/null; sleep 0.5
cd /home/claude/t/be
if [ "$1" = "simple" ]; then SIMPLE=1 nohup node dev.mjs > /tmp/dev.log 2>&1 & else nohup node dev.mjs > /tmp/dev.log 2>&1 & fi
echo $! > /tmp/dev.pid; sleep 1.5; curl -s localhost:8765/api/config; echo
