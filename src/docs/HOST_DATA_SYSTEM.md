# Host Data System Documentation

## Overview
The Host Data System provides a unified way to access all data needed for the 6 host screens. It follows the existing app patterns and provides consistent data management across all host screens.

## Architecture

### 1. Current Gathering Store (`src/stores/currentGatheringStore.ts`)
- Manages which gathering is currently being worked on
- Handles navigation between host screens
- Provides store priority with route params fallback
- Resets on app restart (no persistence)

### 2. Host Data Service (`src/services/hostDataService.ts`)
- Database operations for host-specific data
- Functions:
  - `fetchActiveMentors()` - Active mentors for user's gyld
  - `fetchGyldGatherings()` - Gatherings from 6 months ago to future
  - `fetchPlannedWorkflows()` - Workflows for specific gathering
  - `createNewGathering()` - Creates new gathering (for future use)

### 3. Data Hooks
- `useActiveMentors()` - Mentors with status='Mentor', approval='Accepted', not expired
- `useGyldGatherings()` - Gatherings in user's gyld (6 months back to future)
- `usePlannedWorkflows()` - Workflows for specific gathering ID
- `useHostData()` - Convenience hook combining all data

### 4. TypeScript Interfaces (`src/types/hostData.ts`)
- `ActiveMentor` - Enhanced mentor with status/approval info
- `PlannedWorkflow` - Workflow data structure
- `GyldGathering` - Enhanced gathering with satellite data
- `HostData` - Combined data interface

## Usage in Host Screens

```typescript
import { useHostData } from '../../hooks/useHostData';

export default function YourHostScreen() {
  const route = useRoute();
  
  const {
    gatheringDetail,      // Current gathering details
    gyldMembers,          // All members of current user's gyld
    activeMentors,        // Active approved mentors
    gyldGatherings,       // All gatherings in gyld
    plannedWorkflows,     // Workflows for current gathering
    loading,              // Combined loading state
    error,                // Combined error state
    gatheringId,          // Current gathering ID
    refresh               // Refresh all data
  } = useHostData(route.params);
  
  // Use the data in your component
  if (loading) return <LoadingComponent />;
  if (error) return <ErrorComponent message={error} />;
  
  return (
    <View>
      <Text>Gathering: {gatheringDetail?.gathering?.title}</Text>
      <Text>Members: {gyldMembers.length}</Text>
      <Text>Active Mentors: {activeMentors.length}</Text>
      <Text>Planned Workflows: {plannedWorkflows.length}</Text>
    </View>
  );
}
```

## Data Available

### Current User Data
- `current_user` - Available from `useAuthStore().user`
- `current_user.gyld` - Available from `useAuthStore().userGyld`

### Core Data
- **Gathering Details**: All fields from `gatherings`, `gathering_displays`, `gathering_other`
- **Gyld Members**: All members of current user's gyld
- **Active Mentors**: Filtered mentors (status=Mentor, approval=Accepted, not expired)
- **Gyld Gatherings**: All gatherings in gyld from 6 months ago to future
- **Planned Workflows**: All workflows for current gathering

### Search Capabilities
- **Gyld Members**: `users_public` where `gyld = current_user.gyld`
- **Active Mentors**: Complex query with status, approval, expiration, location matching
- **Gyld Gatherings**: Date range filtered gatherings ordered by start_time

## Navigation Integration

### Entry Points
1. **Existing Gathering**: Navigate with gathering ID
   ```typescript
   navigation.navigate('GatheringSetup', { gatheringId: 'existing-id' });
   ```

2. **New Gathering**: Create new gathering and navigate
   ```typescript
   // Create new gathering first, then navigate
   navigation.navigate('GatheringSetup', { gatheringId: 'new-id', isNew: true });
   ```

### Store Priority
- Hook checks store first, then route params
- Store is updated if gathering ID comes from route params
- Wrong gathering in memory is corrected when screen opens

## Data Flow

1. Screen calls `useHostData(route.params)`
2. Hook gets gathering ID from store or route params
3. Updates store if needed
4. Fetches all data using individual hooks
5. Returns combined data and states
6. Screen uses data and can call `refresh()` to update

## Error Handling
- Consistent error handling across all hooks
- Combined error state in `useHostData`
- Individual errors available from each hook
- Follows existing app error patterns

## Performance
- Data fetched only when needed
- No persistence (fresh data each session)
- Automatic cleanup when components unmount
- Efficient queries with proper joins and filtering

## Files Created/Modified

### New Files
- `src/stores/currentGatheringStore.ts`
- `src/services/hostDataService.ts`
- `src/hooks/useActiveMentors.ts`
- `src/hooks/useGyldGatherings.ts`
- `src/hooks/usePlannedWorkflows.ts`
- `src/hooks/useHostData.ts`
- `src/types/hostData.ts`

### Modified Files
- `src/stores/index.ts` - Added new store export
- `src/hooks/index.ts` - Added new hook exports
- `src/types/index.ts` - Added new type exports
- `src/screens/host/GatheringSetupScreen.tsx` - Added example usage

## Database Queries

### Active Mentors Query
```sql
SELECT m.*, ms.label as mentor_status_label, ma.label as mentor_approval_label
FROM mentors m
JOIN mentor_status ms ON m.mentor_status = ms.id
JOIN mentor_approval ma ON m.mentor_approval = ma.id
WHERE ms.label = 'Mentor' 
  AND ma.label = 'Accepted'
  AND (m.approval_expires_at IS NULL OR m.approval_expires_at > NOW())
  AND (m.gyld = $1 OR (m.metro = $2 AND m.gyld_type = $3))
```

### Gyld Gatherings Query
```sql
SELECT * FROM gatherings 
WHERE gyld = $1 
  AND start_time >= NOW() - INTERVAL '6 months'
ORDER BY start_time ASC
```

### Planned Workflows Query
```sql
SELECT * FROM planned_workflows 
WHERE gathering_id = $1
ORDER BY created_at ASC
```

## Best Practices

1. **Always use `useHostData(route.params)`** in host screens
2. **Check loading and error states** before rendering data
3. **Use `refresh()` after data updates** to sync all data
4. **Handle empty states** gracefully
5. **Follow existing error patterns** in the app 