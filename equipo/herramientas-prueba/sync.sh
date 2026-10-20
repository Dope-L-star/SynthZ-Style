#!/bin/bash
# copia el repo al sitio de pruebas y reinicia el servidor
cd /home/claude && rm -rf site && cp -a synthz-style site && rm -rf site/.git && bash t/srv.sh "$@" >/dev/null 2>&1
