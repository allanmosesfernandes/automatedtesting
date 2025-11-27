# Playwright E2E Test Container
FROM mcr.microsoft.com/playwright:v1.40.1-jammy

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy test files and configs
COPY . .

# Set environment variables
ENV CI=true
ENV NODE_ENV=production

# Default command - run all cart checkout tests
CMD ["npx", "playwright", "test", "tests/e2e/cart-checkout/"]
