#!/bin/bash
# corre las suites de regresión una por una y deja el resumen en /tmp/s23.log
cd /home/claude/t
: > /tmp/s23.log
for f in b2 b3 b4 b5 v18/ag v18/cfg v18/extras v18/gq v18/mem v18/guide v18/pick v18/comp v18/web v19/migra; do
  bash /home/claude/t/srv.sh >/dev/null 2>&1
  s=$(date +%s); out=$(cd $(dirname $f.js) && timeout 240 node $(basename $f).js 2>&1 | grep -E "^(OK|FALLA)|Error|PAGEERR" | grep -v "^OK" | head -6 | tr '\n' ' ' | cut -c1-600)
  echo "$f ($(( $(date +%s)-s ))s): ${out:-todo OK}" >> /tmp/s23.log
done
echo DONE >> /tmp/s23.log
