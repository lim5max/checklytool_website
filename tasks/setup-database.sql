-- ChecklyTool Database Setup
-- Execute this in Supabase SQL Editor

-- 1. Create user profiles table for admin management
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL, -- NextAuth user ID (session.user.id or session.user.email)
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  provider TEXT, -- google, yandex
  role TEXT DEFAULT 'user', -- user, admin
  first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_checks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create main tables
CREate TABLE checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- NextAuth user ID (email or provider ID)
  title TEXT NOT NULL,
  description TEXT,
  variant_count INTEGER NOT NULL DEFAULT 1,
  subject TEXT,
  class_level TEXT,
  total_questions INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE grading_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL, -- 2, 3, 4, 5
  min_percentage INTEGER NOT NULL, -- minimum percentage for this grade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE check_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  variant_number INTEGER NOT NULL,
  reference_answers JSONB, -- structure: {1: "A", 2: "B", 3: "C", ...}
  reference_image_urls TEXT[], -- array of reference image URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(check_id, variant_number)
);

CREATE TABLE student_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  student_name TEXT,
  student_class TEXT,
  submission_images TEXT[] NOT NULL, -- array of uploaded image URLs
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, retry_needed
  variant_detected INTEGER,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE evaluation_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES student_submissions(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  percentage_score DECIMAL(5,2) NOT NULL,
  final_grade INTEGER NOT NULL, -- 2, 3, 4, 5
  variant_used INTEGER,
  detailed_answers JSONB, -- {1: {given: "A", correct: "B", is_correct: false}, ...}
  ai_response JSONB, -- full OpenRouter/Gemini response
  confidence_score DECIMAL(3,2), -- AI confidence in recognition (0.00-1.00)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE check_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  total_submissions INTEGER DEFAULT 0,
  completed_submissions INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  grade_distribution JSONB, -- {"2": 5, "3": 10, "4": 15, "5": 8}
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(check_id)
);

-- 2. Create indexes for performance
-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_provider ON user_profiles(provider);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Main tables indexes
CREATE INDEX idx_checks_user_id ON checks(user_id);
CREATE INDEX idx_checks_created_at ON checks(created_at DESC);
CREATE INDEX idx_submissions_check_id ON student_submissions(check_id);
CREATE INDEX idx_submissions_status ON student_submissions(status);
CREATE INDEX idx_evaluation_results_submission_id ON evaluation_results(submission_id);
CREATE INDEX idx_grading_criteria_check_id ON grading_criteria(check_id);
CREATE INDEX idx_check_variants_check_id ON check_variants(check_id);

-- 3. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_statistics ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for user_profiles table
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "System can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (true); -- Allows system to create profiles on first login

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.user_id = current_setting('app.current_user_id', true)
      AND admin_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can update user roles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.user_id = current_setting('app.current_user_id', true)
      AND admin_profile.role = 'admin'
    )
  );

-- 5. Create RLS policies for checks table
CREATE POLICY "Users can view own checks" ON checks
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create checks" ON checks
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own checks" ON checks
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete own checks" ON checks
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- 6. Create RLS policies for related tables
CREATE POLICY "Users can manage criteria for own checks" ON grading_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = grading_criteria.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can manage variants for own checks" ON check_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = check_variants.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can manage submissions for own checks" ON student_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = student_submissions.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can view results for own submissions" ON evaluation_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM student_submissions s
      JOIN checks c ON c.id = s.check_id
      WHERE s.id = evaluation_results.submission_id 
      AND c.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can view stats for own checks" ON check_statistics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = check_statistics.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );

-- 7. Create function to update user profile statistics
CREATE OR REPLACE FUNCTION update_user_profile_stats(user_identifier TEXT)
RETURNS VOID AS $$
DECLARE
  check_count INTEGER;
BEGIN
  -- Count total checks for user
  SELECT COUNT(*)
  INTO check_count
  FROM checks
  WHERE user_id = user_identifier;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    total_checks = check_count,
    last_login_at = NOW(),
    updated_at = NOW()
  WHERE user_id = user_identifier;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to update check statistics
CREATE OR REPLACE FUNCTION update_check_statistics(check_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_subs INTEGER;
  completed_subs INTEGER;
  avg_score DECIMAL(5,2);
  grade_dist JSONB;
BEGIN
  -- Count total and completed submissions
  SELECT COUNT(*), COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO total_subs, completed_subs
  FROM student_submissions
  WHERE check_id = check_uuid;
  
  -- Calculate average score
  SELECT AVG(percentage_score)
  INTO avg_score
  FROM evaluation_results er
  JOIN student_submissions ss ON ss.id = er.submission_id
  WHERE ss.check_id = check_uuid;
  
  -- Calculate grade distribution
  SELECT json_object_agg(final_grade::text, grade_count)
  INTO grade_dist
  FROM (
    SELECT final_grade, COUNT(*) as grade_count
    FROM evaluation_results er
    JOIN student_submissions ss ON ss.id = er.submission_id
    WHERE ss.check_id = check_uuid
    GROUP BY final_grade
  ) grade_counts;
  
  -- Insert or update statistics
  INSERT INTO check_statistics (check_id, total_submissions, completed_submissions, average_score, grade_distribution)
  VALUES (check_uuid, total_subs, completed_subs, avg_score, COALESCE(grade_dist, '{}'::jsonb))
  ON CONFLICT (check_id) 
  DO UPDATE SET
    total_submissions = EXCLUDED.total_submissions,
    completed_submissions = EXCLUDED.completed_submissions,
    average_score = EXCLUDED.average_score,
    grade_distribution = EXCLUDED.grade_distribution,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics when evaluation results are inserted or updated
  IF TG_TABLE_NAME = 'evaluation_results' THEN
    PERFORM update_check_statistics((
      SELECT check_id FROM student_submissions WHERE id = NEW.submission_id
    ));
  -- Update statistics when submissions are updated
  ELSIF TG_TABLE_NAME = 'student_submissions' THEN
    PERFORM update_check_statistics(NEW.check_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers
CREATE TRIGGER update_stats_on_results
  AFTER INSERT OR UPDATE ON evaluation_results
  FOR EACH ROW EXECUTE FUNCTION trigger_update_statistics();

CREATE TRIGGER update_stats_on_submissions
  AFTER UPDATE ON student_submissions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_statistics();

-- 11. Create trigger to update user stats when checks are created/deleted
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile stats when checks are created or deleted
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_profile_stats(NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_user_profile_stats(OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_on_checks
  AFTER INSERT OR DELETE ON checks
  FOR EACH ROW EXECUTE FUNCTION trigger_update_user_stats();

-- 12. Create storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('checks', 'checks', false)
ON CONFLICT (id) DO NOTHING;

-- 13. Storage policies for file uploads
CREATE POLICY "Authenticated users can upload check files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'checks' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own check files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'checks' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own check files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'checks' AND
    auth.role() = 'authenticated'
  );