import { Router } from "express";
import { generateText, getDocumentChatHistory, clearDocumentChatHistory } from "../controllers/TextGenerator";
import { authenticateToken } from "../middlewares/auth.middleware";

const routes = Router();

// Protected endpoints - require authentication
routes.post("/generate-text", authenticateToken, generateText);
routes.get("/document-chat-history/:documentId", authenticateToken, getDocumentChatHistory);
routes.delete("/document-chat-history/:documentId", authenticateToken, clearDocumentChatHistory);

export default routes;