// Detox init for Jest (Detox 20+)
const detox = require('detox');
const config = require('../.detoxrc.json');

beforeAll(async () => {
  await detox.init(config);
}, 300000);

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
