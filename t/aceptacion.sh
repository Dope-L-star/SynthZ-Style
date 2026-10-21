#!/bin/bash
# Hecho por: AUDITOR
# t/aceptacion.sh — un solo comando de aceptación
# Corre build check, pruebas de API, y lo que exista de alias. Imprime TODO OK o lista de fallos.
# Sin dependencias nuevas.

set -u
cd "$(dirname "$0")/.." || exit 1

FAILS=()
ok() { echo "  OK  $1"; }
bad() { echo "  FAIL $1"; FAILS+=("$1"); }

echo "=== node build.mjs --check ==="
if node build.mjs --check >/dev/null 2>&1; then
  ok "build.mjs --check"
else
  bad "build.mjs --check"
fi

echo "=== t/api/* ==="
for f in t/api/*.mjs t/api/*.js; do
  [ -e "$f" ] || continue
  if node "$f" >/dev/null 2>&1; then
    ok "$f"
  else
    bad "$f"
  fi
done

echo "=== src/alias/prueba-servidor.mjs (si existe) ==="
if [ -f src/alias/prueba-servidor.mjs ]; then
  if node src/alias/prueba-servidor.mjs >/dev/null 2>&1; then
    ok "src/alias/prueba-servidor.mjs"
  else
    bad "src/alias/prueba-servidor.mjs"
  fi
else
  echo "  (no existe, se omite)"
fi

echo "=== t/alias/contrato.mjs (si existe) ==="
if [ -f t/alias/contrato.mjs ]; then
  if node t/alias/contrato.mjs >/dev/null 2>&1; then
    ok "t/alias/contrato.mjs"
  else
    bad "t/alias/contrato.mjs"
  fi
else
  echo "  (no existe, se omite)"
fi

echo "=== t/alias/ui.mjs (Playwright, si existe y está instalado) ==="
if [ -f t/alias/ui.mjs ]; then
  if command -v npx >/dev/null 2>&1 && npx --yes playwright --version >/dev/null 2>&1; then
    if node t/alias/ui.mjs >/dev/null 2>&1; then
      ok "t/alias/ui.mjs"
    else
      bad "t/alias/ui.mjs"
    fi
  else
    echo "  (Playwright no disponible, se omite)"
  fi
else
  echo "  (no existe, se omite)"
fi

echo
if [ ${#FAILS[@]} -eq 0 ]; then
  echo "TODO OK"
  exit 0
else
  echo "FALLOS (${#FAILS[@]}):"
  printf '  - %s\n' "${FAILS[@]}"
  exit 1
fi
