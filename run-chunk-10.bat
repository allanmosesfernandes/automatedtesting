@echo off
echo Running Chunk 10...
set CHUNK_FILE=test-data/chunks/links-chunk-10.json
set CHUNK_ID=10
set BATCH_START=1
set BATCH_SIZE=509
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts
