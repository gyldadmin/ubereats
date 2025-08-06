// Example test file to verify Jest setup
describe('Example Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle string operations', () => {
    const text = 'Hello World';
    expect(text.toLowerCase()).toBe('hello world');
  });
});

// Example of testing a simple utility function
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

describe('formatDate utility', () => {
  test('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date)).toBe('2024-01-15');
  });
});