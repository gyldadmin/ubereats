// Detox init file
const { afterAll, beforeAll, jasmine } = require('@jest/globals');
const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const config = require('../.detoxrc.json');

jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
});

// Capture console errors during E2E to fail tests automatically
if (process.env.E2E) {
  const errors = [];
  const origError = console.error;
  console.error = (...args) => {
    errors.push(args.join(' '));
    origError(...args);
  };

  afterAll(() => {
    if (errors.length) {
      throw new Error('Runtime JS errors:\n' + errors.join('\n'));
    }
  });
}
