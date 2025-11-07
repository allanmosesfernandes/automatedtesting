# Playwright E2E Testing Guide

This directory contains end-to-end tests for the PrinterPix e-commerce platform using Playwright.

## 📋 Table of Contents

- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [OAuth Authentication](#oauth-authentication)
- [Multi-Region Testing](#multi-region-testing)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🚀 Setup

### 1. Install Dependencies

Playwright is already installed as part of the project dependencies:

```bash
npm install
```

### 2. Install Browsers

Install the Chromium browser for testing:

```bash
npx playwright install chromium
```

### 3. Configure Test Credentials

Create a `.env.test` file in the project root (copy from `.env.test.example`):

```bash
cp .env.test.example .env.test
```

Edit `.env.test` and add your test credentials:

```env
BASE_URL=https://qa.printerpix.com
TEST_USER_EMAIL=your-test-email@example.com
TEST_USER_PASSWORD=yourTestPassword123!
TEST_REGION=US
TEST_ENV=qa
```

## 🏃 Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Headed Mode (see browser)

```bash
npm run test:headed
```

### Run Tests with UI Mode (interactive)

```bash
npm run test:ui
```

### Run Authentication Tests Only

```bash
npm run test:auth
```

### View Test Report

```bash
npm run test:report
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/auth/signin.spec.ts
```

### Run Tests with Different Base URL

```bash
BASE_URL=https://qa.printerpix.co.uk npm test
```

## 📁 Test Structure

```
tests/
├── e2e/
│   └── auth/
│       ├── signin.spec.ts          # Standard login tests
│       ├── register.spec.ts        # User registration tests
│       ├── forgot-password.spec.ts # Password reset tests
│       ├── signout.spec.ts         # Sign out tests
│       └── oauth.spec.ts           # OAuth (Google/Facebook) tests
├── pages/
│   ├── LoginPage.ts                # Login page object model
│   ├── RegisterPage.ts             # Register page object model
│   └── ForgotPasswordPage.ts       # Forgot password page object model
├── fixtures/
│   └── auth-states/                # Saved OAuth authentication states
│       ├── google-auth.json        # Google auth state (created after setup)
│       └── facebook-auth.json      # Facebook auth state (created after setup)
├── auth-setup/                     # OAuth setup scripts
│   ├── google-auth.setup.ts        # Google OAuth one-time setup
│   └── facebook-auth.setup.ts      # Facebook OAuth one-time setup
├── config/
│   └── regions.ts                  # Multi-region configuration
└── README.md                       # This file
```

## 🔐 OAuth Authentication

OAuth tests (Google/Facebook) use saved authentication states to avoid manual login each time.

### Setting Up Google Authentication

1. Run the Google OAuth setup script:

```bash
npm run test:setup:google
```

2. A browser window will open - manually complete the Google login
3. The authentication state will be saved to `tests/fixtures/auth-states/google-auth.json`
4. OAuth tests will now use this saved state

### Setting Up Facebook Authentication

1. Run the Facebook OAuth setup script:

```bash
npm run test:setup:facebook
```

2. A browser window will open - manually complete the Facebook login
3. The authentication state will be saved to `tests/fixtures/auth-states/facebook-auth.json`
4. OAuth tests will now use this saved state

### Refreshing OAuth States

OAuth sessions expire over time. When OAuth tests start failing, re-run the setup scripts:

```bash
npm run test:setup:google
npm run test:setup:facebook
```

## 🌍 Multi-Region Testing

The tests support multiple regions (US, GB, FR, DE, NL, IT, ES).

### Test Different Region

```bash
BASE_URL=https://qa.printerpix.co.uk npm test  # Test GB
BASE_URL=https://qa.printerpix.de npm test     # Test DE
BASE_URL=https://qa.printerpix.fr npm test     # Test FR
```

### Region Configuration

Region configurations are defined in `tests/config/regions.ts`. You can:

- Add new regions
- Update QA/Live URLs
- Modify locale settings

Example:

```typescript
export const regions = {
  US: {
    qaUrl: 'https://qa.printerpix.com',
    liveUrl: 'https://www.printerpix.com',
    locale: 'en-US',
    currency: 'USD',
  },
  // ... other regions
};
```

## 🔧 Test Coverage

### Current Authentication Tests

- ✅ Sign in with registered user
- ✅ Sign in with invalid credentials
- ✅ Sign in with empty fields
- ✅ Register new user
- ✅ Register with invalid data
- ✅ Register with existing email
- ✅ Forgot password flow
- ✅ Sign out
- ✅ OAuth (Google) authentication
- ✅ OAuth (Facebook) authentication

### Tested Scenarios

1. **Sign In**
   - Valid credentials
   - Invalid credentials
   - Empty email/password
   - Navigation to forgot password
   - Navigation to register

2. **Registration**
   - Valid registration data
   - Password mismatch
   - Invalid email format
   - Weak password
   - Empty required fields
   - Existing email

3. **Forgot Password**
   - Valid email
   - Invalid email format
   - Empty email
   - Non-existent email (security)

4. **Sign Out**
   - Successful sign out
   - Session clearing
   - Re-authentication after sign out

5. **OAuth**
   - Google authentication
   - Facebook authentication
   - Session persistence
   - Sign out from OAuth

## 🚦 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, releases/*]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install chromium
      - name: Run tests
        run: npm test
        env:
          BASE_URL: https://qa.printerpix.com
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Jenkins Integration

Add to your Jenkinsfile:

```groovy
stage('E2E Tests') {
    steps {
        sh 'npm ci'
        sh 'npx playwright install chromium'
        sh 'BASE_URL=https://qa.printerpix.com npm test'
    }
    post {
        always {
            publishHTML([
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Test Report'
            ])
        }
    }
}
```

## 🐛 Troubleshooting

### Tests Are Failing

1. **Check selectors**: Page structure may have changed. Update Page Object Models in `tests/pages/`
2. **Verify credentials**: Ensure `.env.test` has valid test credentials
3. **Check base URL**: Verify the QA environment is accessible
4. **View screenshots**: Failed tests save screenshots in `test-results/`

### OAuth Tests Skipping

```
Google auth state not found. Run: npm run test:setup:google
```

**Solution**: Run the OAuth setup scripts:

```bash
npm run test:setup:google
npm run test:setup:facebook
```

### Browser Not Installed

```
Error: browserType.launch: Executable doesn't exist
```

**Solution**: Install browsers:

```bash
npx playwright install chromium
```

### Slow Tests

**Solutions**:
- Run tests in headless mode (default)
- Reduce `timeout` values in `playwright.config.ts`
- Run specific test files instead of all tests
- Use `test.only()` for focused testing during development

### Debugging Tests

```bash
# Run with debug mode
PWDEBUG=1 npm test

# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## 📊 Best Practices

1. **Use Page Object Models**: Keep selectors centralized in `tests/pages/`
2. **Environment Variables**: Never commit credentials - use `.env.test`
3. **Descriptive Test Names**: Use clear, descriptive test names
4. **Independent Tests**: Each test should be able to run independently
5. **Clean Up**: Clean up test data after tests (if applicable)
6. **Parallel Execution**: Tests run in parallel by default for speed
7. **Visual Regression**: Consider adding visual regression tests for UI changes

## 🔄 Updating Selectors

When the UI changes, update the Page Object Models:

```typescript
// tests/pages/LoginPage.ts
this.emailInput = page.locator('input[name="email"]'); // Update selector
```

## 📝 Adding New Tests

1. Create a new test file in `tests/e2e/[feature]/`
2. Import necessary Page Objects
3. Write test cases using `test.describe()` and `test()`
4. Run and verify tests locally
5. Update this README if adding new test categories

## 🎯 Future Enhancements

- [ ] Add tests for shopping cart
- [ ] Add tests for checkout flow
- [ ] Add tests for product customization
- [ ] Add visual regression testing
- [ ] Add API testing
- [ ] Add performance testing
- [ ] Support for all regions (GB, FR, DE, NL, IT, ES)
- [ ] Mobile viewport testing
- [ ] Accessibility testing

## 📞 Support

For questions or issues with the test suite, contact the development team or create an issue in the repository.
