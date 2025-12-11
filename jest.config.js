module.exports = {
    testEnvironment: "node",
  
    // Only run inventory module tests
    testMatch: ["**/utils/inv/__tests__/**/*.test.js"],
  
    // Only collect coverage from inventory module
    collectCoverageFrom: ["utils/inv/src/**/*.js"],
  
    // Completely ignore the rest of your huge backend
    modulePathIgnorePatterns: [
      "<rootDir>/controlers/",
      "<rootDir>/routes/",
      "<rootDir>/models/",
      "<rootDir>/public/",
      "<rootDir>/config/",
      "<rootDir>/utils/reports/",
      "<rootDir>/utils/print/",
    ],
  
    coveragePathIgnorePatterns: [
      "<rootDir>/controlers/",
      "<rootDir>/routes/",
      "<rootDir>/models/",
      "<rootDir>/public/",
      "<rootDir>/config/",
      "<rootDir>/utils/reports/",
      "<rootDir>/utils/print/",
    ],
  };