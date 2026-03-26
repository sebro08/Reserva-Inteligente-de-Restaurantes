module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/model/**",
    "!src/database/**",
    "!src/middleware/**",
    "!src/routes/**",
    "!src/index.ts"
  ]
};