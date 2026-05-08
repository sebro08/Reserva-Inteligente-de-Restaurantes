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

  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

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

      setupFilesAfterEnv: ["<rootDir>/src/jest.setup.ts"],

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