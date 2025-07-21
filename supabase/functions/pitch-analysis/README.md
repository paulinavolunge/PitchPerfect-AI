# Pitch Analysis Edge Function

This edge function provides AI-powered analysis of sales pitches using OpenAI's GPT-4.

## Features

- Validates pitch length and quality before analysis
- Provides scores from 0-100 based on multiple criteria
- Returns detailed feedback on clarity, confidence, persuasiveness, tone, and objection handling
- Offers actionable suggestions for improvement
- Handles both text and audio input (audio is transcribed first)

## Input Validation

- Minimum 10 words required for analysis
- Pitches under 30 words or 100 characters receive appropriately low scores
- Very short inputs (like "hello") will receive a score of 0 with an error message

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key for GPT-4 access

## Deployment

1. Make sure you have the Supabase CLI installed
2. Set the OpenAI API key in your Supabase project:
   ```bash
   supabase secrets set OPENAI_API_KEY=your-api-key-here
   ```
3. Deploy the function:
   ```bash
   supabase functions deploy pitch-analysis
   ```

## Testing

Test with a proper pitch:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/pitch-analysis \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"pitchText": "Our revolutionary SaaS platform helps businesses streamline their operations and increase productivity by 40%. With advanced analytics and automation features, we have helped over 500 companies reduce costs while improving customer satisfaction. Would you like to see a demo?"}'
```

Test with short input (should return low score):
```bash
curl -X POST https://your-project.supabase.co/functions/v1/pitch-analysis \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"pitchText": "hello"}'
```

## Response Format

```json
{
  "score": 85,
  "feedback": {
    "overall": "Strong pitch with clear value proposition",
    "clarity": "Very clear and easy to understand",
    "confidence": "Demonstrates strong confidence in the product",
    "persuasiveness": "Compelling statistics and social proof",
    "tone": "Professional and engaging",
    "objectionHandling": "Good anticipation of customer interest",
    "suggestions": [
      "Consider adding specific industry examples",
      "Include more details about implementation timeline"
    ]
  },
  "transcript": "Your pitch text here...",
  "wordCount": 45
}
```

## Error Handling

The function returns appropriate error messages for:
- Missing or invalid input
- Pitches that are too short
- OpenAI API failures
- Authentication issues