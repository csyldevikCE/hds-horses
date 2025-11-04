# Email Confirmation Setup Guide

## Overview

This guide will help you configure Supabase to send proper email confirmations for HDS Horses and customize the email templates.

## 1. Configure Redirect URLs in Supabase

### Step 1: Go to Authentication Settings
1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**

### Step 2: Set Site URL
Set your Site URL to your production domain:
- **Development**: `http://localhost:5173`
- **Production**: `https://your-domain.com` (e.g., `https://hds-horses.vercel.app`)

### Step 3: Add Redirect URLs
Add these URLs to the **Redirect URLs** list:
- `http://localhost:5173/auth/callback` (for development)
- `https://your-domain.com/auth/callback` (for production)

This ensures that when users click the confirmation link in their email, they'll be redirected to the proper callback page that handles the authentication.

## 2. Customize Email Templates

### Step 1: Go to Email Templates
1. In Supabase dashboard, navigate to **Authentication** → **Email Templates**
2. Click on **Confirm signup** template

### Step 2: Update the Email Template

Replace the default template with this customized version:

```html
<h2>Confirm your email for HDS Horses</h2>

<p>Hello,</p>

<p>Thank you for signing up for HDS Horses! Please confirm your email address to complete your account setup.</p>

<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>

<p>If the button above doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 24 hours.</p>

<p>If you didn't create an account with HDS Horses, you can safely ignore this email.</p>

<p>Best regards,<br>
The HDS Horses Team</p>
```

### Step 3: Customize the Subject Line

Change the subject to:
```
Confirm your email for HDS Horses
```

### Step 4: Save the Template
Click **Save** to apply your changes.

## 3. Test the Email Confirmation Flow

### Testing Steps:
1. Go to your signup page
2. Create a new account with a real email address
3. You should be redirected to `/confirm-email` page with instructions
4. Check your email inbox for the confirmation email
5. Click the confirmation link in the email
6. You should be redirected to `/auth/callback` which will verify your email
7. After verification, you'll be automatically logged in and redirected to the dashboard

### Expected Flow:
```
Signup Form
  ↓
/confirm-email (tells user to check email)
  ↓
User clicks link in email
  ↓
/auth/callback (verifies email)
  ↓
/ (dashboard)
```

## 4. Optional: Customize Other Email Templates

You may also want to customize these templates:

### Invite User Template
For when admins invite new team members:
```html
<h2>You're invited to join HDS Horses</h2>

<p>Hello,</p>

<p>You've been invited to join an organization on HDS Horses.</p>

<p><a href="{{ .ConfirmationURL }}">Accept invitation</a></p>

<p>If the button above doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This invitation will expire in 7 days.</p>

<p>Best regards,<br>
The HDS Horses Team</p>
```

### Reset Password Template
```html
<h2>Reset your HDS Horses password</h2>

<p>Hello,</p>

<p>You requested to reset your password for HDS Horses.</p>

<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>

<p>If the button above doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request a password reset, you can safely ignore this email.</p>

<p>Best regards,<br>
The HDS Horses Team</p>
```

## 5. Troubleshooting

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check Supabase dashboard → Authentication → Users to see if user was created
- Check Supabase logs for email delivery errors

### Redirect not working
- Verify redirect URLs are correctly configured in Supabase
- Check browser console for errors
- Make sure `/auth/callback` route exists in your app

### "Invalid confirmation link" error
- Link may have expired (default: 24 hours)
- User may have already confirmed their email
- User should try signing up again

## 6. Email Delivery Notes

### Development
- Supabase sends real emails even in development
- Use real email addresses for testing
- Consider using a test email service like Mailtrap for development

### Production
- Supabase uses its own SMTP server by default
- For better deliverability, consider setting up a custom SMTP server
- Configure SPF/DKIM records for your domain to improve email deliverability

### Custom SMTP (Optional)
To use your own email service:
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable custom SMTP
3. Enter your SMTP credentials (e.g., SendGrid, AWS SES, Mailgun)

## Summary

After completing these steps:
- ✅ Users will receive branded confirmation emails
- ✅ Email confirmation flow works properly
- ✅ Users are redirected to the correct pages
- ✅ Email templates mention "HDS Horses" throughout

## Related Files
- `/src/pages/ConfirmEmail.tsx` - Confirmation instruction page
- `/src/pages/AuthCallback.tsx` - Handles email verification
- `/src/pages/Signup.tsx` - Signup form
- `/src/contexts/AuthContext.tsx` - Authentication logic
