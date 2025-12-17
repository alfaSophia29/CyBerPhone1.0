
import { GoogleGenAI, Modality } from '@google/genai';
import { GEMINI_MODEL, GEMINI_IMAGE_MODEL } from '../constants';

/**
 * Checks if the API key has been selected by the user.
 * Assumes window.aistudio.hasSelectedApiKey() is available in the environment.
 * @returns {Promise<boolean>} True if API key is selected, false otherwise.
 */
async function hasSelectedApiKey(): Promise<boolean> {
  if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.hasSelectedApiKey === 'function') {
    return await window.aistudio.hasSelectedApiKey();
  }
  // For local development or environments where aistudio is not present,
  // we can assume the API_KEY is set via process.env for simplicity.
  return !!process.env.API_KEY;
}

/**
 * Opens the API key selection dialog.
 * Assumes window.aistudio.openSelectKey() is available in the environment.
 */
async function openSelectKey(): Promise<void> {
  if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.openSelectKey === 'function') {
    await window.aistudio.openSelectKey();
  } else {
    console.warn("window.aistudio.openSelectKey() is not available. Please ensure the API key is set via process.env.API_KEY for local development.");
  }
}

/**
 * Initializes GoogleGenAI, ensuring an API key is selected.
 * Prompts user to select API key if not already selected.
 * Creates a new instance on each call to ensure the latest API key is used.
 */
async function getGeminiClient(): Promise<GoogleGenAI> {
  const isKeySelected = await hasSelectedApiKey();
  if (!isKeySelected) {
    console.log("No API key selected. Opening key selection dialog...");
    await openSelectKey();
    // After selection, assume it's successful for this session, though a race condition can exist.
    // In a real scenario, you might re-check or handle API errors gracefully.
  }

  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not defined after selection. Cannot initialize Gemini client.');
  }

  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateProfileDescription = async (prompt: string): Promise<string> => {
  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Gere uma descrição de perfil profissional para um professor, baseada na seguinte solicitação. Seja conciso e atraente: "${prompt}"`,
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    });
    return response.text?.trim() || 'Não foi possível gerar a descrição.';
  } catch (error: any) {
    console.error('Error generating profile description:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
        console.error("API key might be invalid or not properly selected. Prompting user to select key again.");
        await openSelectKey(); // Prompt user again on specific error
    }
    return 'Erro ao gerar descrição: ' + (error.message || 'Erro desconhecido.');
  }
};

export const generateAdCopy = async (prompt: string): Promise<string> => {
  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Crie uma cópia de anúncio curta e impactante para uma campanha de marketing digital, baseada na seguinte descrição: "${prompt}". Inclua um título e um breve texto.`,
      config: {
        maxOutputTokens: 150,
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
      },
    });
    return response.text?.trim() || 'Não foi possível gerar a cópia do anúncio.';
  } catch (error: any) {
    console.error('Error generating ad copy:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
      console.error("API key might be invalid or not properly selected. Prompting user to select key again.");
      await openSelectKey(); // Prompt user again on specific error
    }
    return 'Erro ao gerar cópia do anúncio: ' + (error.message || 'Erro desconhecido.');
  }
};

export const applyAIImageFilter = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `Aplique um filtro de foto com o estilo: ${prompt}.`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error('No image data found in response.');
  } catch (error: any) {
    console.error('Error applying AI image filter:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
      console.error("API key might be invalid or not properly selected. Prompting user to select key again.");
      await openSelectKey(); // Prompt user again on specific error
    }
    throw new Error('Erro ao aplicar filtro de imagem com IA: ' + (error.message || 'Erro desconhecido.'));
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001', // High-quality image generation model
      prompt: `Generate a profile picture for a social media user based on this description: "${prompt}". Make it clean, professional, and suitable for a diverse audience.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1', // Standard profile picture aspect ratio
      },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error: any) {
    console.error('Error generating image from prompt:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
      console.error("API key might be invalid or not properly selected. Prompting user to select key again.");
      await openSelectKey(); // Prompt user again on specific error
    }
    throw new Error('Erro ao gerar imagem de perfil com IA: ' + (error.message || 'Erro desconhecido.'));
  }
};


/**
 * Fetches content from a video URI with the API key appended.
 * Useful for Veo video downloads.
 */
export const fetchVeoVideoContent = async (videoUri: string): Promise<Response> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not defined. Cannot fetch video content.');
  }
  const url = `${videoUri}&key=${process.env.API_KEY}`;
  return fetch(url);
};