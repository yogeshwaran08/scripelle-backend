import { catchAsync, sendResponse, throwError, error_codes } from "../utils/httpWrapper";
import { prisma } from "../db/prisma";
import { AuthRequest } from "../types/auth.types";

export const createDocument = catchAsync(async (req: AuthRequest, res) => {
    const { title, content = "", chatHistory = [] } = req.body;

    if (!title) {
        throw throwError("Title is required", error_codes.BAD_REQUEST);
    }

    const userId = req.user?.userId;

    const document = await prisma.documents.create({
        data: {
            title,
            content,
            chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
            createdBy: userId || null
        }
    });

    return sendResponse(res, document, { message: "Document created successfully" });
});


export const getAllDocuments = catchAsync(async (req: AuthRequest, res) => {
    const userId = req.user?.userId;

    const documents = await prisma.documents.findMany({
        where: userId ? {
            createdBy: userId
        } : undefined,
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return sendResponse(res, documents, {
        message: "Documents retrieved successfully",
        count: documents.length
    });
});

export const getDocumentById = catchAsync(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const document = await prisma.documents.findUnique({
        where: {
            id: parseInt(id)
        },
    });

    if (!document) {
        throw throwError("Document not found", error_codes.NOT_FOUND);
    }

    return sendResponse(res, document, { message: "Document retrieved successfully" });
});

export const updateDocument = catchAsync(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { title, content, chatHistory } = req.body;
    `   `
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

export const deleteDocument = catchAsync(async (req: AuthRequest, res) => {
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