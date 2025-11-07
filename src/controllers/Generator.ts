import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../types/auth.types";
import { genAI } from "../initializers";

export const generateText = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { prompt, context = "", maxTokens = 500, chatHistory = [], mode = "auto" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Validate mode
    const validModes = ["agent", "ask", "auto"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        error: "Invalid mode. Must be one of: agent, ask, auto"
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    let fullPrompt = "";
    let temperature = 0.7;

    switch (mode) {
      case "agent":
        fullPrompt += "You are a writing assistant that generates content to be inserted directly into documents. ";
        fullPrompt += "Generate ONLY the requested content without any explanatory text, introductions, or phrases like 'Here is the answer' or 'Here's what you requested'. ";
        fullPrompt += "Your response should be ready to paste directly into the document. ";
        fullPrompt += "Be concise and precise. Do not add any meta-commentary about your response.\n\n";
        temperature = 0.5;
        break;

      case "ask":
        fullPrompt += "You are a helpful AI assistant answering questions. ";
        fullPrompt += "Provide clear, informative answers with explanations when needed. ";
        fullPrompt += "You may include introductory phrases and structure your response for clarity.\n\n";
        temperature = 0.7;
        break;

      case "auto":
        fullPrompt += "You are a versatile AI assistant. ";
        fullPrompt += "Adapt your response style based on the context and type of request. ";
        fullPrompt += "For content generation requests, be direct. For questions, be explanatory.\n\n";
        temperature = 0.7;
        break;
    }

    if (context) {
      fullPrompt += `Context: ${context}\n`;
    }

    if (chatHistory.length > 0) {
      fullPrompt +=
        "Chat History:\n" +
        chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n") +
        "\n";
    }

    fullPrompt += `Request: ${prompt}`;

    if (mode === "agent") {
      fullPrompt += "\n\nRemember: Respond with ONLY the content requested, no explanatory text or introductions.";
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      },
    });

    let text = result.response.text();

    // Post-process for agent mode to ensure clean output
    if (mode === "agent") {
      text = cleanAgentResponse(text);
    }

    return res.status(200).json({
      success: true,
      text,
      model: "gemini-2.0-flash-exp",
      mode: mode
    });
  } catch (error: any) {
    console.error("Error generating text:", error);

    if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      return res.status(401).json({
        error: "Invalid API key. Please check your GEMINI_API_KEY in .env file"
      });
    }

    // Handle quota exceeded gracefully
    if (error.status === 429 || error.message?.includes('quota')) {
      return res.status(429).json({
        error: "API quota exceeded. Please try again later.",
        details: "Daily quota limit reached for Gemini API"
      });
    }

    return res.status(500).json({
      error: "Failed to generate text",
      details: error.message
    });
  }
};

/**
 * Clean agent response to remove any explanatory text or introductions
 */
function cleanAgentResponse(text: string): string {
  // Remove common AI response prefixes
  const prefixesToRemove = [
    /^(Here is|Here's|Here are)\s+/i,
    /^(The answer is|The response is|The text is)\s*:?\s*/i,
    /^(I'll|I will|Let me)\s+.*?:\s*/i,
    /^(Based on|According to).*?,\s*/i,
    /^(Sure|Certainly|Of course)[,!.]\s*/i,
    /^(Here you go|There you go)[,!.]\s*/i,
    /^(As requested)[,!.]\s*/i
  ];

  let cleanText = text.trim();

  // Remove prefixes
  for (const prefix of prefixesToRemove) {
    cleanText = cleanText.replace(prefix, '');
  }

  // Remove common suffixes that add commentary
  const suffixesToRemove = [
    /\s+(Hope this helps!?|Let me know if you need.*|Feel free to.*|Is there anything else.*)\s*$/i,
    /\s+(I hope this is what you were looking for.*|Does this meet your needs.*)\s*$/i
  ];

  for (const suffix of suffixesToRemove) {
    cleanText = cleanText.replace(suffix, '');
  }

  // Remove excessive newlines but preserve intentional formatting
  cleanText = cleanText.replace(/\n\n\n+/g, '\n\n');

  return cleanText.trim();
}