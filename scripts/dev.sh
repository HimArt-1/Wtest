#!/bin/bash
# Fix "EMFILE: too many open files" on macOS
ulimit -n 65536 2>/dev/null || true
exec npm run dev
