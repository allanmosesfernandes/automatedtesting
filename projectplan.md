# Automated Testing Website Implementation Plan

## Overview
Build a web application with HTTP basic auth where your team can select regions/environments and run Playwright tests with one click, showing trivia messages during execution and downloadable test results.

## Phase 1: Project Setup & Configuration
1. **Create package.json** with dependencies:
   - Express.js (backend server)
   - Playwright + @playwright/test (existing tests)
   - Basic auth middleware
   - Static file serving
2. **Create playwright.config.ts** for proper test execution
3. **Create .env file** for configuration (auth credentials, test user credentials)
4. **Add .gitignore** to exclude node_modules, test results, .env

## Phase 2: Backend API Development
1. **Create Express server** (`server.js` or `src/server.js`):
   - HTTP basic authentication middleware
   - Static file serving for frontend
   - POST `/api/run-tests` endpoint to trigger test execution
   - GET `/api/test-status/:jobId` endpoint for progress updates
   - GET `/api/test-results/:jobId` endpoint to download results
2. **Create test runner service** (`src/test-runner.js`):
   - Run Playwright tests programmatically using `@playwright/test` API
   - Execute tests for selected regions/environments
   - Capture test results (pass/fail, screenshots, errors)
   - Generate HTML and JSON reports
3. **Create trivia service** (`src/trivia.js`):
   - Collection of testing/product trivia messages
   - API endpoint to serve random trivia

## Phase 3: Frontend Development
1. **Create main HTML page** (`public/index.html`):
   - Clean, professional UI design (will use UI-design-specialist agent)
   - Region checkboxes (US, GB, DE, FR, IT, ES, NL)
   - Environment checkboxes (QA, Production)
   - "Run Tests" button
2. **Create frontend JavaScript** (`public/app.js`):
   - Handle test execution trigger
   - Poll for test status updates
   - Display rotating trivia messages during execution
   - Show test results on completion
   - Enable report download (HTML + JSON)
3. **Create CSS styling** (`public/styles.css`):
   - Professional, clean design
   - Loading animations
   - Results table/cards
   - Responsive layout

## Phase 4: Test Improvements (Using Playwright MCP)
1. **Consult Playwright MCP** for:
   - Best practices for running tests programmatically
   - Parallel execution strategies
   - Reporter configuration for HTML/JSON output
   - Error handling and retry logic
2. **Implement improvements** based on MCP recommendations

## Phase 5: UI Design Enhancement (Using UI-design-specialist Agent)
1. **Consult UI-design-specialist** for:
   - Modern, professional design system
   - Color scheme and typography
   - Loading state animations
   - Results visualization (charts, tables, status indicators)
2. **Implement design recommendations**

## Phase 6: Testing & Documentation
1. **Test the application**:
   - Verify HTTP basic auth works
   - Test region/environment selection
   - Confirm tests execute correctly across all combinations
   - Validate trivia rotation
   - Test report downloads
2. **Create README.md** with:
   - Setup instructions
   - How to run the server
   - How to use the application
   - Environment variable configuration

## Technical Architecture
```
automated-testing/
├── public/               # Frontend files
│   ├── index.html       # Main UI
│   ├── app.js           # Frontend logic
│   └── styles.css       # Styling
├── src/                 # Backend files
│   ├── server.js        # Express server
│   ├── test-runner.js   # Playwright test orchestration
│   └── trivia.js        # Trivia messages
├── tests/               # Existing tests (unchanged)
├── test-results/        # Generated reports
├── package.json
├── playwright.config.ts
├── .env
└── README.md
```

## Key Features
✓ HTTP basic authentication
✓ Select specific regions and environments
✓ One-click test execution
✓ Rotating trivia messages during execution
✓ Test results displayed on same page
✓ Downloadable HTML and JSON reports
✓ Tests run across QA and Production environments
✓ Support for all 7 regions

## User Requirements
- **Backend Framework**: Express.js (for faster delivery)
- **Results Display**: Downloadable report (HTML + JSON)
- **Loading State**: Rotating trivia messages
- **Test Selection**: Let users choose specific regions/environments

## Implementation Notes
- Tests currently exist in `tests/e2e/auth/` directory
- 5 test suites: signin, register, forgot-password, signout, google-oauth
- 7 regions supported: US, GB, DE, FR, IT, ES, NL
- 2 environments: QA (qa.domain.com) and Production (www.domain.com)
- Maximum 14 test combinations (7 regions × 2 environments)
- Page Object Model already implemented for all pages
- Region configurations with translations already set up
