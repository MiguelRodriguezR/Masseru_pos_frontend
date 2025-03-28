import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 10000,
  video: true,
  reporter: "mocha-multi-reporters",
  reporterOptions: {
    reporterEnabled: "spec, mocha-junit-reporter",
    mochaJunitReporterReporterOptions: {
      mochaFile: "cypress/results/junit/test-results.xml",
      toConsole: false
    }
  },
  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      // implementa los event listeners aquí
    },
  },
});
