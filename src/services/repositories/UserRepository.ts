/**
 * UserRepository - Handles all user-related database operations
 * 
 * This repository centralizes user data access, including:
 * - Fetching user email addresses
 * - Fetching user phone numbers
 * - Fetching user preferences and profiles
 * - User authentication status checks
 */

import { supabase } from '../supabase';

export interface UserEmailInfo {
  user_id: string;
  email: string;
  first_name?: string;
}

export interface UserPhoneInfo {
  user_id: string;
  phone_number: string;
  first_name?: string;
}

export interface UserContactInfo {
  user_id: string;
  email?: string;
  phone_number?: string;
  first_name?: string;
}

export interface UserPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
}

export class UserRepository {
  
  /**
   * Get user email addresses for given user IDs
   * Filters out users without valid email addresses
   */
  async getUserEmails(userIds: string[]): Promise<UserEmailInfo[]> {
    console.log('UserRepository: Fetching user emails', { userCount: userIds.length });

    // Handle empty input early
    if (userIds.length === 0) {
      console.log('UserRepository: Empty user ID list provided, returning empty result');
      return [];
    }

    const { data, error } = await supabase
      .from('users_public')
      .select('user_id, email, first_name')
      .in('user_id', userIds)
      .not('email', 'is', null);

    if (error) {
      console.error('UserRepository: Error fetching user emails', error);
      throw new Error(`Failed to fetch user emails: ${error.message}`);
    }

    const validEmails = (data || []).filter(user => user.email);

    console.log('UserRepository: Valid user emails found', {
      total: data?.length || 0,
      valid: validEmails.length
    });

    return validEmails as UserEmailInfo[];
  }

  /**
   * Get user phone numbers for given user IDs
   * Filters out users without valid phone numbers
   */
  async getUserPhones(userIds: string[]): Promise<UserPhoneInfo[]> {
    console.log('UserRepository: Fetching user phone numbers', { userCount: userIds.length });

    const { data, error } = await supabase
      .from('users_internal')
      .select('user_id, phone_number, first_name')
      .in('user_id', userIds)
      .not('phone_number', 'is', null);

    if (error) {
      console.error('UserRepository: Error fetching user phone numbers', error);
      throw new Error(`Failed to fetch user phone numbers: ${error.message}`);
    }

    const validPhones = (data || []).filter(user => 
      user.phone_number && user.phone_number.trim() !== ''
    );

    console.log('UserRepository: Valid user phone numbers found', {
      total: data?.length || 0,
      valid: validPhones.length
    });

    return validPhones as UserPhoneInfo[];
  }

  /**
   * Get combined contact information for given user IDs
   * Includes email, phone, and basic profile data
   */
  async getUserContactInfo(userIds: string[]): Promise<UserContactInfo[]> {
    console.log('UserRepository: Fetching user contact info', { userCount: userIds.length });

    // Get email info from users_public
    const emailPromise = supabase
      .from('users_public')
      .select('user_id, email, first_name')
      .in('user_id', userIds);

    // Get phone info from users_internal
    const phonePromise = supabase
      .from('users_internal')
      .select('user_id, phone_number')
      .in('user_id', userIds);

    const [emailResult, phoneResult] = await Promise.all([emailPromise, phonePromise]);

    if (emailResult.error) {
      console.error('UserRepository: Error fetching user emails for contact info', emailResult.error);
      throw new Error(`Failed to fetch user contact info: ${emailResult.error.message}`);
    }

    if (phoneResult.error) {
      console.error('UserRepository: Error fetching user phones for contact info', phoneResult.error);
      throw new Error(`Failed to fetch user contact info: ${phoneResult.error.message}`);
    }

    // Merge email and phone data
    const contactInfo: UserContactInfo[] = [];
    const emailMap = new Map(
      (emailResult.data || []).map(user => [user.user_id, user])
    );
    const phoneMap = new Map(
      (phoneResult.data || []).map(user => [user.user_id, user])
    );

    // Combine data for all requested users
    for (const userId of userIds) {
      const emailData = emailMap.get(userId);
      const phoneData = phoneMap.get(userId);

      if (emailData || phoneData) {
        contactInfo.push({
          user_id: userId,
          email: emailData?.email || undefined,
          phone_number: phoneData?.phone_number || undefined,
          first_name: emailData?.first_name || undefined
        });
      }
    }

    console.log('UserRepository: User contact info compiled', {
      requested: userIds.length,
      found: contactInfo.length
    });

    return contactInfo;
  }

  /**
   * Get notification preferences for given user IDs
   */
  async getUserPreferences(userIds: string[]): Promise<UserPreferences[]> {
    console.log('UserRepository: Fetching user preferences', { userCount: userIds.length });

    const { data, error } = await supabase
      .from('user_preferences')
      .select('user_id, email_notifications, push_notifications, sms_notifications')
      .in('user_id', userIds);

    if (error) {
      console.error('UserRepository: Error fetching user preferences', error);
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }

    console.log('UserRepository: User preferences found', {
      requested: userIds.length,
      found: data?.length || 0
    });

    return (data || []) as UserPreferences[];
  }

  /**
   * Check if users are active/enabled
   * Returns only active user IDs
   */
  async getActiveUsers(userIds: string[]): Promise<string[]> {
    console.log('UserRepository: Checking active users', { userCount: userIds.length });

    const { data, error } = await supabase
      .from('users_public')
      .select('user_id')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (error) {
      console.error('UserRepository: Error checking active users', error);
      throw new Error(`Failed to check active users: ${error.message}`);
    }

    const activeUserIds = (data || []).map(user => user.user_id);

    console.log('UserRepository: Active users found', {
      requested: userIds.length,
      active: activeUserIds.length
    });

    return activeUserIds;
  }

  /**
   * Get user by ID with full profile information
   */
  async getUserById(userId: string): Promise<UserContactInfo | null> {
    console.log('UserRepository: Fetching user by ID', { userId });

    const contactInfo = await this.getUserContactInfo([userId]);
    return contactInfo.length > 0 ? contactInfo[0] || null : null;
  }

  /**
   * Check if user exists and is active
   */
  async isUserActive(userId: string): Promise<boolean> {
    const activeUsers = await this.getActiveUsers([userId]);
    return activeUsers.includes(userId);
  }
}

// Export singleton instance for convenience
export const userRepository = new UserRepository();