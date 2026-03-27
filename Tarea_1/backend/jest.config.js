module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
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
        "!src/index.ts"
      ],
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["**/integration/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/src/integration/setup.ts"],
    }
  ]
};