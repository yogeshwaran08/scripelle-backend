import { Router } from 'express';
import {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument
} from '../controllers/DocumentController';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
router.post('/', authenticateToken, createDocument);
router.get('/', authenticateToken, getAllDocuments);
router.get('/:id', authenticateToken, getDocumentById);
router.put('/:id', authenticateToken, updateDocument);
router.delete('/:id', authenticateToken, deleteDocument);

export default router;
