@echo off
npx.cmd pnpm --dir "%~dp0..\tools\ruflo\v3" --filter @claude-flow/cli exec node bin/cli.js %*
