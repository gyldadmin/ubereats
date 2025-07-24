# Email Template Mapping: invite_with_envelope

## Template Information
- **Template Label**: `invite_with_envelope`
- **Description**: Personalized invitation email template with envelope styling, gathering details, and action button
- **Use Cases**: Gathering invitations, event invitations, personalized meeting requests
- **Updated**: 2025-01-23 - Initial creation with personalization fields

## Variable Mapping

### From Email Service Inputs → SendGrid Template Variables

| Service Input | Template Variable | Description | Required | Type | Lookup Required |
|---------------|------------------|-------------|----------|------|-----------------|
| `first` | `first` | Recipient's first name for personalization | Yes | string | No |
| `gath_date` | `date` | Gathering/event date | Yes | string | No |
| `gath_title` | `title` | Gathering/event title | Yes | string | No |
| `body1` | `subtitle` | Main invitation message/subtitle | Yes | string | No |
| `body2` | `sub` | Additional details or secondary message | No | string | No |
| `subject` | `subject` | Email subject line | Yes | string | No |
| `buttonurl` | `buttonurl` | URL for the action button (RSVP/Join) | Yes | string | No |
| `buttontext` | `buttontext` | Text displayed on the button | Yes | string | No |
| `unsubscribeurl` | `unsubscribeurl` | Unsubscribe link URL | Yes | string | No |
| `header_image` | `header_image` | Header image URL | No | string | No |
| `body_image` | `body_image` | Body/content image URL | No | string | No |
| `to_address` | `to_addresses` | Recipient email address(es) | Yes | string \| string[] | No |
| `cc_address` | `cc_addresses` | CC recipient email address(es) | No | string \| string[] | No |
| `bcc_address` | `bcc_addresses` | BCC recipient email address(es) | No | string \| string[] | No |
| `sender_fullname` | `sender_fullname` | From name display | Yes | string | No |
| `email_type` | `sender_email` | Email label → lookup address in `email` table | Yes | string | **Yes - email.address** |
| `reply_to_address` | `reply_to_address` | Reply-to email address | Yes | string | No |
| `template_name` | `template_id` | Template label → lookup template_id in `email_template_ids` table | Yes | string | **Yes - email_template_ids.template_id** |

## Database Lookups

The email service performs two required database lookups before sending emails:

### 1. Sender Email Lookup
```sql
-- Input: email_type = "invite"
-- Query: 
SELECT address FROM email WHERE label = 'invite';
-- Result: sender_email = "invite@gyld.org"
```

### 2. Template ID Lookup  
```sql
-- Input: template_name = "invite_with_envelope"
-- Query:
SELECT template_id FROM email_template_ids WHERE label = 'invite_with_envelope';
-- Result: template_id = "d-1234567890abcdef"
```

## Personalization Features

### New Fields for Personalization
- **first**: Recipient's first name for personal greeting
- **date**: Gathering date for event-specific messaging
- **title**: Gathering title for context and branding
- **subtitle**: Main invitation message (maps from body1)
- **sub**: Additional details or secondary message (maps from body2)

### Template Structure
The invite_with_envelope template supports:
- Personal greeting using first name
- Event-specific details (date, title)
- Envelope/invitation styling
- Action button for RSVP/joining
- Header and body images for branding
- Standard email compliance (unsubscribe, proper sender info)

## Example Usage

### Gathering Invitation
```typescript
const emailInputs = {
  template_name: "invite_with_envelope",
  email_type: "invite",
  sender_fullname: "Gyld Events Team",
  first: "Sarah",
  gath_date: "Thursday, January 25th at 7:00 PM",
  gath_title: "Monthly Networking Happy Hour",
  subject: "You're invited: Monthly Networking Happy Hour",
  body1: "Join us for an evening of networking and conversation with fellow professionals in your area.",
  body2: "Light appetizers and drinks will be provided. Business casual attire recommended.",
  buttontext: "RSVP Now",
  buttonurl: "https://app.gyld.org/gathering/123/rsvp",
  unsubscribeurl: "https://app.gyld.org/unsubscribe?token=xyz",
  to_address: "sarah@example.com",
  reply_to_address: "events@gyld.org",
  header_image: "https://app.gyld.org/images/happy-hour-header.png",
  send_date: new Date()
};
```

### Mentoring Session Invitation
```typescript
const emailInputs = {
  template_name: "invite_with_envelope",
  email_type: "invite",
  sender_fullname: "Gyld Mentoring",
  first: "Alex",
  gath_date: "Tuesday, January 30th at 2:00 PM",
  gath_title: "Career Development Mentoring Session",
  subject: "Your mentoring session is confirmed",
  body1: "Your one-on-one mentoring session has been scheduled. Come prepared with your career questions and goals.",
  body2: "The session will be held via Zoom. Please join 5 minutes early to test your connection.",
  buttontext: "Join Session",
  buttonurl: "https://zoom.us/j/123456789",
  unsubscribeurl: "https://app.gyld.org/unsubscribe?token=xyz",
  to_address: "alex@example.com",
  reply_to_address: "mentoring@gyld.org",
  header_image: "https://app.gyld.org/images/mentoring-header.png",
  send_date: new Date()
};
```

## SendGrid Template Design Requirements
- Template must include placeholders for all dynamic_template_data variables
- Should feature envelope/invitation styling for visual appeal
- Template should have both HTML and plain text versions for optimal deliverability
- Button styling should be prominent and action-oriented (RSVP, Join, etc.)
- Personal greeting should use the `first` field prominently
- Date and title should be visually highlighted
- Unsubscribe link should be properly formatted and compliant
- Support for optional header and body images
- Responsive design for mobile and desktop viewing

## Implementation Notes
- All personalization fields (first, gath_date, gath_title) are required for proper template rendering
- body1 maps to "subtitle" for main invitation message
- body2 maps to "sub" for additional details (optional)
- Header and body images are optional but recommended for visual appeal
- The envelope styling should convey invitation/event theme
- Consider A/B testing different button text for optimal conversion
- Ensure accessibility compliance for all visual elements 