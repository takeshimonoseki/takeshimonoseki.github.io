@echo off
cd /d "D:\Documents\GitHub\軽貨物TAKE"
set PATH=C:\Program Files\nodejs;%PATH%
start "" http://127.0.0.1:3000
"C:\Program Files\nodejs\npm.cmd" run dev
pause