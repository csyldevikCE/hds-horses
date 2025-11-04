# Email Templates for Supabase

## 1. Confirm Signup Email Template

**Subject:** `Confirm your email for HDS Horses`

**Template Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HDS Horses</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(to bottom right, #f0fdf4, #dbeafe); min-height: 100vh;">

  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f0fdf4, #dbeafe); padding: 40px 20px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                🐎 HDS Horses
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Horse Management Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold;">
                Welcome to HDS Horses! 🎉
              </h2>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>

              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for signing up for HDS Horses. To complete your registration and access your account, please confirm your email address by clicking the button below:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                      ✓ Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #1e3a8a; font-weight: bold; font-size: 14px;">
                      📧 Can't click the button?
                    </p>
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                      Copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0 0; color: #3b82f6; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
                      {{ .ConfirmationURL }}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      ⚠️ <strong>Important:</strong> This confirmation link will expire in 24 hours for security reasons.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't create an account with HDS Horses, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 15px 0; color: #111827; font-size: 14px;">
                Best regards,<br>
                <strong>The HDS Horses Team</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                © 2025 HDS Horses. All rights reserved.<br>
                Professional horse management for modern stables.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 2. Invite User Email Template

**Subject:** `You're invited to join HDS Horses`

**Template Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to HDS Horses</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(to bottom right, #f0fdf4, #dbeafe); min-height: 100vh;">

  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f0fdf4, #dbeafe); padding: 40px 20px;">
    <tr>
      <td align="center">

        <!-- Email Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                🐎 HDS Horses
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Horse Management Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold;">
                You've been invited! 🎉
              </h2>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>

              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                You've been invited to join a horse management organization on HDS Horses - the professional platform for managing your stable.
              </p>

              <!-- Invitation Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-left: 4px solid #16a34a; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #065f46; font-weight: bold; font-size: 15px;">
                      📋 What you'll get access to:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #047857;">
                      <li style="margin-bottom: 8px;">Manage horses and view detailed profiles</li>
                      <li style="margin-bottom: 8px;">Track health records and vaccinations</li>
                      <li style="margin-bottom: 8px;">Monitor competition results</li>
                      <li>Collaborate with your team</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.3);">
                      ✓ Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #1e3a8a; font-weight: bold; font-size: 14px;">
                      📧 Can't click the button?
                    </p>
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                      Copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0 0; color: #3b82f6; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
                      {{ .ConfirmationURL }}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      ⏰ <strong>Note:</strong> This invitation will expire in 7 days.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you weren't expecting this invitation or don't want to join HDS Horses, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 15px 0; color: #111827; font-size: 14px;">
                Best regards,<br>
                <strong>The HDS Horses Team</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                © 2025 HDS Horses. All rights reserved.<br>
                Professional horse management for modern stables.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## How to Add These Templates to Supabase

### For Confirm Signup:
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Click on **Confirm signup**
4. Replace the subject with: `Confirm your email for HDS Horses`
5. Replace the body with the template above
6. Click **Save**

### For Invite User:
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Click on **Invite user**
4. Replace the subject with: `You're invited to join HDS Horses`
5. Replace the body with the template above
6. Click **Save**

---

## Template Variables Explained

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The full confirmation/invitation link
- `{{ .Token }}` - The raw token (if needed)
- `{{ .TokenHash }}` - Token hash for verification
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .Email }}` - The user's email address

These templates use `{{ .ConfirmationURL }}` which Supabase automatically generates with the correct redirect URL based on your **URL Configuration** settings.

---

## Important: URL Configuration

Make sure these are configured in Supabase **Authentication** → **URL Configuration**:

**Site URL:**
- Production: `https://hds-horses.vercel.app`
- Development: `http://localhost:5173`

**Redirect URLs (Add both):**
- `https://hds-horses.vercel.app/auth/callback`
- `http://localhost:5173/auth/callback`

This ensures the `{{ .ConfirmationURL }}` links to the correct callback page.
