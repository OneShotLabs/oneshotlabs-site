#!/bin/zsh
cd -- "${0:A:h}"
(sleep 0.4; open "http://127.0.0.1:4176/") &
exec /usr/bin/python3 -m http.server 4176
