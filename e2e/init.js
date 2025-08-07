// Detox 20+: The Jest testEnvironment manages init/cleanup.
// We keep only a console-error trap to fail tests on runtime errors.
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
