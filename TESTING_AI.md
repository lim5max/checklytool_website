# Testing the AI Evaluation System

## Prerequisites
1. Ensure the development server is running (`npm run dev`)
2. Make sure you have a valid `OPENROUTER_API_KEY` in your `.env.local` file
3. Create at least one check with reference answers

## Testing Methods

### 1. Using the Test UI (Recommended)
1. Navigate to `http://localhost:3005/test-ai` (or your current port)
2. If you don't have any submissions, click "Create Test" to create a sample submission
3. Select a submission from the list or enter a submission ID manually
4. Click "Test AI Evaluation" to run the AI analysis
5. View the results in the output panel

### 2. Using API Endpoints Directly
1. Create a submission (if you don't have one):
   ```bash
   curl -X POST http://localhost:3005/api/create-test-submission
   ```

2. Get recent submissions:
   ```bash
   curl http://localhost:3005/api/recent-submissions
   ```

3. Test evaluation:
   ```bash
   curl -X POST http://localhost:3005/api/test-evaluate \
     -H "Content-Type: application/json" \
     -d '{"submissionId": "YOUR_SUBMISSION_ID"}'
   ```

### 3. Manual Testing Through the App
1. Go to your dashboard and select a check
2. Click "Загрузить работы студентов"
3. Upload images of student work
4. Fill in student information
5. Click "Отправить работу" - this will automatically trigger AI evaluation

## Expected Results
The AI evaluation should return a JSON response with:
- Detected answers from the student work
- Confidence scores for each answer
- Calculated grade based on reference answers
- Total questions and correct/incorrect counts

## Troubleshooting

### Common Issues
1. **"Authentication required"**: Make sure you're logged in to the application
2. **"Submission not found"**: Verify the submission ID exists in your database
3. **OpenRouter API errors**: Check your API key and quota
4. **Timeout errors**: Large images or busy API might cause timeouts

### Debugging Steps
1. Check browser console for frontend errors
2. Check terminal logs for backend errors
3. Verify environment variables are set correctly
4. Test OpenRouter API key directly with curl

### Testing with curl
```bash
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-flash-1.5",
    "messages": [
      {
        "role": "user", 
        "content": "Hello!"
      }
    ]
  }'
```

## Development Notes

### Adding New Features
1. Modify the prompt in `lib/openrouter.ts` for different analysis behavior
2. Update the `AIAnalysisResponse` type in `types/check.ts` for new fields
3. Adjust the grading algorithm in `lib/openrouter.ts` if needed

### Performance Considerations
- Images are sent directly to OpenRouter (no local processing)
- Retry mechanism handles temporary failures
- Results are cached in the database for quick retrieval