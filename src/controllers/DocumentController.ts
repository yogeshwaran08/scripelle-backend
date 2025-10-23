import { Request, Response } from "express";
import { catchAsync, sendResponse, throwError, error_codes } from "../utils/httpWrapper";
import { prisma } from "../db/prisma";

/**
 * Create a new document
 * POST /documents
 */
export const createDocument = catchAsync(async (req, res) => {
    const { title, content = "", chatHistory = [] } = req.body;
    
    if (!title) {
        throw throwError("Title is required", error_codes.BAD_REQUEST);
    }

    const document = await prisma.documents.create({
        data: {
            title,
            content,
            chatHistory: Array.isArray(chatHistory) ? chatHistory : []
        }
    });

    return sendResponse(res, document, { message: "Document created successfully" });
});

/**
 * Get all documents
 * GET /documents
 */
export const getAllDocuments = catchAsync(async (req, res) => {
    const documents = await prisma.documents.findMany({
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return sendResponse(res, documents, { 
        message: "Documents retrieved successfully",
        count: documents.length 
    });
});

/**
 * Get a single document by ID
 * GET /documents/:id
 */
export const getDocumentById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const document = await prisma.documents.findUnique({
        where: {
            id: parseInt(id)
        }
    });

    if (!document) {
        throw throwError("Document not found", error_codes.NOT_FOUND);
    }

    return sendResponse(res, document, { message: "Document retrieved successfully" });
});

/**
 * Update a document
 * PUT /documents/:id
 */
export const updateDocument = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, content, chatHistory } = req.body;

    const existingDocument = await prisma.documents.findUnique({
        where: { id: parseInt(id) }
    });

    if (!existingDocument) {
        throw throwError("Document not found", error_codes.NOT_FOUND);
    }

    const document = await prisma.documents.update({
        where: {
            id: parseInt(id)
        },
        data: {
            ...(title && { title }),
            ...(content !== undefined && { content }),
            ...(chatHistory && { chatHistory: Array.isArray(chatHistory) ? chatHistory : [] })
        }
    });

    return sendResponse(res, document, { message: "Document updated successfully" });
});

/**
 * Delete a document
 * DELETE /documents/:id
 */
export const deleteDocument = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingDocument = await prisma.documents.findUnique({
        where: { id: parseInt(id) }
    });

    if (!existingDocument) {
        throw throwError("Document not found", error_codes.NOT_FOUND);
    }

    await prisma.documents.delete({
        where: {
            id: parseInt(id)
        }
    });

    return sendResponse(res, null, { message: "Document deleted successfully" });
});