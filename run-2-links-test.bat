@echo off
echo Running test with 2 links only...
set BATCH_SIZE=2
set BATCH_START=1
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=1
