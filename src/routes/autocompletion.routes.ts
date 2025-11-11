import { Router } from 'express';
import { getAutocompletionSuggestions, predictNextText } from '../controllers/AutocompletionController';
import { optionalAuthentication } from '../middlewares/auth.middleware';

const router = Router();

router.post('/suggestions', optionalAuthentication, getAutocompletionSuggestions);
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