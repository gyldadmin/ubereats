# Testing Playbook for Gyld Native App

## 🎯 Overview
This playbook explains exactly how to test your React Native app as you build features. Follow this guide to catch bugs early and build with confidence.

## 🚀 Quick Start Commands

### Daily Development Commands
```bash
# Check TypeScript errors (run this first every day)
npm run type-check

# Fix code formatting and basic issues
npm run lint:fix

# Run all tests
npm run test

# Run tests in watch mode (auto-runs when files change)
npm run test:watch
```

## 📋 Testing Workflow for New Features

### Phase 1: Before You Start Coding
1. **Run type check**: `npm run type-check`
2. **Fix any existing issues**: `npm run lint:fix`
3. **Ensure all tests pass**: `npm run test`

### Phase 2: While Coding (Real-Time)
Your IDE will now show:
- ❌ **Red squiggles** = TypeScript errors (fix immediately)
- ⚠️ **Yellow squiggles** = ESLint warnings (fix when convenient)
- 🎨 **Auto-formatting** = Prettier formats on save

### Phase 3: After Completing a Feature
1. **Write tests for the new feature** (see examples below)
2. **Run tests**: `npm run test`
3. **Check coverage**: `npm run test:coverage`
4. **Final lint check**: `npm run lint`

## 🧪 What to Test (Priority Order)

### 1. **High Priority** - Always Test These
- **Business logic functions** (calculations, data transformations)
- **API service functions** (database queries, external calls)
- **Critical user flows** (authentication, RSVP, notifications)
- **Utility functions** (date formatting, validation)

### 2. **Medium Priority** - Test When Time Permits
- **Complex components** (forms, sliders, modals)
- **State management** (hooks, stores)
- **Error handling** (edge cases, network failures)

### 3. **Low Priority** - Usually Skip
- **Simple display components** (just showing data)
- **Styling and layout** (visual testing is better)
- **Third-party library wrappers**

## 📝 Test Examples for Your App

### Testing a Utility Function
```typescript
// src/utils/__tests__/dateHelpers.test.ts
import { formatGatheringDate } from '../dateHelpers';

describe('formatGatheringDate', () => {
  test('should format date correctly', () => {
    const date = new Date('2024-01-15T19:30:00Z');
    expect(formatGatheringDate(date)).toBe('Jan 15, 7:30 PM');
  });

  test('should handle invalid date', () => {
    expect(formatGatheringDate(null)).toBe('TBD');
  });
});
```

### Testing a Service Function
```typescript
// src/services/__tests__/gatheringService.test.ts
import { createGathering } from '../gatheringService';

describe('createGathering', () => {
  test('should create gathering successfully', async () => {
    const gatheringData = {
      title: 'Test Event',
      date: '2024-01-15',
      location: 'Test Location'
    };

    const result = await createGathering(gatheringData);
    
    expect(result.success).toBe(true);
    expect(result.gathering.title).toBe('Test Event');
  });

  test('should handle validation errors', async () => {
    const invalidData = { title: '' }; // Missing required fields
    
    const result = await createGathering(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Title is required');
  });
});
```

### Testing a React Component
```typescript
// src/components/__tests__/CustomButton.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomButton } from '../CustomButton';

describe('CustomButton', () => {
  test('should call onPress when tapped', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <CustomButton onPress={mockPress} title="Test Button" />
    );

    fireEvent.press(getByText('Test Button'));
    
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  test('should be disabled when loading', () => {
    const { getByText } = render(
      <CustomButton title="Test" loading={true} onPress={jest.fn()} />
    );

    const button = getByText('Test');
    expect(button).toBeDisabled();
  });
});
```

### Testing a Custom Hook
```typescript
// src/hooks/__tests__/useGatheringDetail.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useGatheringDetail } from '../useGatheringDetail';

describe('useGatheringDetail', () => {
  test('should fetch gathering data', async () => {
    const { result } = renderHook(() => useGatheringDetail('test-id'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.gatheringDetail).toBeDefined();
    });
  });
});
```

## 🔧 Troubleshooting Common Issues

### Tests Won't Run
```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors in Tests
- Make sure test files end with `.test.ts` or `.test.tsx`
- Import types: `import type { GatheringData } from '../types'`
- Use `jest.fn()` for mock functions

### ESLint Errors
```bash
# Auto-fix most issues
npm run lint:fix

# Disable specific rules if needed (add to .eslintrc.js)
"rules": {
  "@typescript-eslint/no-explicit-any": "off"
}
```

## 📊 Measuring Success

### Daily Checks
- ✅ No TypeScript errors: `npm run type-check`
- ✅ All tests pass: `npm run test`
- ✅ No ESLint errors: `npm run lint`

### Weekly Reviews
- 📈 Test coverage above 70%: `npm run test:coverage`
- 🐛 Zero critical bugs in production
- ⚡ Fast development velocity (fewer debugging sessions)

## 🎯 Testing Strategy for Your Email Component Example

When you build the `WriteEmail` component:

1. **Test the component architecture first**:
   ```typescript
   test('should render different recipient types', () => {
     const { getByText } = render(
       <WriteEmail type="predefined_recipients" recipientLabel="All Members" />
     );
     expect(getByText('To: All Members')).toBeTruthy();
   });
   ```

2. **Test the form logic**:
   ```typescript
   test('should validate required fields', () => {
     const mockSubmit = jest.fn();
     const { getByText, getByPlaceholderText } = render(
       <WriteEmail onSubmit={mockSubmit} />
     );
     
     fireEvent.press(getByText('Send'));
     expect(mockSubmit).not.toHaveBeenCalled(); // Should not submit without subject
   });
   ```

3. **Test the service integration**:
   ```typescript
   test('should call email service with correct data', async () => {
     const mockEmailService = jest.spyOn(EmailService, 'send');
     // ... test implementation
   });
   ```

## 🚨 Red Flags - When to Stop and Test

Stop coding and write tests immediately if:
- 🔥 You're debugging the same issue repeatedly
- 🔄 You're afraid to refactor because things might break
- 😰 You're not sure if your changes broke something else
- 🐛 You found a bug that could have been caught by a test

## 💡 Pro Tips

1. **Test-Driven Development**: For complex features, write the test first, then implement
2. **One test per behavior**: Don't test multiple things in one test
3. **Use descriptive test names**: "should create gathering when all fields are valid"
4. **Mock external dependencies**: Database calls, API requests, file system
5. **Test edge cases**: Empty strings, null values, network failures

---

## 🎉 You're Ready!

With this setup, you now have:
- ✅ **Real-time error detection** in your IDE
- ✅ **Automated testing** with Jest
- ✅ **Code quality enforcement** with ESLint
- ✅ **Consistent formatting** with Prettier
- ✅ **Type safety** with TypeScript

Start with the daily commands and gradually build your testing habits. Your development speed will increase dramatically once you get comfortable with this workflow!