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
//@ts-ignore
router.post('/', authenticateToken, createDocument);
//@ts-ignore

router.get('/', authenticateToken, getAllDocuments);
//@ts-ignore

router.get('/:id', authenticateToken, getDocumentById);
//@ts-ignore

router.put('/:id', authenticateToken, updateDocument);
//@ts-ignore

router.delete('/:id', authenticateToken, deleteDocument);

export default router;
