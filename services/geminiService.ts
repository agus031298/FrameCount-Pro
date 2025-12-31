import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
// Note: In a production app, handle API keys securely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedShotData {
  name: string;
  frames: number;
}

/**
 * Converts a File object to a Base64 string required by Gemini
 */
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeShotImage = async (imageFile: File): Promise<ExtractedShotData[]> => {
  try {
    const base64Data = await fileToGenerativePart(imageFile);
    
    // Use gemini-3-flash-preview for multimodal text tasks
    const modelId = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: `Analyze this image. It likely contains a LIST of folders or files representing VFX shots (e.g. from Windows File Explorer or macOS Finder).
            Look for text patterns like "ShotName - FrameCount" (e.g., "SQ21_SC01_SH02 - 49" or "SQ25_SC03_SH30 - 249").
            
            Task:
            1. Extract ALL valid shots found in the list.
            2. For each item, separate the 'Shot Name' and the 'Frame Count'.
            3. Ignore dates (e.g., 30/12/2025) or file types (e.g., File folder).
            4. If the frame count is not explicitly clear but there is a number at the end of the name separated by a dash or space, use that.
            
            Return a JSON ARRAY of objects.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The name of the shot (e.g. SQ21_SC01_SH02)" },
              frames: { type: Type.INTEGER, description: "The number of frames" },
            },
            required: ["name", "frames"],
          },
        },
      },
    });

    const jsonText = response.text || "[]";
    const data = JSON.parse(jsonText) as ExtractedShotData[];
    
    return data;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw new Error("Failed to extract data from image.");
  }
};