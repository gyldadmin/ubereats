import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface PushTokenServiceResponse {
  success: boolean;
  message: string;
  token?: string;
  error?: string;
}

export interface PushPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

/**
 * Client-side service for managing push notification tokens and permissions
 * This handles the client-side aspects while the actual sending is done server-side
 */
export class PushTokenService {
  
  /**
   * Request push notification permissions and get token
   */
  public async requestPermissionAndGetToken(): Promise<PushTokenServiceResponse> {
    try {
      console.log('PushTokenService: Requesting push notification permissions');

             // Check if device supports push notifications
       if (!Device.isDevice) {
         return {
           success: false,
           message: 'Push notifications are not supported on this device (simulator/emulator)',
           error: 'DEVICE_NOT_SUPPORTED'
         };
       }

      // Request permissions
      const permissionStatus = await this.requestPermissions();
      
      if (!permissionStatus.granted) {
        return {
          success: false,
          message: 'Push notification permission denied',
          error: 'PERMISSION_DENIED'
        };
      }

      // Get push token
      const tokenResult = await this.getExpoPushToken();
      
      if (!tokenResult.success || !tokenResult.token) {
        return {
          success: false,
          message: 'Failed to get push token',
          error: tokenResult.error
        };
      }

      // Store token in database
      const storeResult = await this.storePushToken(tokenResult.token);
      
      if (!storeResult.success) {
        return {
          success: false,
          message: 'Got push token but failed to store it',
          error: storeResult.error,
          token: tokenResult.token
        };
      }

      console.log('PushTokenService: Successfully registered for push notifications');
      
      return {
        success: true,
        message: 'Push notifications enabled successfully',
        token: tokenResult.token
      };

    } catch (error) {
      console.error('PushTokenService: Error in requestPermissionAndGetToken', error);
      return {
        success: false,
        message: 'Failed to setup push notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check current push notification permission status
   */
     public async checkPermissionStatus(): Promise<PushPermissionStatus> {
     try {
       const settings = await Notifications.getPermissionsAsync();
       
       return {
         granted: settings.granted,
         canAskAgain: settings.canAskAgain,
         status: settings.granted ? 'granted' : settings.canAskAgain ? 'undetermined' : 'denied'
       };
     } catch (error) {
       console.error('PushTokenService: Error checking permission status', error);
       return {
         granted: false,
         canAskAgain: false,
         status: 'denied'
       };
     }
   }

  /**
   * Get current push token from storage
   */
  public async getCurrentToken(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('PushTokenService: No authenticated user found');
        return null;
      }

      const { data, error } = await supabase
        .from('users_private')
        .select('push_token')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('PushTokenService: Error fetching current token', error);
        return null;
      }

      return data?.push_token || null;
    } catch (error) {
      console.error('PushTokenService: Error in getCurrentToken', error);
      return null;
    }
  }

  /**
   * Disable push notifications (remove token and update database)
   */
  public async disablePushNotifications(): Promise<PushTokenServiceResponse> {
    try {
      console.log('PushTokenService: Disabling push notifications');

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'No authenticated user found',
          error: 'NO_USER'
        };
      }

      // Update database to disable push notifications
      const { error } = await supabase
        .from('users_private')
        .update({ 
          push_enabled: false,
          push_token: null
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('PushTokenService: Error disabling push notifications', error);
        return {
          success: false,
          message: 'Failed to disable push notifications',
          error: error.message
        };
      }

      console.log('PushTokenService: Push notifications disabled successfully');
      
      return {
        success: true,
        message: 'Push notifications disabled successfully'
      };

    } catch (error) {
      console.error('PushTokenService: Error in disablePushNotifications', error);
      return {
        success: false,
        message: 'Failed to disable push notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Private helper methods
   */

     private async requestPermissions(): Promise<PushPermissionStatus> {
     try {
       // First check current status
       let settings = await Notifications.getPermissionsAsync();
       
       // If not determined or can ask again, request permissions
       if (!settings.granted && settings.canAskAgain) {
         console.log('PushTokenService: Requesting push notification permissions');
         settings = await Notifications.requestPermissionsAsync();
       }

       // Configure notification handling for Android
       if (Platform.OS === 'android') {
         await Notifications.setNotificationChannelAsync('default', {
           name: 'Default',
           importance: Notifications.AndroidImportance.MAX,
           vibrationPattern: [0, 250, 250, 250],
           lightColor: '#FF231F7C',
         });
       }

       return {
         granted: settings.granted,
         canAskAgain: settings.canAskAgain,
         status: settings.granted ? 'granted' : settings.canAskAgain ? 'undetermined' : 'denied'
       };
     } catch (error) {
       console.error('PushTokenService: Error requesting permissions', error);
       return {
         granted: false,
         canAskAgain: false,
         status: 'denied'
       };
     }
   }

     private async getExpoPushToken(): Promise<PushTokenServiceResponse> {
     try {
       console.log('PushTokenService: Getting Expo push token');
       
       const token = await Notifications.getExpoPushTokenAsync({
         projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Make sure this is set in your environment
       });

       if (!token.data) {
         return {
           success: false,
           message: 'Failed to get push token from Expo',
           error: 'NO_TOKEN_RECEIVED'
         };
       }

       console.log('PushTokenService: Received push token', { 
         tokenPreview: token.data.substring(0, 20) + '...' 
       });

       return {
         success: true,
         message: 'Push token received successfully',
         token: token.data
       };

     } catch (error) {
       console.error('PushTokenService: Error getting push token', error);
       return {
         success: false,
         message: 'Failed to get push token',
         error: error instanceof Error ? error.message : 'Unknown error'
       };
     }
   }

  private async storePushToken(token: string): Promise<PushTokenServiceResponse> {
    try {
      console.log('PushTokenService: Storing push token in database');

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'No authenticated user found',
          error: 'NO_USER'
        };
      }

      // Update or insert push token in users_private table
      const { error } = await supabase
        .from('users_private')
        .upsert({
          user_id: user.id,
          push_token: token,
          push_enabled: true
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('PushTokenService: Error storing push token', error);
        return {
          success: false,
          message: 'Failed to store push token',
          error: error.message
        };
      }

      console.log('PushTokenService: Push token stored successfully');
      
      return {
        success: true,
        message: 'Push token stored successfully'
      };

    } catch (error) {
      console.error('PushTokenService: Error in storePushToken', error);
      return {
        success: false,
        message: 'Failed to store push token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const pushTokenService = new PushTokenService(); 