# Humanize Text API Documentation

## Overview

The Humanize Text API allows you to transform AI-generated text into more natural, human-like content using the Rephrasy API.

## Setup

### Environment Variables

Add the following to your `.env` file:

```env
REPHRASY_API_KEY=your_rephrasy_api_key_here
```

Get your API key from: https://rephrasy.ai/

## API Endpoint

### POST `/ai/humanize`

Humanizes AI-generated text to make it sound more natural and human-like.

**Authentication Required:** Yes (Bearer Token)

#### Request Body

```json
{
  "text": "Your AI-generated text to humanize",
  "model": "undetectable",
  "words": true,
  "costs": true,
  "language": "English"
}
```

#### Parameters

| Parameter | Type    | Required | Default        | Description                                  |
| --------- | ------- | -------- | -------------- | -------------------------------------------- |
| text      | string  | Yes      | -              | The text to humanize (max 10,000 characters) |
| model     | string  | No       | "undetectable" | The humanization model to use                |
| words     | boolean | No       | true           | Include word count in response               |
| costs     | boolean | No       | true           | Include cost information in response         |
| language  | string  | No       | "English"      | Target language for humanization             |

#### Success Response (200 OK)

```json
{
  "success": true,
  "humanized_text": "The humanized version of your text",
  "credits_used": 50,
  "cost": 0.05,
  "model": "undetectable",
  "language": "English",
  "userId": 123
}
```

#### Error Responses

**400 Bad Request** - Invalid input

```json
{
  "error": "Text is required and must be a string"
}
```

**401 Unauthorized** - Missing or invalid authentication

```json
{
  "error": "Authentication required"
}
```

**402 Payment Required** - Insufficient credits

```json
{
  "error": "Insufficient credits for humanization service"
}
```

**429 Too Many Requests** - Rate limit exceeded

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**500 Internal Server Error**

```json
{
  "error": "Failed to humanize text",
  "details": "Error details here"
}
```

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
async function humanizeText(text: string) {
  const response = await fetch("http://localhost:5000/ai/humanize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${yourAuthToken}`,
    },
    body: JSON.stringify({
      text: text,
      model: "undetectable",
      language: "English",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
try {
  const result = await humanizeText("AI-generated text here");
  console.log("Humanized:", result.humanized_text);
  console.log("Credits used:", result.credits_used);
} catch (error) {
  console.error("Error:", error.message);
}
```

### cURL

```bash
curl -X POST http://localhost:5000/ai/humanize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "text": "Rephrasy is a service which rephrases AI generated text.",
    "model": "undetectable",
    "language": "English"
  }'
```

### Axios

```javascript
const axios = require("axios");

async function humanizeText(text) {
  try {
    const response = await axios.post(
      "http://localhost:5000/ai/humanize",
      {
        text: text,
        model: "undetectable",
        language: "English",
      },
      {
        headers: {
          Authorization: `Bearer ${yourAuthToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    throw error;
  }
}
```

## Available Models

- `undetectable` - Default model optimized for undetectable humanization
- Other models may be available through the Rephrasy API

## Supported Languages

- English (default)
- Spanish
- French
- German
- Italian
- Portuguese
- Dutch
- Russian
- Chinese
- Japanese
- And more...

Check Rephrasy documentation for the complete list of supported languages.

## Rate Limits

Rate limits are determined by your Rephrasy API plan. Common limits:

- Free plan: Limited requests per day
- Paid plans: Higher limits based on subscription tier

## Best Practices

1. **Input Validation**: Always validate text length before sending (max 10,000 characters)
2. **Error Handling**: Implement proper error handling for API failures and quota issues
3. **Cost Monitoring**: Use the `credits_used` field to track usage and costs
4. **Caching**: Consider caching humanized results to reduce API calls
5. **User Feedback**: Show loading states and inform users of credit usage

## Integration with Document Editor

You can integrate this with your document editor to humanize selected text:

```typescript
// Example: Humanize selected text in editor
async function humanizeSelection(selectedText: string) {
  if (!selectedText || selectedText.length === 0) {
    alert("Please select text to humanize");
    return;
  }

  if (selectedText.length > 10000) {
    alert("Selected text is too long. Maximum 10,000 characters.");
    return;
  }

  try {
    const result = await humanizeText(selectedText);
    // Replace selected text with humanized version
    replaceSelection(result.humanized_text);

    // Show credits used
    showNotification(`Humanized! Credits used: ${result.credits_used}`);
  } catch (error) {
    showError(error.message);
  }
}
```

## Troubleshooting

### "Humanization service is not configured"

- Ensure `REPHRASY_API_KEY` is set in your `.env` file
- Restart your server after adding the environment variable

### "Invalid API key for humanization service"

- Verify your API key is correct
- Check if your API key is active on Rephrasy dashboard

### "Insufficient credits"

- Check your Rephrasy account balance
- Top up credits or upgrade your plan

### "Text is too long"

- Split long text into smaller chunks
- Process each chunk separately and combine results

## Support

For issues with:

- **Backend API**: Check server logs and contact your development team
- **Rephrasy API**: Visit https://rephrasy.ai/support
- **API Key**: Manage at https://rephrasy.ai/dashboard

## Changelog

### Version 1.0.0

- Initial implementation of humanize text API
- Support for multiple languages and models
- Credit usage tracking
- Comprehensive error handling
