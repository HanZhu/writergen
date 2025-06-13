import axios from 'axios';
import { TranslationResponse, ImageResponse, VideoSubmitResponse, VideoStatusResponse } from '../types/api';

const api = axios.create({
  baseURL: 'https://api.siliconflow.cn/v1',
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_SILICONFLOW_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const translateText = async (text: string, targetLanguage: string): Promise<TranslationResponse> => {
  const response = await api.post('/chat/completions', {
    model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
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
    max_tokens: 128,
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

export const submitVideoGeneration = async (
  text: string,
  negativePrompt: string,
  imageSize: string
): Promise<VideoSubmitResponse> => {
  const response = await api.post('/video/submit', {
    model: 'Wan-AI/Wan2.1-T2V-14B',
    prompt: text,
    negative_prompt: negativePrompt,
    image_size: imageSize,
  });
  return response.data;
};

export const checkVideoStatus = async (requestId: string): Promise<VideoStatusResponse> => {
  const response = await api.post('/video/status', { requestId });
  console.log('Video status API response:', response.data);
  // SiliconFlow returns { status, reason, results: { videos: [{ url }] } }
  if (response.data.status === 'Succeed' && response.data.results?.videos?.length > 0) {
    return {
      status: 'completed',
      videoUrl: response.data.results.videos[0].url,
    };
  } else if (
    response.data.status === 'InQueue' ||
    response.data.status === 'Running' ||
    response.data.status === 'Pending' ||
    response.data.status === 'Processing' ||
    response.data.status === 'InProgress'
  ) {
    return {
      status: 'pending',
    };
  } else {
    return {
      status: 'failed',
    };
  }
};

export default api; 