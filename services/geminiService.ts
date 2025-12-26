
import { GoogleGenAI, Type } from '@google/genai';
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
  return !!process.env.API_KEY;
}

/**
 * Opens the API key selection dialog.
 */
async function openSelectKey(): Promise<void> {
  if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.openSelectKey === 'function') {
    await window.aistudio.openSelectKey();
  } else {
    console.warn("window.aistudio.openSelectKey() is not available.");
  }
}

/**
 * Initializes GoogleGenAI, ensuring an API key is selected.
 */
async function getGeminiClient(): Promise<GoogleGenAI> {
  const isKeySelected = await hasSelectedApiKey();
  if (!isKeySelected) {
    await openSelectKey();
  }
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not defined.');
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateDiscoveryPosts = async (count: number = 5): Promise<any[]> => {
  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Gere ${count} postagens educacionais interessantes para uma rede social de professores e alunos chamada CyBerPhone. 
      Os temas devem ser variados (ciência, tecnologia, história, arte, dicas de estudo).
      Retorne um array de objetos no formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              authorName: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { type: Type.STRING, description: "Deve ser 'TEXT' ou 'IMAGE'" },
              imageUrl: { type: Type.STRING, description: "Uma URL de imagem aleatória do picsum.photos se o tipo for IMAGE, senão vazio" }
            },
            required: ["id", "authorName", "content", "type"]
          }
        }
      }
    });
    
    const posts = JSON.parse(response.text || '[]');
    return posts.map((p: any) => ({
      ...p,
      userId: 'ai-creator',
      timestamp: Date.now(),
      likes: [],
      comments: [],
      shares: [],
      saves: [],
      indicatedUserIds: [],
      isAiGenerated: true
    }));
  } catch (error) {
    console.error('Erro ao gerar posts de descoberta:', error);
    return [];
  }
};

export const generateProfileDescription = async (prompt: string): Promise<string> => {
  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Gere uma descrição de perfil profissional para um professor, baseada na seguinte solicitação. Seja conciso e atraente: "${prompt}"`,
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });
    return response.text?.trim() || 'Não foi possível gerar a descrição.';
  } catch (error: any) {
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
      },
    });
    return response.text?.trim() || 'Não foi possível gerar a cópia do anúncio.';
  } catch (error: any) {
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
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: `Aplique um filtro de foto com o estilo: ${prompt}.` },
        ],
      },
    });
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error('No image data found.');
  } catch (error: any) {
    throw new Error('Erro ao aplicar filtro de imagem: ' + (error.message || 'Erro desconhecido.'));
  }
};
