import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, handle missing key gracefully
const ai = new GoogleGenAI({ apiKey });

/**
 * Simulates active chat participants in the room.
 */
export const generateSimulatedChat = async (roomTitle: string, lastMessages: string[]): Promise<string> => {
  if (!apiKey) return "مرحبا بكم في الغرفة!";
  
  try {
    const prompt = `
      You are simulating a lively Arab voice chat room user.
      Room Title: "${roomTitle}"
      Context: People are talking, sending gifts, and having fun.
      Task: Generate a ONE short, casual chat message in Arabic (Gulf, Egyptian, or Levantine dialect).
      Do not repeat previous messages: ${lastMessages.slice(-3).join(', ')}.
      Keep it very short (max 6 words). E.g., "منورين", "يا هلا", "صوتك حلو", "شكرا على الهدية".
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 20,
        temperature: 0.9,
      }
    });

    return response.text?.trim() || "منورين يا شباب";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "أهلا بالجميع 🌹";
  }
};

/**
 * AI Assistant that welcomes high level users or comments on gifts.
 */
export const generateSystemAnnouncement = async (action: string, userName: string): Promise<string> => {
  if (!apiKey) return `${userName} ${action}`;

  try {
    const prompt = `
      Create a hype announcement for a voice chat app.
      User: ${userName}
      Action: ${action} (e.g., entered the room, sent a Dragon gift).
      Tone: Exciting, VIP style, Arabic.
      Max 10 words.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || `رحبوا بالملك ${userName}!`;
  } catch (error) {
    return `${userName} وصل!`;
  }
};