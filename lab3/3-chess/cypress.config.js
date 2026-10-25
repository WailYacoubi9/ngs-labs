import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  video: false,
  reporter: 'mochawesome',
  defaultCommandTimeout: 1000,
  e2e: {
    // The tests use no custom command, so no support file is needed
    supportFile: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
