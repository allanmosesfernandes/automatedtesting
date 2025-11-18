@echo off
echo Running Chunk 2 (509 links)...
set CHUNK_FILE=test-data/chunks/links-chunk-2.json
set CHUNK_ID=2
set BATCH_START=1
set BATCH_SIZE=509
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts
