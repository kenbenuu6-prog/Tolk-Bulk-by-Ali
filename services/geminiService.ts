import { GoogleGenAI } from "@google/genai";

const safeApiKey = process.env.API_KEY || 'dummy-key';
const ai = new GoogleGenAI({ apiKey: safeApiKey });

export const fetchVideoCaption = async (url: string): Promise<string> => {
  try {
    // If no API key is available, try to extract ID as fallback
    if (!process.env.API_KEY) {
       const idMatch = url.match(/\/video\/(\d+)/);
       return idMatch ? `tiktok-${idMatch[1]}` : `tiktok-${Date.now()}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Go to this TikTok URL: ${url}. Extract the exact video caption/title. Return ONLY the caption text. Do not include any other text.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const caption = response.text;
    if (!caption) return `tiktok-${Date.now()}`;
    
    // Clean up caption (remove quotes if the model adds them, trim whitespace)
    let cleanCaption = caption.trim().replace(/^["']|["']$/g, '');
    
    // Truncate if excessively long to prevent filesystem issues
    if (cleanCaption.length > 150) {
      cleanCaption = cleanCaption.substring(0, 147) + '...';
    }

    return cleanCaption;
  } catch (error) {
    console.error("Caption Fetch Error:", error);
    // Fallback
    return `tiktok-${Date.now()}`;
  }
};