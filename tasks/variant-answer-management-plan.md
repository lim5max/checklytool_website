# Variant and Answer Management Implementation Plan

## Current Status
The system currently has:
- ✅ Basic check creation functionality
- ✅ Database schema for variants and answers
- ✅ VariantManager component (frontend)
- ❌ API endpoints for variant management
- ❌ Integration between CreateCheckForm and VariantManager
- ❌ Answer input functionality during/after check creation

## Issue Analysis
Currently, when creating a check:
1. User fills basic check information
2. Variants are auto-created in database but empty
3. No way to add reference answers during creation
4. No API endpoints to update variant answers after creation
5. VariantManager expects API endpoints that don't exist

## Implementation Plan

### Phase 1: API Endpoints for Variant Management

#### 1.1 Create `/api/checks/[id]/variants/[variantId]/route.ts`
- `PUT` - Update variant answers and metadata
- `GET` - Get specific variant details

#### 1.2 Create `/api/checks/[id]/variants/[variantId]/images/route.ts`
- `POST` - Upload reference images for variant
- `DELETE` - Remove specific image from variant

#### 1.3 Create `/api/checks/[id]/variants/route.ts`
- `GET` - List all variants for a check
- `POST` - Create new variant (if needed)

### Phase 2: Enhanced Check Creation Workflow

#### 2.1 Multi-step Check Creation
Update CreateCheckForm to include:
1. **Step 1**: Basic information (existing)
2. **Step 2**: Variant setup with reference answers
3. **Step 3**: Review and create

#### 2.2 Immediate Answer Input
Allow users to input reference answers during check creation process

### Phase 3: Improved Variant Management

#### 3.1 Fix VariantManager Integration
- Connect to real API endpoints
- Handle loading states properly
- Implement error handling

#### 3.2 Enhanced Answer Input
- Support for different question types
- Bulk answer import/export
- Answer validation

### Phase 4: Neural Network Integration Preparation

#### 4.1 Answer Format Standardization
- Define clear answer formats for AI comparison
- Support multiple answer types (exact match, partial match, etc.)

#### 4.2 API Integration Ready
- Prepare answer format for OpenRouter API
- Ensure compatibility with existing evaluation system

## Technical Requirements

### Database Schema Updates
Current schema is sufficient, but ensure:
- `check_variants.reference_answers` stores JSON properly
- `check_variants.reference_image_urls` handles array of URLs
- Proper indexes for performance

### API Response Formats
```typescript
// Variant details
interface VariantResponse {
  id: string
  variant_number: number
  reference_answers: Record<string, string>
  reference_image_urls: string[]
  created_at: string
}

// Answer update request
interface AnswerUpdateRequest {
  reference_answers: Record<string, string>
}
```

### Security Considerations
- Verify user owns the check before allowing variant updates
- Validate answer formats and limits
- Secure image upload with proper validation

## Success Criteria
1. Users can create checks and immediately add reference answers
2. Variant management works seamlessly after check creation  
3. Answer format is compatible with AI evaluation system
4. All operations are secure and performant

## Next Steps
1. Implement API endpoints
2. Update CreateCheckForm for multi-step process
3. Fix VariantManager integration
4. Test complete workflow
5. Prepare for AI integration

## Dependencies
- Supabase file storage for images
- Proper authentication middleware
- Error handling and validation
- Mobile-responsive design