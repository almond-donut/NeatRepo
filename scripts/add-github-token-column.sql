-- Add missing github_token column to user_profiles table
-- This fixes the profile loading issue where the account switcher gets stuck

-- Add github_token column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS github_token TEXT;

-- Add index for better performance on token lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_github_token 
ON user_profiles(github_token) 
WHERE github_token IS NOT NULL;

-- Update the table comment
COMMENT ON COLUMN user_profiles.github_token IS 'GitHub Personal Access Token for repository operations';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'github_token';
