# Vercel Environment Variables Setup - PRODUCTION READY

## ⚠️ IMPORTANT SECURITY CONSIDERATIONS

### 🔐 GitHub OAuth - NEEDS NEW CREDENTIALS FOR PRODUCTION
**CURRENT ISSUE**: Using development OAuth credentials in production is NOT SECURE!

**SOLUTION NEEDED**:
1. Create NEW GitHub OAuth App specifically for production
2. Use production domain (neatrepo.vercel.app) as callback URL
3. Generate fresh CLIENT_ID and CLIENT_SECRET

**Why**: Current credentials are for development and should NOT be shared publicly or used by many users.

### 📧 Email Bug Reports - CLARIFICATION NEEDED
**CURRENT ISSUE**: Using personal email for SMTP sender is not scalable for public use.

**QUESTIONS**:
1. Do you want bug reports sent to your email (prada.202201006@student.stikomyos.ac.id)?
2. Should we use a service email (like noreply@yourdomain.com) as sender?
3. Or disable email bug reports and use alternative (like GitHub Issues)?

**Why**: Personal email credentials shouldn't be in production environment variables.

## Required Environment Variables (UPDATED)

### 1. Supabase Configuration ✅ READY
```
NEXT_PUBLIC_SUPABASE_URL=https://qhoqcuvdgueeisqhkqio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob3FjdXZkZ3VlZWlzcWhrcWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDkxMTksImV4cCI6MjA2ODY4NTExOX0.e5ibUs6zWfPQ1et1BCWx22KWdw5Q1hhAyiLnCxQchzI
```

### 2. GitHub OAuth Configuration ⚠️ NEEDS UPDATE
```
GITHUB_CLIENT_ID=[NEED_NEW_PRODUCTION_CLIENT_ID]
GITHUB_CLIENT_SECRET=[NEED_NEW_PRODUCTION_CLIENT_SECRET]
NEXT_PUBLIC_GITHUB_CLIENT_ID=[SAME_AS_GITHUB_CLIENT_ID]
```

### 3. Email Configuration ❓ NEEDS DECISION
```
SMTP_USER=[DEPENDS_ON_YOUR_DECISION]
SMTP_PASS=[DEPENDS_ON_YOUR_DECISION]
```

### 4. Additional Required Variables ✅ READY
```
NODE_ENV=production
```

## 🚨 DECISIONS NEEDED BEFORE SETUP

### Option A: Quick Deploy (Less Secure)
- Use current GitHub OAuth credentials (temporary)
- Disable email bug reports for now
- Deploy and test basic functionality

### Option B: Production Ready (Recommended)
- Create new GitHub OAuth app for production
- Set up proper email service or alternative bug reporting
- Full security implementation

## STEP-BY-STEP SETUP INSTRUCTIONS

### If choosing Option A (Quick Deploy):

**Step 1: Add ONLY Essential Variables**
1. Click "Add Another" button in Vercel dashboard
2. Add these 3 ESSENTIAL variables:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://qhoqcuvdgueeisqhkqio.supabase.co`
- Environments: Check all (Production, Preview, Development)

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob3FjdXZkZ3VlZWlzcWhrcWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDkxMTksImV4cCI6MjA2ODY4NTExOX0.e5ibUs6zWfPQ1et1BCWx22KWdw5Q1hhAyiLnCxQchzI`
- Environments: Check all (Production, Preview, Development)

**Variable 3:**
- Key: `NODE_ENV`
- Value: `production`
- Environments: Check only Production

**Step 2: Test Basic Deployment**
1. Click "Save" after adding these 3 variables
2. Let Vercel redeploy automatically
3. Test if homepage loads without 500 error

### If choosing Option B (Production Ready):

**Step 1: Create New GitHub OAuth App**
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: "NeatRepo Production"
   - Homepage URL: `https://neatrepo.vercel.app`
   - Authorization callback URL: `https://neatrepo.vercel.app/api/auth/callback`
4. Click "Register application"
5. Copy the new CLIENT_ID and generate new CLIENT_SECRET

**Step 2: Add All Variables with New OAuth**
- Add the 3 essential variables from Option A
- Add GitHub OAuth variables with NEW credentials
- Skip email variables for now (or set up proper email service)

## 🎯 RECOMMENDATION

**Start with Option A** to get the site working, then upgrade to Option B for full production security.

## 🧪 TESTING APPROACH

### For Public Production (NOT Playwright):
- Real user testing with actual signup/login flow
- Community feedback from forum users
- Monitor Vercel logs for errors
- Use built-in analytics and error tracking

### Why NOT Playwright for Production:
- Automated testing shouldn't use production environment
- Real users will provide better feedback
- Playwright is for development/staging testing

## ✅ VERIFICATION CHECKLIST

### Option A (Quick Deploy):
- ✅ Homepage loads without 500 error
- ✅ Basic authentication works (email signup/login)
- ⚠️ GitHub OAuth disabled temporarily
- ⚠️ Bug reports disabled temporarily

### Option B (Full Production):
- ✅ Homepage loads without 500 error
- ✅ Email authentication works
- ✅ GitHub OAuth works with production credentials
- ✅ Bug report system works (if implemented)
- ✅ Dashboard access with proper middleware protection

## 🚀 NEXT STEPS

1. **Choose your option** (A or B)
2. **Set up environment variables** in Vercel
3. **Test the deployment**
4. **Share with community** when ready
5. **Monitor and iterate** based on user feedback
