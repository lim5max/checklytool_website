-- Migration: Add image support to test questions
-- Description: Documents that TestQuestion objects in generated_tests.questions JSON field now support imageUrl field
-- Date: 2025-10-19
-- Note: No schema changes needed since questions are stored as JSON

-- Add comment to document the new imageUrl field support
COMMENT ON COLUMN generated_tests.questions IS
  'JSON array of test questions. Each question can have:
   - id: string (unique identifier)
   - question: string (question text)
   - type: "single" | "multiple" | "open"
   - options: array of {id, text, isCorrect}
   - explanation: string (optional)
   - hideOptionsInPDF: boolean (optional)
   - points: number (optional, default 1)
   - imageUrl: string (optional, URL to question image in Supabase Storage)

   Example with image:
   {
     "id": "q_123",
     "question": "Что изображено на рисунке?",
     "type": "single",
     "imageUrl": "https://[project].supabase.co/storage/v1/object/public/submissions/test-questions/question_q_123_1729300000000.jpg",
     "options": [...],
     "points": 1
   }';

-- This migration is documentation-only. The questions field is JSONB and already supports
-- storing imageUrl without schema changes. Images are stored in Supabase Storage bucket "submissions"
-- under the path "test-questions/question_[questionId]_[timestamp].[ext]"
