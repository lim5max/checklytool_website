# AI Evaluation System Documentation

## Overview
The AI evaluation system uses OpenRouter with Google's Gemini Flash 1.5 model to automatically grade student work by analyzing scanned images and comparing them with reference answers.

## System Architecture

### Components
1. **Frontend**: Submission upload interface
2. **API Layer**: REST endpoints for submission management
3. **AI Engine**: OpenRouter integration with Gemini Flash
4. **Database**: PostgreSQL with Supabase for storing results
5. **Storage**: Supabase Storage for image management

### Data Flow
1. Teacher creates a check with reference answers
2. Student work is uploaded as images
3. System sends images to Gemini Flash for analysis
4. AI extracts student answers and compares with references
5. System calculates grade based on grading criteria
6. Results are stored and displayed to teacher

## API Endpoints

### Submission Management
- `POST /api/checks/[id]/submissions` - Upload student work
- `GET /api/checks/[id]/submissions` - List submissions
- `GET /api/submissions/[id]` - Get submission details

### AI Evaluation
- `POST /api/submissions/[id]/evaluate` - Start AI evaluation
- `GET /api/submissions/[id]/evaluate` - Check evaluation status
- `GET /api/submissions/[id]/results` - Get evaluation results

## AI Analysis Process

### Input Data
- Student work images (1-20 pages)
- Reference answers (text-based)
- Reference images (optional)
- Grading criteria (percentage thresholds for grades 2-5)

### AI Prompt Structure
The system uses a specialized prompt for educational assessment:

```
System Role: Expert educational assessment AI
Task:
1. Extract all visible answers from student work images
2. Identify which exam variant student used (if multiple variants)
3. Compare each answer with reference answers
4. Provide confidence scores for each detection
5. Return structured JSON with results
```

### Output Format
```json
{
  "variant_detected": 1,
  "confidence_score": 0.95,
  "student_name": "Иванов Иван",
  "total_questions": 10,
  "answers": {
    "1": {
      "detected_answer": "42",
      "confidence": 0.9
    },
    "2": {
      "detected_answer": "x=5",
      "confidence": 0.85
    }
  },
  "additional_notes": "Работа выполнена аккуратно, почерк читаемый"
}
```

## Grading Algorithm

### Answer Comparison
- Text-based comparison with case/whitespace normalization
- Mathematical equivalence checking (0.5 = 1/2)
- Partial credit support (future enhancement)

### Grade Calculation
1. Count correct answers
2. Calculate percentage: (correct / total) * 100
3. Apply grading criteria:
   - Grade 5: 90-100%
   - Grade 4: 75-89%
   - Grade 3: 55-74%
   - Grade 2: 0-54%

## Error Handling

### Retry Mechanism
- Automatic retry up to 3 times on API failures
- Exponential backoff (1s, 2s, 4s delays)
- Detailed error logging for debugging

### Common Issues
1. **Poor image quality**: Low confidence scores
2. **Network timeouts**: Retry mechanism
3. **API rate limits**: Queue management
4. **Parsing errors**: Manual review option

## Testing

### Test Endpoints
- `/api/test-evaluate` - Manual evaluation trigger
- `/api/create-test-submission` - Create test data
- `/api/recent-submissions` - List recent submissions

### Test Page
Accessible at `/test-ai` for manual testing and debugging.

## Future Enhancements

### Planned Features
1. **Handwriting recognition improvement**
2. **Multi-language support**
3. **Partial credit scoring**
4. **Batch processing**
5. **Advanced analytics**

### Technical Improvements
1. **Caching for repeated evaluations**
2. **Parallel processing for multiple submissions**
3. **Enhanced error recovery**
4. **Better confidence scoring**