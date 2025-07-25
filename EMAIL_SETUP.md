# 📧 Email Configuration for Bug Reports

## Setup Instructions

To enable the bug report email functionality, you need to configure email credentials in your environment variables.

### 1. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

### 2. Environment Variables

Update your `.env.local` file:

```env
# Email Configuration for Bug Reports
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### 3. Production Deployment (Vercel)

Add the same environment variables to your Vercel project:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `SMTP_USER`: your-email@gmail.com
   - `SMTP_PASS`: your-16-character-app-password

### 4. Email Template

Bug reports will be sent to: `prada.202201006@student.stikomyos.ac.id`

Email format includes:
- Reporter's email (for replies)
- Bug title and description
- Steps to reproduce
- Expected vs actual behavior
- Browser/system information
- Screenshots (as attachments)
- Timestamp and URL tracking

### 5. Testing

1. Navigate to `/bug-report`
2. Fill out the form
3. Upload screenshots (optional)
4. Submit the report
5. Check your email for the bug report

### 6. Alternative Email Providers

If not using Gmail, update the transporter configuration in `/app/api/bug-report/route.ts`:

```typescript
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-host.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})
```

### 7. Security Notes

- Never commit email credentials to version control
- Use app passwords, not your main account password
- Consider using a dedicated email account for bug reports
- Monitor email usage to prevent spam/abuse

## Features

✅ **Professional Email Format**: Clean, structured bug reports
✅ **Screenshot Support**: Up to 5 images per report
✅ **Auto-Detection**: Browser info, timestamp, URL tracking
✅ **Reply-To Setup**: Easy communication with reporters
✅ **Error Handling**: Graceful failure with user feedback
✅ **Responsive UI**: Works on all devices
✅ **Success States**: Clear confirmation for users

## Troubleshooting

**Email not sending?**
- Check SMTP credentials
- Verify app password is correct
- Ensure 2FA is enabled on Gmail
- Check Vercel environment variables

**Screenshots not attaching?**
- File size limit: 10MB per image
- Supported formats: PNG, JPG, GIF
- Maximum 5 files per report

**Form validation errors?**
- Email, title, and description are required
- Check browser console for detailed errors
