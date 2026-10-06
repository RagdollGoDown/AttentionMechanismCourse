#!/usr/bin/env bash
# Renders prototype-flow.svg to PDF and PNG with Playwright's headless Chromium (npx playwright install chromium-headless-shell).
set -euo pipefail
cd "$(dirname "$0")"
CHROME=$(ls -d ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-*/chrome-headless-shell | tail -1)
HTML=$(mktemp --suffix=.html)
trap 'rm -f "$HTML"' EXIT
{ echo '<!doctype html><style>@page{size:1360px 530px;margin:0}html,body{margin:0}svg{display:block}</style>'; cat prototype-flow.svg; } > "$HTML"
"$CHROME" --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf="$PWD/prototype-flow.pdf" "file://$HTML" 2>/dev/null
"$CHROME" --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1360,530 --screenshot="$PWD/prototype-flow.png" "file://$HTML" 2>/dev/null
