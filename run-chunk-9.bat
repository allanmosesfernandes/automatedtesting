@echo off
echo Running Chunk 9...
set CHUNK_FILE=test-data/chunks/links-chunk-9.json
set CHUNK_ID=9
set BATCH_START=1
set BATCH_SIZE=509
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts
