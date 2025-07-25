# Vercel Environment Variables Setup

## Required Environment Variables for Production

### 1. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://qhoqcuvdgueeisqhkqio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob3FjdXZkZ3VlZWlzcWhrcWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDkxMTksImV4cCI6MjA2ODY4NTExOX0.e5ibUs6zWfPQ1et1BCWx22KWdw5Q1hhAyiLnCxQchzI
```

### 2. GitHub OAuth Configuration
```
GITHUB_CLIENT_ID=Ov23liaOcBS8zuFJCGyG
GITHUB_CLIENT_SECRET=7966dc1935a2cf8fd7f26c40cd2ce15feacc5faa0b224a4fb497ce18cf3d3b16
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liaOcBS8zuFJCGyG
```

### 3. Email Configuration (Bug Reports)
```
SMTP_USER=[YOUR_GMAIL_ADDRESS]
SMTP_PASS=[YOUR_GMAIL_APP_PASSWORD]
```

### 4. Additional Required Variables
```
NODE_ENV=production
```

## Setup Instructions

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable above with their respective values
3. Make sure to set them for "Production", "Preview", and "Development" environments
4. Redeploy the project after adding all variables

## Missing Variables Needed

Please provide:
1. **Supabase Service Role Key** (if needed for server-side operations)
2. **Gmail address** for bug report emails
3. **Gmail App Password** for the above email

## Verification

After setting up, the following should work:
- ✅ Homepage loads without 500 error
- ✅ Authentication flow works
- ✅ Bug report system can send emails
- ✅ Dashboard access with proper middleware protection
