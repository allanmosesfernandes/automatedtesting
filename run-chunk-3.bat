@echo off
echo Running Chunk 3...
set CHUNK_FILE=test-data/chunks/links-chunk-3.json
set CHUNK_ID=3
set BATCH_START=1
set BATCH_SIZE=509
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts
