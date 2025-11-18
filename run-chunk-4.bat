@echo off
echo Running Chunk 4...
set CHUNK_FILE=test-data/chunks/links-chunk-4.json
set CHUNK_ID=4
set BATCH_START=1
set BATCH_SIZE=509
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts
