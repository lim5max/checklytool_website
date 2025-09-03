-- Additional SQL functions needed for NextAuth integration
-- Execute this in Supabase SQL Editor AFTER running the main setup-database.sql

-- Function to set configuration parameters (used for RLS with NextAuth)
CREATE OR REPLACE FUNCTION set_config(parameter text, value text)
RETURNS text AS $$
BEGIN
  PERFORM set_config(parameter, value, true);
  RETURN value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert user profiles bypassing RLS
CREATE OR REPLACE FUNCTION upsert_user_profile(profile_data jsonb)
RETURNS user_profiles AS $$
DECLARE
  result user_profiles;
BEGIN
  -- Insert or update user profile
  INSERT INTO user_profiles (
    user_id, email, name, avatar_url, provider, 
    last_login_at, updated_at
  )
  VALUES (
    (profile_data->>'user_id')::text,
    (profile_data->>'email')::text,
    (profile_data->>'name')::text,
    (profile_data->>'avatar_url')::text,
    (profile_data->>'provider')::text,
    (profile_data->>'last_login_at')::timestamptz,
    (profile_data->>'updated_at')::timestamptz
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    last_login_at = EXCLUDED.last_login_at,
    updated_at = EXCLUDED.updated_at
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION set_config(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_profile(jsonb) TO anon, authenticated;