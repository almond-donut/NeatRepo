# GitHub OAuth Setup dengan Supabase

## Production-Ready OAuth Configuration

This application uses Supabase's built-in OAuth provider for secure GitHub authentication. All hardcoded values have been removed and proper environment variable configuration is required.

## Required Configuration

### 1. Supabase Dashboard
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Authentication** > **Providers**
4. Aktifkan **GitHub** provider
5. Masukkan GitHub OAuth App credentials:
   - **Client ID**: Your GitHub OAuth App Client ID
   - **Client Secret**: Your GitHub OAuth App Client Secret

### 2. GitHub OAuth App Settings
1. Buka [GitHub Developer Settings](https://github.com/settings/developers)
2. Pilih OAuth App Anda
3. Update **Authorization callback URL** menjadi:
   ```
   https://qhoqcuvdgueeisqhkqio.supabase.co/auth/v1/callback
   ```
   
   **PENTING**: URL callback harus menggunakan format Supabase, bukan `/api/github/callback` seperti sebelumnya.

### 3. Environment Variables
Create `.env.local` file with your project-specific values:
```env
# Supabase Configuration - Get from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# GitHub OAuth Configuration - Must match Supabase provider settings
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Optional: For debugging
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

## Perubahan yang Dilakukan

### 1. HomePage (`app/page.tsx`)
- ✅ Mengganti implementasi OAuth kustom dengan `supabase.auth.signInWithOAuth()`
- ✅ Menghapus logika manual untuk membuat URL GitHub OAuth
- ✅ Menggunakan `redirectTo: '/dashboard'` untuk redirect otomatis

### 2. AuthProvider (`components/auth-provider.tsx`)
- ✅ Membuat context untuk mengelola state authentication
- ✅ Menangani `onAuthStateChange` untuk update otomatis
- ✅ Membuat/update user profile otomatis saat login berhasil

### 3. Layout (`app/layout.tsx`)
- ✅ Menambahkan `AuthProvider` wrapper

### 4. Endpoint Cleanup
- ✅ Menghapus `/api/github/callback` yang tidak diperlukan
- ✅ Supabase menangani callback secara otomatis

## Testing OAuth Flow

1. Jalankan aplikasi: `npm run dev`
2. Buka `http://localhost:3000`
3. Klik tombol "Connect GitHub"
4. Anda akan diarahkan ke GitHub untuk authorization
5. Setelah approve, akan redirect ke `/dashboard`

## Troubleshooting

### Error: "The redirect_uri is not associated with this application"
- Pastikan callback URL di GitHub OAuth App adalah: `https://qhoqcuvdgueeisqhkqio.supabase.co/auth/v1/callback`
- Jangan gunakan `http://localhost:3001/api/github/callback`

### Error: "Invalid client_id"
- Pastikan Client ID di Supabase Dashboard sama dengan yang di GitHub OAuth App

### User tidak ter-create di database
- Periksa tabel `user_profiles` di Supabase
- AuthProvider akan otomatis membuat profile saat login pertama kali

## Database Schema

Pastikan tabel `user_profiles` memiliki struktur:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  github_username TEXT,
  github_id BIGINT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
