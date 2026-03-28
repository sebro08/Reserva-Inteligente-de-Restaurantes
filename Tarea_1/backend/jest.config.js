module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/model/**",
    "!src/database/**",
    "!src/middleware/**",
    "!src/routes/**",
    "!src/index.ts",
    "!src/swagger.ts",
    "!src/integration/**"
  ],
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["**/tests/**/*.test.ts"],
      collectCoverageFrom: [
        "src/**/*.ts",
        "!src/model/**",
        "!src/database/**",
        "!src/middleware/**",
        "!src/routes/**",
        "!src/index.ts",
        "!src/swagger.ts",
        "!src/integration/**"
      ],
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["**/integration/**/*.test.ts"],
      reporters: [
        "default",
        ["jest-html-reporter", {
          pageTitle: "Integration Test Report",
          outputPath: "test-report.html"
        }]
      ]
    }
  ]
};