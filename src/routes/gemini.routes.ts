import { Router } from 'express';
import { generate, generateStream, chat, generateProtected, chatWithDocument, getDocumentChatHistory, clearDocumentChatHistory } from '../controllers/GeminiAI';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Public AI endpoints
 */
router.post('/generate', generate);
router.post('/generate-stream', generateStream);
router.post('/chat', chat);

/**
 * Protected AI endpoints (requires authentication)
 */
router.post('/generate-protected', authenticateToken, generateProtected);
router.post('/chat-document', authenticateToken, chatWithDocument);
router.get('/document-chat-history/:documentId', authenticateToken, getDocumentChatHistory);
router.delete('/document-chat-history/:documentId', authenticateToken, clearDocumentChatHistory);

export default router;
