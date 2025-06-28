# Zustand Global State Management

This directory contains the global state management setup using Zustand. It provides type-safe, persistent state management across your React Native app.

## 🚀 Quick Start

```typescript
import { useUserState, useAppSettings } from '../hooks/useGlobalState';

function MyComponent() {
  const { user, isAuthenticated, setUser } = useUserState();
  const { settings, setTheme } = useAppSettings();
  
  // Use the state and actions...
}
```

## 📁 File Structure

```
src/stores/
├── globalStore.ts     # Main Zustand store with all state and actions
├── index.ts          # Export file
└── README.md         # This file

src/hooks/
└── useGlobalState.ts # Convenience hooks for using the store
```

## 🎯 Available State

### User State
- `user: User | null` - Current user information
- `isAuthenticated: boolean` - Authentication status

### App Settings
- `settings.theme` - 'light' | 'dark' | 'system'
- `settings.language` - 'en' | 'es' | 'fr'
- `settings.notifications` - Push, email, gathering preferences
- `settings.privacy` - Profile visibility, location sharing

### UI State
- `isLoading: boolean` - Global loading state
- `networkStatus` - 'online' | 'offline'

### Cache
- `cache.restaurants[]` - Cached restaurant data
- `cache.gatherings[]` - Cached gathering data
- `cache.lastUpdated` - Timestamps for cache freshness

## 🪝 Available Hooks

### 1. `useUserState()` - User Management
```typescript
const { 
  user, 
  isAuthenticated, 
  setUser, 
  setAuthenticated, 
  logout 
} = useUserState();
```

### 2. `useAppSettings()` - Settings Management
```typescript
const { 
  settings, 
  updateSettings, 
  setTheme, 
  setLanguage, 
  toggleNotifications 
} = useAppSettings();
```

### 3. `useLoadingState()` - Loading Management
```typescript
const { 
  isLoading, 
  setLoading, 
  startLoading, 
  stopLoading 
} = useLoadingState();
```

### 4. `useCacheState()` - Cache Management
```typescript
const { 
  cache, 
  updateCache, 
  clearCache, 
  updateRestaurants, 
  updateGatherings, 
  isCacheStale 
} = useCacheState();
```

### 5. `useNetworkState()` - Network Status
```typescript
const { 
  networkStatus, 
  setNetworkStatus, 
  isOnline, 
  isOffline 
} = useNetworkState();
```

### 6. `useGlobalState()` - Everything
```typescript
const globalState = useGlobalState();
// Contains all state and actions
```

## 💾 Persistence

The store automatically persists:
- ✅ User data
- ✅ Authentication status
- ✅ App settings
- ✅ Cache data

Does NOT persist:
- ❌ Loading states (reset on app restart)
- ❌ Network status (detected on app start)

## 🔄 Integration with AuthContext

The Zustand store works alongside your existing AuthContext. You can:

1. **Gradually migrate**: Use both systems during transition
2. **Sync data**: Update Zustand store when AuthContext changes
3. **Replace gradually**: Move auth logic to Zustand over time

Example integration:
```typescript
// In AuthContext
const { setUser, setAuthenticated } = useGlobalActions();

const signIn = async (email, password) => {
  const user = await supabaseSignIn(email, password);
  
  // Update both systems
  setAuthUser(user);           // AuthContext
  setUser(user);               // Zustand
  setAuthenticated(true);      // Zustand
};
```

## 🎨 Usage Examples

### Basic Component
```typescript
import { useUserState } from '../hooks/useGlobalState';

export const ProfileScreen = () => {
  const { user, isAuthenticated } = useUserState();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return (
    <ScreenLayout>
      <Typography variant="h1">Welcome {user?.fullName}</Typography>
    </ScreenLayout>
  );
};
```

### Settings Screen
```typescript
import { useAppSettings } from '../hooks/useGlobalState';

export const SettingsScreen = () => {
  const { settings, setTheme, toggleNotifications } = useAppSettings();
  
  return (
    <ScreenLayout>
      <Button onPress={() => setTheme('dark')}>
        Dark Theme
      </Button>
      
      <Switch
        value={settings.notifications.push}
        onValueChange={() => toggleNotifications('push')}
      />
    </ScreenLayout>
  );
};
```

### Loading Management
```typescript
import { useLoadingState } from '../hooks/useGlobalState';

export const DataScreen = () => {
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  
  const fetchData = async () => {
    startLoading();
    try {
      await loadData();
    } finally {
      stopLoading();
    }
  };
  
  return (
    <ScreenLayout>
      <Button loading={isLoading} onPress={fetchData}>
        Load Data
      </Button>
    </ScreenLayout>
  );
};
```

### Cache Management
```typescript
import { useCacheState } from '../hooks/useGlobalState';

export const RestaurantList = () => {
  const { cache, updateRestaurants, isCacheStale } = useCacheState();
  
  useEffect(() => {
    if (isCacheStale('restaurants')) {
      fetchAndCacheRestaurants();
    }
  }, []);
  
  const fetchAndCacheRestaurants = async () => {
    const restaurants = await fetchRestaurants();
    updateRestaurants(restaurants);
  };
  
  return (
    <ScreenLayout>
      {cache.restaurants.map(restaurant => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </ScreenLayout>
  );
};
```

## 🛠️ Advanced Usage

### Custom Selectors
```typescript
import { useGlobalStore } from '../stores';

// Only re-render when user name changes
const userName = useGlobalStore(state => state.user?.fullName);

// Multiple values with shallow comparison
const userInfo = useGlobalStore(
  state => ({ 
    name: state.user?.fullName, 
    email: state.user?.email 
  }),
  shallow
);
```

### Subscribing to Changes
```typescript
import { useGlobalStore } from '../stores';

useEffect(() => {
  const unsubscribe = useGlobalStore.subscribe(
    (state) => state.user,
    (user) => {
      console.log('User changed:', user);
    }
  );
  
  return unsubscribe;
}, []);
```

## 🚨 Best Practices

1. **Use specific hooks**: Prefer `useUserState()` over `useGlobalState()` for better performance
2. **Avoid over-subscribing**: Only subscribe to the state you actually need
3. **Cache wisely**: Use `isCacheStale()` to avoid unnecessary API calls
4. **Type safety**: Always use the provided TypeScript interfaces
5. **Persistence**: Remember that some state persists across app restarts

## 🔧 Troubleshooting

### State not persisting?
- Check that you're using the correct hook
- Verify AsyncStorage permissions
- Clear app storage if needed: `npx react-native run-android --reset-cache`

### Performance issues?
- Use specific hooks instead of `useGlobalState()`
- Check if you're subscribing to too much state
- Use selectors for complex derived state

### TypeScript errors?
- Import types from `../stores`
- Check that your User interface matches the store definition
- Ensure proper typing for cache data 