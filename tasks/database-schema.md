# Database Schema for ChecklyTool Main Functionality

## Overview
This document describes the database schema required for the core ChecklyTool functionality: creating checks, managing variants, scanning student work, and storing results.

## Tables Structure

### 1. checks
Main table for storing check/exam information created by teachers.

```sql
CREATE TABLE checks (
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
```

### 2. grading_criteria
Stores grading criteria for each check (what percentage = what grade).

```sql
CREATE TABLE grading_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL, -- 2, 3, 4, 5
  min_percentage INTEGER NOT NULL, -- minimum percentage for this grade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. check_variants
Stores different variants of the same check with reference answers.

```sql
CREATE TABLE check_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  variant_number INTEGER NOT NULL,
  reference_answers JSONB, -- structure: {1: "A", 2: "B", 3: "C", ...}
  reference_image_urls TEXT[], -- array of reference image URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(check_id, variant_number)
);
```

### 4. student_submissions
Stores individual student work submissions for evaluation.

```sql
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
```

### 5. evaluation_results
Stores the results of AI evaluation for each submission.

```sql
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
```

### 6. check_statistics
Aggregated statistics for each check (calculated and cached).

```sql
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
```

## Row Level Security (RLS) Policies

Since we're using NextAuth instead of Supabase Auth, we'll need to modify RLS to work with user_id instead of auth.uid().

### checks table policies
```sql
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own checks
CREATE POLICY "Users can view own checks" ON checks
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

-- Users can create checks
CREATE POLICY "Users can create checks" ON checks
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Users can update their own checks
CREATE POLICY "Users can update own checks" ON checks
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

-- Users can delete their own checks
CREATE POLICY "Users can delete own checks" ON checks
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true));
```

### Related tables policies (grading_criteria, check_variants, etc.)
```sql
-- grading_criteria
ALTER TABLE grading_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage criteria for own checks" ON grading_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = grading_criteria.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );

-- check_variants
ALTER TABLE check_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage variants for own checks" ON check_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = check_variants.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );

-- student_submissions
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage submissions for own checks" ON student_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = student_submissions.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );

-- evaluation_results
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view results for own submissions" ON evaluation_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM student_submissions s
      JOIN checks c ON c.id = s.check_id
      WHERE s.id = evaluation_results.submission_id 
      AND c.user_id = current_setting('app.current_user_id', true)
    )
  );

-- check_statistics
ALTER TABLE check_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view stats for own checks" ON check_statistics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM checks 
      WHERE checks.id = check_statistics.check_id 
      AND checks.user_id = current_setting('app.current_user_id', true)
    )
  );
```

## Functions and Triggers

### Update statistics function
```sql
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
```

### Trigger to update statistics
```sql
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

-- Create triggers
CREATE TRIGGER update_stats_on_results
  AFTER INSERT OR UPDATE ON evaluation_results
  FOR EACH ROW EXECUTE FUNCTION trigger_update_statistics();

CREATE TRIGGER update_stats_on_submissions
  AFTER UPDATE ON student_submissions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_statistics();
```

## Indexes for Performance

```sql
-- Indexes for better query performance
CREATE INDEX idx_checks_user_id ON checks(user_id);
CREATE INDEX idx_checks_created_at ON checks(created_at DESC);
CREATE INDEX idx_submissions_check_id ON student_submissions(check_id);
CREATE INDEX idx_submissions_status ON student_submissions(status);
CREATE INDEX idx_evaluation_results_submission_id ON evaluation_results(submission_id);
CREATE INDEX idx_grading_criteria_check_id ON grading_criteria(check_id);
CREATE INDEX idx_check_variants_check_id ON check_variants(check_id);
```

## File Storage Structure

For image storage (using Supabase Storage):

```
/checks/
  /{check_id}/
    /reference/
      /variant_{number}/
        - image1.jpg
        - image2.jpg
    /submissions/
      /{submission_id}/
        - page1.jpg
        - page2.jpg
        - page3.jpg
```

Storage policies:
```sql
-- Allow authenticated users to upload to their own check folders
CREATE POLICY "Users can upload to own check folders" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'checks' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM checks WHERE user_id = auth.uid()::text
    )
  );

-- Allow users to read their own check files
CREATE POLICY "Users can view own check files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'checks' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM checks WHERE user_id = auth.uid()::text
    )
  );
```

This schema supports all the requirements from the brief:
- ✅ Creating new checks with multiple variants
- ✅ Setting grading criteria (2-5 grades with percentages)  
- ✅ Storing reference answers (images or manual input)
- ✅ Managing student submissions with multi-page images
- ✅ AI evaluation results with detailed feedback
- ✅ Statistics and grade distribution
- ✅ Personal dashboard with check history
- ✅ Error handling and retry mechanisms
- ✅ User data isolation and security