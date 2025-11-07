/**
 * Trivia Service
 * Provides interesting facts and tips to display during test execution
 */

const triviaMessages = [
  // Testing Facts
  "Did you know? Automated testing can reduce regression testing time by up to 90%!",
  "Fun fact: The first software bug was an actual moth found in a Harvard Mark II computer in 1947.",
  "Playwright was created by Microsoft and can test across Chrome, Firefox, and Safari with a single API.",
  "End-to-end tests catch 70% of bugs that unit tests miss, making them essential for quality assurance.",
  "The cost of fixing a bug increases 10x with each stage it progresses through the development cycle.",

  // Best Practices
  "Pro tip: Always run tests in isolated environments to avoid false positives from cached data.",
  "Testing wisdom: Flaky tests are worse than no tests - they erode confidence in your test suite.",
  "Remember: Good tests are fast, independent, repeatable, self-validating, and timely (FIRST).",
  "Quality over quantity: 100 well-written tests are better than 1000 fragile ones.",
  "Test early, test often: Catching bugs in development is 100x cheaper than in production.",

  // PrinterPix Specific
  "PrinterPix serves customers across 7 countries with localized experiences for each region.",
  "Our authentication system handles thousands of logins daily across multiple regions.",
  "Each region has unique translations and currency settings that need thorough testing.",
  "Testing across QA and production ensures we catch environment-specific issues.",
  "Multi-region testing helps us deliver a consistent experience worldwide.",

  // Motivation
  "Good tests are the safety net that lets you refactor with confidence!",
  "Every test you write is a bug you're preventing in production.",
  "Testing isn't just about finding bugs - it's about ensuring great user experiences.",
  "Automated tests never get tired, never miss a step, and work 24/7.",
  "Your tests are running so your users don't find the bugs first!",

  // Technical Insights
  "Playwright can intercept network requests, making it perfect for testing different API responses.",
  "Page Object Model helps keep your tests maintainable by separating UI logic from test logic.",
  "Visual regression testing can catch UI bugs that functional tests might miss.",
  "Testing across different browsers ensures compatibility for all your users.",
  "Parallel test execution can reduce total test time from hours to minutes.",

  // Fun Facts
  "NASA's software development process has zero tolerance for bugs - they test extensively!",
  "Google runs over 4 million tests per day across their entire codebase.",
  "The average developer spends 50% of their time debugging. Good tests reduce this significantly!",
  "Selenium, one of the first browser automation tools, was created in 2004.",
  "The term 'smoke testing' comes from hardware testing - if it doesn't catch fire, it passes!",

  // More Testing Wisdom
  "Test data matters: Using realistic test data catches more edge cases.",
  "Authentication testing is critical - it's the gateway to your entire application.",
  "Cross-browser testing catches compatibility issues that hurt user experience.",
  "Failed tests are just as valuable as passing ones - they tell you what needs fixing!",
  "Continuous testing means continuous confidence in your deployments.",

  // Process Tips
  "Tests running... Time for a coffee break! ☕",
  "While tests run, remember: Every successful test is a high-five from your code!",
  "Testing patience pays off: Thorough tests mean fewer production emergencies.",
  "Your tests are checking authentication flows across multiple regions right now!",
  "Sit back and relax - automation is doing the repetitive work for you!",

  // Security & Auth
  "Authentication bugs can be costly - that's why we test it thoroughly!",
  "OAuth testing ensures third-party login flows work seamlessly for users.",
  "Password reset flows are critical - one bug can lock users out of their accounts.",
  "Testing sign-out ensures sessions are properly cleared and security is maintained.",
  "Multi-factor authentication adds security but needs careful testing to ensure usability.",

  // E-commerce Specific
  "A smooth login experience is crucial for e-commerce conversion rates.",
  "Cart abandonment often happens at the login step - testing it is vital!",
  "Region-specific testing ensures correct currency, shipping, and tax calculations.",
  "Performance matters: Slow authentication flows lead to user frustration.",
  "Trust is earned: Reliable authentication builds customer confidence.",
];

/**
 * Get a random trivia message
 * @returns {string} Random trivia message
 */
function getRandomTrivia() {
  const randomIndex = Math.floor(Math.random() * triviaMessages.length);
  return triviaMessages[randomIndex];
}

/**
 * Get multiple random trivia messages
 * @param {number} count - Number of messages to return
 * @returns {string[]} Array of random trivia messages
 */
function getMultipleTrivia(count = 5) {
  const shuffled = [...triviaMessages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get all trivia messages
 * @returns {string[]} All trivia messages
 */
function getAllTrivia() {
  return [...triviaMessages];
}

module.exports = {
  getRandomTrivia,
  getMultipleTrivia,
  getAllTrivia
};
