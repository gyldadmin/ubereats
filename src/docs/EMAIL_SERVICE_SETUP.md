# Email Service Setup Guide

The Gyld Native app includes a comprehensive email service that integrates with SendGrid for transactional emails. This guide covers setup, configuration, and usage.

## 🔧 Setup Requirements

### 1. SendGrid API Key Configuration

The email service requires a SendGrid API key. The proper way to configure this in Expo is:

#### Recommended Setup (Using app.config.js)
1. **Add your API key to `.env.local`** (already done):
   ```bash
   SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
   ```

2. **Use app.config.js instead of app.json** (already configured):
   ```javascript
   export default {
     expo: {
       // ... other config
       extra: {
         SENDGRID_API_KEY: process.env.SENDGRID_API_KEY
       }
     }
   };
   ```

3. **Access via Expo Constants** (already implemented in EmailService):
   ```typescript
   import Constants from 'expo-constants';
   const apiKey = Constants.expoConfig?.extra?.SENDGRID_API_KEY;
   ```

#### Alternative: Public Environment Variable (Not Recommended)
If you need public access (not secure for API keys):
```bash
EXPO_PUBLIC_SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
```

**Important**: 
- The `app.config.js` approach keeps your API key more secure than `EXPO_PUBLIC_` variables
- Your `.env.local` file is automatically loaded by Expo at build time
- File system operations (like reading `.sendgrid.key` files) don't work in React Native

### 2. Database Requirements

Ensure the following tables are migrated and populated:

#### Required Tables:
- `email_template_ids` - Email template configurations
- `email` - Email type configurations (sender addresses)
- `status_options` - Workflow status options
- `notification_type` - Notification type lookup
- `notifications_sent` - Sent email tracking
- `planned_workflows` - Scheduled email tracking

#### Required Data:
```sql
-- Email types (add your email addresses)
INSERT INTO email (label, address) VALUES 
  ('invite', 'invite@yourdomain.com'),
  ('transactional', 'noreply@yourdomain.com');

-- Template configuration (basic_with_button)
-- This should already be configured via migrations

-- Status options
INSERT INTO status_options (label) VALUES 
  ('pending'), ('cancelled'), ('completed');

-- Notification types  
INSERT INTO notification_type (label) VALUES 
  ('email'), ('sms'), ('push');
```

## 📧 Email Service Features

### Immediate Email Sending
```typescript
import { emailService } from '../services/emailService';

const result = await emailService.send({
  template_name: 'basic_with_button',
  email_type: 'invite',
  sender_fullname: 'Gyld Team',
  subject: 'Welcome to Gyld!',
  body1: 'Welcome to our platform!',
  to_address: ['user@example.com'],
  send_date: new Date(), // Send immediately
  initiated_by: 'user-uuid',
  buttontext: 'Get Started',
  buttonurl: 'https://app.gyld.org/onboarding',
  unsubscribeurl: 'https://app.gyld.org/unsubscribe'
});
```

### Scheduled Email Sending
```typescript
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7); // Send in 7 days

const result = await emailService.send({
  // ... same inputs as above
  send_date: futureDate // Schedule for future
});

// Cancel if needed
if (result.workflowId) {
  await emailService.cancelScheduledEmail(result.workflowId);
}
```

### Multiple Recipients
```typescript
const result = await emailService.send({
  // ... other inputs
  to_address: ['user1@example.com', 'user2@example.com'],
  cc_address: ['manager@example.com'], // Optional
  bcc_address: ['admin@example.com']   // Optional
});
```

## 🧪 Testing

### Test Button
A test button is available on the HomeScreen (temporary testing section) that sends a test email to `wtriant@gmail.com` using the `basic_with_button` template.

### Manual Testing
```typescript
// Test immediate send
const testResult = await emailService.send({
  template_name: 'basic_with_button',
  email_type: 'invite',
  sender_fullname: 'Test User',
  subject: 'Test Email',
  body1: 'This is a test email.',
  to_address: ['your-email@example.com'],
  send_date: new Date(),
  initiated_by: 'test-user-id',
  buttontext: 'Test Button',
  buttonurl: 'https://example.com',
  unsubscribeurl: 'https://example.com/unsubscribe'
});

console.log('Test result:', testResult);
```

## 🔄 Database-Driven Scheduling

The email service uses a robust database-driven scheduling system:

1. **Immediate emails** (send_date <= now) are sent directly via SendGrid
2. **Scheduled emails** (send_date > now) create a `planned_workflows` record and use `setTimeout`
3. **Cancellation** updates the workflow status to prevent sending
4. **Execution** checks workflow status before sending (supports cancellation)

### Workflow Statuses:
- `pending` - Email scheduled and waiting to send
- `cancelled` - Email cancelled, will not send  
- `completed` - Email sent successfully

## 📊 Tracking & Logging

### Sent Email Tracking
All sent emails are recorded in the `notifications_sent` table:
- `notification_type` - "email" 
- `to_address` - Array of recipients
- `body1` - Email body content
- `subject` - Email subject
- `send_date` - When email was sent

### Workflow Tracking  
Scheduled emails create entries in `planned_workflows`:
- `workflow_id` - Unique identifier
- `status` - Current workflow status
- `gathering_id` - Optional gathering association
- `candidate_id` - Optional candidate association
- `description` - "email"

## 🚨 Error Handling

The service includes comprehensive error handling:

- **Database lookup failures** throw descriptive errors
- **SendGrid API errors** are caught and logged
- **Scheduled email failures** update workflow status
- **Validation errors** prevent invalid emails from being processed

### Common Issues:

1. **"SendGrid API key not found"**
   - Solution: Set `EXPO_PUBLIC_SENDGRID_API_KEY` in `.env` file or `SENDGRID_API_KEY` as build-time variable
   - React Native Note: File-based key storage doesn't work, use environment variables only

2. **"Unable to resolve module fs"**
   - This error indicates Node.js modules are being used in React Native
   - Solution: Use the updated React Native-compatible version of the email service

3. **"Email template 'xyz' not found"**  
   - Solution: Check `email_template_ids` table has the template

4. **"Email type 'xyz' not found"**
   - Solution: Add email type to `email` table with address

5. **"SendGrid API error: 401"**
   - Solution: Verify SendGrid API key is valid and has send permissions

## 🔐 Security Considerations

- **API Key Storage**: 
  - Never commit API keys to version control
  - In React Native, avoid `EXPO_PUBLIC_` prefixed variables for sensitive keys (they become public)
  - Use build-time environment variables or Expo's secure configuration for production
- **Row Level Security**: Database operations respect RLS policies
- **Input Validation**: All inputs are validated before processing
- **Error Logging**: Errors are logged but don't expose sensitive data
- **React Native Security**: File system access isn't available, which actually improves security by preventing accidental key exposure

## 📋 Next Steps

1. **Add Templates**: Create additional email templates in SendGrid and database
2. **Enhance Scheduling**: Consider adding recurring email capabilities  
3. **Analytics**: Add click/open tracking via SendGrid webhooks
4. **Retry Logic**: Implement retry logic for failed sends
5. **Template Variables**: Expand template variable support for new templates

## 🔗 Related Files

- `src/services/emailService.ts` - Main email service implementation
- `src/types/email.ts` - TypeScript interfaces
- `src/docs/email-templates/basic_with_button_mapping.md` - Template mapping
- `supabase/migrations/` - Database schema migrations 