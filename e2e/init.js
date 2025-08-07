// Detox init file
import { afterAll, beforeAll, jasmine } from '@jest/globals';
import detox from 'detox';
import adapter from 'detox/runners/jest/adapter';
import config from '../.detoxrc.json';

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
