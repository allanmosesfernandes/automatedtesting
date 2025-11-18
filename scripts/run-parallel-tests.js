const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Run 10 Playwright test processes in parallel, each testing a different chunk
 */
async function runParallelTests() {
  // Allow override via environment variable (e.g., NUM_WORKERS=2 npm run test:parallel)
  const numChunks = parseInt(process.env.NUM_WORKERS || '10', 10);
  const chunksDir = path.join(__dirname, '..', 'test-data', 'chunks');
  const processes = [];

  console.log('='.repeat(80));
  console.log(`RUNNING PARALLEL TESTS - ${numChunks} WORKER(S)`);
  console.log('='.repeat(80));
  console.log(`Start time: ${new Date().toISOString()}\n`);

  // Check if chunks exist
  if (!fs.existsSync(chunksDir)) {
    console.error('❌ Chunks directory not found. Run: node scripts/split-links.js');
    process.exit(1);
  }

  // Start 10 parallel test processes
  for (let i = 1; i <= numChunks; i++) {
    const chunkFile = path.join(chunksDir, `links-chunk-${i}.json`);

    if (!fs.existsSync(chunkFile)) {
      console.error(`❌ Chunk file not found: ${chunkFile}`);
      continue;
    }

    console.log(`Starting Worker ${i}:`);
    console.log(`  File: links-chunk-${i}.json`);
    console.log(`  Output: test-results/printbox/chunk-${i}/\n`);

    // Spawn Playwright test process
    const testProcess = spawn(
      'npx',
      [
        'playwright',
        'test',
        'tests/e2e/printbox/printbox-links-validator.spec.ts',
        '--reporter=list'
      ],
      {
        env: {
          ...process.env,
          CHUNK_FILE: chunkFile,
          CHUNK_ID: i.toString(),
          BATCH_START: '1',
          BATCH_SIZE: '509' // Each chunk has ~509 links
        },
        shell: true
      }
    );

    // Capture output
    const logFile = path.join(__dirname, '..', 'test-results', 'printbox', `chunk-${i}`, 'test-output.log');
    const logDir = path.dirname(logFile);

    // Create log directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logStream = fs.createWriteStream(logFile);

    testProcess.stdout.on('data', (data) => {
      logStream.write(data);
      // Optionally log to console with prefix
      // process.stdout.write(`[Worker ${i}] ${data}`);
    });

    testProcess.stderr.on('data', (data) => {
      logStream.write(data);
      // process.stderr.write(`[Worker ${i}] ${data}`);
    });

    testProcess.on('close', (code) => {
      logStream.end();
      const status = code === 0 ? '✅ PASSED' : '❌ FAILED';
      console.log(`Worker ${i} finished: ${status} (exit code: ${code})`);
    });

    processes.push({
      id: i,
      process: testProcess,
      chunkFile: `links-chunk-${i}.json`
    });
  }

  // Wait for all processes to complete
  console.log('='.repeat(80));
  console.log('All workers started. Waiting for completion...');
  console.log('='.repeat(80));
  console.log('(Check individual logs in test-results/printbox/chunk-N/test-output.log)\n');

  await Promise.all(
    processes.map(({ id, process }) => {
      return new Promise((resolve) => {
        process.on('close', resolve);
      });
    })
  );

  console.log('\n' + '='.repeat(80));
  console.log('ALL WORKERS COMPLETED');
  console.log('='.repeat(80));
  console.log(`End time: ${new Date().toISOString()}`);
  console.log('\nResults:');
  console.log('  Check: test-results/printbox/chunk-{1-10}/');
  console.log('  HTML Reports: npx playwright show-report test-results/html-report');
  console.log('='.repeat(80));
}

// Run the parallel tests
runParallelTests().catch((error) => {
  console.error('Error running parallel tests:', error);
  process.exit(1);
});
