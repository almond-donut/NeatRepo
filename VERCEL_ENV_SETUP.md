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
SMTP_USER=prada.abdul.07@gmail.com
SMTP_PASS=Acount22
```

### 4. Additional Required Variables
```
NODE_ENV=production
```

## STEP-BY-STEP SETUP INSTRUCTIONS

### Step 1: Access Environment Variables
1. You're already in the right place! (Vercel Dashboard → Settings → Environment Variables)
2. Click the "Add Another" button to start adding variables

### Step 2: Add Each Variable One by One
For each variable below, click "Add Another" and enter:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://qhoqcuvdgueeisqhkqio.supabase.co`
- Environments: Check all (Production, Preview, Development)

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob3FjdXZkZ3VlZWlzcWhrcWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDkxMTksImV4cCI6MjA2ODY4NTExOX0.e5ibUs6zWfPQ1et1BCWx22KWdw5Q1hhAyiLnCxQchzI`
- Environments: Check all (Production, Preview, Development)

**Variable 3:**
- Key: `GITHUB_CLIENT_ID`
- Value: `Ov23liaOcBS8zuFJCGyG`
- Environments: Check all (Production, Preview, Development)

**Variable 4:**
- Key: `GITHUB_CLIENT_SECRET`
- Value: `7966dc1935a2cf8fd7f26c40cd2ce15feacc5faa0b224a4fb497ce18cf3d3b16`
- Environments: Check all (Production, Preview, Development)

**Variable 5:**
- Key: `NEXT_PUBLIC_GITHUB_CLIENT_ID`
- Value: `Ov23liaOcBS8zuFJCGyG`
- Environments: Check all (Production, Preview, Development)

**Variable 6:**
- Key: `SMTP_USER`
- Value: `prada.abdul.07@gmail.com`
- Environments: Check all (Production, Preview, Development)

**Variable 7:**
- Key: `SMTP_PASS`
- Value: `Acount22`
- Environments: Check all (Production, Preview, Development)

**Variable 8:**
- Key: `NODE_ENV`
- Value: `production`
- Environments: Check only Production

### Step 3: Save and Deploy
1. Click "Save" after adding all variables
2. Vercel will automatically redeploy your project
3. Wait for deployment to complete (usually 1-2 minutes)

## Verification

After setting up, the following should work:
- ✅ Homepage loads without 500 error
- ✅ Authentication flow works
- ✅ Bug report system can send emails
- ✅ Dashboard access with proper middleware protection
