# Contributing to Melodyx

Thank you for your interest in contributing to Melodyx! This document provides guidelines and best practices for contributing to the project.

## Table of Contents
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Architecture Overview](#architecture-overview)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## Development Setup

### Prerequisites
- Node.js 18+ or Bun
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation
```bash
# Install dependencies
bun install

# Start the development server
bun start

# Run on web
bun start-web
```

## Code Style Guidelines

### TypeScript
- Use strict TypeScript typing - avoid `any` types
- Use explicit type annotations for useState: `useState<Type[]>([])`
- Use interfaces for object types, type aliases for unions/primitives
- Use `as const` for literal values used in styles

```typescript
// Good
const [items, setItems] = useState<Item[]>([]);
const fontWeight = 'bold' as const;

// Bad
const [items, setItems] = useState([]);
```

### React Components
- Use functional components with hooks
- Use React.memo for components that don't need frequent re-renders
- Use useMemo and useCallback for expensive computations
- Add testID props for testing

```typescript
const MyComponent = React.memo(function MyComponent({ data }: Props) {
  const processedData = useMemo(() => expensiveOperation(data), [data]);
  const handlePress = useCallback(() => { /* ... */ }, []);
  
  return <View testID="my-component">{/* ... */}</View>;
});
```

### State Management
- Use React Query for server state
- Use @nkzw/create-context-hook for shared state
- Use useState for local component state
- Avoid prop drilling - use contexts appropriately

### File Organization
```
/app                 # Expo Router pages
  /(tabs)            # Tab navigation screens
  _layout.tsx        # Root layout
/components          # Reusable UI components
/contexts            # React contexts and providers
/hooks               # Custom React hooks
/utils               # Utility functions
/constants           # Constants, types, mock data
/docs                # Documentation
/__tests__           # Test files
```

### Naming Conventions
- Components: PascalCase (`GameCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAudio.ts`)
- Utilities: camelCase (`gameLogic.ts`)
- Constants: SCREAMING_SNAKE_CASE for values, PascalCase for types

### Styling
- Use React Native StyleSheet
- Keep styles at the bottom of component files
- Use the Colors constants from `@/constants/colors`

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
```

## Architecture Overview

### State Management Layers
1. **Server State**: React Query for API data
2. **App State**: Context providers for user, game, purchases
3. **Local State**: useState for component-specific state

### Navigation
- Expo Router file-based routing
- Tab navigation in `app/(tabs)`
- Stack navigation within tabs
- Modal screens in root layout

### Audio System
- useAudio hook for melody playback
- Instrument context for sound selection
- Audio snippets for game sounds

## Testing Guidelines

### Unit Tests
```typescript
// __tests__/gameLogic.test.ts
describe('evaluateGuess', () => {
  it('should mark correct notes as correct', () => {
    const result = evaluateGuess([...], [...]);
    expect(result[0].status).toBe('correct');
  });
});
```

### Component Tests
```typescript
// __tests__/components.test.tsx
describe('GameCard', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<GameCard />);
    expect(getByTestId('game-card')).toBeTruthy();
  });
});
```

### Running Tests
```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test file
bun test gameLogic.test.ts
```

## Pull Request Process

### Before Submitting
1. Run linting: `bun lint`
2. Run tests: `bun test`
3. Check TypeScript: `bunx tsc --noEmit`
4. Test on both iOS and Android if possible

### PR Requirements
- Clear description of changes
- Link to related issue (if applicable)
- Screenshots for UI changes
- Tests for new functionality

### Commit Messages
Use conventional commits:
```
feat: add new melody sharing feature
fix: resolve audio playback issue on iOS
docs: update API documentation
refactor: simplify game logic evaluation
test: add unit tests for validation utils
```

### Review Process
1. Automated checks must pass
2. At least one approval required
3. No unresolved comments
4. Squash merge preferred

## Accessibility

- Add accessibilityLabel to all interactive elements
- Use proper accessibilityRole
- Ensure minimum touch target of 44x44
- Support reduced motion preferences
- Test with screen readers

```typescript
<TouchableOpacity
  accessibilityLabel="Play melody"
  accessibilityRole="button"
  accessibilityHint="Plays the current melody"
  style={styles.button}
  onPress={handlePlay}
>
```

## Performance

- Use React.memo for pure components
- Implement virtualization for long lists (FlatList)
- Lazy load heavy components
- Minimize re-renders with proper dependency arrays
- Profile using React DevTools

## Questions?

If you have questions about contributing, feel free to open an issue for discussion.
