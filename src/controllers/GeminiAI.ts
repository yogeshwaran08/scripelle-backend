import { Request, Response } from 'express';
import { generateContent, generateContentStream, startChat } from '../services/gemini.service';
import { AuthRequest } from '../types/auth.types';
import { DocumentChatRequest, GenerateProtectedRequest } from '../types/gemini.types';
import prisma from '../db/prisma';

/**
 * Helper function to verify document ownership and return document
 */
async function verifyDocumentOwnership(documentId: string, userId: number) {
  const document = await prisma.documents.findUnique({
    where: {
      id: parseInt(documentId),
      createdBy: userId
    }
  });

  if (!document) {
    throw new Error('Document not found or access denied');
  }

  return document;
}

/**
 * Helper function to update document chat history
 */
async function updateDocumentChatHistory(documentId: string, userMessage: string, aiResponse: string, currentHistory: string[] = []) {
  const updatedChatHistory = [
    ...currentHistory,
    `User: ${userMessage}`,
    `AI: ${aiResponse}`
  ];

  await prisma.documents.update({
    where: { id: parseInt(documentId) },
    data: {
      chatHistory: updatedChatHistory,
      updatedAt: new Date()
    }
  });

  return updatedChatHistory;
}

/**
 * Generate AI content
 * POST /ai/generate
 */
export async function generate(req: Request, res: Response): Promise<void> {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const response = await generateContent(prompt, model);

    res.status(200).json({
      success: true,
      response,
      model: model || 'gemini-2.0-flash-exp'
    });
  } catch (error: any) {
    console.error('Generate error:', error);

    if (error.message?.includes('API key')) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    res.status(500).json({
      error: 'Failed to generate content',
      details: error.message
    });
  }
}


export async function generateStream(req: Request, res: Response): Promise<void> {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await generateContentStream(prompt, model);

    for await (const chunk of stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Generate stream error:', error);
    res.status(500).json({
      error: 'Failed to generate content stream',
      details: error.message
    });
  }
}

/**
 * Chat with AI (maintains conversation)
 * POST /ai/chat
 */
export async function chat(req: Request, res: Response): Promise<void> {
  try {
    const { message, history, model } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const chatSession = startChat(history || [], model);
    const result = await chatSession.sendMessage(message);
    const response = result.response.text();

    res.status(200).json({
      success: true,
      response,
      model: model || 'gemini-2.0-flash-exp'
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat',
      details: error.message
    });
  }
}

/**
 * Protected Chat with Document - requires authentication and document ownership
 * POST /ai/chat-document
 */
export async function chatWithDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { message, documentId, model } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!documentId) {
      res.status(400).json({ error: 'Document ID is required' });
      return;
    }

    // Verify document belongs to the user
    const document = await verifyDocumentOwnership(documentId, req.user.userId);

    // Use existing chat history from the document
    const chatSession = startChat(document.chatHistory || [], model);
    const result = await chatSession.sendMessage(message);
    const response = result.response.text();

    // Update chat history in the database
    const updatedChatHistory = await updateDocumentChatHistory(
      documentId,
      message,
      response,
      document.chatHistory || []
    );

    res.status(200).json({
      success: true,
      response,
      model: model || 'gemini-2.0-flash-exp',
      documentId,
      chatHistoryLength: updatedChatHistory.length
    });
  } catch (error: any) {
    console.error('Chat with document error:', error);

    if (error.message === 'Document not found or access denied') {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: 'Failed to process chat with document',
      details: error.message
    });
  }
}

/**
 * Protected AI endpoint - requires authentication
 * POST /ai/generate-protected
 */
export async function generateProtected(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { prompt, model, documentId } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // If documentId is provided, verify document ownership
    let document = null;
    if (documentId) {
      try {
        document = await verifyDocumentOwnership(documentId, req.user.userId);
      } catch (error: any) {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    // You can add credit check here
    // const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    // if (user.availableCredits <= 0) {
    //   res.status(403).json({ error: 'Insufficient credits' });
    //   return;
    // }

    const response = await generateContent(prompt, model);

    // If document was provided, update its chat history
    let chatHistoryLength = null;
    if (document) {
      const updatedChatHistory = await updateDocumentChatHistory(
        documentId,
        prompt,
        response,
        document.chatHistory || []
      );
      chatHistoryLength = updatedChatHistory.length;
    }

    // Deduct credits here if needed
    // await prisma.user.update({
    //   where: { id: req.user.userId },
    //   data: { availableCredits: user.availableCredits - 1 }
    // });

    res.status(200).json({
      success: true,
      response,
      model: model || 'gemini-2.0-flash-exp',
      userId: req.user.userId,
      documentId: documentId || null,
      chatHistoryLength
    });
  } catch (error: any) {
    console.error('Generate protected error:', error);
    res.status(500).json({
      error: 'Failed to generate content',
      details: error.message
    });
  }
}

/**
 * Get document chat history - requires authentication and document ownership
 * GET /ai/document-chat-history/:documentId
 */
export async function getDocumentChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { documentId } = req.params;

    if (!documentId) {
      res.status(400).json({ error: 'Document ID is required' });
      return;
    }

    // Verify document belongs to the user
    try {
      const document = await verifyDocumentOwnership(documentId, req.user.userId);

      res.status(200).json({
        success: true,
        documentId,
        chatHistory: document.chatHistory || [],
        chatHistoryLength: document.chatHistory?.length || 0,
        lastUpdated: document.updatedAt
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  } catch (error: any) {
    console.error('Get document chat history error:', error);
    res.status(500).json({
      error: 'Failed to get document chat history',
      details: error.message
    });
  }
}

/**
 * Clear document chat history - requires authentication and document ownership
 * DELETE /ai/document-chat-history/:documentId
 */
export async function clearDocumentChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { documentId } = req.params;

    if (!documentId) {
      res.status(400).json({ error: 'Document ID is required' });
      return;
    }

    // Verify document belongs to the user
    try {
      await verifyDocumentOwnership(documentId, req.user.userId);

      // Clear chat history
      await prisma.documents.update({
        where: { id: parseInt(documentId) },
        data: {
          chatHistory: [],
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        documentId,
        message: 'Chat history cleared successfully'
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  } catch (error: any) {
    console.error('Clear document chat history error:', error);
    res.status(500).json({
      error: 'Failed to clear document chat history',
      details: error.message
    });
  }
}
