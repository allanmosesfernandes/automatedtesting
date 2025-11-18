/**
 * Navigation Monitor Dashboard Server
 * Express server with Socket.IO for real-time test monitoring
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve test results directory
app.use('/test-results', express.static(path.join(__dirname, '..', 'test-results')));

const PORT = process.env.PORT || 3000;
const PROGRESS_FILE = path.join(__dirname, '..', 'test-results', 'navigation-monitoring', '.progress.json');
const STOP_SIGNAL_FILE = path.join(__dirname, '..', 'test-results', 'navigation-monitoring', '.stop-signal');

// Store current test process
let currentTestProcess = null;

// Initialize progress file with idle state
function initializeIdleProgress() {
  const progressDir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir, { recursive: true });
  }

  const idleProgress = {
    status: 'idle',
    startTime: new Date().toISOString(),
    currentTime: new Date().toISOString(),
    duration: 0,
    elapsed: 0,
    remaining: 0,
    totalClicks: 0,
    successfulClicks: 0,
    failedClicks: 0,
    successRate: '0.0%',
    currentLink: null,
    currentEnvironment: '',
    recentFailures: [],
    shouldStop: false
  };

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(idleProgress, null, 2));
}

// Watch progress file for changes and broadcast via Socket.IO
function watchProgressFile() {
  const watcher = chokidar.watch(PROGRESS_FILE, {
    persistent: true,
    ignoreInitial: false
  });

  watcher.on('change', () => {
    try {
      const progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      io.emit('progress-update', progressData);
    } catch (error) {
      console.error('Error reading progress file:', error);
    }
  });

  watcher.on('add', () => {
    try {
      const progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      io.emit('progress-update', progressData);
    } catch (error) {
      console.error('Error reading progress file:', error);
    }
  });

  console.log('📊 Watching progress file for changes...');
}

// API Endpoints

/**
 * GET /api/status - Get current test status
 */
app.get('/api/status', (req, res) => {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      res.json({
        status: 'success',
        data: progressData,
        isRunning: currentTestProcess !== null
      });
    } else {
      res.json({
        status: 'success',
        data: {
          status: 'idle',
          message: 'No test running'
        },
        isRunning: false
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * POST /api/start-test - Start navigation test
 */
app.post('/api/start-test', (req, res) => {
  try {
    // Check if test is already running
    if (currentTestProcess !== null) {
      return res.status(400).json({
        status: 'error',
        message: 'Test is already running'
      });
    }

    const { duration = 5, environment = 'qa' } = req.body;

    console.log(`🚀 Starting test: Duration=${duration}min, Environment=${environment}`);

    // Set environment variable for test duration
    const env = {
      ...process.env,
      TEST_DURATION_MINUTES: duration.toString(),
      TEST_ENVIRONMENT: environment
    };

    // Spawn Playwright test process
    currentTestProcess = spawn('npx', [
      'playwright',
      'test',
      'navigation-monitor',
      '--reporter=list'
    ], {
      env,
      cwd: path.join(__dirname, '..'),
      shell: true
    });

    currentTestProcess.stdout.on('data', (data) => {
      console.log(`[Test] ${data.toString().trim()}`);
    });

    currentTestProcess.stderr.on('data', (data) => {
      console.error(`[Test Error] ${data.toString().trim()}`);
    });

    currentTestProcess.on('close', (code) => {
      console.log(`✅ Test process exited with code ${code}`);
      currentTestProcess = null;

      // Update progress to completed or stopped
      if (fs.existsSync(PROGRESS_FILE)) {
        try {
          const progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
          if (progressData.status === 'running') {
            progressData.status = 'completed';
            progressData.currentTime = new Date().toISOString();
            fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progressData, null, 2));
          }
        } catch (error) {
          console.error('Error updating progress on completion:', error);
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Test started successfully',
      pid: currentTestProcess.pid
    });

  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * POST /api/stop-test - Stop running test
 */
app.post('/api/stop-test', (req, res) => {
  try {
    if (currentTestProcess === null) {
      return res.status(400).json({
        status: 'error',
        message: 'No test is currently running'
      });
    }

    console.log('⏹️  Stopping test...');

    // Create stop signal file
    const stopSignalDir = path.dirname(STOP_SIGNAL_FILE);
    if (!fs.existsSync(stopSignalDir)) {
      fs.mkdirSync(stopSignalDir, { recursive: true });
    }
    fs.writeFileSync(STOP_SIGNAL_FILE, new Date().toISOString());

    // Update progress file to indicate stop request
    if (fs.existsSync(PROGRESS_FILE)) {
      try {
        const progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
        progressData.shouldStop = true;
        progressData.status = 'stopped';
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progressData, null, 2));
      } catch (error) {
        console.error('Error updating progress for stop:', error);
      }
    }

    // Kill the test process
    currentTestProcess.kill('SIGTERM');

    // Force kill after 5 seconds if not stopped
    setTimeout(() => {
      if (currentTestProcess !== null) {
        currentTestProcess.kill('SIGKILL');
        currentTestProcess = null;
      }
    }, 5000);

    res.json({
      status: 'success',
      message: 'Stop signal sent to test'
    });

  } catch (error) {
    console.error('Error stopping test:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/results - Get latest test results
 */
app.get('/api/results', (req, res) => {
  try {
    const { environment } = req.query;
    const envDir = environment
      ? environment.replace(/https?:\/\//, '').replace(/\./g, '-')
      : 'qa-printerpix-co-uk';

    const summaryPath = path.join(
      __dirname,
      '..',
      'test-results',
      'navigation-monitoring',
      envDir,
      'summary.json'
    );

    if (fs.existsSync(summaryPath)) {
      const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      res.json({
        status: 'success',
        data: summaryData
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'No results found for this environment'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/screenshots - Get list of failure screenshots
 */
app.get('/api/screenshots', (req, res) => {
  try {
    const { environment } = req.query;
    const envDir = environment
      ? environment.replace(/https?:\/\//, '').replace(/\./g, '-')
      : 'qa-printerpix-co-uk';

    const screenshotsDir = path.join(
      __dirname,
      '..',
      'test-results',
      'navigation-monitoring',
      envDir,
      'screenshots'
    );

    if (fs.existsSync(screenshotsDir)) {
      const screenshots = fs.readdirSync(screenshotsDir)
        .filter(file => file.endsWith('.png'))
        .map(file => ({
          filename: file,
          path: `/test-results/navigation-monitoring/${envDir}/screenshots/${file}`,
          timestamp: fs.statSync(path.join(screenshotsDir, file)).mtime
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      res.json({
        status: 'success',
        data: screenshots
      });
    } else {
      res.json({
        status: 'success',
        data: []
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);

  // Send current progress on connection
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      socket.emit('progress-update', progressData);
    } catch (error) {
      console.error('Error sending initial progress:', error);
    }
  }

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

// Initialize
initializeIdleProgress();
watchProgressFile();

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('  🔍 Navigation Monitor Dashboard Server');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  ✅ Server running at: http://localhost:${PORT}`);
  console.log(`  📊 Dashboard: http://localhost:${PORT}/`);
  console.log(`  🔌 WebSocket ready for real-time updates`);
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
});
