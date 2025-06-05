import axios from 'axios';
import { TranslationResponse, ImageResponse, VideoSubmitResponse, VideoStatusResponse } from '../types/api';

const API_KEY = 'sk-bvzmpseywrtsakqtnxaqfpilmrydalevpgrdcicsexfojmti';
const BASE_URL = 'https://api.siliconflow.cn/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const translateText = async (text: string, targetLanguage: string): Promise<TranslationResponse> => {
  const response = await api.post('/chat/completions', {
    model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator and literary author. Translate the following text to ${targetLanguage} in a natural, professional, and literary style. Respond ONLY with a single valid JSON object: {"translation": "..."}. Do not include any extra text, markdown, or code fences.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.5,
    max_tokens: 800,
  });
  return response.data;
};

export const generateImage = async (text: string): Promise<ImageResponse> => {
  const response = await api.post('/images/generations', {
    model: 'Kwai-Kolors/Kolors',
    prompt: text,
    image_size: '1024x1024',
    batch_size: 3,
    num_inference_steps: 20,
    guidance_scale: 7.5,
  });
  return response.data;
};

export const submitVideoGeneration = async (text: string): Promise<VideoSubmitResponse> => {
  // Use the Wan-AI model as per API documentation
  const response = await api.post('/video/submit', {
    model: 'Wan-AI/Wan2.1-T2V-14B',
    prompt: text,
  });
  return response.data;
};

export const checkVideoStatus = async (requestId: string): Promise<VideoStatusResponse> => {
  // Use POST /video/retrieve as per documentation
  const response = await api.post('/video/retrieve', {
    requestId,
  });
  return response.data;
}; 