import { Router } from "express";
import { generateText, getDocumentChatHistory, clearDocumentChatHistory, humanizeAIText } from "../controllers/TextGenerator";
import { authenticateToken } from "../middlewares/auth.middleware";

const routes = Router();

routes.post("/generate-text", authenticateToken, generateText);
routes.post("/humanize", authenticateToken, humanizeAIText);
routes.get("/document-chat-history/:documentId", authenticateToken, getDocumentChatHistory);
routes.delete("/document-chat-history/:documentId", authenticateToken, clearDocumentChatHistory);

export default routes;