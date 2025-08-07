/**
 * Repository Index - Centralized exports for all repository classes
 * 
 * This provides a single import point for all repository classes and their types.
 */

// Repository Classes
export { StatusRepository, statusRepository } from './StatusRepository';
export { UserRepository, userRepository } from './UserRepository';
export { WorkflowRepository, workflowRepository } from './WorkflowRepository';

// Type Definitions
export type {
    UserContactInfo, UserEmailInfo,
    UserPhoneInfo, UserPreferences
} from './UserRepository';

export type {
    WorkflowRecord,
    WorkflowTypeLookup,
    WorkflowUpdateData
} from './WorkflowRepository';

export type {
    GatheringStatus,
    StatusOption, StatusOptionLookup
} from './StatusRepository';

// Repository Interface (for dependency injection)
export interface Repositories {
  userRepository: InstanceType<typeof UserRepository>;
  workflowRepository: InstanceType<typeof WorkflowRepository>;
  statusRepository: InstanceType<typeof StatusRepository>;
}

// Default repositories instance
export const repositories: Repositories = {
  userRepository,
  workflowRepository,
  statusRepository
};