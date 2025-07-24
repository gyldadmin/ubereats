# Email Template Mapping: basic_with_button

## Template Information
- **Template Label**: `basic_with_button`
- **Description**: Standard email template with body text, subject, action button, and support for CC/BCC recipients
- **Use Cases**: Invitations, confirmations, call-to-action emails, notifications with multiple recipients
- **Updated**: 2025-01-23 - Added CC/BCC support and multiple recipient handling

## Variable Mapping

### From Email Service Inputs → SendGrid Template Variables

| Service Input | Template Variable | Description | Required | Type | Lookup Required |
|---------------|------------------|-------------|----------|------|-----------------|
| `body` | `body1` | Main email body content | Yes | string | No |
| `subject` | `subject` | Email subject line | Yes | string | No |
| `buttonUrl` | `buttonurl` | URL for the action button | Yes | string | No |
| `buttonText` | `buttontext` | Text displayed on the button | Yes | string | No |
| `unsubscribeUrl` | `unsubscribeurl` | Unsubscribe link URL | Yes | string | No |
| `toAddress` | `to_addresses` | Recipient email address(es) | Yes | string \| string[] | No |
| `ccAddress` | `cc_addresses` | CC recipient email address(es) | No | string \| string[] | No |
| `bccAddress` | `bcc_addresses` | BCC recipient email address(es) | No | string \| string[] | No |
| `senderEmail` | `sender_email` | Email label → lookup address in `email` table | Yes | string | **Yes - email.address** |
| `senderFullName` | `sender_fullname` | From name display | Yes | string | No |
| `replyToAddress` | `reply_to_address` | Reply-to email address | Yes | string | No |
| `templateLabel` | `template_id` | Template label → lookup template_id in `email_template_ids` table | Yes | string | **Yes - email_template_ids.template_id** |

## Database Lookups

The email service performs two required database lookups before sending emails:

### 1. Sender Email Lookup
```sql
-- Input: senderEmail = "noreply"
-- Query: 
SELECT address FROM email WHERE label = 'noreply';
-- Result: sender_email = "noreply@gyld.org"
```

### 2. Template ID Lookup  
```sql
-- Input: templateLabel = "basic_with_button"
-- Query:
SELECT template_id FROM email_template_ids WHERE label = 'basic_with_button';
-- Result: template_id = "d-1234567890abcdef"
```

### Lookup Implementation
The email service must:
1. Query the `email` table to resolve `senderEmail` label → actual email address
2. Query the `email_template_ids` table to resolve `templateLabel` → SendGrid template ID
3. Handle lookup failures gracefully (throw descriptive errors)
4. Cache lookups for performance if needed

## Recipient Handling

### Multiple Recipients Support
- **Single Recipient**: Pass string directly
- **Multiple Recipients (same content)**: Pass array of strings
- **CC Recipients**: Optional, supports single string or array
- **BCC Recipients**: Optional, supports single string or array

### Email Service Processing
The email service will transform recipient inputs:

```typescript
// Single recipient
toAddress: "user@example.com" 
→ to_addresses: [{"email": "user@example.com"}]

// Multiple recipients  
toAddress: ["user1@example.com", "user2@example.com"]
→ to_addresses: [{"email": "user1@example.com"}, {"email": "user2@example.com"}]

// Optional CC/BCC (same transformation logic)
ccAddress: "cc@example.com"
→ cc_addresses: [{"email": "cc@example.com"}]
```

## Implementation Notes
- All primary variables (body, subject, button info, sender info) are required
- CC and BCC are optional and can be omitted from the API call
- The `senderEmail` input is a label that gets looked up in the `email` table to find the actual email address
- The `templateLabel` input is a label that gets looked up in the `email_template_ids` table to find the SendGrid template ID
- Email service must handle database lookup failures gracefully with descriptive error messages
- Button styling is controlled by the SendGrid template design
- Unsubscribe link is mandatory for compliance
- Text/HTML versions are handled by the SendGrid template design, not the API call
- Consider caching database lookups for performance optimization

## Example Usage

### Basic Single Recipient
```typescript
const emailInputs = {
  body: "Welcome to our platform! Click below to get started.",
  subject: "Welcome to Gyld!",
  buttonUrl: "https://app.gyld.org/onboarding",
  buttonText: "Get Started",
  unsubscribeUrl: "https://app.gyld.org/unsubscribe?token=xyz",
  toAddress: "user@example.com",
  senderEmail: "noreply",  // Label - will lookup address from email table
  senderFullName: "Gyld Team",
  replyToAddress: "support@gyld.org",
  templateLabel: "basic_with_button"  // Label - will lookup template_id from email_template_ids table
};
```

### Multiple Recipients with CC/BCC
```typescript
const emailInputs = {
  body: "Team meeting scheduled for tomorrow at 2 PM.",
  subject: "Team Meeting Tomorrow",
  buttonUrl: "https://zoom.us/j/123456789",
  buttonText: "Join Meeting",
  unsubscribeUrl: "https://app.gyld.org/unsubscribe?token=xyz",
  toAddress: ["team-lead@example.com", "project-manager@example.com"],
  ccAddress: "supervisor@example.com",
  bccAddress: ["hr@example.com", "admin@example.com"],
  senderEmail: "meetings",  // Label - will lookup address from email table
  senderFullName: "Gyld Meetings",
  replyToAddress: "support@gyld.org",
  templateLabel: "basic_with_button"  // Label - will lookup template_id from email_template_ids table
};
```

### Customized Content (Multiple Service Calls)
```typescript
// For personalized content, loop and call service separately for each recipient
const recipients = [
  { email: "user1@example.com", name: "John" },
  { email: "user2@example.com", name: "Jane" }
];

for (const recipient of recipients) {
  await emailService.send({
    body: `Welcome ${recipient.name}! Your account has been created.`,
    subject: `Welcome ${recipient.name}!`,
    buttonUrl: `https://app.gyld.org/welcome?user=${recipient.email}`,
    buttonText: "Complete Setup",
    unsubscribeUrl: `https://app.gyld.org/unsubscribe?email=${recipient.email}`,
    toAddress: recipient.email,
    senderEmail: "welcome",  // Label - will lookup address from email table
    senderFullName: "Gyld Welcome Team",
    replyToAddress: "support@gyld.org",
    templateLabel: "basic_with_button"  // Label - will lookup template_id from email_template_ids table
  });
}
```

## SendGrid Template Design Requirements
- Template must include placeholders for all dynamic_template_data variables
- Template should have both HTML and plain text versions for optimal deliverability
- Button styling should be defined in the template design
- Unsubscribe link should be properly formatted and compliant 