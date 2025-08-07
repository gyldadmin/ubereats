/**
 * Manual Test Utility for Personalized Messaging
 * 
 * This utility provides manual testing functions that can be called to validate
 * the personalized messaging functionality in a more realistic environment.
 * 
 * Usage:
 * - Import and call these functions from a test script or development environment
 * - Each function demonstrates a different aspect of personalized messaging
 * - Results are logged to console for manual verification
 */

import type { ScheduleTaskInput } from '../scheduler';
import { CentralScheduler } from '../scheduler';

export class PersonalizedMessagingTester {
  private scheduler: CentralScheduler;

  constructor() {
    this.scheduler = new CentralScheduler();
  }

  /**
   * Test 1: Basic Individual Email Scheduling
   * Demonstrates scheduling personalized emails with custom variables
   */
  async testBasicIndividualEmails(): Promise<void> {
    console.log('\n=== Manual Test 1: Basic Individual Email Scheduling ===');
    
    try {
      const taskInput: ScheduleTaskInput = {
        task_type: 'individual_email',
        scheduled_time: new Date(Date.now() + 5000), // 5 seconds from now
        max_retries: 2,
        task_data: {
          template_name: 'welcome_email',
          email_type: 'welcome',
          sender_fullname: 'Gyld Team',
          subject: 'Welcome to Gyld!',
          body1: 'We\'re excited to have you join our community.',
          body2: 'Click your personalized link below to get started.',
          send_date: new Date(),
          to_address: [], // Will be fetched from database
          
          // Personalized messaging configuration
          send_individual_messages: true,
          per_user_variables: [
            {
              user_id: 'test-user-1',
              variables: {
                firstName: 'Alice',
                lastName: 'Johnson',
                role: 'Product Manager',
                customUrl: 'https://app.gyld.com/welcome/alice-johnson',
                department: 'Product',
                startDate: '2024-02-15'
              }
            },
            {
              user_id: 'test-user-2', 
              variables: {
                firstName: 'Bob',
                lastName: 'Smith',
                role: 'Software Engineer',
                customUrl: 'https://app.gyld.com/welcome/bob-smith',
                department: 'Engineering',
                startDate: '2024-02-16'
              }
            },
            {
              user_id: 'test-user-3',
              variables: {
                firstName: 'Carol',
                lastName: 'Davis',
                role: 'Designer',
                customUrl: 'https://app.gyld.com/welcome/carol-davis',
                department: 'Design',
                startDate: '2024-02-17'
              }
            }
          ],
          
          // Global template variables
          gathering_title: 'New Employee Orientation',
          host_name: 'HR Team',
          gathering_date: '2024-02-20',
          gathering_location: 'Main Conference Room',
          attendee_count: 3,
          recipient_count: 3
        }
      };

      console.log('Scheduling individual email task...');
      const result = await this.scheduler.schedule(taskInput);
      
      if (result.success) {
        console.log('✅ Task scheduled successfully:', {
          taskId: result.taskId,
          scheduledTime: taskInput.scheduled_time,
          recipientCount: 3
        });
        
        console.log('📧 Individual emails will be sent to:');
        taskInput.task_data.per_user_variables.forEach((userVar: any, index: number) => {
          console.log(`  ${index + 1}. ${userVar.variables.firstName} ${userVar.variables.lastName} (${userVar.variables.role})`);
          console.log(`     Custom URL: ${userVar.variables.customUrl}`);
        });
        
      } else {
        console.log('❌ Failed to schedule task:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Error in testBasicIndividualEmails:', error);
    }
  }

  /**
   * Test 2: Orchestration with Individual Messaging
   * Demonstrates routing orchestration tasks to individual email handler
   */
  async testOrchestrationIndividualMessaging(): Promise<void> {
    console.log('\n=== Manual Test 2: Orchestration with Individual Messaging ===');
    
    try {
      const taskInput: ScheduleTaskInput = {
        task_type: 'orchestration',
        scheduled_time: new Date(Date.now() + 10000), // 10 seconds from now
        max_retries: 2,
        task_data: {
          // Orchestration configuration
          mode: 'both', // Required for individual messaging
          send_date: new Date(),
          content_key: 'monthly_gathering_invite',
          
          // Event details
          gathering_title: 'Monthly All-Hands Meeting',
          host_name: 'Executive Team',
          gathering_date: '2024-03-01',
          gathering_location: 'Virtual (Zoom)',
          attendee_count: 50,
          
          // Individual messaging configuration
          send_individual_messages: true,
          per_user_variables: [
            {
              user_id: 'manager-1',
              variables: {
                firstName: 'Sarah',
                lastName: 'Wilson',
                title: 'Engineering Manager',
                team: 'Backend Team',
                customUrl: 'https://app.gyld.com/rsvp/sarah-wilson-march',
                specialNote: 'Please prepare your team update for the meeting.'
              }
            },
            {
              user_id: 'manager-2',
              variables: {
                firstName: 'Mike',
                lastName: 'Chen',
                title: 'Product Manager',
                team: 'Mobile Team',
                customUrl: 'https://app.gyld.com/rsvp/mike-chen-march',
                specialNote: 'Don\'t forget to share the latest roadmap updates.'
              }
            },
            {
              user_id: 'manager-3',
              variables: {
                firstName: 'Lisa',
                lastName: 'Rodriguez',
                title: 'Design Manager',
                team: 'UX Team',
                customUrl: 'https://app.gyld.com/rsvp/lisa-rodriguez-march',
                specialNote: 'Please bring the new design system presentation.'
              }
            }
          ]
        }
      };

      console.log('Scheduling orchestration task with individual messaging...');
      const result = await this.scheduler.schedule(taskInput);
      
      if (result.success) {
        console.log('✅ Orchestration task scheduled successfully:', {
          taskId: result.taskId,
          mode: taskInput.task_data.mode,
          eventTitle: taskInput.task_data.gathering_title,
          individualMessaging: taskInput.task_data.send_individual_messages,
          recipientCount: taskInput.task_data.per_user_variables.length
        });
        
        console.log('🎯 Orchestration will route to IndividualEmailHandler for:');
        taskInput.task_data.per_user_variables.forEach((userVar: any, index: number) => {
          console.log(`  ${index + 1}. ${userVar.variables.firstName} ${userVar.variables.lastName} (${userVar.variables.title})`);
          console.log(`     Team: ${userVar.variables.team}`);
          console.log(`     Special Note: ${userVar.variables.specialNote}`);
        });
        
      } else {
        console.log('❌ Failed to schedule orchestration task:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Error in testOrchestrationIndividualMessaging:', error);
    }
  }

  /**
   * Test 3: Complex Template Variables
   * Demonstrates advanced template processing with mixed global and user variables
   */
  async testComplexTemplateVariables(): Promise<void> {
    console.log('\n=== Manual Test 3: Complex Template Variables ===');
    
    try {
      const taskInput: ScheduleTaskInput = {
        task_type: 'individual_email',
        scheduled_time: new Date(Date.now() + 15000), // 15 seconds from now
        max_retries: 2,
        task_data: {
          template_name: 'event_reminder_complex',
          email_type: 'reminder',
          sender_fullname: 'Event Coordinator',
          subject: 'Reminder: {{event_name}} - Action Required',
          body1: 'Hi {{firstName}}, don\'t forget about {{event_name}} on {{event_date}}!',
          body2: 'Your role: {{attendee_role}}. Location: {{location}}. RSVP: {{rsvp_url}}',
          send_date: new Date(),
          to_address: [],
          
          send_individual_messages: true,
          per_user_variables: [
            {
              user_id: 'attendee-1',
              variables: {
                firstName: 'Emma',
                lastName: 'Thompson',
                attendee_role: 'Keynote Speaker',
                rsvp_url: 'https://app.gyld.com/rsvp/emma-keynote',
                dietary_restrictions: 'Vegetarian',
                arrival_time: '9:00 AM',
                special_instructions: 'Please arrive 30 minutes early for sound check.'
              }
            },
            {
              user_id: 'attendee-2',
              variables: {
                firstName: 'David',
                lastName: 'Kim',
                attendee_role: 'Panel Moderator',
                rsvp_url: 'https://app.gyld.com/rsvp/david-moderator',
                dietary_restrictions: 'None',
                arrival_time: '9:30 AM',
                special_instructions: 'Review panel questions beforehand.'
              }
            },
            {
              user_id: 'attendee-3',
              variables: {
                firstName: 'Rachel',
                lastName: 'Green',
                attendee_role: 'Workshop Facilitator',
                rsvp_url: 'https://app.gyld.com/rsvp/rachel-workshop',
                dietary_restrictions: 'Gluten-free',
                arrival_time: '10:00 AM',
                special_instructions: 'Bring workshop materials and handouts.'
              }
            }
          ],
          
          // Global variables that apply to all recipients
          template_variables: {
            event_name: 'Annual Tech Conference 2024',
            event_date: 'March 15, 2024',
            location: 'Grand Convention Center',
            event_duration: '9:00 AM - 5:00 PM',
            parking_info: 'Free parking available in Lot C',
            contact_email: 'events@company.com',
            weather_forecast: 'Sunny, 72°F'
          }
        }
      };

      console.log('Scheduling complex template variables test...');
      const result = await this.scheduler.schedule(taskInput);
      
      if (result.success) {
        console.log('✅ Complex template task scheduled successfully:', {
          taskId: result.taskId,
          templateName: taskInput.task_data.template_name,
          globalVariables: Object.keys(taskInput.task_data.template_variables || {}),
          recipientCount: taskInput.task_data.per_user_variables.length
        });
        
        console.log('📋 Template will process these variables:');
        console.log('  Global Variables:');
        Object.entries(taskInput.task_data.template_variables || {}).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
        
        console.log('  Per-User Variables:');
        taskInput.task_data.per_user_variables.forEach((userVar: any, index: number) => {
          console.log(`    User ${index + 1} (${userVar.variables.firstName}):`);
          Object.entries(userVar.variables).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
          });
        });
        
      } else {
        console.log('❌ Failed to schedule complex template task:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Error in testComplexTemplateVariables:', error);
    }
  }

  /**
   * Test 4: Error Scenarios
   * Demonstrates various error conditions and recovery
   */
  async testErrorScenarios(): Promise<void> {
    console.log('\n=== Manual Test 4: Error Scenarios ===');
    
    console.log('\n4a. Testing missing per_user_variables...');
    try {
      const invalidTask1: ScheduleTaskInput = {
        task_type: 'individual_email',
        scheduled_time: new Date(Date.now() + 20000),
        max_retries: 1,
        task_data: {
          template_name: 'test_template',
          email_type: 'test',
          sender_fullname: 'Test Sender',
          subject: 'Test Subject',
          body1: 'Test Body',
          send_date: new Date(),
          to_address: [],
          send_individual_messages: true
          // Missing per_user_variables!
        }
      };

      const result1 = await this.scheduler.schedule(invalidTask1);
      console.log('Result (should still schedule):', result1.success ? '✅ Scheduled' : '❌ Failed');
      
    } catch (error) {
      console.log('❌ Error in missing per_user_variables test:', error);
    }

    console.log('\n4b. Testing invalid user_id format...');
    try {
      const invalidTask2: ScheduleTaskInput = {
        task_type: 'individual_email',
        scheduled_time: new Date(Date.now() + 25000),
        max_retries: 1,
        task_data: {
          template_name: 'test_template',
          email_type: 'test',
          sender_fullname: 'Test Sender',
          subject: 'Test Subject',
          body1: 'Test Body',
          send_date: new Date(),
          to_address: [],
          send_individual_messages: true,
          per_user_variables: [
            { user_id: '', variables: { firstName: 'John' } }, // Invalid empty user_id
            { user_id: 'valid-user', variables: { firstName: 'Jane' } }
          ]
        }
      };

      const result2 = await this.scheduler.schedule(invalidTask2);
      console.log('Result (should still schedule):', result2.success ? '✅ Scheduled' : '❌ Failed');
      
    } catch (error) {
      console.log('❌ Error in invalid user_id test:', error);
    }

    console.log('\n4c. Testing orchestration with push_preferred mode...');
    try {
      const invalidTask3: ScheduleTaskInput = {
        task_type: 'orchestration',
        scheduled_time: new Date(Date.now() + 30000),
        max_retries: 1,
        task_data: {
          mode: 'push_preferred', // Invalid for individual messaging
          send_date: new Date(),
          content_key: 'test_content',
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: { firstName: 'John' } }
          ]
        }
      };

      const result3 = await this.scheduler.schedule(invalidTask3);
      console.log('Result (should still schedule):', result3.success ? '✅ Scheduled' : '❌ Failed');
      
    } catch (error) {
      console.log('❌ Error in push_preferred mode test:', error);
    }
  }

  /**
   * Start execution engine and monitor tasks
   */
  async startMonitoring(): Promise<void> {
    console.log('\n=== Starting Execution Engine ===');
    console.log('🚀 Execution engine started. Monitoring scheduled tasks...');
    console.log('📊 Watch the console for task execution results.');
    console.log('⏰ Tasks will execute at their scheduled times.');
    
    this.scheduler.startExecutionEngine();
    
    // Log execution engine status
    setInterval(() => {
      console.log(`🔄 Execution engine running... (${new Date().toLocaleTimeString()})`);
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop execution engine
   */
  async stopMonitoring(): Promise<void> {
    console.log('\n=== Stopping Execution Engine ===');
    await this.scheduler.stopExecutionEngine();
    console.log('🛑 Execution engine stopped.');
  }

  /**
   * Run all manual tests in sequence
   */
  async runAllTests(): Promise<void> {
    console.log('\n🧪 PERSONALIZED MESSAGING MANUAL TEST SUITE');
    console.log('============================================');
    
    try {
      await this.testBasicIndividualEmails();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.testOrchestrationIndividualMessaging();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.testComplexTemplateVariables();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.testErrorScenarios();
      
      console.log('\n✅ All manual tests scheduled successfully!');
      console.log('🎯 Start monitoring to see execution results.');
      
    } catch (error) {
      console.error('❌ Error running manual tests:', error);
    }
  }
}

// Export convenience functions for easy testing
export const personalizedMessagingTester = new PersonalizedMessagingTester();

export const runBasicTest = () => personalizedMessagingTester.testBasicIndividualEmails();
export const runOrchestrationTest = () => personalizedMessagingTester.testOrchestrationIndividualMessaging();
export const runComplexTest = () => personalizedMessagingTester.testComplexTemplateVariables();
export const runErrorTests = () => personalizedMessagingTester.testErrorScenarios();
export const runAllTests = () => personalizedMessagingTester.runAllTests();
export const startMonitoring = () => personalizedMessagingTester.startMonitoring();
export const stopMonitoring = () => personalizedMessagingTester.stopMonitoring();

// Example usage:
/*
import { runAllTests, startMonitoring, stopMonitoring } from './manual-personalized-messaging-test';

async function testPersonalizedMessaging() {
  // Schedule all test tasks
  await runAllTests();
  
  // Start monitoring execution
  await startMonitoring();
  
  // Let it run for a while, then stop
  setTimeout(async () => {
    await stopMonitoring();
  }, 60000); // Stop after 1 minute
}
*/