const express = require('express');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const testRunner = require('./test-runner');
const triviaService = require('./trivia');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Basic Authentication
const authMiddleware = basicAuth({
  users: {
    [process.env.AUTH_USERNAME || 'admin']: process.env.AUTH_PASSWORD || 'testadmin123'
  },
  challenge: true,
  realm: 'Automated Testing Dashboard'
});

// Apply auth to all routes
app.use(authMiddleware);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve test results and screenshots (protected by auth)
app.use('/test-results', express.static(path.join(__dirname, '../test-results')));

// Store for active test jobs
const testJobs = new Map();

// API Routes

/**
 * POST /api/run-tests
 * Trigger test execution for selected regions and environments
 * Body: { regions: string[], environments: string[] }
 */
app.post('/api/run-tests', async (req, res) => {
  try {
    const { regions, environments } = req.body;

    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json({ error: 'Regions array is required and cannot be empty' });
    }

    if (!environments || !Array.isArray(environments) || environments.length === 0) {
      return res.status(400).json({ error: 'Environments array is required and cannot be empty' });
    }

    // Generate unique job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job status
    testJobs.set(jobId, {
      id: jobId,
      status: 'running',
      startTime: new Date().toISOString(),
      progress: {
        total: regions.length * environments.length,
        completed: 0,
        current: null
      },
      regions,
      environments,
      results: null
    });

    // Start test execution asynchronously
    testRunner.runTests(jobId, regions, environments, (update) => {
      const job = testJobs.get(jobId);
      if (job) {
        Object.assign(job, update);
      }
    }).then((results) => {
      const job = testJobs.get(jobId);
      if (job) {
        job.status = 'completed';
        job.endTime = new Date().toISOString();
        job.results = results;
      }
    }).catch((error) => {
      const job = testJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.endTime = new Date().toISOString();
        job.error = error.message;
      }
    });

    res.json({
      jobId,
      message: 'Test execution started',
      totalTests: regions.length * environments.length
    });

  } catch (error) {
    console.error('Error starting tests:', error);
    res.status(500).json({ error: 'Failed to start test execution' });
  }
});

/**
 * GET /api/test-status/:jobId
 * Get current status of a test job
 */
app.get('/api/test-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = testJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    status: job.status,
    startTime: job.startTime,
    endTime: job.endTime,
    progress: job.progress,
    error: job.error
  });
});

/**
 * GET /api/test-results/:jobId
 * Get test results for a completed job
 */
app.get('/api/test-results/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = testJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job is not completed yet' });
  }

  res.json({
    id: job.id,
    status: job.status,
    startTime: job.startTime,
    endTime: job.endTime,
    regions: job.regions,
    environments: job.environments,
    results: job.results
  });
});

/**
 * GET /api/test-results/:jobId/download
 * Download test results as JSON file
 */
app.get('/api/test-results/:jobId/download', (req, res) => {
  const { jobId } = req.params;
  const job = testJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job is not completed yet' });
  }

  const filename = `test-results-${jobId}-${new Date().toISOString().split('T')[0]}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(job.results);
});

/**
 * GET /api/trivia
 * Get a random trivia message
 */
app.get('/api/trivia', (req, res) => {
  const trivia = triviaService.getRandomTrivia();
  res.json({ message: trivia });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeJobs: testJobs.size
  });
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Clean up old jobs periodically (older than 24 hours)
setInterval(() => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  for (const [jobId, job] of testJobs.entries()) {
    const jobTime = new Date(job.startTime).getTime();
    if (jobTime < oneDayAgo) {
      testJobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Automated Testing Dashboard is running!`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔐 Username: ${process.env.AUTH_USERNAME || 'admin'}`);
  console.log(`🔑 Password: ${process.env.AUTH_PASSWORD || 'testadmin123'}`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   POST   /api/run-tests`);
  console.log(`   GET    /api/test-status/:jobId`);
  console.log(`   GET    /api/test-results/:jobId`);
  console.log(`   GET    /api/test-results/:jobId/download`);
  console.log(`   GET    /api/trivia`);
  console.log(`   GET    /api/health\n`);
});

module.exports = app;
