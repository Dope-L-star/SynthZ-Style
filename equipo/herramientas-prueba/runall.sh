#!/bin/bash
# corre las suites del navegador una por una, con tiempo límite, y deja el resultado en /tmp/suites.log
cd /home/claude/t
: > /tmp/suites.log
for f in "$@"; do
  [ -f $f.js ] || continue
  case $f in e8|f2) ./srv.sh simple >/dev/null 2>&1;; *) ./srv.sh >/dev/null 2>&1;; esac
  start=$(date +%s)
  out=$(timeout 240 node $f.js 2>&1 | tail -4 | tr '\n' ' ' | cut -c1-400)
  code=$?
  echo "$f ($(( $(date +%s)-start ))s): $out" >> /tmp/suites.log
done
echo DONE >> /tmp/suites.log
