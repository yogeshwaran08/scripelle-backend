import { Router } from 'express';
import { getAutocompletionSuggestions, predictNextText } from '../controllers/AutocompletionController';
import { optionalAuthentication } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /autocompletion/suggestions
 * Get autocompletion suggestions for text input
 * 
 * Body:
 * {
 *   "text": "The quick brown fox",
 *   "cursorPosition": 15,
 *   "context": "Writing an email about project updates",
 *   "documentType": "email",
 *   "maxSuggestions": 5,
 *   "strategy": "hybrid"
 * }
 */
router.post('/suggestions', optionalAuthentication, getAutocompletionSuggestions);

/**
 * POST /autocompletion/predict
 * Simple text prediction endpoint
 * 
 * Body:
 * {
 *   "text": "The quick brown fox",
 *   "context": "optional context"
 * }
 */
router.post('/predict', optionalAuthentication, async (req, res) => {
    try {
        const { text, context } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Text is required and must be a string',
                data: null
            });
        }

        const prediction = await predictNextText(text, context);

        res.json({
            success: true,
            message: 'Text prediction generated successfully',
            data: {
                originalText: text,
                prediction,
                context: context || null
            }
        });
    } catch (error) {
        console.error('Text prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate text prediction',
            data: null
        });
    }
});

export default router;